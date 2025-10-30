import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileHeader from '../../../modules/profile/profile-header.component';

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

  it('should render profile header title', () => {
    render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  it('should render notifications toggle when enabled', () => {
    render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toBeChecked();
  });

  it('should render notifications toggle when disabled', () => {
    render(
      <ProfileHeader
        notificationsEnabled={false}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeInTheDocument();
    expect(toggle).not.toBeChecked();
  });

  it('should call onNotificationsChange when toggle is clicked', () => {
    render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    const toggle = screen.getByRole('checkbox');
    fireEvent.click(toggle);

    expect(mockOnNotificationsChange).toHaveBeenCalledWith(false);
  });

  it('should have correct header structure', () => {
    const { container } = render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    const header = container.querySelector('div');
    expect(header).toHaveClass('flex', 'items-center', 'justify-between', 'mb-6');
  });

  it('should render notification label', () => {
    render(
      <ProfileHeader
        notificationsEnabled={true}
        onNotificationsChange={mockOnNotificationsChange}
      />
    );

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });
});
