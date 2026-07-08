import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMercadoPago } from '@/lib/mercadopago';
import { sendBookingConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Valida a assinatura do webhook do Mercado Pago.
 * Manifesto: `id:{data.id};request-id:{x-request-id};ts:{ts};`
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 *
 * O MP também manda notificações no formato legado (?topic=payment&id=X),
 * que nunca vêm assinadas (o recurso x-signature só existe no formato novo).
 * Para essas, não há o que validar aqui — a autenticidade real vem de
 * buscar o pagamento de volta na API do MP com nosso próprio access token
 * antes de agir, o que já acontece depois desta checagem.
 */
function isValidSignature(request: NextRequest, dataId: string): boolean {
  const signature = request.headers.get('x-signature');
  if (!signature) return true;

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    // Sem secret configurado (dev), aceita mas registra o alerta.
    console.warn('[webhook/mp] MP_WEBHOOK_SECRET não configurado — assinatura não validada');
    return true;
  }

  const requestId = request.headers.get('x-request-id');

  const parts = Object.fromEntries(
    signature.split(',').map((part) => {
      const [key, ...rest] = part.split('=');
      return [key.trim(), rest.join('=').trim()];
    }),
  );
  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId ?? ''};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let body: {
    action?: string;
    type?: string;
    topic?: string;
    data?: { id?: string };
    resource?: string;
  };
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  // Loga toda notificação recebida — o MP usa formatos diferentes
  // (novo: type/data.id; antigo IPN: topic/id) dependendo de como o
  // pagamento foi criado, então é melhor ver exatamente o que chegou.
  console.log('[webhook/mp] notificação recebida:', {
    url: request.nextUrl.toString(),
    body: rawBody,
  });

  // Formato novo (Webhooks v2): ?data.id=X&type=payment, body { data: { id } }
  // Formato antigo (IPN v1): ?id=X&topic=payment
  const dataId =
    request.nextUrl.searchParams.get('data.id') ||
    body.data?.id ||
    request.nextUrl.searchParams.get('id') ||
    '';

  if (!dataId) {
    return NextResponse.json({ received: true });
  }

  if (!isValidSignature(request, String(dataId))) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  const topic = request.nextUrl.searchParams.get('topic') || body.topic;
  const isPaymentEvent =
    body.type === 'payment' ||
    body.action?.startsWith('payment.') ||
    topic === 'payment';
  if (!isPaymentEvent) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  try {
    // 1. Busca o pagamento no MP (token da plataforma; se falhar, tenta o do tenant)
    let payment;
    try {
      payment = await getMercadoPago().payment.get({ id: String(dataId) });
    } catch (err) {
      payment = await findPaymentViaTenantTokens(String(dataId));
      if (!payment) throw err;
    }

    const bookingId = payment.external_reference;
    if (!bookingId) {
      return NextResponse.json({ received: true });
    }

    // 2. Encontra o booking
    const { data: booking } = await admin
      .from('bookings')
      .select('*, services(name, duration)')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ received: true });
    }

    // 3. Pagamento aprovado → confirma o agendamento (idempotente)
    if (payment.status === 'approved' && booking.status === 'aguardando_pagamento') {
      await admin
        .from('bookings')
        .update({
          status: 'confirmado',
          mp_payment_id: String(payment.id),
          payment_method: payment.payment_method_id === 'pix' ? 'pix' : 'credit_card',
          payment_at: payment.date_approved ?? new Date().toISOString(),
        })
        .eq('id', booking.id)
        .eq('status', 'aguardando_pagamento');

      // 4. E-mail de confirmação (best-effort)
      const { data: tenant } = await admin
        .from('tenants')
        .select('name, address, phone')
        .eq('id', booking.tenant_id)
        .single();

      if (tenant) {
        await sendBookingConfirmationEmail({
          booking,
          tenant,
          serviceName: booking.services?.name ?? 'Serviço',
        });
      }
    }

    // Pagamento cancelado/expirado → libera o slot
    if (
      (payment.status === 'cancelled' || payment.status === 'expired') &&
      booking.status === 'aguardando_pagamento'
    ) {
      await admin
        .from('bookings')
        .update({ status: 'cancelado' })
        .eq('id', booking.id)
        .eq('status', 'aguardando_pagamento');
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const notFound =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as { status?: number }).status === 404;
    console.error(
      notFound
        ? `[webhook/mp] Pagamento ${dataId} não encontrado no Mercado Pago (id incorreto ou notificação de teste):`
        : '[webhook/mp] Erro ao processar notificação:',
      error,
    );
    // 500 faz o MP reenviar a notificação depois
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

/**
 * Pagamentos criados com o token do tenant não são visíveis pelo token da
 * plataforma. Busca o booking pendente cujo mp_payment_id bate e usa o token
 * do respectivo tenant.
 */
async function findPaymentViaTenantTokens(paymentId: string) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('tenant_id')
    .eq('mp_payment_id', paymentId)
    .maybeSingle();

  if (!booking) return null;

  const { data: tenant } = await admin
    .from('tenants')
    .select('mp_access_token')
    .eq('id', booking.tenant_id)
    .single();

  if (!tenant?.mp_access_token) return null;

  return getMercadoPago(tenant.mp_access_token).payment.get({ id: paymentId });
}
