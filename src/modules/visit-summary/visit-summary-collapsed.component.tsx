import { type FC, type ReactNode, useState, useCallback } from 'react';
import iconEdit from '../../assets/icons/edit.svg';
import iconChevronDown from '../../assets/icons/icon-chevron-down.svg';

export interface CollapsedComponentProps {
  icon: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  contentLabel?: string;
  onChangeClick?: () => void;
}

const CollapsedComponent: FC<CollapsedComponentProps> = ({
  icon,
  title,
  subtitle,
  children,
  defaultOpen = true,
  contentLabel,
  onChangeClick,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const handleChangeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChangeClick?.();
    },
    [onChangeClick]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-3 md:px-4 md:py-2.5 cursor-pointer"
        onClick={toggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <img src={icon} alt="" className="w-8 h-8 shrink-0" />
          <div className="text-left">
            <span className="text-sm font-semibold text-gray-800">{title}</span>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <img
            src={iconChevronDown}
            alt=""
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <>
          <hr className="border-t border-gray-200" />
          <div className="px-3 pt-3 pb-3 md:px-4 md:pt-3 md:pb-3">
            {(contentLabel || onChangeClick) && (
              <div className="flex items-center justify-between mb-2">
                {contentLabel && (
                  <span className="text-sm font-bold text-gray-800">
                    {contentLabel}
                  </span>
                )}
                {onChangeClick && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-1.5 text-xs text-[#2F1E91] font-medium cursor-pointer border border-[#E1DCFF] rounded-md px-3 py-1 hover:bg-[#E1DCFF] transition-colors"
                    onClick={handleChangeClick}
                    onKeyDown={e =>
                      e.key === 'Enter' &&
                      handleChangeClick(e as unknown as React.MouseEvent)
                    }
                  >
                    <img src={iconEdit} alt="" className="w-3.5 h-3.5" />
                    Change
                  </span>
                )}
              </div>
            )}
            {children}
          </div>
        </>
      )}
    </div>
  );
};

export default CollapsedComponent;
