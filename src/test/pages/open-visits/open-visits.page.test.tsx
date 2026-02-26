import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import OpenVisitsPage from '../../../pages/open-visits/open-visits.page';

describe('OpenVisitsPage', () => {
  it('renders Open Visits heading', () => {
    render(
      <MemoryRouter>
        <OpenVisitsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Open Visits/i)).toBeInTheDocument();
  });
});
