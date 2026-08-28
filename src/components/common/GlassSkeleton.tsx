import React from 'react';

export interface GlassSkeletonProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const GlassSkeleton: React.FC<GlassSkeletonProps> = ({
  className = '',
  count = 1,
  height = 'h-4',
  width = 'w-full',
  rounded = 'lg',
}) => {
  const roundedClass = {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[rounded];

  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="space-y-2 w-full">
      {items.map((i) => (
        <div
          key={i}
          className={`${height} ${width} ${roundedClass} bg-[var(--gym-surface-glass-strong)] border border-[var(--gym-border)] animate-pulse ${className}`}
        />
      ))}
    </div>
  );
};
