import * as yup from 'yup';

export const profileSchema = yup.object({
  username: yup.string().trim().defined(),
  firstName: yup.string().trim().required('First name is required'),
  middleName: yup.string().trim().defined(),
  lastName: yup.string().trim().required('Last name is required'),
  email: yup
    .string()
    .trim()
    .email('Email is invalid')
    .required('Email is required'),
  phone: yup
    .string()
    .trim()
    .matches(/^\d{10}$/g, 'Phone must be 10 digits')
    .required('Phone number is required'),
  dateOfBirth: yup.string().trim().required('Date of birth is required'),
  gender: yup
    .mixed<'male' | 'female' | 'other'>()
    .oneOf(['male', 'female', 'other'])
    .required('Gender is required'),
  setupLocation: yup.string().trim().required('Setup location is required'),
});

export type ProfileFormValues = yup.InferType<typeof profileSchema>;
