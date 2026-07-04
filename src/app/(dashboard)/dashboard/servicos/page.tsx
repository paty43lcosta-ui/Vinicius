import { createClient } from '@/lib/supabase/server';
import { ServicesManager } from '@/components/dashboard/ServicesManager';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Serviços' };

export default async function ServicesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', user!.id)
    .single();

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenant!.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
        Serviços
      </h1>
      <p className="mt-1 text-sm text-cream/50">
        Arraste para reordenar. A ordem aparece na sua página pública.
      </p>
      <ServicesManager tenantId={tenant!.id} initialServices={services ?? []} />
    </div>
  );
}
