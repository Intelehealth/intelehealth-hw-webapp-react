import React from 'react';
import iconSearch from '../../assets/icons/icon-search.svg';

interface HelpSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export const HelpSearchHeader: React.FC<HelpSearchProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search',
}) => (
  <div className="hidden md:block relative">
    <img
      src={iconSearch}
      alt="search"
      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40"
    />
    <input
      type="text"
      placeholder={placeholder}
      value={searchQuery}
      onChange={e => onSearchChange(e.target.value)}
      className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#2E1E91] w-[30%] min-w-[247px] bg-gray-50"
    />
  </div>
);
export const HelpSearchMobile: React.FC<HelpSearchProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search',
}) => (
  <div className="relative mt-1 mb-3 md:hidden">
    <img
      src={iconSearch}
      alt="search"
      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40"
    />
    <input
      type="text"
      placeholder={placeholder}
      value={searchQuery}
      onChange={e => onSearchChange(e.target.value)}
      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#2E1E91] box-border"
    />
  </div>
);
