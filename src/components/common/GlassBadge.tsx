import React from 'react';

interface GlassBadgeProps {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  className = '',
  size = 'sm',
}) => {
  const variantStyles = {
    brand: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    info: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  }[variant];

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border shadow-xs ${sizeStyles} ${variantStyles} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
