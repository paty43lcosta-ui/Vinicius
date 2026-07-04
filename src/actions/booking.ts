'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMercadoPago, centsToAmount } from '@/lib/mercadopago';
import { bookingDraftSchema } from '@/lib/validations/booking';
import type { BookingDraftInput } from '@/lib/validations/booking';
import {
  calcDeposit,
  generateTimeSlots,
  parseDateString,
  RESERVATION_MINUTES,
  toDateString,
} from '@/lib/utils';
import type { BookingStatus } from '@/types/database';

export type CreateBookingResult =
  | { error: string }
  | {
      bookingId: string;
      depositAmount: number;
      pix?: {
        qrCode: string;
        qrCodeBase64: string;
        ticketUrl: string | null;
      };
      initPoint?: string;
    };

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/** Data de expiração no formato aceito pelo MP (ISO com offset). */
function expirationDate(): string {
  return new Date(Date.now() + RESERVATION_MINUTES * 60_000)
    .toISOString()
    .replace('Z', '+00:00');
}

/**
 * Cria o agendamento (status aguardando_pagamento) e a cobrança do sinal
 * no Mercado Pago — PIX direto (QR Code) ou preferência de checkout para cartão.
 */
export async function createBookingWithPayment(
  input: BookingDraftInput,
): Promise<CreateBookingResult> {
  const parsed = bookingDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' };
  }
  const draft = parsed.data;

  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from('tenants')
    .select('*')
    .eq('id', draft.tenant_id)
    .eq('active', true)
    .single();
  if (!tenant) {
    return { error: 'Barbearia não encontrada. Recarregue a página.' };
  }

  const { data: service } = await admin
    .from('services')
    .select('*')
    .eq('id', draft.service_id)
    .eq('tenant_id', tenant.id)
    .eq('active', true)
    .single();
  if (!service) {
    return { error: 'Serviço indisponível. Escolha outro serviço.' };
  }

  // Valida o slot: dia de funcionamento, grade de horários e não estar no passado
  const bookingDate = parseDateString(draft.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (bookingDate < today) {
    return { error: 'Essa data já passou. Escolha uma data futura.' };
  }
  if (!tenant.working_days.includes(bookingDate.getDay())) {
    return { error: 'A barbearia não abre nesse dia. Escolha outra data.' };
  }
  const validSlots = generateTimeSlots(tenant.hours_start, tenant.hours_end);
  if (!validSlots.includes(draft.time_slot)) {
    return { error: 'Horário fora do funcionamento. Escolha outro horário.' };
  }
  if (draft.date === toDateString(new Date())) {
    const [h, m] = draft.time_slot.split(':').map(Number);
    const slotTime = new Date();
    slotTime.setHours(h, m, 0, 0);
    if (slotTime <= new Date()) {
      return { error: 'Esse horário já passou. Escolha um horário futuro.' };
    }
  }

  // Libera reservas pendentes expiradas nesse slot antes de tentar inserir
  const expirationCutoff = new Date(
    Date.now() - RESERVATION_MINUTES * 60_000,
  ).toISOString();
  await admin
    .from('bookings')
    .update({ status: 'cancelado' })
    .eq('tenant_id', tenant.id)
    .eq('date', draft.date)
    .eq('time_slot', draft.time_slot)
    .eq('status', 'aguardando_pagamento')
    .lt('created_at', expirationCutoff);

  const totalAmount = service.price;
  const depositAmount = calcDeposit(
    totalAmount,
    tenant.deposit_pct,
    tenant.deposit_min,
  );
  const remainingAmount = totalAmount - depositAmount;

  const { data: booking, error: insertError } = await admin
    .from('bookings')
    .insert({
      tenant_id: tenant.id,
      service_id: service.id,
      date: draft.date,
      time_slot: draft.time_slot,
      client_name: draft.client_name,
      client_phone: draft.client_phone,
      client_email: draft.client_email || null,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      remaining_amount: remainingAmount,
      payment_method: draft.payment_method,
    })
    .select('*')
    .single();

  if (insertError || !booking) {
    if (insertError?.code === '23505') {
      return {
        error:
          'Esse horário acabou de ser reservado por outra pessoa. Escolha outro horário.',
      };
    }
    return { error: 'Não foi possível criar o agendamento. Tente novamente.' };
  }

  const notificationUrl = `${appUrl()}/api/webhooks/mp`;

  try {
    const mp = getMercadoPago(tenant.mp_access_token);

    if (draft.payment_method === 'pix') {
      const payment = await mp.payment.create({
        body: {
          transaction_amount: centsToAmount(depositAmount),
          description: `Sinal — ${service.name} em ${tenant.name}`,
          payment_method_id: 'pix',
          external_reference: booking.id,
          date_of_expiration: expirationDate(),
          notification_url: notificationUrl,
          payer: {
            email:
              draft.client_email ||
              `cliente-${booking.id.slice(0, 8)}@agendabarba.com.br`,
            first_name: draft.client_name.split(' ')[0],
          },
        },
      });

      const tx = payment.point_of_interaction?.transaction_data;
      if (!payment.id || !tx?.qr_code || !tx.qr_code_base64) {
        throw new Error('Resposta do Mercado Pago sem dados do PIX');
      }

      await admin
        .from('bookings')
        .update({ mp_payment_id: String(payment.id) })
        .eq('id', booking.id);

      return {
        bookingId: booking.id,
        depositAmount,
        pix: {
          qrCode: tx.qr_code,
          qrCodeBase64: tx.qr_code_base64,
          ticketUrl: tx.ticket_url ?? null,
        },
      };
    }

    // Cartão: preferência de checkout (redirecionamento para o Mercado Pago)
    const successUrl = `${appUrl()}/b/${tenant.slug}/sucesso?booking=${booking.id}`;
    const preference = await mp.preference.create({
      body: {
        items: [
          {
            id: service.id,
            title: `Sinal — ${service.name} (${tenant.name})`,
            quantity: 1,
            unit_price: centsToAmount(depositAmount),
            currency_id: 'BRL',
          },
        ],
        external_reference: booking.id,
        notification_url: notificationUrl,
        statement_descriptor: tenant.name.slice(0, 22),
        back_urls: {
          success: successUrl,
          pending: successUrl,
          failure: `${appUrl()}/b/${tenant.slug}?erro=pagamento`,
        },
        auto_return: 'approved',
        expires: true,
        expiration_date_to: expirationDate(),
        payment_methods: {
          excluded_payment_types: [{ id: 'ticket' }],
          installments: 1,
        },
      },
    });

    if (!preference.id || !preference.init_point) {
      throw new Error('Resposta do Mercado Pago sem init_point');
    }

    await admin
      .from('bookings')
      .update({ mp_preference_id: preference.id })
      .eq('id', booking.id);

    return {
      bookingId: booking.id,
      depositAmount,
      initPoint: preference.init_point,
    };
  } catch (error) {
    console.error('[booking] Falha ao criar cobrança no MP:', error);
    // Libera o slot: sem cobrança criada não há como confirmar o agendamento
    await admin
      .from('bookings')
      .update({ status: 'cancelado' })
      .eq('id', booking.id);
    return {
      error:
        'Não foi possível iniciar o pagamento. Verifique sua conexão e tente novamente.',
    };
  }
}

/**
 * Ações do dono no painel: concluir ou cancelar um agendamento.
 * Usa o cliente com sessão — a RLS garante que só bookings do próprio tenant mudam.
 */
export async function updateBookingStatus(
  bookingId: string,
  status: Extract<BookingStatus, 'concluido' | 'cancelado'>,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);

  if (error) {
    return { error: 'Não foi possível atualizar o agendamento. Tente novamente.' };
  }
  revalidatePath('/dashboard/agenda');
  revalidatePath('/dashboard');
  return { success: true };
}
