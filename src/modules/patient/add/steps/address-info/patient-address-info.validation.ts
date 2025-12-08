import * as yup from 'yup';

export const patientAddressInfoSchema = yup.object({
  postalCode: yup
    .string()
    .required('Postal Code is required')
    .test('postal-code-format', function (value) {
      const { country } = this.parent;

      if (!value) return true; // Let required validation handle this

      // For India, postal code must be exactly 6 digits
      if (country === 'India') {
        if (!/^\d{6}$/.test(value)) {
          return this.createError({
            message: 'Postal Code must be exactly 6 digits for India',
          });
        }
      } else {
        // For other countries, postal code must be 3-10 alphanumeric characters
        if (!/^[a-zA-Z0-9]{3,10}$/.test(value)) {
          return this.createError({
            message: 'Postal Code must be 3-10 alphanumeric characters',
          });
        }
      }

      return true;
    }),
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
