import { forwardRef, useId, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, prefix, className = '', id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-cream/80">
          {label}
        </label>
      )}
      <div className="flex items-stretch">
        {prefix && (
          <span className="flex items-center rounded-l-xl border border-r-0 border-barber-line bg-charcoal-soft px-3 text-sm text-cream/50">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={`w-full border bg-charcoal-soft px-4 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:ring-1 ${
            prefix ? 'rounded-r-xl' : 'rounded-xl'
          } ${
            error
              ? 'border-barber-red focus:border-barber-red focus:ring-barber-red'
              : 'border-barber-line focus:border-brass focus:ring-brass'
          } ${className}`}
          {...rest}
        />
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-cream/40">{hint}</p>
      ) : null}
    </div>
  );
});
