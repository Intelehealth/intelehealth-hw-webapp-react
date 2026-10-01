import React from 'react';

// The real datepicker reads and renders dates in LOCAL time. Formatting with
// toISOString() (UTC) here shifted the day by one in non-UTC timezones and made
// the stub disagree with the component under test.
const toLocalISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

const fromLocalISO = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

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
    value: selected ? toLocalISO(new Date(selected)) : '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange?.(fromLocalISO(e.target.value), e),
    ...props,
  });

export default DatePicker;
