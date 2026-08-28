import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 'subtle' | 'regular' | 'neon';
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  level = 'regular',
  hoverEffect = false,
  padding = 'md',
  children,
  className = '',
  ...rest
}) => {
  const levelClass =
    level === 'subtle'
      ? 'glass-subtle'
      : level === 'neon'
      ? 'glass-neon'
      : 'glass-regular';

  const paddingClass = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  }[padding];

  const hoverClass = hoverEffect
    ? 'hover:scale-[1.008] transition-all duration-200 cursor-pointer hover:border-[var(--gym-border-strong)]'
    : '';

  return (
    <div
      className={`rounded-2xl text-[var(--gym-text,#f3f4f6)] ${levelClass} ${paddingClass} ${hoverClass} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

