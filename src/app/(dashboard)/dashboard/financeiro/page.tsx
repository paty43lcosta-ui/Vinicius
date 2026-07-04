import { createClient } from '@/lib/supabase/server';
import { toDateString } from '@/lib/utils';
import { FinancialTable } from '@/components/dashboard/FinancialTable';
import type { BookingWithService } from '@/types/database';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Financeiro' };

export default async function FinancialPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user!.id)
    .single();

  // Últimos 12 meses — os filtros de período rodam no cliente
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, services(name, duration)')
    .eq('tenant_id', tenant!.id)
    .gte('date', toDateString(oneYearAgo))
    .order('date', { ascending: false })
    .order('time_slot', { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
        Financeiro
      </h1>
      <FinancialTable bookings={(bookings as BookingWithService[]) ?? []} />
    </div>
  );
}
