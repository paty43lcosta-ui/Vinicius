import { createClient } from '@/lib/supabase/server';
import { AgendaView } from '@/components/dashboard/AgendaView';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Agenda' };

export default async function AgendaPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user!.id)
    .single();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
        Agenda
      </h1>
      <AgendaView tenantId={tenant!.id} />
    </div>
  );
}
