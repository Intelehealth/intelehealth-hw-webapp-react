import React from 'react';
import { Button } from '../common';
type ConfirmModalConfig = {
  open: boolean;
  type: 'confirm';
  title: string;
  description?: string;
  size?: 'sm' | 'lg';
  note?: string;
  icon?: string;
  iconElement?: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  items?: string[];
  children?: React.ReactNode;
  hideActions?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
};

export const ConfirmationModal = ({
  open,
  title,
  description,
  note,
  icon,
  iconElement,
  cancelText = 'Back',
  confirmText = 'Confirm',
  size = 'sm',
  items,
  children,
  hideActions = false,
  onConfirm,
  onClose,
}: ConfirmModalConfig) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
      <div
        className={`${size === 'lg' ? 'w-[90vw] sm:w-[550px] lg:w-[560px] min-h-[240px] sm:min-h-[240px]' : 'w-[400px] max-sm:w-[350px] p-4'} bg-white  p-5 sm:p-6 rounded-2xl flex flex-col`}
      >
        {/* Icon */}
        {iconElement ? (
          <div className="flex justify-center mb-4">{iconElement}</div>
        ) : (
          icon && (
            <div className="flex justify-center mb-4">
              <img src={icon} className="w-12 h-12" />
            </div>
          )
        )}

        {/* Title */}
        <h2 className="text-center font-semibold text-black-800">{title}</h2>

        {/* Description */}
        {description && (
          <p
            className={`${size === 'lg' ? 'text-left' : 'text-center'} mt-3 ${title ? 'text-gray-500' : 'font-semibold text-gray-800'} break-words px-2`}
          >
            {description}
          </p>
        )}
        {note && (
          <p className="mt-2 text-left text-gray-500 text-sm break-words px-2">
            <span className="font-semibold">Note: </span>
            {note}
          </p>
        )}
        {items && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {items.map(item => (
              <div
                key={item}
                className="flex items-center gap-2 px-3 py-1 rounded-sm bg-[#2E1E91] text-white text-sm"
              >
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Custom body content (e.g. form fields) */}
        {children && <div className="mt-3">{children}</div>}

        {/* Divider + Actions */}
        {!hideActions && (
          <>
            <div className="mt-3 border-b border-gray-200" />
            <div className="mt-3 flex justify-center gap-4 max-sm:mt-3 max-sm:pb-6">
              {title && (
                <Button
                  variant="primarylight"
                  size="sm"
                  type="button"
                  onClick={onClose}
                >
                  <span className="mx-auto w-full font-semibold text-base">
                    {cancelText}
                  </span>
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={onConfirm}
              >
                <span className="mx-auto w-full font-semibold text-base">
                  {confirmText}
                </span>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
