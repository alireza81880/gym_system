import React from 'react';
import { GlassBadge, GlassBadgeProps } from './GlassBadge';

export interface GlassPageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  badge?:
    | React.ReactNode
    | {
        text: string;
        variant?: GlassBadgeProps['variant'];
      };
  actions?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  className?: string;
}

export const GlassPageHeader: React.FC<GlassPageHeaderProps> = ({
  title,
  subtitle,
  description,
  icon,
  badge,
  actions,
  primaryAction,
  secondaryActions,
  className = '',
}) => {
  const displayDescription = subtitle || description;

  const renderBadge = () => {
    if (!badge) return null;
    if (typeof badge === 'object' && badge !== null && 'text' in badge) {
      const badgeObj = badge as { text: string; variant?: GlassBadgeProps['variant'] };
      return (
        <GlassBadge variant={badgeObj.variant || 'neutral'} size="sm">
          {badgeObj.text}
        </GlassBadge>
      );
    }
    return badge as React.ReactNode;
  };

  return (
    <div
      className={`glass-regular rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[var(--gym-border)] ${className}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {icon && (
          <div className="w-11 h-11 rounded-2xl bg-[var(--gym-brand-soft,rgba(16,185,129,0.15))] border border-[var(--gym-border-strong)] flex items-center justify-center text-[var(--gym-brand,#10b981)] shrink-0 shadow-xs">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--gym-text,#fff)] tracking-tight truncate">
              {title}
            </h2>
            {badge && <div>{renderBadge()}</div>}
          </div>
          {displayDescription && (
            <p className="text-xs text-[var(--gym-text-muted,#9ca3af)] mt-0.5 leading-relaxed">
              {displayDescription}
            </p>
          )}
        </div>
      </div>

      {(actions || primaryAction || secondaryActions) && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {secondaryActions}
          {primaryAction}
          {actions}
        </div>
      )}
    </div>
  );
};
