import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          {
            'bg-gray-900 text-white': variant === 'default',
            'bg-blue-600 text-white': variant === 'primary',
            'bg-green-600 text-white': variant === 'success',
            'bg-yellow-500 text-gray-900': variant === 'warning',
            'bg-red-600 text-white': variant === 'danger',
            'border border-gray-300 text-gray-700 bg-white': variant === 'outline',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
