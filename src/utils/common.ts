import { Country } from 'country-state-city';
import type { CountryCode } from '../types/common.types';

export function getCountryCode(countryCode: string): CountryCode | undefined {
  const country = Country.getAllCountries().find(
    country => `+${country.phonecode}` === countryCode
  );
  if (!country) return undefined;
  return {
    name: country?.name,
    code: country?.isoCode,
    dial_code: `+${country?.phonecode}`,
  };
}
