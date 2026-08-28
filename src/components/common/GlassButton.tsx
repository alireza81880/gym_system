import React from 'react';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  children?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5 min-h-[32px]',
    md: 'px-4 py-2 text-xs sm:text-sm rounded-xl gap-2 min-h-[40px]',
    lg: 'px-6 py-3 text-sm sm:text-base rounded-2xl gap-2.5 font-bold min-h-[46px]',
  }[size];

  const variantClasses = {
    primary:
      'bg-[var(--gym-brand,#10b981)] hover:opacity-95 text-stone-950 font-bold border border-[var(--gym-border-strong)] shadow-[var(--gym-glow)] active:scale-[0.98]',
    secondary:
      'glass-regular text-[var(--gym-text,#f3f4f6)] hover:border-[var(--gym-border-strong)] active:scale-[0.98]',
    outline:
      'glass-subtle text-[var(--gym-text-secondary,#d1d5db)] hover:text-[var(--gym-text,#fff)] hover:border-[var(--gym-border-strong)] active:scale-[0.98]',
    danger:
      'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-xs active:scale-[0.98]',
    success:
      'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-xs active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-[var(--gym-surface-glass)] text-[var(--gym-text-muted,#9ca3af)] hover:text-[var(--gym-text,#fff)] border-transparent active:scale-[0.98]',
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
      ) : (
        icon && iconPosition === 'start' && <span className="shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === 'end' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};

export interface GlassIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon: React.ReactNode;
  loading?: boolean;
  tooltip?: string;
}

export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  loading = false,
  tooltip,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base',
  }[size];

  const variantClasses = {
    primary:
      'bg-[var(--gym-brand,#10b981)] text-stone-950 font-bold border border-[var(--gym-border-strong)] shadow-[var(--gym-glow)] hover:opacity-95',
    secondary:
      'glass-regular text-[var(--gym-text,#f3f4f6)] hover:border-[var(--gym-border-strong)]',
    outline:
      'glass-subtle text-[var(--gym-text-muted,#9ca3af)] hover:text-[var(--gym-text,#fff)] hover:border-[var(--gym-border-strong)]',
    danger:
      'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40',
    success:
      'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40',
    ghost:
      'bg-transparent hover:bg-[var(--gym-surface-glass)] text-[var(--gym-text-muted,#9ca3af)] hover:text-[var(--gym-text,#fff)] border-transparent',
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      title={tooltip}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
      ) : (
        icon
      )}
    </button>
  );
};

