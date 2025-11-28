// CountryCodeDropdown.tsx
import { useEffect, useState } from 'react';
import { countries } from '../../assets/data/countries';
import type { CountryCode } from '../../types/common.types';

interface CountryCodeDropdownProps {
  onChange: (country: CountryCode) => void;
  value?: CountryCode;
}

const CountryCodeDropdown = ({
  onChange,
  value = countries[0],
}: CountryCodeDropdownProps) => {
  const [selected, setSelected] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onChange(selected);
  }, [selected, onChange]);

  useEffect(() => {
    if (!value.dial_code) setSelected(countries[0]);
  }, [value]);

  // Function to get flag image URL based on country code

  const getFlagUrl = (code: string) =>
    `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

  return (
    <div className="relative w-full">
      {/* Selected */}
      <button
        type="button" // added type
        onClick={() => setOpen(!open)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 flex items-center justify-between bg-white shadow-sm"
      >
        <div className="flex items-center space-x-2 gap-2">
          <img
            src={getFlagUrl(selected.code)}
            alt={selected.name}
            className="w-5 h-4 rounded-sm object-cover md:hidden lg:block"
          />
          <span className="text-sm">{selected.dial_code}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-20 overflow-auto">
          {countries.map(country => (
            <li
              key={country.code}
              onClick={() => {
                setSelected(country);
                setOpen(false);
              }}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
            >
              <img
                src={getFlagUrl(country.code)}
                alt={country.name}
                className="w-5 h-4 rounded-sm object-cover md:hidden lg:block"
              />
              <span className="text-sm">{country.code.toUpperCase()}</span>
              <span className="ml-auto text-sm text-gray-500">
                {country.dial_code}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CountryCodeDropdown;
