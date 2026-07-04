'use client';

import { useMemo } from 'react';
import type { Tenant } from '@/types/database';
import {
  getNextWorkingDays,
  MONTH_LABELS,
  toDateString,
  WEEKDAY_LABELS,
} from '@/lib/utils';

type Props = {
  tenant: Tenant;
  selectedDate: string | null;
  onSelect: (date: string) => void;
};

export function StepDate({ tenant, selectedDate, onSelect }: Props) {
  const days = useMemo(
    () => getNextWorkingDays(tenant.working_days, 14),
    [tenant.working_days],
  );
  const todayStr = toDateString(new Date());

  return (
    <section aria-label="Escolha a data">
      <h2 className="mb-4 font-display text-2xl font-bold uppercase tracking-wide">
        Escolha o dia
      </h2>
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {days.map((day) => {
          const dateStr = toDateString(day);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelect(dateStr)}
              className={`flex min-w-[72px] flex-col items-center rounded-2xl border px-3 py-3 transition-colors ${
                isSelected
                  ? 'border-brass bg-brass text-charcoal'
                  : 'border-barber-line bg-charcoal-soft hover:border-brass/50'
              }`}
            >
              <span
                className={`text-[11px] font-medium uppercase ${
                  isSelected ? 'text-charcoal/70' : 'text-cream/50'
                }`}
              >
                {isToday ? 'Hoje' : WEEKDAY_LABELS[day.getDay()]}
              </span>
              <span className="font-display text-2xl font-bold">
                {day.getDate()}
              </span>
              <span
                className={`text-[11px] uppercase ${
                  isSelected ? 'text-charcoal/70' : 'text-cream/50'
                }`}
              >
                {MONTH_LABELS[day.getMonth()]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
