import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HelpSearchHeader,
  HelpSearchMobile,
} from '../../../modules/help-and-support/help-search';

vi.mock('../../../assets/icons/icon-search.svg', () => ({
  default: 'mocked-search-icon.svg',
}));

describe('HelpSearchHeader', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<HelpSearchHeader {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('should render with the default placeholder', () => {
    render(<HelpSearchHeader {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('should render with a custom placeholder', () => {
    render(<HelpSearchHeader {...defaultProps} placeholder="Search for help" />);
    expect(screen.getByPlaceholderText('Search for help')).toBeInTheDocument();
  });

  it('should display the search query value', () => {
    render(<HelpSearchHeader {...defaultProps} searchQuery="test query" />);
    const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
    expect(input.value).toBe('test query');
  });

  it('should call onSearchChange when input value changes', () => {
    const onSearchChange = vi.fn();
    render(<HelpSearchHeader {...defaultProps} onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'new query' } });
    expect(onSearchChange).toHaveBeenCalledWith('new query');
  });

  it('should render the search icon', () => {
    render(<HelpSearchHeader {...defaultProps} />);
    const icon = screen.getByAltText('search');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', 'mocked-search-icon.svg');
  });

  it('should have hidden md:block class for desktop-only display', () => {
    const { container } = render(<HelpSearchHeader {...defaultProps} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('hidden');
    expect(wrapper.className).toContain('md:block');
  });
});

describe('HelpSearchMobile', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<HelpSearchMobile {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('should render with the default placeholder', () => {
    render(<HelpSearchMobile {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('should render with a custom placeholder', () => {
    render(<HelpSearchMobile {...defaultProps} placeholder="Search FAQ" />);
    expect(screen.getByPlaceholderText('Search FAQ')).toBeInTheDocument();
  });

  it('should display the search query value', () => {
    render(<HelpSearchMobile {...defaultProps} searchQuery="mobile query" />);
    const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
    expect(input.value).toBe('mobile query');
  });

  it('should call onSearchChange when input value changes', () => {
    const onSearchChange = vi.fn();
    render(<HelpSearchMobile {...defaultProps} onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'mobile search' } });
    expect(onSearchChange).toHaveBeenCalledWith('mobile search');
  });

  it('should render the search icon', () => {
    render(<HelpSearchMobile {...defaultProps} />);
    const icon = screen.getByAltText('search');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', 'mocked-search-icon.svg');
  });

  it('should have md:hidden class for mobile-only display', () => {
    const { container } = render(<HelpSearchMobile {...defaultProps} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('md:hidden');
  });
});
