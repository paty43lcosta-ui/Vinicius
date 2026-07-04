export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-barber-line bg-charcoal-soft p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wider text-cream/50">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-brass-light">
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-cream/40">{detail}</p>}
    </Card>
  );
}
