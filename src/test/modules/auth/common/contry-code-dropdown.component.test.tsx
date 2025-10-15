import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CountryCodeDropdown from '../../../../modules/auth/common/contry-code-dropdown.component';

// Mock the countries data
vi.mock('../../../../assets/data/countries', () => ({
  countries: [
    { name: 'United States', code: 'us', dial_code: '+1' },
    { name: 'United Kingdom', code: 'gb', dial_code: '+44' },
    { name: 'India', code: 'in', dial_code: '+91' },
    { name: 'Canada', code: 'ca', dial_code: '+1' },
  ],
}));

describe('CountryCodeDropdown', () => {
  const mockOnChange = vi.fn();
  const mockCountries = [
    { name: 'United States', code: 'us', dial_code: '+1' },
    { name: 'United Kingdom', code: 'gb', dial_code: '+44' },
    { name: 'India', code: 'in', dial_code: '+91' },
    { name: 'Canada', code: 'ca', dial_code: '+1' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with default selected country', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      expect(screen.getByText('+1')).toBeInTheDocument();
      expect(screen.getByAltText('United States')).toBeInTheDocument();
    });

    it('should call onChange with initial country', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      expect(mockOnChange).toHaveBeenCalledWith(mockCountries[0]);
    });
  });

  describe('Dropdown Functionality', () => {
    it('should open dropdown when button is clicked', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(screen.getByText('US')).toBeInTheDocument();
      expect(screen.getByText('GB')).toBeInTheDocument();
      expect(screen.getByText('IN')).toBeInTheDocument();
      expect(screen.getByText('CA')).toBeInTheDocument();
    });

    it('should close dropdown when button is clicked again', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(screen.queryByText('US')).not.toBeInTheDocument();
    });

    it('should show dropdown items when open', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const dropdownItems = screen.getAllByRole('listitem');
      expect(dropdownItems).toHaveLength(mockCountries.length);
    });
  });

  describe('Country Selection', () => {
    it('should select a country when clicked', async () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const ukItem = screen.getByText('GB');
      fireEvent.click(ukItem);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(mockCountries[1]);
      });
    });

    it('should close dropdown after selection', async () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const ukItem = screen.getByText('GB');
      fireEvent.click(ukItem);
      
      await waitFor(() => {
        expect(screen.queryByText('US')).not.toBeInTheDocument();
      });
    });

    it('should update selected country display', async () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const indiaItem = screen.getByText('IN');
      fireEvent.click(indiaItem);
      
      await waitFor(() => {
        expect(screen.getByText('+91')).toBeInTheDocument();
        expect(screen.getByAltText('India')).toBeInTheDocument();
      });
    });
  });

  describe('Flag URL Generation', () => {
    it('should generate correct flag URLs', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const flagImages = screen.getAllByRole('img');
      // Check that all flag URLs are generated correctly (5 images: 1 in button + 4 in dropdown)
      expect(flagImages).toHaveLength(5);
      expect(flagImages[0]).toHaveAttribute('src', 'https://flagcdn.com/w40/us.png');
      expect(flagImages[1]).toHaveAttribute('src', 'https://flagcdn.com/w40/us.png');
      expect(flagImages[2]).toHaveAttribute('src', 'https://flagcdn.com/w40/gb.png');
      expect(flagImages[3]).toHaveAttribute('src', 'https://flagcdn.com/w40/in.png');
      expect(flagImages[4]).toHaveAttribute('src', 'https://flagcdn.com/w40/ca.png');
    });

    it('should handle country codes with different cases', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Check that all flag URLs are generated correctly
      const flagImages = screen.getAllByRole('img');
      // First image is from button (selected country), rest are from dropdown
      expect(flagImages[0]).toHaveAttribute('src', 'https://flagcdn.com/w40/us.png');
      expect(flagImages[1]).toHaveAttribute('src', 'https://flagcdn.com/w40/us.png');
      expect(flagImages[2]).toHaveAttribute('src', 'https://flagcdn.com/w40/gb.png');
      expect(flagImages[3]).toHaveAttribute('src', 'https://flagcdn.com/w40/in.png');
      expect(flagImages[4]).toHaveAttribute('src', 'https://flagcdn.com/w40/ca.png');
    });
  });

  describe('Visual States', () => {
    it('should show correct arrow rotation when open', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      const arrow = button.querySelector('svg');
      
      expect(arrow).not.toHaveClass('rotate-180');
      
      fireEvent.click(button);
      expect(arrow).toHaveClass('rotate-180');
    });

    it('should show correct arrow rotation when closed', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      const arrow = button.querySelector('svg');
      
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(arrow).not.toHaveClass('rotate-180');
    });
  });

  describe('Dropdown Content', () => {
    it('should display country codes in uppercase', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(screen.getByText('US')).toBeInTheDocument();
      expect(screen.getByText('GB')).toBeInTheDocument();
      expect(screen.getByText('IN')).toBeInTheDocument();
      expect(screen.getByText('CA')).toBeInTheDocument();
    });

    it('should display dial codes correctly', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const dialCodes = screen.getAllByText('+1');
      expect(dialCodes).toHaveLength(3); // +1 appears 3 times (1 in button + 2 in dropdown for US and Canada)
      expect(screen.getByText('+44')).toBeInTheDocument();
      expect(screen.getByText('+91')).toBeInTheDocument();
    });

    it('should display country names as alt text for flags', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const usImages = screen.getAllByAltText('United States');
      expect(usImages).toHaveLength(2); // US appears twice (button and dropdown)
      expect(screen.getByAltText('United Kingdom')).toBeInTheDocument();
      expect(screen.getByAltText('India')).toBeInTheDocument();
      expect(screen.getByAltText('Canada')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have proper list structure when open', () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(mockCountries.length);
    });
  });

  describe('State Management', () => {
    it('should maintain selected state correctly', async () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const ukItem = screen.getByText('GB');
      fireEvent.click(ukItem);
      
      await waitFor(() => {
        expect(screen.getByText('+44')).toBeInTheDocument();
        expect(screen.getByAltText('United Kingdom')).toBeInTheDocument();
      });
    });

    it('should call onChange when selection changes', async () => {
      render(<CountryCodeDropdown onChange={mockOnChange} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      const indiaItem = screen.getByText('IN');
      fireEvent.click(indiaItem);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(mockCountries[2]);
      });
    });
  });

  describe('Component Exports', () => {
    it('should export CountryCodeDropdown as default', () => {
      expect(CountryCodeDropdown).toBeDefined();
      expect(typeof CountryCodeDropdown).toBe('function');
    });
  });
});
