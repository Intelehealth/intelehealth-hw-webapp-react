import closeIcon from '../../assets/icons/close.svg';
import changeIcon from '../../assets/icons/edit.svg';
import iconRightArrow from '../../assets/icons/icon-right-arrow.svg';
import Button from '../common/button.component';

interface ModalItem {
  label: string;
  value: string | number | null;
}

interface VitalConfirmationModalProps {
  open: boolean;
  title: string;

  description?: string;
  highlightText?: string;
  icon?: string;

  items?: ModalItem[];

  // Global Change Button
  onChange?: () => void;

  cancelText?: string;
  confirmText?: string;

  onClose: () => void;
  onConfirm: () => void;
}

export const VitalConfirmationModal = ({
  open,
  title,
  description,
  icon,
  items = [],

  onChange,

  cancelText = 'Back',
  confirmText = 'Confirm',

  onClose,
  onConfirm,
}: VitalConfirmationModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
      {/* Modal Box */}
      <div
        className="
      bg-white shadow-xl flex flex-col

      /* Desktop Modal */
      w-[420px] max-w-full rounded-2xl p-6

      /* Mobile Fullscreen */
      max-sm:w-full
      max-sm:h-full
      max-sm:rounded-none
      max-sm:p-5
    "
      >
        {/* Mobile Header (Close Button) */}
        <div className="flex justify-end items-center mb-2">
          <button onClick={onClose} className="flex justify-end sm:hidden">
            <img src={closeIcon} alt="Close Icon" className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Icon */}
          {icon && (
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-100">
                <img src={icon} alt="Modal Icon" className="w-6 h-6" />
              </div>
            </div>
          )}

          {/* Title */}
          <h2
            className="text-center font-medium text-xs md:text-lg"
            style={{ color: '#2e1e91' }}
          >
            {title}
          </h2>

          {/* Description + Change */}
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm font-bold text-black-500">{description}</p>

            {onChange && (
              <button
                onClick={onChange}
                className="flex items-center gap-1 text-sm text-purple-700 border border-gray-200 font-medium rounded-lg px-2 py-1 hover:bg-purple-50"
              >
                <img src={changeIcon} alt="Change Icon" className="w-4 h-4" />
                <h2
                  className="text-center text-xs"
                  style={{ color: '#2e1e91' }}
                >
                  Change
                </h2>
              </button>
            )}
          </div>

          {/* Items Proper Alignment */}
          <div
            className={`mt-4 space-y-3 ${
              items.length > 7
                ? 'sm:max-h-[250px] sm:overflow-y-auto sm:pr-2'
                : ''
            }`}
          >
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[2px_150px_0fr] items-center gap-2 text-sm w-full"
              >
                {/* Bullet */}
                <span className="text-gray-500 font-bold">•</span>

                {/* Label Fixed Width */}
                <span className="text-gray-500 font-medium">{item.label}</span>

                {/* Value Always Right */}
                <span className="whitespace-nowrap">
                  {item.value ? (
                    <span className="text-gray-900">{String(item.value)}</span>
                  ) : (
                    <span className="text-gray-500">No information</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mt-3 border-b border-gray-200" />

        {/* Footer Buttons Fixed */}
        <div className="mt-6 flex justify-center gap-4 max-sm:mt-auto max-sm:pb-6">
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
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={onConfirm}
            rightIcon={<img src={iconRightArrow} />}
          >
            <span className="mx-auto w-full font-semibold text-base">
              {confirmText}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};
