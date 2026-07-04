import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    'bg-brass text-charcoal font-semibold hover:bg-brass-light active:bg-brass disabled:bg-barber-line disabled:text-cream/40',
  secondary:
    'border border-brass text-brass hover:bg-brass/10 disabled:border-barber-line disabled:text-cream/40',
  ghost: 'text-cream/70 hover:text-cream hover:bg-charcoal-soft',
  danger:
    'bg-barber-red/15 border border-barber-red/60 text-red-300 hover:bg-barber-red/30',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass-light disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});
