
import React from 'react';
import { cn } from '@/lib/utils';

export interface CircularProgressProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 'medium',
  color = 'primary',
  className,
}) => {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-3',
  };

  const colorClasses = {
    primary: 'border-t-blue-600',
    secondary: 'border-t-purple-600',
    success: 'border-t-green-600',
    danger: 'border-t-red-600',
    warning: 'border-t-amber-500',
    info: 'border-t-sky-500',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-solid border-gray-200',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
};

export default CircularProgress;
