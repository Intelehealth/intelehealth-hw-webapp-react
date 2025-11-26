import { describe, expect, it } from 'vitest';
import {
  getAllCountries,
  getAllStates,
  getCountryByName,
  getDistrictByName,
  getDistrictsByState,
  getStateByName,
  getStateByNameInCountry,
  getStatesByCountry,
} from '../../utils/states-districts';

describe('states-districts.ts', () => {
  describe('getAllCountries', () => {
    it('should return an array of countries with states', () => {
      const countries = getAllCountries();
      expect(Array.isArray(countries)).toBe(true);
      expect(countries.length).toBeGreaterThan(0);
    });

    it('should return countries with states property', () => {
      const countries = getAllCountries();
      const firstCountry = countries[0];
      expect(firstCountry).toHaveProperty('name');
      expect(firstCountry).toHaveProperty('states');
      expect(Array.isArray(firstCountry.states)).toBe(true);
    });
  });

  describe('getCountryByName', () => {
    it('should return country for valid name', () => {
      const countries = getAllCountries();
      if (countries.length > 0) {
        const countryName = countries[0].name;
        const result = getCountryByName(countryName);
        expect(result).toBeDefined();
        expect(result?.name).toBe(countryName);
      }
    });

    it('should return country for case-insensitive name', () => {
      const countries = getAllCountries();
      if (countries.length > 0) {
        const countryName = countries[0].name;
        const result = getCountryByName(countryName.toLowerCase());
        expect(result).toBeDefined();
        expect(result?.name).toBe(countryName);
      }
    });

    it('should return country by Hindi name if available', () => {
      const countries = getAllCountries();
      const countryWithHindi = countries.find(c => c['name-hi']);
      if (countryWithHindi && countryWithHindi['name-hi']) {
        const result = getCountryByName(countryWithHindi['name-hi']);
        expect(result).toBeDefined();
        expect(result?.name).toBe(countryWithHindi.name);
      }
    });

    it('should return undefined for invalid country name', () => {
      const result = getCountryByName('NonExistentCountry');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = getCountryByName('');
      expect(result).toBeUndefined();
    });
  });

  describe('getStatesByCountry', () => {
    it('should return states for valid country', () => {
      const countries = getAllCountries();
      if (countries.length > 0 && countries[0].states.length > 0) {
        const countryName = countries[0].name;
        const result = getStatesByCountry(countryName);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should return empty array for invalid country', () => {
      const result = getStatesByCountry('NonExistentCountry');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should return empty array for empty string', () => {
      const result = getStatesByCountry('');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getAllStates', () => {
    it('should return an array of all states', () => {
      const states = getAllStates();
      expect(Array.isArray(states)).toBe(true);
      expect(states.length).toBeGreaterThan(0);
    });

    it('should return states with required properties', () => {
      const states = getAllStates();
      if (states.length > 0) {
        const firstState = states[0];
        expect(firstState).toHaveProperty('state');
        expect(firstState).toHaveProperty('districts');
        expect(Array.isArray(firstState.districts)).toBe(true);
      }
    });
  });

  describe('getStateByName', () => {
    it('should return state for valid name', () => {
      const states = getAllStates();
      if (states.length > 0) {
        const stateName = states[0].state;
        const result = getStateByName(stateName);
        expect(result).toBeDefined();
        expect(result?.state).toBe(stateName);
      }
    });

    it('should return state for case-insensitive name', () => {
      const states = getAllStates();
      if (states.length > 0) {
        const stateName = states[0].state;
        const result = getStateByName(stateName.toLowerCase());
        expect(result).toBeDefined();
        expect(result?.state).toBe(stateName);
      }
    });

    it('should return undefined for invalid state name', () => {
      const result = getStateByName('NonExistentState');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = getStateByName('');
      expect(result).toBeUndefined();
    });
  });

  describe('getStateByNameInCountry', () => {
    it('should return state for valid name in country', () => {
      const countries = getAllCountries();
      if (countries.length > 0 && countries[0].states.length > 0) {
        const countryName = countries[0].name;
        const stateName = countries[0].states[0].state;
        const result = getStateByNameInCountry(countryName, stateName);
        expect(result).toBeDefined();
        expect(result?.state).toBe(stateName);
      }
    });

    it('should return state for case-insensitive name', () => {
      const countries = getAllCountries();
      if (countries.length > 0 && countries[0].states.length > 0) {
        const countryName = countries[0].name;
        const stateName = countries[0].states[0].state;
        const result = getStateByNameInCountry(
          countryName,
          stateName.toLowerCase()
        );
        expect(result).toBeDefined();
        expect(result?.state).toBe(stateName);
      }
    });

    it('should return undefined for invalid state name', () => {
      const countries = getAllCountries();
      if (countries.length > 0) {
        const countryName = countries[0].name;
        const result = getStateByNameInCountry(
          countryName,
          'NonExistentState'
        );
        expect(result).toBeUndefined();
      }
    });

    it('should return undefined for invalid country', () => {
      const result = getStateByNameInCountry('NonExistentCountry', 'State');
      expect(result).toBeUndefined();
    });
  });

  describe('getDistrictsByState', () => {
    it('should return districts for valid state', () => {
      const states = getAllStates();
      if (states.length > 0 && states[0].districts.length > 0) {
        const stateName = states[0].state;
        const result = getDistrictsByState(stateName);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should return districts for valid state with country name', () => {
      const countries = getAllCountries();
      if (
        countries.length > 0 &&
        countries[0].states.length > 0 &&
        countries[0].states[0].districts.length > 0
      ) {
        const countryName = countries[0].name;
        const stateName = countries[0].states[0].state;
        const result = getDistrictsByState(stateName, countryName);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should return empty array for invalid state', () => {
      const result = getDistrictsByState('NonExistentState');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should return empty array for invalid state with country', () => {
      const countries = getAllCountries();
      if (countries.length > 0) {
        const countryName = countries[0].name;
        const result = getDistrictsByState('NonExistentState', countryName);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      }
    });
  });

  describe('getDistrictByName', () => {
    it('should return district for valid name', () => {
      const states = getAllStates();
      if (states.length > 0 && states[0].districts.length > 0) {
        const stateName = states[0].state;
        const districtName = states[0].districts[0].name;
        const result = getDistrictByName(stateName, districtName);
        expect(result).toBeDefined();
        expect(result?.name).toBe(districtName);
      }
    });

    it('should return district for case-insensitive name', () => {
      const states = getAllStates();
      if (states.length > 0 && states[0].districts.length > 0) {
        const stateName = states[0].state;
        const districtName = states[0].districts[0].name;
        const result = getDistrictByName(stateName, districtName.toLowerCase());
        expect(result).toBeDefined();
        expect(result?.name).toBe(districtName);
      }
    });

    it('should return undefined for invalid district name', () => {
      const states = getAllStates();
      if (states.length > 0) {
        const stateName = states[0].state;
        const result = getDistrictByName(stateName, 'NonExistentDistrict');
        expect(result).toBeUndefined();
      }
    });

    it('should return undefined for invalid state', () => {
      const result = getDistrictByName('NonExistentState', 'District');
      expect(result).toBeUndefined();
    });
  });
});

