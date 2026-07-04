import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Cliente com service role — IGNORA a RLS. Uso exclusivo no servidor:
 * webhook do Mercado Pago, disponibilidade pública de horários e
 * Server Actions que precisam de escrita sem sessão de usuário.
 * NUNCA importar em código que roda no cliente.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
