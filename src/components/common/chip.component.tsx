import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The content to display inside the chip
   */
  children: React.ReactNode;

  /**
   * Visual variant of the chip
   */
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'outline';

  /**
   * Size of the chip
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether the chip is clickable/button-like
   */
  clickable?: boolean;

  /**
   * Whether the chip is removable (shows close button)
   */
  removable?: boolean;

  /**
   * Callback when remove button is clicked
   */
  onRemove?: () => void;

  /**
   * Icon to display before the content
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to display after the content
   */
  rightIcon?: React.ReactNode;

  /**
   * Whether the chip is selected/active
   */
  selected?: boolean;

  /**
   * Whether the chip is disabled
   */
  disabled?: boolean;
}

const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      clickable = false,
      removable = false,
      onRemove,
      leftIcon,
      rightIcon,
      selected = false,
      disabled = false,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: {
        container: 'px-2 py-1 text-xs',
        icon: 'w-3 h-3',
        removeButton: 'w-3 h-3 ml-1',
        spacing: 'gap-1',
      },
      md: {
        container: 'px-3 py-1.5 text-sm',
        icon: 'w-4 h-4',
        removeButton: 'w-4 h-4 ml-1.5',
        spacing: 'gap-1.5',
      },
      lg: {
        container: 'px-4 py-2 text-base',
        icon: 'w-5 h-5',
        removeButton: 'w-5 h-5 ml-2',
        spacing: 'gap-2',
      },
    };

    const variantClasses = {
      default: {
        base: 'bg-gray-100 text-gray-800 border-gray-200',
        hover: 'hover:bg-gray-200',
        selected: 'bg-gray-200 ring-2 ring-gray-300',
        disabled: 'bg-gray-50 text-gray-400 border-gray-100',
      },
      primary: {
        base: 'bg-primary-100 text-primary-800 border-primary-200',
        hover: 'hover:bg-primary-200',
        selected: 'bg-primary-200 ring-2 ring-primary-300',
        disabled: 'bg-primary-50 text-primary-400 border-primary-100',
      },
      secondary: {
        base: 'bg-secondary-100 text-secondary-800 border-secondary-200',
        hover: 'hover:bg-secondary-200',
        selected: 'bg-secondary-200 ring-2 ring-secondary-300',
        disabled: 'bg-secondary-50 text-secondary-400 border-secondary-100',
      },
      success: {
        base: 'bg-success-100 text-success-800 border-success-200',
        hover: 'hover:bg-success-200',
        selected: 'bg-success-200 ring-2 ring-success-300',
        disabled: 'bg-success-50 text-success-400 border-success-100',
      },
      warning: {
        base: 'bg-warning-100 text-warning-800 border-warning-200',
        hover: 'hover:bg-warning-200',
        selected: 'bg-warning-200 ring-2 ring-warning-300',
        disabled: 'bg-warning-50 text-warning-400 border-warning-100',
      },
      error: {
        base: 'bg-error-100 text-error-800 border-error-200',
        hover: 'hover:bg-error-200',
        selected: 'bg-error-200 ring-2 ring-error-300',
        disabled: 'bg-error-50 text-error-400 border-error-100',
      },
      outline: {
        base: 'bg-transparent text-gray-700 border-gray-300',
        hover: 'hover:bg-gray-50',
        selected: 'bg-gray-50 ring-2 ring-gray-300',
        disabled: 'bg-transparent text-gray-400 border-gray-200',
      },
    };

    const currentVariant = variantClasses[variant];
    const currentSize = sizeClasses[size];

    const baseClasses = cn(
      'inline-flex items-center justify-center rounded-full border font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      currentSize.container,
      currentSize.spacing,
      currentVariant.base,
      !disabled && clickable && currentVariant.hover,
      selected && currentVariant.selected,
      disabled && currentVariant.disabled,
      clickable && !disabled && 'cursor-pointer',
      !clickable && 'cursor-default',
      disabled && 'cursor-not-allowed',
      className
    );

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      onRemove?.();
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onClick?.(e);
    };

    if (!clickable && !removable) {
      // Non-interactive chip (just display)
      return (
        <span className={baseClasses}>
          {leftIcon && (
            <span className={cn('flex-shrink-0', currentSize.icon)}>
              {leftIcon}
            </span>
          )}
          <span className="truncate">{children}</span>
          {rightIcon && (
            <span className={cn('flex-shrink-0', currentSize.icon)}>
              {rightIcon}
            </span>
          )}
        </span>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        className={baseClasses}
        onClick={handleClick}
        aria-pressed={selected}
        {...props}
      >
        {leftIcon && (
          <span className={cn('flex-shrink-0', currentSize.icon)}>
            {leftIcon}
          </span>
        )}
        <span className="truncate">{children}</span>
        {rightIcon && !removable && (
          <span className={cn('flex-shrink-0', currentSize.icon)}>
            {rightIcon}
          </span>
        )}
        {removable && (
          <button
            type="button"
            className={cn(
              'flex-shrink-0 rounded-full p-0.5 transition-colors duration-200',
              'hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-400',
              currentSize.removeButton,
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={handleRemove}
            aria-label="Remove"
          >
            <svg
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </button>
    );
  }
);

Chip.displayName = 'Chip';

export default Chip;
