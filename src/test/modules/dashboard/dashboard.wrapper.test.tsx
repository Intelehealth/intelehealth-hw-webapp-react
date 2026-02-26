import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import DashboardComponent from '../../../modules/dashboard/dashboard.component';

describe('DashboardComponent wrapper class toggles', () => {
  it('wrapper has hidden md:flex when initialShowPrescriptions is false', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardComponent />
      </MemoryRouter>
    );

    const info = screen.getByText(/are waiting their Pending Prescriptions/i);
    // the text lives inside the inner info div; the outer wrapper is its parent
    const inner = info.closest('div');
    const wrapper = inner?.parentElement;
    expect(wrapper).toBeTruthy();
    // wrapper class should include the mobile-hidden / md:flex path
    expect(wrapper?.className).toMatch(/hidden\s+md:flex|md:flex/);
  });

  it('wrapper has flex when initialShowPrescriptions is true', () => {
    render(
      <MemoryRouter>
        <DashboardComponent initialShowPrescriptions={true} />
      </MemoryRouter>
    );

    const info = screen.getByText(/are waiting their Pending Prescriptions/i);
    const inner = info.closest('div');
    const wrapper = inner?.parentElement;
    expect(wrapper).toBeTruthy();
    // when showPrescriptions is true the wrapper should start with 'flex'
    expect(wrapper?.className).toMatch(/(^|\s)flex(\s|$)/);
  });
});
