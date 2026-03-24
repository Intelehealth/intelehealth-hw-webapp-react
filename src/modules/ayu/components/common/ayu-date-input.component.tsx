import Calendar from '../../../../components/common/calendar.component';
import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';

export function AyuDateInput({
  question,
  parent,
  previousSibling,
  value,
  onChange,
}: AyuRendererBaseProps) {
  const label = question
    ? resolveLabel(question, parent, previousSibling)
    : undefined;

  return (
    <div>
      <Calendar
        label={label}
        value={typeof value === 'string' ? value : ''}
        onChange={date => onChange?.(date)}
        disabled={question?.readOnly}
        dateFormat="dd MMM,yyyy"
        maxDate={new Date()}
      />
    </div>
  );
}
