import { AyuAssociatedSymptoms } from '../components/common/ayu-associated-symptoms.component';
import { AyuDateInput } from '../components/common/ayu-date-input.component';
import { AyuDisplayText } from '../components/common/ayu-display-text.component';
import { AyuDuration } from '../components/common/ayu-duration.component';
import { AyuGroup } from '../components/common/ayu-group.component';
import { AyuMultiSelect } from '../components/common/ayu-multiselect.component';
import { AyuNumberInput } from '../components/common/ayu-number-input.component';
import { AyuRepeatableText } from '../components/common/ayu-repeatable-text.component';
import { AyuSelect } from '../components/common/ayu-select.component';
import { AyuSelectableOptionGroup } from '../components/common/ayu-selectable-option-group';
import { AyuTextInput } from '../components/common/ayu-text-input.component';

export const componentMap = {
  group: AyuGroup,
  display: AyuDisplayText,
  text: AyuTextInput,
  'repeatable-text': AyuRepeatableText,
  number: AyuNumberInput,
  date: AyuDateInput,
  select: AyuSelect,
  selectableOptionGroup: AyuSelectableOptionGroup,
  'multi-select': AyuMultiSelect,
  quantity: AyuDuration,
  associatedSymptoms: AyuAssociatedSymptoms,
};
