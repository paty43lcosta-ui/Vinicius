import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Polling do status do agendamento durante o pagamento.
 * Retorna apenas o status — nenhum dado pessoal é exposto.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!z.string().uuid().safeParse(params.id).success) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('status')
    .eq('id', params.id)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({ status: booking.status });
}
