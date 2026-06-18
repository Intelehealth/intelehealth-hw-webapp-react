import * as yup from 'yup';

export const patientPersonalInfoSchema = yup
  .object()
  .shape({
    firstName: yup.string().required('First name is required'),
    middleName: yup.string().default(''),
    lastName: yup.string().required('Last name is required'),
    gender: yup.string().required('Gender is required'),
    dateOfBirth: yup.string().notRequired(),
    age: yup
      .string()
      .notRequired()
      .optional()
      .test('valid-age', 'Age must be between 0 and 120', value => {
        if (!value) return true; // allow empty
        return /^(?:[0-9]|[1-9][0-9]|1[01][0-9]|120)$/.test(value);
      }),
    phoneNumberCountryCode: yup.string().required('Country code is required'),
    phoneNumber: yup.string().required('Phone number is required'),
    contactType: yup.string().required('Contact type is required'),
    emergencyContactName: yup
      .string()
      .required('Emergency contact name is required'),
    emergencyContactNumber: yup
      .string()
      .required('Emergency contact number is required')
      .test(
        'not-same-as-phone',
        'Emergency contact number must be different from phone number.',
        function (value) {
          const { phoneNumber } = this.parent;
          if (!value || !phoneNumber) return true;
          return value !== phoneNumber;
        }
      ),
    emergencyContactNumberCountryCode: yup
      .string()
      .required('Emergency contact number country code is required'),
    profilePhoto: yup.string().nullable().notRequired(),
  })
  .test(
    'dateOfBirth-or-age',
    'Either date of birth or age is required',
    function (value) {
      const { dateOfBirth, age } = value;
      if (!dateOfBirth && !age) {
        return this.createError({
          path: 'dateOfBirth',
          message: 'Date of birth or age is required',
        });
      }
      return true;
    }
  );
