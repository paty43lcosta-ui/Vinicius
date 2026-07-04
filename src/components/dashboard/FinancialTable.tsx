'use client';

import { useMemo, useState } from 'react';
import type { BookingWithService } from '@/types/database';
import {
  formatCurrency,
  formatDateFull,
  normalizeTimeSlot,
  toDateString,
} from '@/lib/utils';
import { StatCard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

type Period = '7d' | '30d' | '3m' | 'custom';

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: 'custom', label: 'Personalizado' },
];

export function FinancialTable({ bookings }: { bookings: BookingWithService[] }) {
  const [period, setPeriod] = useState<Period>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { startStr, endStr } = useMemo(() => {
    const today = new Date();
    const end = toDateString(today);
    if (period === 'custom') {
      return {
        startStr: customStart || '0000-01-01',
        endStr: customEnd || end,
      };
    }
    const start = new Date(today);
    if (period === '7d') start.setDate(today.getDate() - 7);
    if (period === '30d') start.setDate(today.getDate() - 30);
    if (period === '3m') start.setMonth(today.getMonth() - 3);
    return { startStr: toDateString(start), endStr: end };
  }, [period, customStart, customEnd]);

  const filtered = useMemo(
    () => bookings.filter((b) => b.date >= startStr && b.date <= endStr),
    [bookings, startStr, endStr],
  );

  const totals = useMemo(() => {
    const paid = filtered.filter(
      (b) => b.status === 'confirmado' || b.status === 'concluido',
    );
    const depositTotal = paid.reduce((sum, b) => sum + b.deposit_amount, 0);
    const avgTicket =
      paid.length > 0
        ? Math.round(paid.reduce((sum, b) => sum + b.total_amount, 0) / paid.length)
        : 0;

    const byService = new Map<string, number>();
    for (const b of paid) {
      const name = b.services?.name ?? 'Serviço';
      byService.set(name, (byService.get(name) ?? 0) + 1);
    }
    let popular = '—';
    let max = 0;
    byService.forEach((count, name) => {
      if (count > max) {
        max = count;
        popular = name;
      }
    });

    return { depositTotal, avgTicket, popular };
  }, [filtered]);

  function exportCsv() {
    const header = [
      'Data',
      'Horário',
      'Cliente',
      'Serviço',
      'Total (R$)',
      'Sinal recebido (R$)',
      'Restante (R$)',
      'Status',
    ];
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = filtered.map((b) =>
      [
        formatDateFull(b.date),
        normalizeTimeSlot(b.time_slot),
        escape(b.client_name),
        escape(b.services?.name ?? 'Serviço'),
        (b.total_amount / 100).toFixed(2).replace('.', ','),
        (b.deposit_amount / 100).toFixed(2).replace('.', ','),
        (b.remaining_amount / 100).toFixed(2).replace('.', ','),
        b.status,
      ].join(';'),
    );
    const csv = '﻿' + [header.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financeiro-${startStr}-a-${endStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              period === p.value
                ? 'border-brass bg-brass/15 text-brass-light'
                : 'border-barber-line text-cream/50 hover:text-cream'
            }`}
          >
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <span className="flex items-center gap-2 text-xs text-cream/60">
            <input
              type="date"
              aria-label="Data inicial"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-barber-line bg-charcoal-soft px-2 py-1 text-cream [color-scheme:dark]"
            />
            até
            <input
              type="date"
              aria-label="Data final"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-barber-line bg-charcoal-soft px-2 py-1 text-cream [color-scheme:dark]"
            />
          </span>
        )}
        <div className="ml-auto">
          <Button
            size="sm"
            variant="secondary"
            onClick={exportCsv}
            disabled={filtered.length === 0}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Sinais recebidos"
          value={formatCurrency(totals.depositTotal)}
          detail="Agendamentos confirmados e concluídos"
        />
        <StatCard
          label="Ticket médio"
          value={formatCurrency(totals.avgTicket)}
          detail="Valor total por agendamento"
        />
        <StatCard label="Serviço mais popular" value={totals.popular} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-barber-line">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-barber-line bg-charcoal-soft text-xs uppercase tracking-wider text-cream/50">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Serviço</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-right font-medium">Sinal</th>
              <th className="px-4 py-3 text-right font-medium">Restante</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-cream/40">
                  Nenhum agendamento no período selecionado.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-barber-line/50 last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatDateFull(b.date)}{' '}
                    <span className="text-cream/40">
                      {normalizeTimeSlot(b.time_slot)}
                    </span>
                  </td>
                  <td className="max-w-40 truncate px-4 py-3">{b.client_name}</td>
                  <td className="max-w-40 truncate px-4 py-3 text-cream/70">
                    {b.services?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(b.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400">
                    {formatCurrency(b.deposit_amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-cream/70">
                    {formatCurrency(b.remaining_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
