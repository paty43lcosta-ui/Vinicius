/** Formata centavos como moeda brasileira: 4500 → "R$ 45,00" */
export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Calcula o sinal em centavos: pct% do total, respeitando o mínimo. */
export function calcDeposit(
  totalCents: number,
  depositPct: number,
  depositMinCents: number,
): number {
  return Math.min(
    totalCents,
    Math.max(depositMinCents, Math.round((totalCents * depositPct) / 100)),
  );
}

/** Gera slug a partir do nome: minúsculas, sem acentos, hífens. Máx. 50 chars. */
export function generateSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '');
}

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const MONTH_LABELS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

/** 'YYYY-MM-DD' na hora local (não UTC). */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Interpreta 'YYYY-MM-DD' como data local (evita shift de fuso do new Date). */
export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Próximos `count` dias (a partir de hoje) que caem em `workingDays` (0=Dom…6=Sáb). */
export function getNextWorkingDays(workingDays: number[], count = 14): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // olha até 60 dias à frente para garantir `count` dias úteis
  for (let i = 0; i < 60 && days.length < count; i++) {
    if (workingDays.includes(cursor.getDay())) {
      days.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Slots de 30min entre hoursStart e hoursEnd: ['09:00', '09:30', …]. */
export function generateTimeSlots(hoursStart: number, hoursEnd: number): string[] {
  const slots: string[] = [];
  for (let h = hoursStart; h < hoursEnd; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

/** Normaliza 'HH:MM:SS' ou 'HH:MM' para 'HH:MM'. */
export function normalizeTimeSlot(time: string): string {
  return time.slice(0, 5);
}

/** 'Sex, 04 jul' */
export function formatDateShort(dateStr: string): string {
  const d = parseDateString(dateStr);
  return `${WEEKDAY_LABELS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${MONTH_LABELS[d.getMonth()]}`;
}

/** '04/07/2026' */
export function formatDateFull(dateStr: string): string {
  return parseDateString(dateStr).toLocaleDateString('pt-BR');
}

/** Telefone apenas com dígitos, com DDI 55 se faltar (para link do WhatsApp). */
export function phoneToWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

/** Minutos desde a criação do booking — usado na expiração da reserva. */
export const RESERVATION_MINUTES = 10;
