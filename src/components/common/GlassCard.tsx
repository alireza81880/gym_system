import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 'subtle' | 'regular' | 'neon';
  hoverEffect?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  level = 'regular',
  hoverEffect = false,
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

  const hoverClass = hoverEffect
    ? 'hover:scale-[1.01] hover:border-slate-600 transition-all duration-200 cursor-pointer'
    : '';

  return (
    <div
      className={`rounded-2xl p-4 sm:p-6 text-slate-100 ${levelClass} ${hoverClass} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
