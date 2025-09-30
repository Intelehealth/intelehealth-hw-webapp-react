import * as yup from 'yup';

export const loginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  role: yup.string().oneOf(['nurse', 'doctor', 'admin']).notRequired(), // ✅ allows key to be missing
  terms: yup
    .boolean()
    .oneOf(
      [true],
      'Please read and agree the Terms & Conditions and Privacy Policy.'
    )
    .notRequired(), // ✅ allows key to be missing
});
