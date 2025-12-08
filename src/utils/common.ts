import type { CountryCode } from '../types/common.types';
import { getCountryByDialCode } from './countries';

export async function getCountryCode(
  countryCode: string
): Promise<CountryCode | undefined> {
  // Return undefined for empty or whitespace-only strings
  if (!countryCode || !countryCode.trim()) {
    return undefined;
  }
  // Get country by dial code from local JSON data
  const country = getCountryByDialCode(countryCode);
  if (!country) return undefined;
  return {
    name: country.name,
    code: country.code || '',
    dial_code: country.dial_code || countryCode,
  };
}

export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}
