'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Tenant } from '@/types/database';
import {
  formatDateShort,
  generateTimeSlots,
  toDateString,
} from '@/lib/utils';

type Props = {
  tenant: Tenant;
  date: string;
  selectedTime: string | null;
  onSelect: (time: string) => void;
};

const POLL_INTERVAL_MS = 30_000;

export function StepTime({ tenant, date, selectedTime, onSelect }: Props) {
  const [occupied, setOccupied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const slots = useMemo(
    () => generateTimeSlots(tenant.hours_start, tenant.hours_end),
    [tenant.hours_start, tenant.hours_end],
  );

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/availability?tenant_id=${tenant.id}&date=${date}`,
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error('availability fetch failed');
      const data: { occupied: string[] } = await res.json();
      setOccupied(new Set(data.occupied));
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [tenant.id, date]);

  // Busca inicial + polling a cada 30s para evitar conflito de horário
  useEffect(() => {
    setLoading(true);
    fetchAvailability();
    const interval = setInterval(fetchAvailability, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAvailability]);

  const now = new Date();
  const isToday = date === toDateString(now);

  function isPast(slot: string): boolean {
    if (!isToday) return false;
    const [h, m] = slot.split(':').map(Number);
    return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
  }

  return (
    <section aria-label="Escolha o horário">
      <h2 className="font-display text-2xl font-bold uppercase tracking-wide">
        Escolha o horário
      </h2>
      <p className="mb-4 mt-1 text-sm text-cream/50">{formatDateShort(date)}</p>

      {loading ? (
        <p className="py-8 text-center text-sm text-cream/50">
          Carregando horários…
        </p>
      ) : loadError ? (
        <p className="rounded-xl border border-barber-red/50 bg-barber-red/10 p-4 text-center text-sm text-red-300">
          Não conseguimos carregar os horários. Verifique sua conexão e
          recarregue a página.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {slots.map((slot) => {
            const taken = occupied.has(slot) || isPast(slot);
            const isSelected = slot === selectedTime;
            return (
              <button
                key={slot}
                type="button"
                disabled={taken}
                onClick={() => onSelect(slot)}
                className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition-colors ${
                  taken
                    ? 'cursor-not-allowed border-barber-line/50 bg-charcoal text-cream/25 line-through'
                    : isSelected
                      ? 'border-brass bg-brass text-charcoal'
                      : 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/15'
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-cream/40">
        Horários em verde estão livres. A lista atualiza sozinha a cada 30
        segundos.
      </p>
    </section>
  );
}
