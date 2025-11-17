import { useEffect, useRef, useState } from 'react';
import type { CountryCode, PhoneNumberObject } from '../../types/common.types';
import { getCountryCode } from '../../utils/common';
import CountryCodeDropdown from './contry-code-dropdown.component';
import Input from './input.component';

interface InputPhoneNumberProps {
  value: PhoneNumberObject;
  error: string;
  onChange: (phoneNumberObject: PhoneNumberObject) => void;
}

const InputPhoneNumber = ({
  value,
  error,
  onChange,
}: InputPhoneNumberProps) => {
  const [country, setCountry] = useState<CountryCode>({
    name: '',
    code: '',
    dial_code: '',
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const isUpdatingFromProps = useRef(false);

  // Initialize from value prop only once on mount or when value structure changes significantly
  useEffect(() => {
    if (value && value.countryCode) {
      isUpdatingFromProps.current = true;
      setPhoneNumber(value.number || '');
      const getCountry = getCountryCode(value.countryCode);
      if (getCountry) {
        setCountry(getCountry);
      }
      // Reset flag after state updates have been processed
      setTimeout(() => {
        isUpdatingFromProps.current = false;
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.countryCode]); // Only depend on countryCode to avoid infinite loops

  // Call onChange when user makes changes (not when syncing from props)
  useEffect(() => {
    if (country.dial_code && !isUpdatingFromProps.current) {
      onChange({
        number: phoneNumber,
        countryCode: country.dial_code,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country.dial_code, phoneNumber]);

  return (
    <div className="flex gap-2 justify-between w-full mb-2">
      <div className="w-1/3">
        <CountryCodeDropdown
          onChange={country => setCountry(country)}
          value={country}
        />
      </div>
      <Input
        placeholder="Enter Phone Number"
        error={error}
        isRequired={true}
        onChange={e => setPhoneNumber(e.target.value)}
        type="tel"
        maxLength={10}
        minLength={10}
        value={phoneNumber}
      />
    </div>
  );
};

export default InputPhoneNumber;
