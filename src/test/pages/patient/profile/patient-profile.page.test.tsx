import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '../../../../modules/patient/profile/patient-profile.component',
  () => ({
    default: () => (
      <div data-testid="patient-profile-component">PatientProfile</div>
    ),
  })
);

import PatientProfilePage from '../../../../pages/patient/profile/patient-profile.page';

describe('PatientProfilePage', () => {
  it('renders PatientProfileComponent', () => {
    render(<PatientProfilePage />);
    expect(
      screen.getByTestId('patient-profile-component')
    ).toBeInTheDocument();
  });
});
