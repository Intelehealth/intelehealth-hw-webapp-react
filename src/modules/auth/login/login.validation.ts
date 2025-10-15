import * as yup from 'yup';

export const loginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  role: yup.string().oneOf(['nurse', 'doctor', 'admin']), // ✅ allows key to be missing
  terms: yup
    .boolean()
    .required('Terms must be accepted')
    .oneOf(
      [true],
      'Please read and agree the Terms & Conditions and Privacy Policy.'
    ),
});
