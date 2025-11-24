import stateDistrictData from '../assets/data/state_district_tehsil.json';
import type {
  CountryWithStates,
  District,
  State,
  StateData,
} from '../types/common.types';

/**
 * Get all countries from the state_district_tehsil.json file
 * @returns Array of countries with their states
 */
export function getAllCountries(): CountryWithStates[] {
  return (stateDistrictData as StateData).countries;
}

/**
 * Get a country by name
 * @param countryName - The name of the country to find
 * @returns The country object or undefined if not found
 */
export function getCountryByName(
  countryName: string
): CountryWithStates | undefined {
  const countries = getAllCountries();
  return countries.find(
    country =>
      country.name.toLowerCase() === countryName.toLowerCase() ||
      country['name-hi']?.toLowerCase() === countryName.toLowerCase()
  );
}

/**
 * Get all states for a given country
 * @param countryName - The name of the country
 * @returns Array of states for the country, or empty array if country not found
 */
export function getStatesByCountry(countryName: string): State[] {
  const country = getCountryByName(countryName);
  return country?.states || [];
}

/**
 * Get all states from all countries in the state_district_tehsil.json file
 * @returns Array of all states from all countries
 */
export function getAllStates(): State[] {
  const countries = getAllCountries();
  return countries.flatMap(country => country.states);
}

/**
 * Get a state by name (searches across all countries)
 * @param stateName - The name of the state to find
 * @returns The state object or undefined if not found
 */
export function getStateByName(stateName: string): State | undefined {
  const states = getAllStates();
  return states.find(
    state => state.state.toLowerCase() === stateName.toLowerCase()
  );
}

/**
 * Get a state by name within a specific country
 * @param countryName - The name of the country
 * @param stateName - The name of the state to find
 * @returns The state object or undefined if not found
 */
export function getStateByNameInCountry(
  countryName: string,
  stateName: string
): State | undefined {
  const states = getStatesByCountry(countryName);
  return states.find(
    state => state.state.toLowerCase() === stateName.toLowerCase()
  );
}

/**
 * Get all districts for a given state
 * @param stateName - The name of the state
 * @param countryName - Optional country name for more accurate lookup
 * @returns Array of districts for the state, or empty array if state not found
 */
export function getDistrictsByState(
  stateName: string,
  countryName?: string
): District[] {
  const state = countryName
    ? getStateByNameInCountry(countryName, stateName)
    : getStateByName(stateName);
  return state?.districts || [];
}

/**
 * Get a district by name within a state
 * @param stateName - The name of the state
 * @param districtName - The name of the district
 * @returns The district object or undefined if not found
 */
export function getDistrictByName(
  stateName: string,
  districtName: string
): District | undefined {
  const districts = getDistrictsByState(stateName);
  return districts.find(
    district => district.name.toLowerCase() === districtName.toLowerCase()
  );
}
