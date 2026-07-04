'use client';

import { useEffect, useRef, useState } from 'react';
import { checkSlugAvailability } from '@/actions/auth';
import { updateTenantSettings } from '@/actions/tenant';
import type { Tenant } from '@/types/database';
import { calcDeposit, formatCurrency, WEEKDAY_LABELS } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

type Props = {
  tenant: Tenant;
  exampleService: { name: string; price: number };
};

export function ConfigForm({ tenant, exampleService }: Props) {
  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);
  const [address, setAddress] = useState(tenant.address ?? '');
  const [phone, setPhone] = useState(tenant.phone ?? '');
  const [hoursStart, setHoursStart] = useState(tenant.hours_start);
  const [hoursEnd, setHoursEnd] = useState(tenant.hours_end);
  const [workingDays, setWorkingDays] = useState<number[]>(tenant.working_days);
  const [depositPct, setDepositPct] = useState(tenant.deposit_pct);
  const [mpToken, setMpToken] = useState(tenant.mp_access_token ?? '');

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/b/${slug}`;

  // Checagem de unicidade do slug (debounce 400ms), ignorando o próprio tenant
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (slug === tenant.slug || slug.length < 3) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await checkSlugAvailability(slug, tenant.id);
        setSlugStatus(available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [slug, tenant.slug, tenant.id]);

  function toggleDay(day: number) {
    setWorkingDays((days) =>
      days.includes(day)
        ? days.filter((d) => d !== day)
        : [...days, day].sort((a, b) => a - b),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const result = await updateTenantSettings(tenant.id, {
      name,
      slug,
      address,
      phone,
      hours_start: hoursStart,
      hours_end: hoursEnd,
      working_days: workingDays,
      deposit_pct: depositPct,
      mp_access_token: mpToken,
    });

    setMessage(
      result.error
        ? { type: 'error', text: result.error }
        : { type: 'ok', text: 'Configurações salvas!' },
    );
    setSaving(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage({ type: 'error', text: 'Não foi possível copiar o link.' });
    }
  }

  const exampleDeposit = calcDeposit(exampleService.price, depositPct, tenant.deposit_min);

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-2xl flex-col gap-6">
      {/* Link público */}
      <Card>
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-brass-light">
          Sua página de agendamento
        </h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-lg border border-barber-line bg-charcoal px-3 py-2 text-sm text-cream/70">
            {publicUrl}
          </code>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={copyLink}>
              {copied ? '✓ Copiado' : 'Copiar'}
            </Button>
            <a href={`/b/${slug}`} target="_blank" rel="noopener noreferrer">
              <Button type="button" size="sm" variant="secondary">
                Abrir ↗
              </Button>
            </a>
          </div>
        </div>
      </Card>

      {/* Dados da barbearia */}
      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-brass-light">
          Dados da barbearia
        </h2>
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Link (slug)"
          prefix="/b/"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          error={slugStatus === 'taken' ? 'Esse link já está em uso' : undefined}
          hint={
            slugStatus === 'checking'
              ? 'Verificando…'
              : slugStatus === 'available'
                ? '✓ Disponível'
                : 'Só letras minúsculas, números e hífens'
          }
          required
        />
        <Input
          label="Endereço"
          placeholder="Rua, número, bairro"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Input
          label="WhatsApp / Telefone"
          type="tel"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </Card>

      {/* Funcionamento */}
      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-brass-light">
          Horário de funcionamento
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm text-cream/80">
            Abre às
            <select
              value={hoursStart}
              onChange={(e) => setHoursStart(Number(e.target.value))}
              className="rounded-xl border border-barber-line bg-charcoal-soft px-3 py-2.5 text-cream focus:border-brass focus:outline-none"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-cream/80">
            Fecha às
            <select
              value={hoursEnd}
              onChange={(e) => setHoursEnd(Number(e.target.value))}
              className="rounded-xl border border-barber-line bg-charcoal-soft px-3 py-2.5 text-cream focus:border-brass focus:outline-none"
            >
              {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <p className="mb-2 text-sm text-cream/80">Dias de funcionamento</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                key={day}
                type="button"
                aria-pressed={workingDays.includes(day)}
                onClick={() => toggleDay(day)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  workingDays.includes(day)
                    ? 'border-brass bg-brass/15 text-brass-light'
                    : 'border-barber-line text-cream/40 hover:text-cream'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Sinal */}
      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-brass-light">
          Sinal cobrado online
        </h2>
        <label className="flex items-center justify-between text-sm text-cream/80">
          Percentual do sinal
          <span className="font-display text-2xl font-bold text-brass-light">
            {depositPct}%
          </span>
        </label>
        <input
          type="range"
          min={20}
          max={50}
          step={5}
          value={depositPct}
          onChange={(e) => setDepositPct(Number(e.target.value))}
          className="w-full accent-[#C08A35]"
          aria-label="Percentual do sinal"
        />
        <p className="rounded-lg border border-barber-line bg-charcoal px-3 py-2 text-xs text-cream/60">
          Exemplo: para “{exampleService.name}” de{' '}
          {formatCurrency(exampleService.price)}, o cliente paga{' '}
          <strong className="text-brass-light">{formatCurrency(exampleDeposit)}</strong>{' '}
          na reserva (mínimo {formatCurrency(tenant.deposit_min)}).
        </p>
      </Card>

      {/* Mercado Pago */}
      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-brass-light">
          Mercado Pago
        </h2>
        <p className="text-sm text-cream/60">
          Cole o Access Token da sua conta Mercado Pago para receber os sinais
          direto na sua conta. Sem token, a cobrança usa a conta da plataforma.
        </p>
        <Input
          label="Access Token"
          type="password"
          placeholder="APP_USR-…"
          value={mpToken}
          onChange={(e) => setMpToken(e.target.value)}
          hint="Encontre em mercadopago.com.br → Seu negócio → Configurações → Credenciais"
        />
      </Card>

      {message && (
        <p
          role="alert"
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.type === 'ok'
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
              : 'border-barber-red/50 bg-barber-red/10 text-red-300'
          }`}
        >
          {message.text}
        </p>
      )}

      <Button type="submit" size="lg" loading={saving} disabled={slugStatus === 'taken'}>
        Salvar configurações
      </Button>
    </form>
  );
}
