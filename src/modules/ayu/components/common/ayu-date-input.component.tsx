import { useMemo } from 'react';
import Calendar from '../../../../components/common/calendar.component';
import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';

export function AyuDateInput({
  question,
  parent,
  previousSibling,
  value,
  onChange,
  answers,
}: AyuRendererBaseProps) {
  const label = question
    ? resolveLabel(question, parent, previousSibling)
    : undefined;

  // When the previous sibling is a date field (e.g. "From Date"),
  // use its value as the minimum allowed date for this field ("To Date").
  const minDate = useMemo(() => {
    if (!previousSibling || previousSibling.type !== 'date' || !answers)
      return undefined;
    const fromValue = answers[previousSibling.linkId];
    if (typeof fromValue === 'string' && fromValue) {
      return new Date(fromValue);
    }
    return undefined;
  }, [previousSibling, answers]);

  return (
    <div>
      <Calendar
        label={label}
        value={typeof value === 'string' ? value : ''}
        onChange={date => onChange?.(date)}
        disabled={question?.readOnly}
        dateFormat="dd MMM,yyyy"
        maxDate={new Date()}
        minDate={minDate}
      />
    </div>
  );
}
