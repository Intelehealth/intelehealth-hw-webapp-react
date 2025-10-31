declare module 'react-datepicker' {
  import React from 'react';

  export interface ReactDatePickerProps {
    selected?: Date | null;
    onChange?: (date: Date | null, event?: React.SyntheticEvent) => void;
    placeholderText?: string;
    dateFormat?: string;
    showYearDropdown?: boolean;
    showMonthDropdown?: boolean;
    calendarClassName?: string;
    openToDate?: Date;
    renderDayContents?: (dayOfMonth: number) => React.ReactNode;
    renderCustomHeader?: (props: { date: Date }) => React.ReactNode;
    maxDate?: Date;
    minDate?: Date;
    disabled?: boolean;
  }

  const DatePicker: React.FC<ReactDatePickerProps>;
  export default DatePicker;
}
