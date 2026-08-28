import React from 'react';
import { Search, AlertCircle } from 'lucide-react';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, helperText, icon, wrapperClassName = '', className = '', ...props }, ref) => {
    return (
      <div className={`space-y-1.5 ${wrapperClassName}`}>
        {label && (
          <label className="block text-xs font-semibold text-[var(--gym-text-secondary,#d1d5db)]">
            {label}
            {props.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--gym-text-muted,#9ca3af)] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-medium glass-subtle text-[var(--gym-text,#fff)] placeholder-[var(--gym-text-muted,#9ca3af)] transition-all focus-neon disabled:opacity-50 disabled:cursor-not-allowed ${
              icon ? 'pr-10' : ''
            } ${
              error
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                : 'border-[var(--gym-border)]'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-[11px] font-medium text-rose-400 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-[var(--gym-text-muted,#9ca3af)] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
GlassInput.displayName = 'GlassInput';

export interface GlassSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  shortcut?: string;
  wrapperClassName?: string;
}

export const GlassSearch: React.FC<GlassSearchProps> = ({
  placeholder = 'جستجو...',
  shortcut,
  wrapperClassName = '',
  className = '',
  value,
  ...props
}) => {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gym-text-muted,#9ca3af)] pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        className={`w-full py-2 pl-4 pr-10 rounded-xl text-xs sm:text-sm glass-subtle text-[var(--gym-text,#fff)] placeholder-[var(--gym-text-muted,#9ca3af)] transition-all focus-neon border-[var(--gym-border)] ${className}`}
        {...props}
      />
      {shortcut && !value && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[var(--gym-text-muted,#9ca3af)] bg-[var(--gym-surface-glass-strong)] border border-[var(--gym-border)] rounded-md">
            {shortcut}
          </kbd>
        </div>
      )}
    </div>
  );
};

export interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
  options?: { value: string | number; label: string }[];
  children?: React.ReactNode;
}

export const GlassSelect = React.forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ label, error, helperText, wrapperClassName = '', className = '', options, children, ...props }, ref) => {
    return (
      <div className={`space-y-1.5 ${wrapperClassName}`}>
        {label && (
          <label className="block text-xs font-semibold text-[var(--gym-text-secondary,#d1d5db)]">
            {label}
            {props.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium glass-subtle text-[var(--gym-text,#fff)] transition-all focus-neon disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--gym-surface)] ${
            error ? 'border-rose-500/80' : 'border-[var(--gym-border)]'
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-stone-900 text-white">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error ? (
          <p className="text-[11px] font-medium text-rose-400 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-[var(--gym-text-muted,#9ca3af)] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
GlassSelect.displayName = 'GlassSelect';

export interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
}

export const GlassTextarea = React.forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ label, error, helperText, wrapperClassName = '', className = '', ...props }, ref) => {
    return (
      <div className={`space-y-1.5 ${wrapperClassName}`}>
        {label && (
          <label className="block text-xs font-semibold text-[var(--gym-text-secondary,#d1d5db)]">
            {label}
            {props.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-medium glass-subtle text-[var(--gym-text,#fff)] placeholder-[var(--gym-text-muted,#9ca3af)] transition-all focus-neon disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-rose-500/80' : 'border-[var(--gym-border)]'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-[11px] font-medium text-rose-400 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-[var(--gym-text-muted,#9ca3af)] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
GlassTextarea.displayName = 'GlassTextarea';
