import type { AyuQuestion } from '../../modules/ayu-library/types/ayu.types';
import {
  EXT_URL_IS_EXCLUSIVE_OPTION,
  EXT_URL_PE_CATEGORY_LABEL,
  EXT_URL_PE_OPTION_KIND,
  EXT_URL_PE_SECTION_KEY,
  PE_OPTION_KIND_CAMERA,
} from '../../modules/ayu-library/utils/constants';

/** A Physical Exam question with Yes/No options and a "Take a Picture" tile. */
export const makeCameraQuestion = (linkId: string): AyuQuestion => ({
  linkId,
  text: `Question ${linkId}`,
  type: 'choice',
  extension: [
    { url: EXT_URL_PE_SECTION_KEY, valueString: 'General Exams' },
    { url: EXT_URL_PE_CATEGORY_LABEL, valueString: linkId },
  ],
  answerOption: [
    { valueCoding: { code: 'no', display: 'No' } },
    { valueCoding: { code: 'yes', display: 'Yes' } },
    {
      valueCoding: { code: 'cam', display: 'Take a picture' },
      extension: [
        { url: EXT_URL_PE_OPTION_KIND, valueString: PE_OPTION_KIND_CAMERA },
        { url: EXT_URL_IS_EXCLUSIVE_OPTION, valueString: 'true' },
      ],
    },
  ],
});
