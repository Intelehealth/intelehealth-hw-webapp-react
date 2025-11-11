import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { flushSync } from 'react-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileStatusModal from '../../../modules/profile/profile-status-modal.component';

// Mock Button component
vi.mock('../../../components/common/button.component', () => ({
  default: ({ children, onClick, variant, size, ...props }: any) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('ProfileStatusModal', () => {
  const mockOnGoToProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow
    document.body.style.overflow = '';
  });

  it('should return null when isOpen is false', () => {
    const { container } = render(
      <ProfileStatusModal
        isOpen={false}
        onGoToProfile={mockOnGoToProfile}
        profileState="not-started"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="not-started"
      />
    );

    const modal = screen.getByText('Complete your profile to get started!');
    expect(modal).toBeInTheDocument();
  });

  it('should display correct content for not-started profileState', () => {
    render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="not-started"
      />
    );

    expect(screen.getByText('Complete your profile to get started!')).toBeInTheDocument();
    expect(screen.getByText('Go to profile')).toBeInTheDocument();
    
    // Check for icon container with correct background color
    const iconContainer = document.querySelector('[style*="background-color: rgb(225, 220, 255)"]');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should display correct content for incomplete profileState', () => {
    render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="incomplete"
      />
    );

    expect(screen.getByText('Please complete all required fields to continue.')).toBeInTheDocument();
    expect(screen.getByText('Go to Profile')).toBeInTheDocument();
    
    // Check for icon container with correct background color
    const iconContainer = document.querySelector('[style*="background-color: rgb(255, 240, 237)"]');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should call onGoToProfile when button is clicked', () => {
    render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="not-started"
      />
    );

    const button = screen.getByText('Go to profile');
    fireEvent.click(button);

    expect(mockOnGoToProfile).toHaveBeenCalledTimes(1);
  });

  it('should set body overflow to hidden when modal opens', () => {
    render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="not-started"
      />
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body overflow when modal closes', async () => {
    // Render with modal open - effect runs and sets overflow to hidden
    const { rerender } = render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="not-started"
      />
    );

    // Wait for effect to run and set overflow
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });

    // Close the modal - useEffect now runs BEFORE the early return,
    // so it will set overflow to 'unset' when isOpen changes to false
    act(() => {
      flushSync(() => {
        rerender(
          <ProfileStatusModal
            isOpen={false}
            onGoToProfile={mockOnGoToProfile}
            profileState="not-started"
          />
        );
      });
    });

    // Verify component returns null (modal is not rendered)
    expect(screen.queryByText('Complete your profile to get started!')).not.toBeInTheDocument();
    
    // Cleanup should have run - overflow should be 'unset' now
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  it('should restore body overflow when component unmounts', async () => {
    const { unmount } = render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="not-started"
      />
    );

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });

    // Unmount should trigger cleanup
    act(() => {
      unmount();
    });

    // Wait for cleanup to run
    await waitFor(
      () => {
        expect(document.body.style.overflow).toBe('unset');
      },
      { timeout: 100 }
    );
  });

  it('should update body overflow when isOpen changes', async () => {
    // Start with modal closed - useEffect runs and sets overflow to 'unset'
    const { rerender } = render(
      <ProfileStatusModal
        isOpen={false}
        onGoToProfile={mockOnGoToProfile}
        profileState="not-started"
      />
    );

    // Effect should set overflow to 'unset' when isOpen is false
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('unset');
    });

    // Open modal - useEffect runs and sets overflow to hidden
    rerender(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="not-started"
      />
    );

    // Wait for effect to run
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });

    // Close modal - useEffect runs BEFORE early return and sets overflow to 'unset'
    act(() => {
      flushSync(() => {
        rerender(
          <ProfileStatusModal
            isOpen={false}
            onGoToProfile={mockOnGoToProfile}
            profileState="not-started"
          />
        );
      });
    });

    // Verify component returns null (modal is not rendered)
    expect(screen.queryByText('Complete your profile to get started!')).not.toBeInTheDocument();
    
    // Cleanup should have run - overflow should be 'unset' now
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  it('should render with correct button props for not-started state', () => {
    render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="not-started"
      />
    );

    const button = screen.getByText('Go to profile');
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('should render with correct button props for incomplete state', () => {
    render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="incomplete"
      />
    );

    const button = screen.getByText('Go to Profile');
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('should render icon for not-started state', () => {
    const { container } = render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="not-started"
      />
    );

    // Check for SVG icon (the clock icon)
    const svg = container.querySelector('svg[width="24"][height="24"]');
    expect(svg).toBeInTheDocument();
  });

  it('should render icon for incomplete state', () => {
    const { container } = render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="incomplete"
      />
    );

    // Check for SVG icon (the warning icon)
    const svg = container.querySelector('svg[width="24"][height="24"]');
    expect(svg).toBeInTheDocument();
  });

  it('should have correct modal structure and classes', () => {
    const { container } = render(
      <ProfileStatusModal
        isOpen={true}
        onGoToProfile={mockOnGoToProfile}
        profileState="not-started"
      />
    );

    // Check for modal container
    const modalContainer = container.querySelector('.fixed.inset-0.z-50');
    expect(modalContainer).toBeInTheDocument();

    // Check for backdrop
    const backdrop = container.querySelector('.absolute.inset-0');
    expect(backdrop).toBeInTheDocument();

    // Check for modal content
    const modalContent = container.querySelector('.relative.bg-white.rounded-2xl');
    expect(modalContent).toBeInTheDocument();
  });
});

