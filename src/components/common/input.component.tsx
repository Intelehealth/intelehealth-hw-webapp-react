import React, { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRequired?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      variant = 'outlined',
      leftIcon,
      rightIcon,
      isRequired = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = React.useId();
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    };

    const variantClasses = {
      default:
        'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
      filled:
        'bg-gray-100 border-transparent focus:bg-white focus:border-primary-500 focus:ring-primary-500',
      outlined:
        'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    };

    const baseClasses = cn(
      'block w-full rounded-lg border transition-colors duration-200',
      'placeholder:text-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
      'read-only:bg-gray-50 read-only:cursor-default',
      sizeClasses[size],
      variantClasses[variant],
      error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-gray-700 mb-2',
              error && 'text-error-700',
              disabled && 'text-gray-400'
            )}
          >
            {label}
            {isRequired && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div
                className={cn(
                  'text-gray-400',
                  size === 'sm'
                    ? 'w-4 h-4'
                    : size === 'lg'
                      ? 'w-6 h-6'
                      : 'w-5 h-5'
                )}
              >
                {leftIcon}
              </div>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={baseClasses}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              error ? errorId : undefined,
              helperText ? helperId : undefined
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div
                className={cn(
                  'text-gray-400',
                  size === 'sm'
                    ? 'w-4 h-4'
                    : size === 'lg'
                      ? 'w-6 h-6'
                      : 'w-5 h-5'
                )}
              >
                {rightIcon}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="mt-2 text-sm text-error-600 text-left"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-gray-500 text-left">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
