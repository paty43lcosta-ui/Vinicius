'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { tenantSettingsSchema } from '@/lib/validations/tenant';
import type { TenantSettingsInput } from '@/lib/validations/tenant';
import { checkSlugAvailability } from './auth';

export async function updateTenantSettings(
  tenantId: string,
  input: TenantSettingsInput,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = tenantSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' };
  }

  const { available } = await checkSlugAvailability(parsed.data.slug, tenantId);
  if (!available) {
    return { error: 'Esse link já está em uso por outra barbearia. Escolha outro.' };
  }

  // Cliente com a sessão do dono — a RLS garante que só o próprio tenant é editável.
  const supabase = createClient();
  const { error } = await supabase
    .from('tenants')
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      hours_start: parsed.data.hours_start,
      hours_end: parsed.data.hours_end,
      working_days: parsed.data.working_days,
      deposit_pct: parsed.data.deposit_pct,
      mp_access_token: parsed.data.mp_access_token || null,
    })
    .eq('id', tenantId);

  if (error) {
    if (error.code === '23505') {
      return { error: 'Esse link já está em uso por outra barbearia. Escolha outro.' };
    }
    return { error: 'Não foi possível salvar as configurações. Tente novamente.' };
  }

  revalidatePath('/dashboard/config');
  revalidatePath('/dashboard');
  return { success: true };
}
