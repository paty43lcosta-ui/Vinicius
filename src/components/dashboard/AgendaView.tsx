'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BookingStatus, BookingWithService } from '@/types/database';
import { toDateString, WEEKDAY_LABELS, MONTH_LABELS } from '@/lib/utils';
import { AgendaCard } from './AgendaCard';
import { Button } from '@/components/ui/Button';

type StatusFilter = 'todos' | BookingStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'aguardando_pagamento', label: 'Aguardando' },
  { value: 'concluido', label: 'Concluídos' },
  { value: 'cancelado', label: 'Cancelados' },
];

export function AgendaView({ tenantId }: { tenantId: string }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [bookings, setBookings] = useState<BookingWithService[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDays = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const weekStart = toDateString(weekDays[0]);
  const weekEnd = toDateString(weekDays[6]);

  const fetchBookings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('bookings')
      .select('*, services(name, duration)')
      .eq('tenant_id', tenantId)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .order('time_slot', { ascending: true });
    setBookings((data as BookingWithService[]) ?? []);
    setLoading(false);
  }, [tenantId, weekStart, weekEnd]);

  useEffect(() => {
    setLoading(true);
    fetchBookings();
  }, [fetchBookings]);

  // Realtime: novo agendamento confirmado aparece sem recarregar
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`bookings-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => fetchBookings(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, fetchBookings]);

  const filtered = useMemo(
    () =>
      statusFilter === 'todos'
        ? bookings
        : bookings.filter((b) => b.status === statusFilter),
    [bookings, statusFilter],
  );

  const todayStr = toDateString(new Date());
  const monthLabel = `${MONTH_LABELS[weekDays[0].getMonth()]}${
    weekDays[0].getMonth() !== weekDays[6].getMonth()
      ? ` / ${MONTH_LABELS[weekDays[6].getMonth()]}`
      : ''
  } ${weekDays[6].getFullYear()}`;

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
            ← Anterior
          </Button>
          <span className="min-w-28 text-center text-sm font-medium capitalize text-cream/70">
            {weekOffset === 0 ? 'Esta semana' : monthLabel}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
            Próxima →
          </Button>
        </div>

        <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors ${
                statusFilter === f.value
                  ? 'border-brass bg-brass/15 text-brass-light'
                  : 'border-barber-line text-cream/50 hover:text-cream'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-cream/50">
          Carregando agenda…
        </p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-7">
          {weekDays.map((day) => {
            const dateStr = toDateString(day);
            const dayBookings = filtered.filter((b) => b.date === dateStr);
            const isToday = dateStr === todayStr;
            return (
              <section key={dateStr} aria-label={dateStr}>
                <header
                  className={`mb-2 flex items-baseline gap-2 lg:flex-col lg:gap-0 ${
                    isToday ? 'text-brass-light' : 'text-cream/60'
                  }`}
                >
                  <span className="text-xs font-medium uppercase">
                    {isToday ? 'Hoje' : WEEKDAY_LABELS[day.getDay()]}
                  </span>
                  <span className="font-display text-xl font-bold">
                    {day.getDate()}
                  </span>
                </header>
                <div className="flex flex-col gap-2">
                  {dayBookings.length === 0 ? (
                    <p className="hidden rounded-lg border border-dashed border-barber-line/60 px-2 py-3 text-center text-[11px] text-cream/25 lg:block">
                      Livre
                    </p>
                  ) : (
                    dayBookings.map((booking) => (
                      <AgendaCard
                        key={booking.id}
                        booking={booking}
                        onChanged={fetchBookings}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
