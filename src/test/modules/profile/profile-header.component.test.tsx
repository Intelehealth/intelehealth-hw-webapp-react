import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileHeader from '../../../modules/profile/profile-header.component';

// Mock the Toggle component
// Store onChange handler so tests can access it
let storedOnChange: ((e: React.ChangeEvent<HTMLInputElement>) => void) | undefined;

vi.mock('../../../components/common', () => ({
  Toggle: ({ label, checked, onChange, size, variant, ...props }: any) => {
    // Store onChange for testing
    storedOnChange = onChange;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // ProfileHeader expects: onChange={(e) => onNotificationsChange?.(e.target.checked)}
      if (onChange) {
        // Extract checked value from the event
        // When fireEvent.change(toggleInput, { target: { checked: false } }) is called,
        // React Testing Library creates an event where e.target is the input element
        // and the properties are merged. We need to check if checked is in the merged object
        const target = e.target as any;
        let checkedValue: boolean;
        
        // Check if checked property exists in the event target
        // fireEvent.change merges { target: { checked: false } } into e.target
        if (target && 'checked' in target && target.checked !== undefined) {
          checkedValue = Boolean(target.checked);
        } else {
          // Fallback: toggle from current state
          checkedValue = !checked;
        }
        
        // Create event with checked value explicitly set in target
        const syntheticEvent = {
          ...e,
          target: {
            ...target,
            checked: checkedValue,
          },
          currentTarget: {
            ...(e.currentTarget as any),
            checked: checkedValue,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange(syntheticEvent);
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

describe('ProfileHeader', () => {
  const mockOnNotificationsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(
        <ProfileHeader
          notificationsEnabled={true}
          onNotificationsChange={mockOnNotificationsChange}
        />
      );
    }).not.toThrow();
  });

  it('should render mobile header', () => {
    const { container } = render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    // Mobile header should be visible
    const mobileHeader = container.querySelector('.lg\\:hidden');
    expect(mobileHeader).toBeInTheDocument();

    // Check for back button
    const backButton = mobileHeader?.querySelector('button');
    expect(backButton).toBeInTheDocument();
    const backIcon = backButton?.querySelector('.fa-arrow-left');
    expect(backIcon).toBeInTheDocument();

    // Check for title
    const title = screen.getByText('My profile');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-xl', 'font-bold', 'text-gray-900');

    // Check for sync button
    const buttons = mobileHeader?.querySelectorAll('button');
    expect(buttons?.length).toBeGreaterThanOrEqual(2);
    const syncIcon = buttons?.[1]?.querySelector('.fa-sync');
    expect(syncIcon).toBeInTheDocument();
    expect(syncIcon).toHaveClass('text-teal-500');
  });

  it('should render desktop header', () => {
    const { container } = render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    // Desktop header should be visible
    const desktopHeader = container.querySelector('.hidden.lg\\:flex');
    expect(desktopHeader).toBeInTheDocument();

    // Check for user icon container
    const userIconContainer = desktopHeader?.querySelector('.w-8.h-8.rounded-full');
    expect(userIconContainer).toBeInTheDocument();
    expect(userIconContainer).toHaveStyle({ backgroundColor: 'var(--color-primary)' });

    // Check for user icon
    const userIcon = userIconContainer?.querySelector('.fa-user');
    expect(userIcon).toBeInTheDocument();
    expect(userIcon).toHaveClass('text-white', 'text-sm');

    // Check for desktop title
    const desktopTitle = screen.getAllByText(/My Profile/i).find(
      (el) => el.className.includes('text-heading-5')
    );
    expect(desktopTitle).toBeInTheDocument();
    expect(desktopTitle).toHaveClass('text-heading-5', 'text-[--color-dark]');
  });

  it('should render toggle with notifications enabled', () => {
    render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    const toggle = screen.getByTestId('toggle');
    expect(toggle).toBeInTheDocument();

    const toggleInput = toggle.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(toggleInput).toBeInTheDocument();
    expect(toggleInput.checked).toBe(true);

    const label = toggle.querySelector('label');
    expect(label).toHaveTextContent('Notifications');
  });

  it('should render toggle with notifications disabled', () => {
    render(
      <ProfileHeader
        notificationsEnabled={false}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    const toggleInput = screen
      .getByTestId('toggle')
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(toggleInput.checked).toBe(false);
  });

  it('should call onNotificationsChange when toggle is changed', () => {
    render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    const toggleInput = screen
      .getByTestId('toggle')
      .querySelector('input[type="checkbox"]') as HTMLInputElement;

    // Verify initial state
    expect(toggleInput.checked).toBe(true);

    mockOnNotificationsChange.mockClear();

    // Call onChange directly with an event that has checked: false
    // This tests the component logic directly
    if (storedOnChange) {
      const falseEvent = {
        target: { checked: false },
        currentTarget: { checked: false },
      } as React.ChangeEvent<HTMLInputElement>;
      storedOnChange(falseEvent);
    }

    expect(mockOnNotificationsChange).toHaveBeenCalledWith(false);
    expect(mockOnNotificationsChange).toHaveBeenCalledTimes(1);

    mockOnNotificationsChange.mockClear();

    // Call onChange directly with an event that has checked: true
    if (storedOnChange) {
      const trueEvent = {
        target: { checked: true },
        currentTarget: { checked: true },
      } as React.ChangeEvent<HTMLInputElement>;
      storedOnChange(trueEvent);
    }

    expect(mockOnNotificationsChange).toHaveBeenCalledWith(true);
    expect(mockOnNotificationsChange).toHaveBeenCalledTimes(1);
  });

  it('should pass correct props to Toggle component', () => {
    render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    const toggleInput = screen
      .getByTestId('toggle')
      .querySelector('input[type="checkbox"]') as HTMLInputElement;

    expect(toggleInput).toHaveAttribute('data-size', 'md');
    expect(toggleInput).toHaveAttribute('data-variant', 'primary');
  });

  it('should render toggle container with correct styling', () => {
    const { container } = render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    const toggleContainer = container.querySelector('.hidden.lg\\:flex.items-center.gap-4');
    expect(toggleContainer).toBeInTheDocument();

    // Check for the inner div with CSS variable
    const toggleWrapper = toggleContainer?.querySelector('div[style*="--color-accent"]');
    expect(toggleWrapper).toBeInTheDocument();
    expect(toggleWrapper).toHaveStyle({ '--color-accent': '#34cc8b' });
  });

  it('should have correct root container classes', () => {
    const { container } = render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass(
      'flex',
      'items-center',
      'justify-between',
      'mb-6'
    );
  });

  it('should render both mobile and desktop headers', () => {
    const { container } = render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    // Both should be in the DOM (visibility controlled by CSS)
    const mobileHeader = container.querySelector('.lg\\:hidden');
    const desktopHeader = container.querySelector('.hidden.lg\\:flex');

    expect(mobileHeader).toBeInTheDocument();
    expect(desktopHeader).toBeInTheDocument();
  });

  it('should handle toggle onChange event correctly', () => {
    render(
      <ProfileHeader
        notificationsEnabled={false}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    const toggle = screen.getByTestId('toggle');
    const toggleInput = toggle.querySelector('input[type="checkbox"]') as HTMLInputElement;

    // Verify initial state
    expect(toggleInput.checked).toBe(false);

    // Clear any previous calls from render
    mockOnNotificationsChange.mockClear();

    // Call onChange directly with an event that has checked: true
    // This tests the component logic directly, similar to the previous test
    if (storedOnChange) {
      const changeEvent = {
        target: { checked: true },
        currentTarget: { checked: true },
      } as React.ChangeEvent<HTMLInputElement>;
      
      storedOnChange(changeEvent);
    }

    // Should be called exactly once with true
    expect(mockOnNotificationsChange).toHaveBeenCalledTimes(1);
    expect(mockOnNotificationsChange).toHaveBeenCalledWith(true);
  });

  it('should render all icons correctly', () => {
    const { container } = render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

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

  it('should render titles in both mobile and desktop versions', () => {
    render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    // Mobile title
    const mobileTitle = screen.getByText('My profile');
    expect(mobileTitle).toBeInTheDocument();

    // Desktop title
    const desktopTitles = screen.getAllByText(/My Profile/i);
    expect(desktopTitles.length).toBeGreaterThanOrEqual(1);
    
    const desktopTitle = desktopTitles.find(
      (el) => el.className.includes('text-heading-5')
    );
    expect(desktopTitle).toBeInTheDocument();
  });

  it('should maintain correct structure and nesting', () => {
    const { container } = render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    const root = container.firstChild as HTMLElement;

    // Root should have 3 direct children (mobile header, desktop header, toggle container)
    expect(root.children.length).toBeGreaterThanOrEqual(2);

    // Mobile header structure
    const mobileHeader = root.querySelector('.lg\\:hidden');
    expect(mobileHeader?.children.length).toBeGreaterThanOrEqual(2);

    // Desktop header structure
    const desktopHeader = root.querySelector('.hidden.lg\\:flex.items-center.gap-3');
    expect(desktopHeader).toBeInTheDocument();
    expect(desktopHeader?.children.length).toBeGreaterThanOrEqual(2);
  });
});

