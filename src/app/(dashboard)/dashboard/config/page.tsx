import { createClient } from '@/lib/supabase/server';
import { ConfigForm } from '@/components/dashboard/ConfigForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Configurações' };

export default async function ConfigPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('owner_id', user!.id)
    .single();

  // Preço de exemplo para o preview do sinal: primeiro serviço ativo
  const { data: firstService } = await supabase
    .from('services')
    .select('name, price')
    .eq('tenant_id', tenant!.id)
    .eq('active', true)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
        Configurações
      </h1>
      <ConfigForm
        tenant={tenant!}
        exampleService={firstService ?? { name: 'Corte', price: 5000 }}
      />
    </div>
  );
}
