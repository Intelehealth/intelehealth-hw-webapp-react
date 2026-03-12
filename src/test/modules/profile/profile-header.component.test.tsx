import { render, screen } from '@testing-library/react';
import React from 'react';
import { HashRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileHeader from '../../../modules/profile/profile-header.component';

// Mock NotificationContext
const mockToggleNotifications = vi.fn();
let mockIsEnabled = true;

vi.mock('../../../context/NotificationContext', () => ({
  useNotificationContext: () => ({
    isEnabled: mockIsEnabled,
    toggleNotifications: mockToggleNotifications,
    token: '',
    notifications: [],
    unreadCount: 0,
    requestPermission: vi.fn(),
  }),
}));

// Mock the Toggle component
let storedOnChange: ((e: React.ChangeEvent<HTMLInputElement>) => void) | undefined;

vi.mock('../../../components/common', () => ({
  Toggle: ({ label, checked, onChange, size, variant, ...props }: any) => {
    storedOnChange = onChange;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div data-testid="toggle">
        <label>
          {label}
          <input
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            data-size={size}
            data-variant={variant}
            {...props}
          />
        </label>
      </div>
    );
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<HashRouter>{component}</HashRouter>);
};

describe('ProfileHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEnabled = true;
  });

  it('should render without crashing', () => {
    expect(() => {
      renderWithRouter(<ProfileHeader />);
    }).not.toThrow();
  });

  it('should render mobile back button', () => {
    const { container } = renderWithRouter(<ProfileHeader />);

    const backButton = container.querySelector('button');
    expect(backButton).toBeInTheDocument();
    const backIcon = backButton?.querySelector('.fa-arrow-left');
    expect(backIcon).toBeInTheDocument();
  });

  it('should render desktop header with user icon', () => {
    const { container } = renderWithRouter(<ProfileHeader />);

    const userIconContainer = container.querySelector('.w-8.h-8.rounded-full');
    expect(userIconContainer).toBeInTheDocument();
    expect(userIconContainer).toHaveStyle({ backgroundColor: 'var(--color-primary)' });

    const userIcon = userIconContainer?.querySelector('.fa-user');
    expect(userIcon).toBeInTheDocument();
    expect(userIcon).toHaveClass('text-white', 'text-sm');
  });

  it('should render My Profile title', () => {
    renderWithRouter(<ProfileHeader />);

    const title = screen.getByText('My Profile');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-heading-5', 'text-[--color-dark]');
  });

  it('should render toggle with notifications enabled', () => {
    mockIsEnabled = true;
    renderWithRouter(<ProfileHeader />);

    const toggle = screen.getByTestId('toggle');
    expect(toggle).toBeInTheDocument();

    const toggleInput = toggle.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(toggleInput).toBeInTheDocument();
    expect(toggleInput.checked).toBe(true);

    const label = toggle.querySelector('label');
    expect(label).toHaveTextContent('Notifications');
  });

  it('should render toggle with notifications disabled', () => {
    mockIsEnabled = false;
    renderWithRouter(<ProfileHeader />);

    const toggleInput = screen
      .getByTestId('toggle')
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(toggleInput.checked).toBe(false);
  });

  it('should call toggleNotifications when toggle is changed', () => {
    renderWithRouter(<ProfileHeader />);

    // The component passes onChange={() => toggleNotifications()}
    // So calling storedOnChange triggers toggleNotifications
    if (storedOnChange) {
      const event = {
        target: { checked: false },
        currentTarget: { checked: false },
      } as React.ChangeEvent<HTMLInputElement>;
      storedOnChange(event);
    }

    expect(mockToggleNotifications).toHaveBeenCalledTimes(1);
  });

  it('should pass correct props to Toggle component', () => {
    renderWithRouter(<ProfileHeader />);

    const toggleInput = screen
      .getByTestId('toggle')
      .querySelector('input[type="checkbox"]') as HTMLInputElement;

    expect(toggleInput).toHaveAttribute('data-size', 'md');
    expect(toggleInput).toHaveAttribute('data-variant', 'primary');
  });

  it('should render toggle container with correct styling', () => {
    const { container } = renderWithRouter(<ProfileHeader />);

    const toggleWrapper = container.querySelector('div[style*="--color-accent"]');
    expect(toggleWrapper).toBeInTheDocument();
    expect(toggleWrapper).toHaveStyle({ '--color-accent': '#34cc8b' });
  });

  it('should have correct root container classes', () => {
    const { container } = renderWithRouter(<ProfileHeader />);

    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('flex', 'items-center', 'justify-between');
  });

  it('should render all icons correctly', () => {
    const { container } = renderWithRouter(<ProfileHeader />);

    // Back arrow icon
    const backIcon = container.querySelector('.fa-arrow-left');
    expect(backIcon).toBeInTheDocument();
    expect(backIcon).toHaveClass('text-gray-600', 'text-lg');

    // Sync icon
    const syncIcon = container.querySelector('.fa-sync');
    expect(syncIcon).toBeInTheDocument();
    expect(syncIcon).toHaveClass('text-teal-500', 'text-lg');

    // User icon
    const userIcon = container.querySelector('.fa-user');
    expect(userIcon).toBeInTheDocument();
    expect(userIcon).toHaveClass('text-white', 'text-sm');
  });

  it('should render sync button for mobile', () => {
    const { container } = renderWithRouter(<ProfileHeader />);

    const syncIcon = container.querySelector('.fa-sync');
    expect(syncIcon).toBeInTheDocument();
    expect(syncIcon?.closest('button')).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    const { container } = renderWithRouter(<ProfileHeader />);

    const root = container.firstChild as HTMLElement;
    // Root should have children (left section + right section)
    expect(root.children.length).toBeGreaterThanOrEqual(2);
  });
});
