'use client';

import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  createService,
  reorderServices,
} from '@/actions/service';
import type { Service } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ServiceRow } from './ServiceRow';

export function ServicesManager({
  tenantId,
  initialServices,
}: {
  tenantId: string;
  initialServices: Service[];
}) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form de novo serviço
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('30');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = services.findIndex((s) => s.id === active.id);
    const newIndex = services.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(services, oldIndex, newIndex);
    setServices(reordered);

    const result = await reorderServices(reordered.map((s) => s.id));
    if (result.error) {
      setError(result.error);
      setServices(services); // desfaz visualmente
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const priceCents = Math.round(parseFloat(newPrice.replace(',', '.')) * 100);
    const result = await createService(
      tenantId,
      {
        name: newName,
        price: Number.isNaN(priceCents) ? 0 : priceCents,
        duration: parseInt(newDuration, 10) || 0,
      },
      services.length,
    );

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    // recarrega do servidor para pegar o ID real
    window.location.reload();
  }

  function patchService(id: string, patch: Partial<Service>) {
    setServices((list) =>
      list.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }

  return (
    <div className="mt-6 max-w-2xl">
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-barber-red/50 bg-barber-red/10 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {services.length === 0 && !showForm && (
        <p className="mb-4 rounded-xl border border-barber-line bg-charcoal-soft p-6 text-center text-sm text-cream/50">
          Você ainda não tem serviços. Cadastre o primeiro para liberar sua
          página de agendamento.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={services.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-2">
            {services.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                onPatched={(patch) => patchService(service.id, patch)}
                onError={setError}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {showForm ? (
        <form
          onSubmit={handleCreate}
          className="mt-4 flex flex-col gap-3 rounded-2xl border border-brass/40 bg-charcoal-soft p-4"
        >
          <Input
            label="Nome do serviço"
            placeholder="Corte degradê"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Preço (R$)"
              inputMode="decimal"
              placeholder="45,00"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              required
            />
            <Input
              label="Duração (min)"
              type="number"
              min={10}
              step={5}
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>
              Salvar serviço
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button className="mt-4" onClick={() => setShowForm(true)}>
          + Adicionar serviço
        </Button>
      )}
    </div>
  );
}
