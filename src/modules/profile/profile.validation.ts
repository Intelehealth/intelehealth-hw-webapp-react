import * as yup from 'yup';
import { VALID_TLDS } from '../../utils/valid-tlds';

export const profileSchema = yup.object({
  username: yup.string().trim().defined(),
  firstName: yup
    .string()
    .trim()
    .required('First name is required')
    .matches(/^[A-Za-z\s]+$/, 'Enter alphabets only'),
  middleName: yup
    .string()
    .trim()
    .matches(/^[A-Za-z\s]*$/, 'Enter alphabets only')
    .defined(),
  lastName: yup
    .string()
    .trim()
    .required('Last name is required')
    .matches(/^[A-Za-z\s]+$/, 'Enter alphabets only'),
  email: yup
    .string()
    .trim()
    .required('Email is required')
    .matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, {
      message: 'Email is invalid',
      excludeEmptyString: true,
    })
    .test('valid-tld', 'Email is invalid', value => {
      if (!value) return true;
      const tld = value.split('.').pop()?.toLowerCase();
      return !!tld && VALID_TLDS.has(tld);
    }),
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
