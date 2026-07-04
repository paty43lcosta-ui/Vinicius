'use client';

import { useCallback, useState } from 'react';
import type { Service, Tenant } from '@/types/database';
import type { ClientDataInput } from '@/lib/validations/booking';
import { StepsIndicator } from './StepsIndicator';
import { StepService } from './steps/StepService';
import { StepDate } from './steps/StepDate';
import { StepTime } from './steps/StepTime';
import { StepClientData } from './steps/StepClientData';
import { StepPayment } from './steps/StepPayment';
import { StepConfirmation } from './steps/StepConfirmation';

export type BookingSelection = {
  service: Service | null;
  date: string | null; // 'YYYY-MM-DD'
  time: string | null; // 'HH:MM'
  client: ClientDataInput | null;
};

type Props = {
  tenant: Tenant;
  services: Service[];
};

export function BookingFlow({ tenant, services }: Props) {
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState<BookingSelection>({
    service: null,
    date: null,
    time: null,
    client: null,
  });
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  const goBack = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);

  return (
    <div>
      <StepsIndicator current={step} />

      {step > 1 && step < 6 && (
        <button
          type="button"
          onClick={goBack}
          className="mb-4 text-sm text-cream/50 transition-colors hover:text-cream"
        >
          ← Voltar
        </button>
      )}

      {step === 1 && (
        <StepService
          services={services}
          selectedId={selection.service?.id ?? null}
          onSelect={(service) => {
            setSelection((s) => ({ ...s, service, time: null }));
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <StepDate
          tenant={tenant}
          selectedDate={selection.date}
          onSelect={(date) => {
            setSelection((s) => ({ ...s, date, time: null }));
            setStep(3);
          }}
        />
      )}

      {step === 3 && selection.date && (
        <StepTime
          tenant={tenant}
          date={selection.date}
          selectedTime={selection.time}
          onSelect={(time) => {
            setSelection((s) => ({ ...s, time }));
            setStep(4);
          }}
        />
      )}

      {step === 4 && (
        <StepClientData
          defaultValues={selection.client ?? undefined}
          onSubmit={(client) => {
            setSelection((s) => ({ ...s, client }));
            setStep(5);
          }}
        />
      )}

      {step === 5 &&
        selection.service &&
        selection.date &&
        selection.time &&
        selection.client && (
          <StepPayment
            tenant={tenant}
            service={selection.service}
            date={selection.date}
            time={selection.time}
            client={selection.client}
            onConfirmed={(bookingId) => {
              setConfirmedBookingId(bookingId);
              setStep(6);
            }}
            onExpired={() => {
              // reserva expirou: volta para a escolha de horário
              setSelection((s) => ({ ...s, time: null }));
              setStep(3);
            }}
          />
        )}

      {step === 6 &&
        selection.service &&
        selection.date &&
        selection.time &&
        selection.client && (
          <StepConfirmation
            tenant={tenant}
            service={selection.service}
            date={selection.date}
            time={selection.time}
            client={selection.client}
            bookingId={confirmedBookingId}
          />
        )}
    </div>
  );
}
