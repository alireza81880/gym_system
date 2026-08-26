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
            ? 'bg-slate-800/40 border-slate-700/50 text-slate-400'
            : 'bg-slate-900/80 hover:bg-slate-900 text-white border-slate-700/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-inner'
        } ${className}`}
        dir="ltr"
      />
      {unit && (
        <span className="absolute left-3 text-xs font-sans font-medium text-slate-400 pointer-events-none select-none">
          {unit}
        </span>
      )}
    </div>
  );
};
