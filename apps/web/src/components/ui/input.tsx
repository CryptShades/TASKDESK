import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const errorId = id ? `${id}-error` : undefined;
  const hintId = id ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium uppercase tracking-wide text-foreground-muted"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={cn(
          'block w-full rounded-md border bg-input px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50',
          error
            ? 'border-risk-hard focus:ring-risk-hard'
            : 'border-border focus:ring-primary',
          className
        )}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-risk-hard">{error}</p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-sm text-foreground-subtle">{hint}</p>
      )}
    </div>
  );
}