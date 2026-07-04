import 'server-only';
import { Resend } from 'resend';
import { formatCurrency, formatDateFull, normalizeTimeSlot } from '@/lib/utils';
import type { Booking, Tenant } from '@/types/database';

type ConfirmationParams = {
  booking: Booking;
  tenant: Pick<Tenant, 'name' | 'address' | 'phone'>;
  serviceName: string;
};

/**
 * Envia o e-mail de confirmação de agendamento via Resend.
 * Silenciosamente ignora se o cliente não informou e-mail ou se a
 * RESEND_API_KEY não estiver configurada (ambiente de dev).
 */
export async function sendBookingConfirmationEmail({
  booking,
  tenant,
  serviceName,
}: ConfirmationParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !booking.client_email) return;

  const resend = new Resend(apiKey);
  const from =
    process.env.RESEND_FROM_EMAIL || 'AgendaBarba <onboarding@resend.dev>';

  try {
    await resend.emails.send({
      from,
      to: booking.client_email,
      subject: `Agendamento confirmado — ${tenant.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #1B1B1D; color: #F2ECE2; padding: 32px; border-radius: 12px;">
          <h1 style="color: #C08A35; font-size: 22px; margin: 0 0 4px;">✂️ ${tenant.name}</h1>
          <p style="font-size: 16px; margin: 0 0 24px;">Seu horário está confirmado, ${booking.client_name}!</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #E4C98A;">Serviço</td><td style="text-align: right;">${serviceName}</td></tr>
            <tr><td style="padding: 6px 0; color: #E4C98A;">Data</td><td style="text-align: right;">${formatDateFull(booking.date)}</td></tr>
            <tr><td style="padding: 6px 0; color: #E4C98A;">Horário</td><td style="text-align: right;">${normalizeTimeSlot(booking.time_slot)}</td></tr>
            <tr><td style="padding: 6px 0; color: #E4C98A;">Sinal pago</td><td style="text-align: right;">${formatCurrency(booking.deposit_amount)}</td></tr>
            <tr><td style="padding: 6px 0; color: #E4C98A;">Restante no local</td><td style="text-align: right; font-weight: bold;">${formatCurrency(booking.remaining_amount)}</td></tr>
          </table>
          ${tenant.address ? `<p style="font-size: 13px; margin: 24px 0 0; color: #E4C98A;">📍 ${tenant.address}</p>` : ''}
          ${tenant.phone ? `<p style="font-size: 13px; margin: 4px 0 0; color: #E4C98A;">📞 ${tenant.phone}</p>` : ''}
          <p style="font-size: 12px; margin: 24px 0 0; color: #8a8a8f;">Agendado pelo AgendaBarba.</p>
        </div>
      `,
    });
  } catch (error) {
    // E-mail é best-effort: não pode quebrar a confirmação do pagamento.
    console.error('[email] Falha ao enviar confirmação:', error);
  }
}
