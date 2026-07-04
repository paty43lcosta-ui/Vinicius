import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { BookingFlow } from '@/components/booking/BookingFlow';

export const dynamic = 'force-dynamic';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('slug', params.slug)
    .eq('active', true)
    .maybeSingle();

  return {
    title: tenant ? `Agendar em ${tenant.name}` : 'Barbearia',
    description: tenant
      ? `Agende seu horário em ${tenant.name} — pague o sinal online e garanta sua vaga.`
      : undefined,
  };
}

export default async function PublicBookingPage({ params }: Props) {
  // Cliente anônimo — as políticas públicas de RLS liberam apenas
  // tenants ativos e serviços ativos.
  const supabase = createClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', params.slug)
    .eq('active', true)
    .maybeSingle();

  if (!tenant) notFound();

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('active', true)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
      <header className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-brass">
          Agendamento online
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-wide">
          {tenant.name}
        </h1>
        {tenant.address && (
          <p className="mt-2 text-sm text-cream/60">📍 {tenant.address}</p>
        )}
      </header>

      <BookingFlow tenant={tenant} services={services ?? []} />

      <footer className="mt-12 pb-4 text-center text-xs text-cream/30">
        Agendamento por AgendaBarba
      </footer>
    </main>
  );
}
