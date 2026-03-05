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
});
