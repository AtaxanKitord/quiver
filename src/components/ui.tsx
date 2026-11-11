import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { cx };

type Variant = 'gold' | 'primary' | 'ghost' | 'quiet' | 'danger';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-[background,box-shadow,transform] duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px',
        size === 'sm' && 'h-8 px-3 text-sm',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        variant === 'gold' && 'bg-gold text-on-gold shadow-card hover:brightness-105',
        variant === 'primary' && 'bg-brand text-brand-ink hover:brightness-110',
        variant === 'ghost' && 'border border-line-strong bg-transparent text-ink hover:bg-surface-2',
        variant === 'quiet' && 'bg-transparent text-ink-soft hover:bg-surface-2 hover:text-ink',
        variant === 'danger' && 'border border-line-strong bg-transparent text-ink hover:bg-surface-2',
        className,
      )}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-line bg-surface shadow-card', className)}>{children}</div>;
}

export function Chip({
  active,
  onClick,
  children,
  className,
  title,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const base = cx(
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors',
    active ? 'border-gold bg-gold-soft text-ink' : 'border-line bg-surface text-ink-soft',
    onClick && !active && 'hover:border-line-strong hover:text-ink',
    className,
  );
  if (!onClick) return <span className={base} title={title}>{children}</span>;
  return (
    <button type="button" className={base} onClick={onClick} aria-pressed={!!active} title={title}>
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 select-none">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-5 w-9 rounded-full border border-line-strong bg-surface-2 transition-colors peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold" />
        <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-ink-faint transition-transform peer-checked:translate-x-4 peer-checked:bg-brand-ink" />
      </span>
      <span className="text-sm">
        <span className="font-medium text-ink">{label}</span>
        {hint && <span className="block text-ink-faint">{hint}</span>}
      </span>
    </label>
  );
}

export function Field({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-gold focus:outline-none';

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            o.value === value ? 'bg-surface text-ink shadow-card' : 'text-ink-soft hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cx(
        'm-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-visible rounded-2xl border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-black/40',
        wide ? 'max-w-2xl' : 'max-w-lg',
      )}
    >
      {open && (
        <div className="flex max-h-[90dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-ink-soft hover:bg-surface-2 hover:text-ink" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}

export function Monogram({ text, size = 'md' }: { text: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-xl bg-brand font-semibold tracking-wide text-brand-ink',
        size === 'sm' && 'h-7 w-7 text-[10px]',
        size === 'md' && 'h-9 w-9 text-xs',
        size === 'lg' && 'h-12 w-12 text-sm',
      )}
    >
      {text}
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#0B3D2E" />
      <path d="M20 46 L44 20" stroke="#F5F1E6" strokeWidth="4" strokeLinecap="round" />
      <path d="M35 18 H46 V29" fill="none" stroke="#C9A227" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 40 L24 47 M14 45 L19 50" stroke="#C9A227" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function MatchMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`${value}% match`}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-gold" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums text-ink">{value}%</span>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
      <div className="mb-3 text-ink-faint">{icon}</div>
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="mt-2 max-w-md text-sm text-ink-soft">{children}</div>}
    </div>
  );
}
