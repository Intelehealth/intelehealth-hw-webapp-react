import * as yup from 'yup';

export const resetPasswordSchema = yup.object({
  newPassword: yup
    .string()
    .min(
      6,
      'Password length must be greater than or equal to 8 and with combination of small,capital and digits'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});
