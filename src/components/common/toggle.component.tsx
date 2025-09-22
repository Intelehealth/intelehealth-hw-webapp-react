import React, { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  isRequired?: boolean;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      label,
      error,
      helperText,
      description,
      size = 'md',
      isRequired = false,
      variant = 'default',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = React.useId();
    const finalInputId = id || inputId;
    const errorId = `${finalInputId}-error`;
    const helperId = `${finalInputId}-helper`;

    const sizeClasses = {
      sm: {
        toggle: 'w-8 h-4',
        thumb: 'w-3 h-3',
        translate: 'translate-x-4',
      },
      md: {
        toggle: 'w-11 h-6',
        thumb: 'w-5 h-5',
        translate: 'translate-x-5',
      },
      lg: {
        toggle: 'w-14 h-7',
        thumb: 'w-6 h-6',
        translate: 'translate-x-7',
      },
    };

    const labelSizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    const variantClasses = {
      default: {
        checked: 'bg-primary-600',
        unchecked: 'bg-gray-200',
        thumb: 'bg-white',
      },
      success: {
        checked: 'bg-success-600',
        unchecked: 'bg-gray-200',
        thumb: 'bg-white',
      },
      warning: {
        checked: 'bg-warning-600',
        unchecked: 'bg-gray-200',
        thumb: 'bg-white',
      },
      error: {
        checked: 'bg-error-600',
        unchecked: 'bg-gray-200',
        thumb: 'bg-white',
      },
    };

    const currentVariant = error ? 'error' : variant;

    return (
      <div className="w-full">
        <div className="flex items-start gap-3">
          <div className="flex items-center h-5">
            <label
              htmlFor={finalInputId}
              className={cn(
                'relative inline-flex items-center cursor-pointer',
                disabled && 'cursor-not-allowed',
                sizeClasses[size].toggle
              )}
            >
              <input
                ref={ref}
                type="checkbox"
                id={finalInputId}
                className="sr-only"
                disabled={disabled}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={cn(
                  error ? errorId : undefined,
                  helperText ? helperId : undefined,
                  description ? `${finalInputId}-description` : undefined
                )}
                {...props}
              />
              <div
                className={cn(
                  'relative rounded-full transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2',
                  sizeClasses[size].toggle,
                  props.checked
                    ? variantClasses[currentVariant].checked
                    : variantClasses[currentVariant].unchecked,
                  'peer-focus:ring-primary-500',
                  error && 'peer-focus:ring-error-500',
                  disabled && 'opacity-50'
                )}
              />
              <div
                className={cn(
                  'absolute top-0.5 left-0.5 rounded-full transition-transform duration-200',
                  props.checked ? sizeClasses[size].translate : '',
                  sizeClasses[size].thumb,
                  variantClasses[currentVariant].thumb
                )}
              />
            </label>
          </div>

          <div className="flex-1 min-w-0">
            {label && (
              <label
                htmlFor={finalInputId}
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

            {description && (
              <p
                id={`${finalInputId}-description`}
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
          <p id={errorId} className="mt-2 text-sm text-error-600" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;
