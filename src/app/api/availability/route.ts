import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeTimeSlot, RESERVATION_MINUTES } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  tenant_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Slots ocupados de um tenant em uma data (para a página pública).
 * Ocupado = booking não cancelado; reservas pendentes só contam
 * dentro da janela de 10 minutos.
 */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    tenant_id: request.nextUrl.searchParams.get('tenant_id'),
    date: request.nextUrl.searchParams.get('date'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid params' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: bookings, error } = await admin
    .from('bookings')
    .select('time_slot, status, created_at')
    .eq('tenant_id', parsed.data.tenant_id)
    .eq('date', parsed.data.date)
    .neq('status', 'cancelado');

  if (error) {
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }

  const cutoff = Date.now() - RESERVATION_MINUTES * 60_000;
  const occupied = (bookings ?? [])
    .filter(
      (b) =>
        b.status !== 'aguardando_pagamento' ||
        new Date(b.created_at).getTime() >= cutoff,
    )
    .map((b) => normalizeTimeSlot(b.time_slot));

  return NextResponse.json({ occupied });
}
