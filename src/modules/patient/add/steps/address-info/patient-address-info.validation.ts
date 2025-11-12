import * as yup from 'yup';

export const patientAddressInfoSchema = yup.object({
  postalCode: yup.string().required('Postal Code is required'),
  country: yup.string().required('Country is required'),
  state: yup.string().required('State is required'),
  district: yup.string().required('District is required'),
  city: yup.string().required('Village/Town/City is required'),
  correspondingAddress1: yup
    .string()
    .required('Corresponding Address 1 is required'),
  correspondingAddress2: yup
    .string()
    .required('Corresponding Address 2 is required'),
});
