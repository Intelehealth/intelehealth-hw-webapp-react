import React, { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg' | 'default';
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
      size = 'default',
      variant = 'default',
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
      default: 'w-full py-[10px] px-3 text-[13px]',
    };

    const variantClasses = {
      default: '',
      filled:
        'border-transparent focus:bg-white focus:border-primary-500 focus:ring-primary-500',
      outlined: 'focus:border-primary-500 focus:ring-primary-500',
    };

    const baseClasses = cn(
      'form-input-base',
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
              'block text-base text-(--color-muted) mb-2',
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

Input.displayName = 'Input';

export default Input;
