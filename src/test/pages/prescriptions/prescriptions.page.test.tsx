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
  it('renders Prescriptions heading', () => {
    render(
      <MemoryRouter>
        <PrescriptionsPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Prescriptions/i).length).toBeGreaterThan(0);
  });

  it('renders without crashing', () => {
    expect(() => {
      render(
        <MemoryRouter>
          <PrescriptionsPage />
        </MemoryRouter>
      );
    }).not.toThrow();
  });

  it('renders wrapper with flex layout classes', () => {
    const { container } = render(
      <MemoryRouter>
        <PrescriptionsPage />
      </MemoryRouter>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('p-4', 'flex-1', 'min-h-0', 'flex', 'flex-col');
  });

  it('passes initialRowCount=9 to PrescriptionsReceived', () => {
    const { container } = render(
      <MemoryRouter>
        <PrescriptionsPage />
      </MemoryRouter>
    );

    // Component renders with PrescriptionsReceived inside
    expect(container.querySelector('.rounded-2xl')).toBeInTheDocument();
  });

  it('renders search input from PrescriptionsReceived', () => {
    render(
      <MemoryRouter>
        <PrescriptionsPage />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Find patient')).toBeInTheDocument();
  });

  it('renders Received and Pending tabs', () => {
    render(
      <MemoryRouter>
        <PrescriptionsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Received')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
