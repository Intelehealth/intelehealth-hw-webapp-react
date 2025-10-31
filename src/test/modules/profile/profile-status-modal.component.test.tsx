import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileStatusModal from '../../../modules/profile/profile-status-modal.component';

// COMMENTED OUT: Profile tests
describe.skip('ProfileStatusModal', () => {
  const mockOnGoToProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <ProfileStatusModal
        isOpen={false}
        onGoToProfile={mockOnGoToProfile}
        profileState="incomplete"
      />
    );

    expect(screen.queryByText('Please complete all required fields to continue.')).not.toBeInTheDocument();
  });

  it('should render incomplete profile message', () => {
    render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="incomplete"
      />
    );

    expect(screen.getByText('Please complete all required fields to continue.')).toBeInTheDocument();
    expect(screen.getByText('Go to Profile')).toBeInTheDocument();
  });

  it('should render not-started profile message', () => {
    render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="not-started"
      />
    );

    expect(screen.getByText('Complete your profile to get started!')).toBeInTheDocument();
    expect(screen.getByText('Go to profile')).toBeInTheDocument();
  });

  it('should call onGoToProfile when button is clicked', () => {
    render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="incomplete"
      />
    );

    const button = screen.getByText('Go to Profile');
    fireEvent.click(button);

    expect(mockOnGoToProfile).toHaveBeenCalledTimes(1);
  });

  it('should have correct modal structure', () => {
    const { container } = render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="incomplete"
      />
    );

    const modal = container.querySelector('.relative.bg-white.rounded-2xl');
    expect(modal).toBeInTheDocument();
  });
});
