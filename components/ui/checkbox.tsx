import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    if (label) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={checkboxId}
            className={cn(
              'h-4 w-4 rounded border-gray-300 text-blue-600',
              'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'cursor-pointer',
              className
            )}
            ref={ref}
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className="text-sm font-medium text-gray-700 cursor-pointer select-none"
          >
            {label}
          </label>
        </div>
      );
    }

    return (
      <input
        type="checkbox"
        id={checkboxId}
        className={cn(
          'h-4 w-4 rounded border-gray-300 text-blue-600',
          'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'cursor-pointer',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
