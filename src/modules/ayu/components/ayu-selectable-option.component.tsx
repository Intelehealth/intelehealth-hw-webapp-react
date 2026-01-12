import React from 'react';
import './selectable-option.css';

interface SelectableOptionProps {
  label: string | undefined;
  value: string | undefined;
  selected: boolean;
}

export const AyuSelectableOption: React.FC<SelectableOptionProps> = ({
  label,
}) => {
  return (
    <button type="button" className={`selectable-option`} onClick={() => {}}>
      {label}
    </button>
  );
};
