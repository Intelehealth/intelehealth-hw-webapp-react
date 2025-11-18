import { countries } from '../assets/data/countries';
import type { CountryCode } from '../types/common.types';

export function getCountryCode(countryCode: string): CountryCode | undefined {
  return countries.find(val => val.dial_code === countryCode);
}
