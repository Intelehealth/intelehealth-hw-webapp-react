import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReasonSearchInput } from '../../../../../../modules/ayu/components/start-visit/visit-reason/search-input.component';

describe('ReasonSearchInput', () => {
  const mockSetSearch = vi.fn();
  const mockAddReason = vi.fn();

  it('should render search input with placeholder', () => {
    render(
      <ReasonSearchInput
        search=""
        setSearch={mockSetSearch}
        filteredNames={[]}
        addReason={mockAddReason}
      />
    );

    expect(
      screen.getByPlaceholderText('Type or select reason eg. Fever')
    ).toBeInTheDocument();
  });

  it('should render instruction text', () => {
    render(
      <ReasonSearchInput
        search=""
        setSearch={mockSetSearch}
        filteredNames={[]}
        addReason={mockAddReason}
      />
    );

    expect(screen.getByText('Select one or multiple reasons')).toBeInTheDocument();
  });

  it('should call setSearch when input value changes', async () => {
    const user = userEvent.setup();
    render(
      <ReasonSearchInput
        search=""
        setSearch={mockSetSearch}
        filteredNames={[]}
        addReason={mockAddReason}
      />
    );

    const input = screen.getByPlaceholderText('Type or select reason eg. Fever');
    await user.type(input, 'Fever');

    expect(mockSetSearch).toHaveBeenCalled();
  });

  it('should display filtered results when search has value', () => {
    render(
      <ReasonSearchInput
        search="Fever"
        setSearch={mockSetSearch}
        filteredNames={['Fever', 'Fever with chills']}
        addReason={mockAddReason}
      />
    );

    const results = screen.getAllByText(/Fever/);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('should display "No matching complaints found" when no results', () => {
    render(
      <ReasonSearchInput
        search="xyz"
        setSearch={mockSetSearch}
        filteredNames={[]}
        addReason={mockAddReason}
      />
    );

    expect(screen.getByText('No matching complaints found')).toBeInTheDocument();
  });

  it('should call addReason when a filtered result is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReasonSearchInput
        search="Fever"
        setSearch={mockSetSearch}
        filteredNames={['Fever']}
        addReason={mockAddReason}
      />
    );

    await user.click(screen.getByText(/Fever/));

    expect(mockAddReason).toHaveBeenCalledWith('Fever');
  });

  it('should not display results when search is empty', () => {
    render(
      <ReasonSearchInput
        search=""
        setSearch={mockSetSearch}
        filteredNames={[]}
        addReason={mockAddReason}
      />
    );

    expect(screen.queryByText('No matching complaints found')).not.toBeInTheDocument();
  });

  it('should limit results to 8 items', () => {
    const manyResults = Array.from({ length: 15 }, (_, i) => `Fever ${i}`);
    render(
      <ReasonSearchInput
        search="Fever"
        setSearch={mockSetSearch}
        filteredNames={manyResults}
        addReason={mockAddReason}
      />
    );

    const displayedResults = screen.getAllByText(/Fever/);
    expect(displayedResults.length).toBeLessThanOrEqual(8);
  });

  it('should highlight matching text in search results with bold', () => {
    render(
      <ReasonSearchInput
        search="Fev"
        setSearch={mockSetSearch}
        filteredNames={['Fever']}
        addReason={mockAddReason}
      />
    );

    const boldElements = document.querySelectorAll('strong.text-black.font-semibold');
    expect(boldElements.length).toBeGreaterThanOrEqual(1);
    expect(boldElements[0].textContent).toBe('Fev');
  });

  it('should render non-matching text in span elements', () => {
    render(
      <ReasonSearchInput
        search="Fev"
        setSearch={mockSetSearch}
        filteredNames={['Fever']}
        addReason={mockAddReason}
      />
    );

    const spans = document.querySelectorAll('span');
    const spanTexts = Array.from(spans).map(s => s.textContent);
    expect(spanTexts).toContain('er');
  });

  it('should hide search icon when search has value', () => {
    render(
      <ReasonSearchInput
        search="Fever"
        setSearch={mockSetSearch}
        filteredNames={['Fever']}
        addReason={mockAddReason}
      />
    );

    expect(screen.queryByAltText('Search')).not.toBeInTheDocument();
  });

  it('should show search icon when search is empty', () => {
    render(
      <ReasonSearchInput
        search=""
        setSearch={mockSetSearch}
        filteredNames={[]}
        addReason={mockAddReason}
      />
    );

    expect(screen.getByAltText('Search')).toBeInTheDocument();
  });

  it('should render visit reason question text', () => {
    render(
      <ReasonSearchInput
        search=""
        setSearch={mockSetSearch}
        filteredNames={[]}
        addReason={mockAddReason}
      />
    );

    expect(screen.getByText('What is the reason for this visit?')).toBeInTheDocument();
  });
});
