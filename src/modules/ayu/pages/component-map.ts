import { AyuDateInput } from '../components/ayu-date-input.component';
import { AyuDisplayText } from '../components/ayu-display-text.component';
import { AyuGroup } from '../components/ayu-group.component';
import { AyuMultiSelect } from '../components/ayu-multiselect.component';
import { AyuNumberInput } from '../components/ayu-number-input.component';
import { AyuRadioGroup } from '../components/ayu-radio-group.component';
import { AyuRepeatableText } from '../components/ayu-repeatable-text.component';
import { AyuSelect } from '../components/ayu-select.component';
import { AyuSelectableOptionGroup } from '../components/ayu-selectable-option-group';
import { AyuTextInput } from '../components/ayu-text-input.component';

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
  radio: AyuRadioGroup,
};
