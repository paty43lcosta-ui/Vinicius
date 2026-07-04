'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toggleServiceActive, updateService } from '@/actions/service';
import type { Service } from '@/types/database';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function ServiceRow({
  service,
  onPatched,
  onError,
}: {
  service: Service;
  onPatched: (patch: Partial<Service>) => void;
  onError: (message: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(service.name);
  const [price, setPrice] = useState((service.price / 100).toFixed(2).replace('.', ','));
  const [duration, setDuration] = useState(String(service.duration));

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: service.id });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    onError(null);

    const priceCents = Math.round(parseFloat(price.replace(',', '.')) * 100);
    const durationMin = parseInt(duration, 10) || 0;
    const result = await updateService(service.id, {
      name,
      price: Number.isNaN(priceCents) ? 0 : priceCents,
      duration: durationMin,
    });

    if (result.error) {
      onError(result.error);
    } else {
      onPatched({ name, price: priceCents, duration: durationMin });
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleToggle() {
    const next = !service.active;
    onPatched({ active: next }); // otimista
    const result = await toggleServiceActive(service.id, next);
    if (result.error) {
      onPatched({ active: !next });
      onError(result.error);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border bg-charcoal-soft ${
        isDragging ? 'z-10 border-brass shadow-lg' : 'border-barber-line'
      } ${service.active ? '' : 'opacity-50'}`}
    >
      {editing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-3 p-4">
          <Input
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Preço (R$)"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <Input
              label="Duração (min)"
              type="number"
              min={10}
              step={5}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={saving}>
              Salvar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3 p-3">
          <button
            type="button"
            aria-label={`Arrastar ${service.name} para reordenar`}
            className="cursor-grab touch-none px-1 text-cream/30 hover:text-cream/60 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            ⠿
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{service.name}</p>
            <p className="text-xs text-cream/50">
              {formatCurrency(service.price)} · {service.duration} min
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={service.active}
            aria-label={`${service.active ? 'Desativar' : 'Ativar'} ${service.name}`}
            onClick={handleToggle}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              service.active ? 'bg-brass' : 'bg-barber-line'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream transition-all ${
                service.active ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Editar
          </Button>
        </div>
      )}
    </li>
  );
}
