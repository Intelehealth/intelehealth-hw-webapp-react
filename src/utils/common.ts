import type { CountryCode } from '../types/common.types';

export async function getCountryCode(
  countryCode: string
): Promise<CountryCode | undefined> {
  // Dynamically import country-state-city to reduce initial bundle size
  const { Country } = await import('country-state-city');
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
