import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { OpenVisitsComponent } from '../modules/dashboard/open-visits.component';
import { store } from '../store/store';

describe('OpenVisitsComponent', () => {
  it('renders and toggles tabs, shows patients and search input', async () => {
    render(
      <Provider store={store}>
        <OpenVisitsComponent />
      </Provider>
    );

    // Search input should be present
    const search = screen.getByPlaceholderText('Find patient');
    expect(search).toBeInTheDocument();

    // Initial active tab should be Unclosed
    const unclosedBtn = screen.getByText('Unclosed');
    const closedBtn = screen.getByText('Closed');

    expect(unclosedBtn).toBeInTheDocument();
    expect(closedBtn).toBeInTheDocument();

    // Unclosed is active by default (has indicator class)
    expect(unclosedBtn.className).toContain('border-indigo-600');

    // Click Closed and expect it to become active
    await userEvent.click(closedBtn);
    expect(closedBtn.className).toContain('border-indigo-600');
    expect(unclosedBtn.className).not.toContain('border-indigo-600');

    // Patient data from fixture should be rendered (may appear in multiple views)
    const patients = screen.getAllByText('Sarrah Paul (F)');
    expect(patients.length).toBeGreaterThan(0);
  });
});
