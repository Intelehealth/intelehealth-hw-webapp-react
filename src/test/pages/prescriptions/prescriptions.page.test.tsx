import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../hooks/usePrescriptionsReceived', () => ({
  usePrescriptionsReceived: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

vi.mock('../../../hooks/usePrescriptionsPending', () => ({
  usePrescriptionsPending: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

import PrescriptionsPage from '../../../pages/prescriptions/prescriptions.page';

describe('PrescriptionsPage', () => {
  it('renders Prescription Received heading', () => {
    render(
      <MemoryRouter>
        <PrescriptionsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Prescription Received/i)).toBeInTheDocument();
  });
});
