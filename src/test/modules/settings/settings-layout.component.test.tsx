import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsLayout from '../../../modules/settings/settings-layout.component';

vi.mock('../../../modules/settings/settings-account.component', () => ({
  default: () => <div data-testid="tab-account" />,
}));
vi.mock('../../../modules/settings/settings-notification.component', () => ({
  default: () => <div data-testid="tab-notification" />,
}));
vi.mock('../../../modules/settings/settings-security.component', () => ({
  default: () => <div data-testid="tab-security" />,
}));
vi.mock('../../../modules/settings/settings-language.component', () => ({
  default: () => <div data-testid="tab-language" />,
}));

describe('SettingsLayout', () => {
  it('renders the Settings header with gear icon', () => {
    render(<SettingsLayout />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByAltText('Settings')).toBeInTheDocument();
  });

  it('shows the Personal section label', () => {
    render(<SettingsLayout />);
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('renders all 4 nav tabs', () => {
    render(<SettingsLayout />);
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Notification')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Language & protocol')).toBeInTheDocument();
  });

  it('renders the Account tab content by default', () => {
    render(<SettingsLayout />);
    expect(screen.getByTestId('tab-account')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-notification')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tab-security')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tab-language')).not.toBeInTheDocument();
  });

  it('switches to the Notification tab when clicked', () => {
    render(<SettingsLayout />);
    fireEvent.click(screen.getByText('Notification'));
    expect(screen.getByTestId('tab-notification')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-account')).not.toBeInTheDocument();
  });

  it('switches to the Security tab when clicked', () => {
    render(<SettingsLayout />);
    fireEvent.click(screen.getByText('Security'));
    expect(screen.getByTestId('tab-security')).toBeInTheDocument();
  });

  it('switches to the Language & protocol tab when clicked', () => {
    render(<SettingsLayout />);
    fireEvent.click(screen.getByText('Language & protocol'));
    expect(screen.getByTestId('tab-language')).toBeInTheDocument();
  });

  it('applies active styling to the currently selected tab', () => {
    render(<SettingsLayout />);
    const accountBtn = screen.getByText('Account').closest('button');
    expect(accountBtn).toHaveClass('bg-gray-100');

    fireEvent.click(screen.getByText('Security'));
    const securityBtn = screen.getByText('Security').closest('button');
    expect(securityBtn).toHaveClass('bg-gray-100');
  });

  it('renders nav-item icons', () => {
    render(<SettingsLayout />);
    expect(screen.getByAltText('Account')).toBeInTheDocument();
    expect(screen.getByAltText('Notification')).toBeInTheDocument();
    expect(screen.getByAltText('Security')).toBeInTheDocument();
    expect(screen.getByAltText('Language & protocol')).toBeInTheDocument();
  });
});
