import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | string;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  actions,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthMap: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  const maxWidthClass = maxWidth.startsWith('max-w-')
    ? maxWidth
    : maxWidthMap[maxWidth] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2.5 sm:p-4 md:p-6" dir="rtl">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Card */}
      <div
        className={`relative w-full ${maxWidthClass} max-h-[min(94vh,calc(100vh-20px))] glass-regular rounded-2xl sm:rounded-3xl border border-[var(--gym-border-strong)] shadow-2xl flex flex-col z-10 animate-in zoom-in-95 duration-150 overflow-hidden`}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[var(--gym-border)] flex items-center justify-between gap-2 shrink-0 bg-[var(--gym-surface-glass)]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {icon && (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--gym-brand-soft)] border border-[var(--gym-border-strong)] flex items-center justify-center text-[var(--gym-brand,#10b981)] shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-xs sm:text-base font-bold text-[var(--gym-text,#fff)] leading-tight truncate">{title}</h3>
              {subtitle && <p className="text-[11px] sm:text-xs text-[var(--gym-text-muted,#9ca3af)] mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[var(--gym-surface-glass)] hover:bg-[var(--gym-surface-strong)] text-[var(--gym-text-muted)] hover:text-[var(--gym-text,#fff)] flex items-center justify-center transition-colors border border-[var(--gym-border)] cursor-pointer"
              aria-label="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 scrollbar-thin space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[var(--gym-border)] bg-[var(--gym-surface-glass)] flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
