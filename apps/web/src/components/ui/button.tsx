import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  asChild?: boolean;
}

const variantStyles = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-muted focus:ring-primary',
  secondary: 'bg-surface-raised text-foreground border border-border hover:bg-surface-overlay focus:ring-primary',
  ghost: 'text-foreground-muted hover:bg-surface-raised hover:text-foreground focus:ring-primary',
  danger: 'bg-risk-hard-bg text-risk-hard border border-risk-hard-border hover:bg-risk-hard focus:ring-risk-hard',
  outline: 'bg-transparent text-foreground-muted border border-border hover:bg-surface-raised hover:text-foreground focus:ring-primary',
};

const sizeStyles = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  asChild = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const classes = cn(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: cn(classes, children.props.className),
      ...props,
    });
  }

  return (
    <button className={classes} disabled={isDisabled} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}