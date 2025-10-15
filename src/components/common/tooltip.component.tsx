import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip = ({ text, children }: TooltipProps) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hideTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-block"
      >
        {children}
      </span>

      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            onMouseEnter={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            }}
            onMouseLeave={hideTooltip}
            className="absolute z-50"
            style={{
              top: coords.top - 70, // adjust spacing above the icon
              left: coords.left,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Tooltip box with vertical colored border */}
            <div className="relative bg-white text-(--color-dark) text-xs font-medium px-4 py-2 pl-5 rounded-[8px] shadow-md max-w-[200px] whitespace-normal text-left border-l-4 border-(--color-primary) leading-[150%] tracking-[0.25px">
              {text}
            </div>

            {/* Arrow */}
            <div className="w-4 h-4 bg-white rotate-45 shadow-md -mt-2 mx-auto"></div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
