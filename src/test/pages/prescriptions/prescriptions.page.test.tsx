import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
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
