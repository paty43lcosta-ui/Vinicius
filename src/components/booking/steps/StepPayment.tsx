'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Service, Tenant } from '@/types/database';
import type { ClientDataInput } from '@/lib/validations/booking';
import {
  createBookingWithPayment,
  type CreateBookingResult,
} from '@/actions/booking';
import {
  calcDeposit,
  formatCurrency,
  formatDateShort,
  RESERVATION_MINUTES,
} from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Props = {
  tenant: Tenant;
  service: Service;
  date: string;
  time: string;
  client: ClientDataInput;
  onConfirmed: (bookingId: string) => void;
  onExpired: () => void;
};

type PixData = { qrCode: string; qrCodeBase64: string; ticketUrl: string | null };

const STATUS_POLL_MS = 4_000;

export function StepPayment({
  tenant,
  service,
  date,
  time,
  client,
  onConfirmed,
  onExpired,
}: Props) {
  const [creating, setCreating] = useState<'pix' | 'credit_card' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [pix, setPix] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESERVATION_MINUTES * 60);
  const expiredRef = useRef(false);

  const deposit = calcDeposit(service.price, tenant.deposit_pct, tenant.deposit_min);
  const remaining = service.price - deposit;

  const startPayment = useCallback(
    async (method: 'pix' | 'credit_card') => {
      setCreating(method);
      setError(null);
      const result: CreateBookingResult = await createBookingWithPayment({
        tenant_id: tenant.id,
        service_id: service.id,
        date,
        time_slot: time,
        client_name: client.client_name,
        client_phone: client.client_phone,
        client_email: client.client_email || '',
        payment_method: method,
      });

      if ('error' in result) {
        setError(result.error);
        setCreating(null);
        return;
      }

      setBookingId(result.bookingId);
      setSecondsLeft(RESERVATION_MINUTES * 60);

      if (result.initPoint) {
        // Cartão: redireciona para o checkout do Mercado Pago
        window.location.href = result.initPoint;
        return;
      }
      if (result.pix) {
        setPix(result.pix);
      }
      setCreating(null);
    },
    [tenant.id, service.id, date, time, client],
  );

  // Polling do status do booking enquanto o PIX está na tela
  useEffect(() => {
    if (!bookingId || !pix) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/status`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data: { status: string } = await res.json();
        if (data.status === 'confirmado') {
          clearInterval(interval);
          onConfirmed(bookingId);
        }
        if (data.status === 'cancelado') {
          clearInterval(interval);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpired();
          }
        }
      } catch {
        // rede oscilou — tenta de novo no próximo tick
      }
    }, STATUS_POLL_MS);
    return () => clearInterval(interval);
  }, [bookingId, pix, onConfirmed, onExpired]);

  // Timer de expiração da reserva (10 minutos)
  useEffect(() => {
    if (!pix) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpired();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1_000);
    return () => clearInterval(interval);
  }, [pix, onExpired]);

  async function copyPixCode() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      setError('Não foi possível copiar. Selecione o código manualmente.');
    }
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <section aria-label="Pagamento do sinal">
      <h2 className="mb-4 font-display text-2xl font-bold uppercase tracking-wide">
        Pague o sinal
      </h2>

      <Card className="mb-5">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-cream/60">Serviço</dt>
            <dd className="font-medium">{service.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cream/60">Quando</dt>
            <dd className="font-medium">
              {formatDateShort(date)} às {time}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cream/60">Valor total</dt>
            <dd>{formatCurrency(service.price)}</dd>
          </div>
          <div className="flex justify-between border-t border-barber-line pt-2">
            <dt className="font-medium text-brass-light">
              Sinal agora ({tenant.deposit_pct}%)
            </dt>
            <dd className="font-display text-xl font-bold text-brass-light">
              {formatCurrency(deposit)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cream/60">Restante no local</dt>
            <dd>{formatCurrency(remaining)}</dd>
          </div>
        </dl>
      </Card>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-barber-red/50 bg-barber-red/10 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {!pix ? (
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            loading={creating === 'pix'}
            disabled={creating !== null}
            onClick={() => startPayment('pix')}
          >
            Pagar com PIX
          </Button>
          <Button
            size="lg"
            variant="secondary"
            loading={creating === 'credit_card'}
            disabled={creating !== null}
            onClick={() => startPayment('credit_card')}
          >
            Pagar com cartão
          </Button>
          <p className="text-center text-xs text-cream/40">
            Seu horário fica reservado por {RESERVATION_MINUTES} minutos
            enquanto você paga.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p
            className="rounded-full border border-brass/40 bg-brass/10 px-4 py-1 font-mono text-sm text-brass-light"
            aria-live="polite"
          >
            Reserva expira em {minutes}:{seconds}
          </p>

          {/* QR Code do PIX (base64 vindo do Mercado Pago) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${pix.qrCodeBase64}`}
            alt="QR Code do PIX para pagamento do sinal"
            className="h-56 w-56 rounded-xl bg-white p-2"
          />

          <p className="text-center text-sm text-cream/70">
            Abra o app do seu banco, escolha PIX e escaneie o código — ou use o
            copia e cola:
          </p>

          <div className="w-full">
            <p className="scrollbar-none max-h-20 overflow-y-auto break-all rounded-xl border border-barber-line bg-charcoal p-3 font-mono text-xs text-cream/60">
              {pix.qrCode}
            </p>
            <Button className="mt-2 w-full" variant="secondary" onClick={copyPixCode}>
              {copied ? '✓ Código copiado!' : 'Copiar código PIX'}
            </Button>
          </div>

          <p className="flex items-center gap-2 text-sm text-cream/50" aria-live="polite">
            <span
              aria-hidden
              className="h-3 w-3 animate-spin rounded-full border-2 border-brass border-t-transparent"
            />
            Aguardando confirmação do pagamento…
          </p>
        </div>
      )}
    </section>
  );
}
