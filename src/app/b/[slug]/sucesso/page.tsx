import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  formatCurrency,
  formatDateShort,
  normalizeTimeSlot,
  phoneToWhatsApp,
} from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { SuccessStatus } from '@/components/booking/SuccessStatus';

export const dynamic = 'force-dynamic';

type Props = {
  params: { slug: string };
  searchParams: { booking?: string };
};

export default async function SuccessPage({ params, searchParams }: Props) {
  const bookingId = searchParams.booking;
  if (!bookingId || !/^[0-9a-f-]{36}$/i.test(bookingId)) notFound();

  // Admin client: a página é pública e o cliente final não tem sessão.
  // Só dados do próprio booking (via ID na URL) são exibidos.
  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from('tenants')
    .select('id, name, slug, address, phone')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tenant) notFound();

  const { data: booking } = await admin
    .from('bookings')
    .select('*, services(name, duration)')
    .eq('id', bookingId)
    .eq('tenant_id', tenant.id)
    .maybeSingle();
  if (!booking) notFound();

  const serviceName = booking.services?.name ?? 'Serviço';
  const time = normalizeTimeSlot(booking.time_slot);

  const whatsappMessage = encodeURIComponent(
    `Olá! Acabei de agendar ${serviceName} para ${formatDateShort(booking.date)} às ${time} pelo AgendaBarba. Sou ${booking.client_name}.`,
  );
  const whatsappUrl = tenant.phone
    ? `https://wa.me/${phoneToWhatsApp(tenant.phone)}?text=${whatsappMessage}`
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-10">
      <header className="mb-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-brass">
          {tenant.name}
        </p>
      </header>

      <SuccessStatus bookingId={booking.id} initialStatus={booking.status} />

      <Card className="mt-6">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-cream/60">Serviço</dt>
            <dd className="font-medium">{serviceName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cream/60">Quando</dt>
            <dd className="font-medium">
              {formatDateShort(booking.date)} às {time}
            </dd>
          </div>
          {tenant.address && (
            <div className="flex justify-between gap-4">
              <dt className="text-cream/60">Onde</dt>
              <dd className="text-right">{tenant.address}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-barber-line pt-2">
            <dt className="text-cream/60">Sinal</dt>
            <dd className="font-medium text-emerald-400">
              {formatCurrency(booking.deposit_amount)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cream/60">Restante no local</dt>
            <dd className="font-display text-lg font-bold text-brass-light">
              {formatCurrency(booking.remaining_amount)}
            </dd>
          </div>
        </dl>
      </Card>

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          Confirmar pelo WhatsApp
        </a>
      )}

      <p className="mt-6 text-center text-xs text-cream/40">
        Código da reserva: {booking.id.slice(0, 8).toUpperCase()}
      </p>
      <Link
        href={`/b/${tenant.slug}`}
        className="mt-2 text-center text-sm text-brass hover:text-brass-light"
      >
        Fazer outro agendamento
      </Link>
    </main>
  );
}
