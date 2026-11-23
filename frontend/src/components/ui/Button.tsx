import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// eslint-disable-next-line react/only-export-components
export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-hover border border-primary hover:border-primary-hover shadow-card',
  secondary:
    'bg-surface text-fg hover:bg-surface-2 border border-line hover:border-line-strong shadow-card',
  outline: 'bg-transparent text-fg-muted hover:text-fg hover:bg-surface-2 border border-line-strong',
  ghost: 'bg-transparent text-fg-muted hover:text-fg hover:bg-surface-2 border border-transparent',
  danger:
    'bg-critical/12 text-critical hover:bg-critical/20 border border-critical/35',
};

// eslint-disable-next-line react/only-export-components
export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-md font-medium',
  md: 'text-sm px-3.5 py-2 gap-2 rounded-lg font-medium',
  lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5 rounded-lg font-semibold',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={`inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariantClasses[variant]} ${buttonSizeClasses[size]} ${className}`}
        {...rest}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : leftIcon}
        {children !== undefined && <span>{children}</span>}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
