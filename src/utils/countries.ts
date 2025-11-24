import countyData from '../assets/data/county.json';
import type { Country } from '../types';

/**
 * Get all countries from the county.json file
 * @returns Array of countries with English and Hindi names, dial codes, and ISO codes
 */
export function getAllCountries(): Country[] {
  return countyData.countries;
}

/**
 * Get a country by name
 * @param countryName - The name of the country to find
 * @returns The country object or undefined if not found
 */
export function getCountryByName(countryName: string): Country | undefined {
  const countries = getAllCountries();
  return countries.find(
    country => country.name.toLowerCase() === countryName.toLowerCase()
  );
}

/**
 * Get a country by dial code
 * @param dialCode - The dial code (e.g., '+91')
 * @returns The country object or undefined if not found
 */
export function getCountryByDialCode(dialCode: string): Country | undefined {
  const countries = getAllCountries();
  return countries.find(country => country.dial_code === dialCode);
}
