'use client';

import { useEffect, useState } from 'react';
import type { BookingStatus } from '@/types/database';

/**
 * No retorno do checkout de cartão o webhook pode ainda não ter chegado.
 * Faz polling até o booking sair de aguardando_pagamento.
 */
export function SuccessStatus({
  bookingId,
  initialStatus,
}: {
  bookingId: string;
  initialStatus: BookingStatus;
}) {
  const [status, setStatus] = useState<BookingStatus>(initialStatus);

  useEffect(() => {
    if (status !== 'aguardando_pagamento') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/status`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data: { status: BookingStatus } = await res.json();
        if (data.status !== 'aguardando_pagamento') {
          setStatus(data.status);
          clearInterval(interval);
        }
      } catch {
        // tenta de novo no próximo tick
      }
    }, 4_000);
    return () => clearInterval(interval);
  }, [bookingId, status]);

  if (status === 'confirmado' || status === 'concluido') {
    return (
      <div className="text-center">
        <div
          aria-hidden
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/60 bg-emerald-500/10 text-3xl"
        >
          ✓
        </div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-emerald-400">
          Horário garantido!
        </h1>
        <p className="mt-2 text-sm text-cream/60">
          Sinal pago e reserva confirmada. Te esperamos lá!
        </p>
      </div>
    );
  }

  if (status === 'cancelado') {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-red-300">
          Reserva cancelada
        </h1>
        <p className="mt-2 text-sm text-cream/60">
          O pagamento não foi concluído a tempo e o horário foi liberado. Você
          pode agendar de novo quando quiser.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center" aria-live="polite">
      <div
        aria-hidden
        className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brass border-t-transparent"
      />
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-brass-light">
        Confirmando pagamento…
      </h1>
      <p className="mt-2 text-sm text-cream/60">
        Estamos aguardando a confirmação do Mercado Pago. Isso costuma levar
        poucos segundos — não feche esta página.
      </p>
    </div>
  );
}
