import React from 'react';

const SvgIcon = ({ d, join }: { d: string; join?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d={d}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      {...(join ? { strokeLinejoin: 'round' } : {})}
    />
  </svg>
);

export const getOptionIcon = (text: string): React.ReactNode | undefined => {
  const l = text.toLowerCase();
  if (l === 'yes') return <SvgIcon d="M2 7l3.5 3.5L12 3.5" join />;
  if (l === 'no') return <SvgIcon d="M2 2l10 10M12 2L2 12" />;
  return undefined;
};

export const arraysEqual = (a: string[], b: string[]) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
