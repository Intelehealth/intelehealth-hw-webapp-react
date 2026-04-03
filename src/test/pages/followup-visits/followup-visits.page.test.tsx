/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import FollowupVisitsPage from '../../../pages/followup-visits/followup-visits.page';

vi.mock('../../../modules/dashboard/followup-visits.component', () => ({
  FollowupVisitsComponent: () => <div data-testid="mock-followup-visits-component" />,
}));

describe('FollowupVisitsPage', () => {
  it('renders the FollowupVisitsComponent', () => {
    render(
      <MemoryRouter>
        <FollowupVisitsPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('mock-followup-visits-component')).toBeInTheDocument();
  });
});
