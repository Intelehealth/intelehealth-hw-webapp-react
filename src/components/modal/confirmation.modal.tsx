import { Button } from '../common';
type ConfirmModalConfig = {
  open: boolean;
  type: 'confirm';
  title: string;
  description?: string;
  icon?: string;
  cancelText?: string;
  confirmText?: string;
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
  onConfirm,
  onClose,
}: ConfirmModalConfig) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
      <div className="bg-white w-[400px] h-[260px] max-sm:w-[350px] p-4 rounded-2xl flex flex-col">
        {/* Icon */}
        {icon && (
          <div className="flex justify-center mb-4">
            <img src={icon} className="w-12 h-12" />
          </div>
        )}

        {/* Title */}
        <h2 className="text-center font-semibold text-black-800">{title}</h2>

        {/* Description */}
        <p className="text-center text-gray-500 mt-3 whitespace-pre-line">
          {description}
        </p>

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
