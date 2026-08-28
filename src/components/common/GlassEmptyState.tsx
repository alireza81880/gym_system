import React from 'react';
import { GlassButton } from './GlassButton';

export interface GlassEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const GlassEmptyState: React.FC<GlassEmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  secondaryActionText,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`glass-subtle rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center border border-[var(--gym-border)] ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[var(--gym-surface-glass-strong)] border border-[var(--gym-border-strong)] flex items-center justify-center text-[var(--gym-brand,#10b981)] mb-4 shadow-sm">
        {icon}
      </div>

      <h3 className="text-base font-bold text-[var(--gym-text,#fff)] mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-[var(--gym-text-muted,#9ca3af)] max-w-md mx-auto mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {(onAction || onSecondaryAction) && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {onAction && actionText && (
            <GlassButton
              variant="primary"
              size="sm"
              icon={actionIcon}
              onClick={onAction}
            >
              {actionText}
            </GlassButton>
          )}
          {onSecondaryAction && secondaryActionText && (
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={onSecondaryAction}
            >
              {secondaryActionText}
            </GlassButton>
          )}
        </div>
      )}
    </div>
  );
};
