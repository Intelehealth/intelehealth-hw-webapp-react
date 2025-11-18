import * as yup from 'yup';

export const patientOtherInfoSchema = yup.object({
  sonDaughterWifeOf: yup.string().optional().default(''),
  occupation: yup.string().optional().default(''),
  caste: yup.string().optional().default(''),
  education: yup.string().required('Education is required'),
  economicStatus: yup.string().optional().default(''),
});
