import React from 'react';

export interface CustomToastProps {
  title: string;
  message: React.ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onClose?: () => void;
}

const CustomToast: React.FC<CustomToastProps> = ({
  title,
  message,
  primaryLabel,
  secondaryLabel = 'Dismiss',
  onPrimary,
  onSecondary,
  onClose,
}) => (
  <div
    className="flex flex-col gap-1 py-1"
    style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
  >
    <div className="flex items-start justify-between">
      <strong className="text-[13px] font-bold text-gray-900 leading-tight">
        {title}
      </strong>
      {onClose && (
        <span
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 cursor-pointer text-[16px] leading-none ml-2"
        >
          &times;
        </span>
      )}
    </div>
    <p className="text-[12px] text-gray-600 leading-snug mt-0.5">{message}</p>
    <div className="flex items-center gap-5 mt-2">
      {secondaryLabel && (
        <span
          onClick={onSecondary}
          className="text-[12px] text-gray-500 cursor-pointer hover:text-gray-700"
        >
          {secondaryLabel}
        </span>
      )}
      {primaryLabel && (
        <span
          onClick={onPrimary}
          className="text-[12px] font-semibold cursor-pointer hover:underline"
          style={{ color: '#2f1e91' }}
        >
          {primaryLabel}
        </span>
      )}
    </div>
  </div>
);

export default CustomToast;
