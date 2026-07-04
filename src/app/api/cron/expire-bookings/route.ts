import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { RESERVATION_MINUTES } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * Job de expiração: cancela reservas aguardando pagamento há mais de
 * 10 minutos, liberando o slot. Agendado via Vercel Cron (vercel.json).
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const cutoff = new Date(
    Date.now() - RESERVATION_MINUTES * 60_000,
  ).toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('bookings')
    .update({ status: 'cancelado' })
    .eq('status', 'aguardando_pagamento')
    .lt('created_at', cutoff)
    .select('id');

  if (error) {
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }

  return NextResponse.json({ expired: data?.length ?? 0 });
}
