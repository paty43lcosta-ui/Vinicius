const STEP_LABELS = ['Serviço', 'Data', 'Horário', 'Seus dados', 'Sinal', 'Pronto'];

export function StepsIndicator({ current }: { current: number }) {
  return (
    <ol
      aria-label="Etapas do agendamento"
      className="mb-8 flex items-center justify-center gap-1.5"
    >
      {STEP_LABELS.map((label, index) => {
        const step = index + 1;
        const isDone = step < current;
        const isCurrent = step === current;
        return (
          <li key={label} className="flex items-center gap-1.5">
            <span
              aria-current={isCurrent ? 'step' : undefined}
              title={label}
              className={`h-2 rounded-full transition-all ${
                isCurrent
                  ? 'w-8 bg-brass'
                  : isDone
                    ? 'w-2 bg-brass/60'
                    : 'w-2 bg-barber-line'
              }`}
            />
          </li>
        );
      })}
    </ol>
  );
}
