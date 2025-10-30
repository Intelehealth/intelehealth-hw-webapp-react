import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProfilePage from '../../../pages/profile/profile.page';

// Mock the ProfileForm component
vi.mock('../../../modules/profile/profile-form.component', () => ({
  default: () => <div data-testid="profile-form">Profile Form</div>,
}));

describe('ProfilePage', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(<ProfilePage />);
    }).not.toThrow();
  });

  it('should render the profile form', () => {
    render(<ProfilePage />);
    
    expect(screen.getByTestId('profile-form')).toBeInTheDocument();
  });

  it('should have correct page structure', () => {
    const { container } = render(<ProfilePage />);
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('h-screen', 'w-full', 'bg-white');
  });
});
