import React from 'react';

// Mock react-datepicker component
const DatePicker = ({
  selected,
  onChange,
  ...props
}: {
  selected?: Date | null;
  onChange?: (date: Date | null, event?: React.SyntheticEvent) => void;
  [key: string]: unknown;
}) =>
  React.createElement('input', {
    type: 'date',
    value: selected ? new Date(selected).toISOString().split('T')[0] : '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange?.(new Date(e.target.value), e),
    ...props,
  });

export default DatePicker;

