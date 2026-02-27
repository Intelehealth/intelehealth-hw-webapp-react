import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import VisitSummaryPage from '../../../pages/visit-summary/visit-summary.page';

describe('VisitSummaryPage', () => {
  it('renders visit summary component', () => {
    render(
      <MemoryRouter>
        <VisitSummaryPage />
      </MemoryRouter>
    );

    const elements = screen.getAllByText(/Visit summary/i);
    expect(elements.length).toBeGreaterThan(0);
  });
});
