/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import FollowupVisitsPage from '../../../pages/followup-visits/followup-visits.page';
import { BreadcrumbProvider } from '../../../context/BreadcrumbContext';

vi.mock('../../../modules/dashboard/followup-visits.component', () => ({
  FollowupVisitsComponent: () => <div data-testid="mock-followup-visits-component" />,
}));

describe('FollowupVisitsPage', () => {
  it('renders the FollowupVisitsComponent', () => {
    render(
      <MemoryRouter>
        <BreadcrumbProvider>
          <FollowupVisitsPage />
        </BreadcrumbProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('mock-followup-visits-component')).toBeInTheDocument();
  });
});
