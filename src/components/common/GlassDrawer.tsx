import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface GlassDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}

export const GlassDrawer: React.FC<GlassDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  widthClass = 'max-w-xl',
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
      {/* Semi-transparent backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen ${widthClass} max-w-[min(100vw,580px)] glass-regular border-l border-[var(--gym-border-strong)] shadow-2xl flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right`}
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-[var(--gym-border)] bg-[var(--gym-surface-glass-strong)] flex items-center justify-between sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="w-10 h-10 rounded-2xl bg-[var(--gym-brand-soft)] border border-[var(--gym-border-strong)] flex items-center justify-center text-[var(--gym-brand,#10b981)] shrink-0 shadow-xs">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[var(--gym-text,#fff)] leading-tight truncate">{title}</h3>
                {subtitle && <p className="text-xs text-[var(--gym-text-muted,#9ca3af)] mt-0.5 truncate">{subtitle}</p>}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[var(--gym-surface-glass)] hover:bg-[var(--gym-surface-strong)] text-[var(--gym-text-muted)] hover:text-[var(--gym-text,#fff)] flex items-center justify-center transition-colors border border-[var(--gym-border)]"
              aria-label="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin text-[var(--gym-text,#f3f4f6)]">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-5 sm:px-6 py-3.5 border-t border-[var(--gym-border)] bg-[var(--gym-surface-glass-strong)] shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

