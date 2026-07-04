'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signInSchema, signUpSchema } from '@/lib/validations/auth';
import type { SignInInput, SignUpInput } from '@/lib/validations/auth';

export type ActionResult = { error?: string } | void;

/** Checagem de unicidade do slug — usada no debounce do cadastro e config. */
export async function checkSlugAvailability(
  slug: string,
  excludeTenantId?: string,
): Promise<{ available: boolean }> {
  const admin = createAdminClient();
  let query = admin.from('tenants').select('id').eq('slug', slug).limit(1);
  if (excludeTenantId) {
    query = query.neq('id', excludeTenantId);
  }
  const { data } = await query;
  return { available: !data || data.length === 0 };
}

export async function signUp(input: SignUpInput): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' };
  }
  const { name, email, password, shopName, slug } = parsed.data;

  const admin = createAdminClient();

  const { available } = await checkSlugAvailability(slug);
  if (!available) {
    return { error: 'Esse link já está em uso. Escolha outro para sua barbearia.' };
  }

  // Cria o usuário já confirmado — o dono entra direto após o cadastro.
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (userError || !created.user) {
    if (userError?.message.toLowerCase().includes('already')) {
      return { error: 'Esse e-mail já tem cadastro. Faça login em /entrar.' };
    }
    return { error: 'Não foi possível criar sua conta. Tente novamente.' };
  }

  const { error: tenantError } = await admin.from('tenants').insert({
    owner_id: created.user.id,
    slug,
    name: shopName,
  });

  if (tenantError) {
    // desfaz o usuário para não deixar conta órfã
    await admin.auth.admin.deleteUser(created.user.id);
    if (tenantError.code === '23505') {
      return { error: 'Esse link já está em uso. Escolha outro para sua barbearia.' };
    }
    return { error: 'Não foi possível criar sua barbearia. Tente novamente.' };
  }

  // Autentica na sessão atual (cookies)
  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    return { error: 'Conta criada! Agora faça login em /entrar.' };
  }

  redirect('/dashboard');
}

export async function signIn(input: SignInInput): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: 'E-mail ou senha incorretos. Confira e tente de novo.' };
  }

  redirect('/dashboard');
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/entrar');
}
