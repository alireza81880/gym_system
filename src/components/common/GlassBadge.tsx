import React from 'react';

export interface GlassBadgeProps {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'live' | 'offline';
  children: React.ReactNode;
  icon?: React.ReactNode;
  pulse?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  pulse = false,
  className = '',
  size = 'sm',
}) => {
  const variantStyles = {
    brand: 'bg-[var(--gym-brand-soft,rgba(16,185,129,0.15))] text-[var(--gym-brand,#10b981)] border-[var(--gym-border-strong)]',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    info: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    neutral: 'bg-[var(--gym-surface-glass)] text-[var(--gym-text-secondary,#d1d5db)] border-[var(--gym-border)]',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    live: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs shadow-emerald-500/20',
    offline: 'bg-stone-500/20 text-stone-400 border-stone-600/40',
  }[variant];

  const sizeStyles = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${sizeStyles} ${variantStyles} ${className}`}
    >
      {pulse && (
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
          variant === 'live' || variant === 'success' || variant === 'brand'
            ? 'bg-emerald-400'
            : variant === 'danger'
            ? 'bg-rose-400'
            : variant === 'warning'
            ? 'bg-amber-400'
            : 'bg-stone-400'
        }`} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};

