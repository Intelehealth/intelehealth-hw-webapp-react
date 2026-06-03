import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../hooks/useOpenVisits', () => ({
  useOpenVisits: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

vi.mock('../../../hooks/usePriorityVisits', () => ({
  usePriorityVisits: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

import OpenVisitsPage from '../../../pages/open-visits/open-visits.page';
import { BreadcrumbProvider } from '../../../context/BreadcrumbContext';

describe('OpenVisitsPage', () => {
  it('renders Open Visits heading', () => {
    render(
      <MemoryRouter>
        <BreadcrumbProvider>
          <OpenVisitsPage />
        </BreadcrumbProvider>
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Open Visits/i).length).toBeGreaterThan(0);
  });

  it('renders without crashing', () => {
    expect(() => {
      render(
        <MemoryRouter>
          <BreadcrumbProvider>
            <OpenVisitsPage />
          </BreadcrumbProvider>
        </MemoryRouter>
      );
    }).not.toThrow();
  });

  it('renders wrapper with flex layout classes', () => {
    const { container } = render(
      <MemoryRouter>
        <BreadcrumbProvider>
          <OpenVisitsPage />
        </BreadcrumbProvider>
      </MemoryRouter>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('p-4', 'flex-1', 'min-h-0', 'flex', 'flex-col');
  });

  it('renders search input from OpenVisitsComponent', () => {
    render(
      <MemoryRouter>
        <BreadcrumbProvider>
          <OpenVisitsPage />
        </BreadcrumbProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Find patient')).toBeInTheDocument();
  });

  it('renders filter icon next to search', () => {
    render(
      <MemoryRouter>
        <BreadcrumbProvider>
          <OpenVisitsPage />
        </BreadcrumbProvider>
      </MemoryRouter>
    );

    expect(screen.getByAltText('filter')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    render(
      <MemoryRouter>
        <BreadcrumbProvider>
          <OpenVisitsPage />
        </BreadcrumbProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('No open visits found.')).toBeInTheDocument();
  });
});
