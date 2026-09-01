import React from 'react';
import { GlassBadge, GlassBadgeProps } from './GlassBadge';

export interface GlassStatCardProps {
  id?: string;
  label?: string;
  title?: string;
  value: string | number;
  subValue?: string;
  subtitle?: string;
  description?: string;
  changeType?: string;
  badge?: {
    text: string;
    variant?: GlassBadgeProps['variant'];
  };
  neonAccent?: boolean;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  icon?: React.ReactNode;
  level?: 'subtle' | 'regular' | 'neon';
  statusColor?: 'brand' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  onClick?: () => void;
}

export const GlassStatCard: React.FC<GlassStatCardProps> = ({
  label,
  title,
  value,
  subValue,
  subtitle,
  badge,
  neonAccent = false,
  trend,
  icon,
  level = 'regular',
  statusColor,
  className = '',
  onClick,
}) => {
  const displayLabel = title || label || '';
  const displaySubValue = subtitle || subValue;

  const actualLevel = neonAccent ? 'neon' : level;
  const levelClass =
    actualLevel === 'subtle'
      ? 'glass-subtle'
      : actualLevel === 'neon'
      ? 'glass-neon'
      : 'glass-regular';

  const statusBorder = statusColor
    ? {
        brand: 'border-l-4 border-l-[var(--gym-brand,#10b981)]',
        success: 'border-l-4 border-l-emerald-500',
        warning: 'border-l-4 border-l-amber-500',
        danger: 'border-l-4 border-l-rose-500',
        info: 'border-l-4 border-l-cyan-500',
      }[statusColor]
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-4 sm:p-5 border border-[var(--gym-border)] flex flex-col justify-between transition-all duration-150 ${levelClass} ${statusBorder} ${
        onClick ? 'cursor-pointer hover:border-[var(--gym-border-strong)] hover:scale-[1.01]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--gym-text-muted,#9ca3af)] truncate">
          {displayLabel}
        </span>
        {badge && (
          <GlassBadge variant={badge.variant || 'neutral'} size="sm">
            {badge.text}
          </GlassBadge>
        )}
        {icon && !badge && (
          <div className="w-8 h-8 rounded-xl bg-[var(--gym-surface-glass)] border border-[var(--gym-border)] flex items-center justify-center text-[var(--gym-brand,#10b981)] shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[var(--gym-text,#fff)]">
          {value}
        </div>

        {trend && (
          <span
            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
              trend.isNeutral
                ? 'bg-stone-500/15 text-stone-300'
                : trend.isPositive
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-rose-500/15 text-rose-300'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {displaySubValue && (
        <div className="text-[11px] text-[var(--gym-text-muted,#9ca3af)] mt-1.5 truncate">
          {displaySubValue}
        </div>
      )}
    </div>
  );
};

