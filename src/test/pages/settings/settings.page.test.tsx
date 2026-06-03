import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsPage from '../../../pages/settings/settings.page';
import { BreadcrumbProvider } from '../../../context/BreadcrumbContext';

// Mock the layout so the page test only verifies wrapping/layout.
vi.mock('../../../modules/settings/settings-layout.component', () => ({
  default: () => <div data-testid="settings-layout" />,
}));

describe('SettingsPage', () => {
  it('renders the SettingsLayout inside a full-height white wrapper', () => {
    const { container } = render(<BreadcrumbProvider><SettingsPage /></BreadcrumbProvider>);
    expect(screen.getByTestId('settings-layout')).toBeInTheDocument();
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('h-full');
    expect(wrapper).toHaveClass('w-full');
    expect(wrapper).toHaveClass('bg-white');
    expect(wrapper).toHaveClass('overflow-hidden');
  });
});
