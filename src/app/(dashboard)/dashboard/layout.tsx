import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/entrar');

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!tenant) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase">
            Barbearia não encontrada
          </h1>
          <p className="mt-2 max-w-sm text-sm text-cream/60">
            Sua conta não tem uma barbearia vinculada. Entre em contato com o
            suporte do AgendaBarba.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar tenantName={tenant.name} tenantSlug={tenant.slug} />
      <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
        {children}
      </main>
    </div>
  );
}
