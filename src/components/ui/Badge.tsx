import type { BookingStatus } from '@/types/database';

const statusStyles: Record<BookingStatus, { label: string; className: string }> = {
  aguardando_pagamento: {
    label: 'Aguardando pagamento',
    className: 'bg-brass/15 text-brass-light border-brass/40',
  },
  confirmado: {
    label: 'Confirmado',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40',
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-barber-red/15 text-red-300 border-barber-red/50',
  },
  concluido: {
    label: 'Concluído',
    className: 'bg-cream/10 text-cream/70 border-cream/20',
  },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export function Badge({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-barber-line bg-charcoal-soft px-2.5 py-0.5 text-xs font-medium text-cream/70 ${className}`}
    >
      {children}
    </span>
  );
}
