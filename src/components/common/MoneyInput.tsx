import React, { useState, useEffect } from 'react';
import { MoneyService } from '../../services/moneyService';

interface MoneyInputProps {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  unit?: string;
  id?: string;
  autoFocus?: boolean;
  required?: boolean;
  onFullAmount?: () => void;
  fullAmountLabel?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  placeholder = '۰',
  className = '',
  disabled = false,
  min = 0,
  max,
  unit = 'تومان',
  id,
  autoFocus = false,
  required = false,
  onFullAmount,
  fullAmountLabel = 'دریافت کامل',
}) => {
  const [displayVal, setDisplayVal] = useState<string>(() => {
    return value > 0 ? value.toLocaleString('en-US') : '';
  });

  useEffect(() => {
    if (value > 0) {
      setDisplayVal(value.toLocaleString('en-US'));
    } else if (value === 0) {
      setDisplayVal('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = MoneyService.parse(raw);

    if (max !== undefined && numeric > max) {
      return;
    }

    if (numeric === 0 && raw.trim() === '') {
      setDisplayVal('');
      onChange(0);
    } else {
      setDisplayVal(numeric.toLocaleString('en-US'));
      onChange(numeric);
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="relative flex items-center w-full">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoFocus={autoFocus}
          disabled={disabled}
          required={required}
          value={displayVal}
          placeholder={placeholder}
          onChange={handleChange}
          className={`w-full py-2.5 px-3.5 pl-14 text-left font-mono font-bold text-sm sm:text-base rounded-xl transition-all duration-200 border outline-none disabled:opacity-50 ${
            disabled
              ? 'bg-[var(--gym-surface-glass)] border-[var(--gym-border)] text-[var(--gym-text-muted)] cursor-not-allowed'
              : 'bg-[var(--gym-surface-glass-strong)] hover:bg-[var(--gym-surface-soft)] text-[var(--gym-text)] border-[var(--gym-border)] hover:border-[var(--gym-brand)] focus:border-[var(--gym-brand)] focus:ring-2 focus:ring-[var(--gym-brand-soft)] shadow-xs placeholder:text-[var(--gym-text-muted)]'
          } ${className}`}
          dir="ltr"
        />
        {unit && (
          <span className="absolute left-3 text-xs font-sans font-medium text-[var(--gym-text-muted)] pointer-events-none select-none">
            {unit}
          </span>
        )}
      </div>

      {onFullAmount && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onFullAmount}
            className="text-[11px] font-bold text-[var(--gym-brand)] hover:brightness-125 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>[ {fullAmountLabel} ]</span>
          </button>
        </div>
      )}
    </div>
  );
};
