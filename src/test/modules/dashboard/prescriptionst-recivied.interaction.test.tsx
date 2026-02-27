import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrescriptionsReceived } from '../../../modules/dashboard/prescriptions-received.component';

describe('PrescriptionsReceived interactions', () => {
  it('toggles Received and Pendings tabs and applies active classes', () => {
    render(<PrescriptionsReceived />);

    // Initially header is present
    expect(screen.getByText(/Prescription Received/i)).toBeInTheDocument();

    const receivedBtn = screen.getByRole('button', { name: /^Received$/i });
    const pendingsBtn = screen.getByRole('button', { name: /^Pendings$/i });

    // Click Received -> should set active class
    fireEvent.click(receivedBtn);
    expect(receivedBtn).toHaveClass('border-indigo-600');

    // Click Pendings -> should set active class on pendings
    fireEvent.click(pendingsBtn);
    expect(pendingsBtn).toHaveClass('border-indigo-600');
  });
});
