import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import {
  formatCurrency,
  normalizeTimeSlot,
  toDateString,
} from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardOverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, mp_access_token')
    .eq('owner_id', user!.id)
    .single();

  const today = new Date();
  const todayStr = toDateString(today);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [todayRes, weekRes, monthRes, summaryRes, upcomingRes] =
    await Promise.all([
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant!.id)
        .eq('date', todayStr)
        .in('status', ['confirmado', 'concluido']),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant!.id)
        .gte('date', toDateString(weekStart))
        .lte('date', toDateString(weekEnd))
        .in('status', ['confirmado', 'concluido']),
      supabase
        .from('bookings')
        .select('status')
        .eq('tenant_id', tenant!.id)
        .gte('date', toDateString(monthStart))
        .lte('date', toDateString(monthEnd)),
      supabase
        .from('financial_summary')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .gte('month', toDateString(monthStart)),
      supabase
        .from('bookings')
        .select('id, time_slot, client_name, status, deposit_amount, services(name, duration)')
        .eq('tenant_id', tenant!.id)
        .eq('date', todayStr)
        .neq('status', 'cancelado')
        .order('time_slot', { ascending: true })
        .limit(8),
    ]);

  const monthBookings = monthRes.data ?? [];
  const confirmedCount = monthBookings.filter(
    (b) => b.status === 'confirmado' || b.status === 'concluido',
  ).length;
  const conversionRate =
    monthBookings.length > 0
      ? Math.round((confirmedCount / monthBookings.length) * 100)
      : null;

  const monthDeposits = summaryRes.data?.[0]?.total_deposits ?? 0;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
        Resumo
      </h1>
      <p className="mt-1 text-sm text-cream/50">
        {today.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </p>

      {!tenant!.mp_access_token && (
        <Link
          href="/dashboard/config#mercado-pago"
          className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-brass/50 bg-brass/10 p-4 transition-colors hover:bg-brass/15 sm:flex-row sm:items-center"
        >
          <span>
            <span className="block font-display text-lg font-bold uppercase tracking-wide text-brass-light">
              Falta conectar o Mercado Pago
            </span>
            <span className="mt-0.5 block text-sm text-cream/70">
              Sem isso, ninguém consegue pagar o sinal na sua página. Leva
              menos de 5 minutos — veja o passo a passo.
            </span>
          </span>
          <span className="whitespace-nowrap rounded-xl bg-brass px-4 py-2 text-sm font-semibold text-charcoal">
            Configurar agora →
          </span>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Agendamentos hoje"
          value={String(todayRes.count ?? 0)}
        />
        <StatCard
          label="Sinais no mês"
          value={formatCurrency(monthDeposits ?? 0)}
          detail="Recebidos online"
        />
        <StatCard
          label="Nesta semana"
          value={String(weekRes.count ?? 0)}
          detail="Confirmados"
        />
        <StatCard
          label="Taxa de conversão"
          value={conversionRate === null ? '—' : `${conversionRate}%`}
          detail="Confirmados / total no mês"
        />
      </div>

      <h2 className="mt-10 font-display text-xl font-bold uppercase tracking-wide">
        Hoje na barbearia
      </h2>
      {!upcomingRes.data || upcomingRes.data.length === 0 ? (
        <p className="mt-4 rounded-xl border border-barber-line bg-charcoal-soft p-6 text-center text-sm text-cream/50">
          Nenhum agendamento para hoje. Divulgue sua página para encher a
          agenda!
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {upcomingRes.data.map((booking) => (
            <li
              key={booking.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-barber-line bg-charcoal-soft px-4 py-3"
            >
              <div className="flex items-center gap-4">
                <span className="font-display text-lg font-bold text-brass-light">
                  {normalizeTimeSlot(booking.time_slot)}
                </span>
                <div>
                  <p className="text-sm font-medium">{booking.client_name}</p>
                  <p className="text-xs text-cream/50">
                    {booking.services?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-cream/50 sm:block">
                  Sinal {formatCurrency(booking.deposit_amount)}
                </span>
                <StatusBadge status={booking.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
