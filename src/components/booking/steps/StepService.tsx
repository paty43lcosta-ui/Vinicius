'use client';

import type { Service } from '@/types/database';
import { formatCurrency } from '@/lib/utils';

type Props = {
  services: Service[];
  selectedId: string | null;
  onSelect: (service: Service) => void;
};

export function StepService({ services, selectedId, onSelect }: Props) {
  if (services.length === 0) {
    return (
      <p className="rounded-xl border border-barber-line bg-charcoal-soft p-6 text-center text-sm text-cream/60">
        Essa barbearia ainda não cadastrou serviços. Volte mais tarde ou entre
        em contato direto com o barbeiro.
      </p>
    );
  }

  return (
    <section aria-label="Escolha o serviço">
      <h2 className="mb-4 font-display text-2xl font-bold uppercase tracking-wide">
        Escolha o serviço
      </h2>
      <div className="grid gap-3">
        {services.map((service) => {
          const isSelected = service.id === selectedId;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-colors ${
                isSelected
                  ? 'border-brass bg-brass/10'
                  : 'border-barber-line bg-charcoal-soft hover:border-brass/50'
              }`}
            >
              <span>
                <span className="block font-medium">{service.name}</span>
                <span className="mt-0.5 block text-xs text-cream/50">
                  {service.duration} min
                </span>
              </span>
              <span className="font-display text-xl font-bold text-brass-light">
                {formatCurrency(service.price)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
