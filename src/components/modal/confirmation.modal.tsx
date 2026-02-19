import { Button } from '../common';
type ConfirmModalConfig = {
  open: boolean;
  type: 'confirm';
  title: string;
  description?: string;
  icon?: string;
  cancelText?: string;
  confirmText?: string;
  items?: string[];
  onConfirm?: () => void;
  onClose: () => void;
};

export const ConfirmationModal = ({
  open,
  title,
  description,
  icon,
  cancelText = 'Back',
  confirmText = 'Confirm',
  items,
  onConfirm,
  onClose,
}: ConfirmModalConfig) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
      <div className="bg-white w-[400px] max-sm:w-[350px] p-4 rounded-2xl flex flex-col">
        {/* Icon */}
        {icon && (
          <div className="flex justify-center mb-4">
            <img src={icon} className="w-12 h-12" />
          </div>
        )}

        {/* Title */}
        <h2 className="text-center font-semibold text-black-800">{title}</h2>

        {/* Description */}
        <p className="mt-3 text-center text-gray-500 whitespace-pre-line break-words max-w-[280px] mx-auto">
          {description}
        </p>
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
