import React, { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string | React.ReactNode;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  isRequired?: boolean;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      helperText,
      description,
      size = 'md',
      variant = 'primary',
      isRequired = false,
      className,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const reactUseId = React.useId();
    const inputId = id || reactUseId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const variantClasses = {
      primary: 'form-checkbox-primary',
      secondary: 'form-checkbox-secondary',
    };

    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const labelSizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    const checkboxClasses = cn(
      'form-toggle-base form-checkbox',
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <div className="w-full">
        <div className="flex items-start gap-3">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              type="checkbox"
              id={inputId}
              className={checkboxClasses}
              disabled={disabled}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={cn(
                error ? errorId : undefined,
                helperText ? helperId : undefined,
                description ? `${inputId}-description` : undefined
              )}
              {...props}
            />
          </div>

          <div className="flex-1 min-w-0">
            {label && typeof label === 'string' && (
              <label
                htmlFor={inputId}
                className={cn(
                  'block font-medium text-gray-700 cursor-pointer',
                  labelSizeClasses[size],
                  error && 'text-error-700',
                  disabled && 'text-gray-400 cursor-not-allowed'
                )}
              >
                {label}
                {isRequired && <span className="text-error-500 ml-1">*</span>}
              </label>
            )}

            {label && typeof label !== 'string' && label}

            {description && (
              <p
                id={`${inputId}-description`}
                className={cn(
                  'mt-1 text-gray-500',
                  size === 'sm'
                    ? 'text-sm'
                    : size === 'lg'
                      ? 'text-base'
                      : 'text-sm'
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {error && (
          <p id={errorId} className="form-error-message" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="form-helper-text">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
