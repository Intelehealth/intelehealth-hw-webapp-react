import React, { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'primarylight' | 'white';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const AyuButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const baseClasses = cn('btn-base-styles', fullWidth && 'w-full');

    const variantClasses = {
      primary: cn('btn-primary-variant'),
      primarylight: cn('btn-primary-light-variant'),
      secondary: cn('btn-secondary-variant'),
      white: cn('btn-white-variant'),
    };

    const sizeClasses = {
      sm: 'px-3 py-2 gap-2',
      md: 'px-4 py-3 gap-2',
      lg: 'px-6 py-4 gap-3',
    };

    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <svg
              className={cn('animate-spin', iconSizeClasses[size])}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-inherit">{loadingText || 'Loading...'}</span>
          </div>
        ) : (
          <>
            {leftIcon && (
              <span className={cn('flex-shrink-0', iconSizeClasses[size])}>
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span
                className={cn(
                  'flex items-center ml-auto',
                  iconSizeClasses[size]
                )}
              >
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

AyuButton.displayName = 'Button';

export default AyuButton;
