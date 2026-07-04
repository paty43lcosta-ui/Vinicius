'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { serviceSchema } from '@/lib/validations/service';
import type { ServiceInput } from '@/lib/validations/service';

type Result = { error?: string; success?: boolean };

// Todas as actions usam o cliente com a sessão do dono —
// a RLS garante que só serviços do próprio tenant são afetados.

export async function createService(
  tenantId: string,
  input: ServiceInput,
  position: number,
): Promise<Result> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' };
  }

  const supabase = createClient();
  const { error } = await supabase.from('services').insert({
    tenant_id: tenantId,
    name: parsed.data.name,
    price: parsed.data.price,
    duration: parsed.data.duration,
    position,
  });

  if (error) {
    return { error: 'Não foi possível criar o serviço. Tente novamente.' };
  }
  revalidatePath('/dashboard/servicos');
  return { success: true };
}

export async function updateService(
  serviceId: string,
  input: ServiceInput,
): Promise<Result> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('services')
    .update({
      name: parsed.data.name,
      price: parsed.data.price,
      duration: parsed.data.duration,
    })
    .eq('id', serviceId);

  if (error) {
    return { error: 'Não foi possível salvar o serviço. Tente novamente.' };
  }
  revalidatePath('/dashboard/servicos');
  return { success: true };
}

export async function toggleServiceActive(
  serviceId: string,
  active: boolean,
): Promise<Result> {
  const supabase = createClient();
  const { error } = await supabase
    .from('services')
    .update({ active })
    .eq('id', serviceId);

  if (error) {
    return { error: 'Não foi possível alterar o serviço. Tente novamente.' };
  }
  revalidatePath('/dashboard/servicos');
  return { success: true };
}

/** Recebe os IDs na nova ordem e persiste o campo `position`. */
export async function reorderServices(orderedIds: string[]): Promise<Result> {
  const supabase = createClient();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('services').update({ position: index }).eq('id', id),
    ),
  );
  if (results.some((r) => r.error)) {
    return { error: 'Não foi possível reordenar. Recarregue a página e tente de novo.' };
  }
  revalidatePath('/dashboard/servicos');
  return { success: true };
}
