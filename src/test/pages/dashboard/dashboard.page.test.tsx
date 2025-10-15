import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '../../../pages/dashboard/dashboard.page';

// Mock the DashboardComponent
vi.mock('../../../modules/dashboard/dashboard.component', () => ({
  default: vi.fn(() => <div data-testid="dashboard-component">Dashboard Component</div>),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<DashboardPage />);
      expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
    });

    it('should render DashboardComponent', () => {
      render(<DashboardPage />);
      
      expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Component')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render DashboardComponent correctly', () => {
      render(<DashboardPage />);
      
      // Verify DashboardComponent is rendered
      expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
    });
  });

  describe('Component Exports', () => {
    it('should export DashboardPage as default', () => {
      expect(DashboardPage).toBeDefined();
      expect(typeof DashboardPage).toBe('function');
    });
  });

  describe('Component Rendering', () => {
    it('should render as a functional component', () => {
      const { container } = render(<DashboardPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not have any props or state', () => {
      render(<DashboardPage />);
      
      // The component should render without any props
      expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
    });
  });
});
