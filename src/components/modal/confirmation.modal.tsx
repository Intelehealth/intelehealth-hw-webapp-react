import { Button } from '../common';
type ConfirmModalConfig = {
  open: boolean;
  type: 'confirm';
  title: string;
  description?: string;
  note?: string;
  icon?: string;
  cancelText?: string;
  confirmText?: string;
  items?: string[];
  size?: 'sm' | 'lg';
  onConfirm?: () => void;
  onClose: () => void;
};

export const ConfirmationModal = ({
  open,
  title,
  description,
  note,
  icon,
  cancelText = 'Back',
  confirmText = 'Confirm',
  items,
  size = 'lg',
  onConfirm,
  onClose,
}: ConfirmModalConfig) => {
  if (!open) return null;

  const sizeClass =
    size === 'sm'
      ? 'w-[400px] max-sm:w-[350px] p-4'
      : 'w-[90vw] sm:w-[450px] lg:w-[560px] min-h-[240px] sm:min-h-[240px] p-5 sm:p-6';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
      <div className={`bg-white ${sizeClass} rounded-2xl flex flex-col`}>
        {/* Icon */}
        {icon && (
          <div className="flex justify-center mb-4">
            <img src={icon} className="w-12 h-12" />
          </div>
        )}

        {/* Title */}
        <h2 className="text-center font-semibold text-black-800">{title}</h2>

        {/* Description */}
        {description && (
          <p className="mt-3 text-left text-gray-500 break-words px-2">
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
        {/* Divider */}
        <div className="mt-3 border-b border-gray-200" />
        {/* Footer Buttons Fixed */}
        <div className="mt-3 flex justify-center gap-4 max-sm:mt-3 max-sm:pb-6">
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
          <Button variant="primary" size="sm" type="button" onClick={onConfirm}>
            <span className="mx-auto w-full font-semibold text-base">
              {confirmText}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};
