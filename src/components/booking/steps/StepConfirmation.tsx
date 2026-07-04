'use client';

import type { Service, Tenant } from '@/types/database';
import type { ClientDataInput } from '@/lib/validations/booking';
import {
  calcDeposit,
  formatCurrency,
  formatDateShort,
  phoneToWhatsApp,
} from '@/lib/utils';
import { Card } from '@/components/ui/Card';

type Props = {
  tenant: Tenant;
  service: Service;
  date: string;
  time: string;
  client: ClientDataInput;
  bookingId: string | null;
};

export function StepConfirmation({
  tenant,
  service,
  date,
  time,
  client,
  bookingId,
}: Props) {
  const deposit = calcDeposit(service.price, tenant.deposit_pct, tenant.deposit_min);
  const remaining = service.price - deposit;

  const whatsappMessage = encodeURIComponent(
    `Olá! Acabei de agendar ${service.name} para ${formatDateShort(date)} às ${time} pelo AgendaBarba. Sou ${client.client_name}.`,
  );
  const whatsappUrl = tenant.phone
    ? `https://wa.me/${phoneToWhatsApp(tenant.phone)}?text=${whatsappMessage}`
    : null;

  return (
    <section aria-label="Agendamento confirmado" className="text-center">
      <div
        aria-hidden
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/60 bg-emerald-500/10 text-3xl"
      >
        ✓
      </div>
      <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-emerald-400">
        Horário garantido!
      </h2>
      <p className="mt-2 text-sm text-cream/60">
        Sinal pago e reserva confirmada. Te esperamos lá!
      </p>

      <Card className="mt-6 text-left">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-cream/60">Serviço</dt>
            <dd className="font-medium">{service.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cream/60">Quando</dt>
            <dd className="font-medium">
              {formatDateShort(date)} às {time}
            </dd>
          </div>
          {tenant.address && (
            <div className="flex justify-between gap-4">
              <dt className="text-cream/60">Onde</dt>
              <dd className="text-right">{tenant.address}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-barber-line pt-2">
            <dt className="text-cream/60">Sinal pago</dt>
            <dd className="font-medium text-emerald-400">
              {formatCurrency(deposit)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cream/60">Restante no local</dt>
            <dd className="font-display text-lg font-bold text-brass-light">
              {formatCurrency(remaining)}
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

      {client.client_email && (
        <p className="mt-4 text-xs text-cream/40">
          Enviamos a confirmação para {client.client_email}.
        </p>
      )}
      {bookingId && (
        <p className="mt-1 text-[11px] text-cream/30">
          Código da reserva: {bookingId.slice(0, 8).toUpperCase()}
        </p>
      )}
    </section>
  );
}
