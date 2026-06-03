import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfilePage from '../../../pages/profile/profile.page';
import { BreadcrumbProvider } from '../../../context/BreadcrumbContext';

// Mock the ProfileForm component
vi.mock('../../../modules/profile/profile-form.component', () => ({
  default: vi.fn(() => <div data-testid="profile-form">Profile Form Component</div>),
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<BreadcrumbProvider><ProfilePage /></BreadcrumbProvider>);
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    it('should render ProfileForm component', () => {
      render(<BreadcrumbProvider><ProfilePage /></BreadcrumbProvider>);
      
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
      expect(screen.getByText('Profile Form Component')).toBeInTheDocument();
    });

    it('should have correct CSS classes for layout', () => {
      const { container } = render(<BreadcrumbProvider><ProfilePage /></BreadcrumbProvider>);
      
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv).toHaveClass('h-screen', 'w-full', 'bg-white');
      
      const innerDiv = rootDiv.firstChild as HTMLElement;
      expect(innerDiv).toHaveClass('w-full', 'mt-4');
    });
  });

  describe('Component Integration', () => {
    it('should render ProfileForm correctly', () => {
      render(<BreadcrumbProvider><ProfilePage /></BreadcrumbProvider>);
      
      // Verify ProfileForm is rendered
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    it('should render ProfileForm inside the correct container structure', () => {
      const { container } = render(<BreadcrumbProvider><ProfilePage /></BreadcrumbProvider>);
      
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv).toBeInTheDocument();
      
      const innerDiv = rootDiv.firstChild as HTMLElement;
      expect(innerDiv).toBeInTheDocument();
      
      const profileForm = innerDiv.querySelector('[data-testid="profile-form"]');
      expect(profileForm).toBeInTheDocument();
    });
  });

  describe('Component Exports', () => {
    it('should export ProfilePage as default', () => {
      expect(ProfilePage).toBeDefined();
      expect(typeof ProfilePage).toBe('function');
    });
  });

  describe('Component Rendering', () => {
    it('should render as a functional component', () => {
      const { container } = render(<BreadcrumbProvider><ProfilePage /></BreadcrumbProvider>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not have any props or state', () => {
      render(<BreadcrumbProvider><ProfilePage /></BreadcrumbProvider>);
      
      // The component should render without any props
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    it('should render with correct DOM structure', () => {
      const { container } = render(<BreadcrumbProvider><ProfilePage /></BreadcrumbProvider>);
      
      // Check root div structure
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.tagName).toBe('DIV');
      expect(rootDiv).toHaveClass('h-screen', 'w-full', 'bg-white');
      
      // Check inner div structure
      const innerDiv = rootDiv.firstChild as HTMLElement;
      expect(innerDiv.tagName).toBe('DIV');
      expect(innerDiv).toHaveClass('w-full', 'mt-4');
      
      // Check ProfileForm is inside inner div
      expect(innerDiv.querySelector('[data-testid="profile-form"]')).toBeInTheDocument();
    });
  });
});

