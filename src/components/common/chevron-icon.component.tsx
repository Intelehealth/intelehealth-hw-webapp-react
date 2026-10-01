import React from 'react';

/**
 * Inline chevron used by the calendar's navigation controls.
 *
 * These were `<i className="fa-solid fa-chevron-*">` elements, which render as
 * nothing whenever the remote FontAwesome kit fails to load (domain allowlist,
 * CSP, or an offline deployment). The buttons then collapsed to 8x8 and the
 * calendar looked like it had no navigation at all. An inline SVG has no such
 * dependency.
 */
export type ChevronDirection = 'left' | 'right' | 'up' | 'down';

const ROTATION: Record<ChevronDirection, string> = {
  left: 'rotate(90deg)',
  right: 'rotate(-90deg)',
  up: 'rotate(180deg)',
  down: 'none',
};

interface ChevronIconProps {
  direction: ChevronDirection;
  className?: string;
}

const ChevronIcon: React.FC<ChevronIconProps> = ({
  direction,
  className = 'w-3.5 h-3.5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
    style={{ transform: ROTATION[direction] }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default ChevronIcon;
