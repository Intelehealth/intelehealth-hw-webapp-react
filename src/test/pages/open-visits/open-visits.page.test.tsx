import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../hooks/useOpenVisits', () => ({
  useOpenVisits: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

import OpenVisitsPage from '../../../pages/open-visits/open-visits.page';

describe('OpenVisitsPage', () => {
  it('renders Open Visits heading', () => {
    render(
      <MemoryRouter>
        <OpenVisitsPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Open Visits/i).length).toBeGreaterThan(0);
  });

  it('renders without crashing', () => {
    expect(() => {
      render(
        <MemoryRouter>
          <OpenVisitsPage />
        </MemoryRouter>
      );
    }).not.toThrow();
  });

  it('renders wrapper with flex layout classes', () => {
    const { container } = render(
      <MemoryRouter>
        <OpenVisitsPage />
      </MemoryRouter>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('p-4', 'flex-1', 'min-h-0', 'flex', 'flex-col');
  });

  it('renders search input from OpenVisitsComponent', () => {
    render(
      <MemoryRouter>
        <OpenVisitsPage />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Find patient')).toBeInTheDocument();
  });

  it('renders filter icon', () => {
    render(
      <MemoryRouter>
        <OpenVisitsPage />
      </MemoryRouter>
    );

    expect(screen.getByAltText('filter')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    render(
      <MemoryRouter>
        <OpenVisitsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No open visits found.')).toBeInTheDocument();
  });
});
