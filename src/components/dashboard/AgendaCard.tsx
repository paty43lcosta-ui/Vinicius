'use client';

import { useState } from 'react';
import { updateBookingStatus } from '@/actions/booking';
import type { BookingWithService } from '@/types/database';
import { formatCurrency, normalizeTimeSlot } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';

export function AgendaCard({
  booking,
  onChanged,
}: {
  booking: BookingWithService;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(status: 'concluido' | 'cancelado') {
    if (
      status === 'cancelado' &&
      !window.confirm(
        `Cancelar o agendamento de ${booking.client_name}? O horário será liberado.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await updateBookingStatus(booking.id, status);
    if (result.error) setError(result.error);
    setBusy(false);
    onChanged();
  }

  const actionable = booking.status === 'confirmado';

  return (
    <article className="rounded-xl border border-barber-line bg-charcoal-soft p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-lg font-bold text-brass-light">
          {normalizeTimeSlot(booking.time_slot)}
        </span>
        <StatusBadge status={booking.status} />
      </div>
      <p className="mt-1.5 truncate text-sm font-medium">{booking.client_name}</p>
      <p className="truncate text-xs text-cream/50">
        {booking.services?.name ?? 'Serviço'} · sinal{' '}
        {formatCurrency(booking.deposit_amount)}
      </p>
      <p className="mt-0.5 truncate text-xs text-cream/40">
        {booking.client_phone}
      </p>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {actionable && (
        <div className="mt-2.5 flex gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => changeStatus('concluido')}
            className="flex-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            Concluir
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => changeStatus('cancelado')}
            className="flex-1 rounded-lg border border-barber-red/50 bg-barber-red/10 px-2 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-barber-red/25 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}
    </article>
  );
}
