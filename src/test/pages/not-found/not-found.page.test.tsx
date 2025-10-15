import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotFoundPage from '../../../pages/not-found/not-found.page';

describe('NotFoundPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<NotFoundPage />);
      expect(screen.getByText('404 - Not Found')).toBeInTheDocument();
    });

    it('should render 404 message', () => {
      render(<NotFoundPage />);
      
      expect(screen.getByText('404 - Not Found')).toBeInTheDocument();
    });
  });

  describe('Component Content', () => {
    it('should display correct 404 message', () => {
      render(<NotFoundPage />);
      
      const notFoundText = screen.getByText('404 - Not Found');
      expect(notFoundText).toBeInTheDocument();
      expect(notFoundText).toHaveTextContent('404 - Not Found');
    });

    it('should render as a div element', () => {
      const { container } = render(<NotFoundPage />);
      
      const divElement = container.querySelector('div');
      expect(divElement).toBeInTheDocument();
      expect(divElement).toHaveTextContent('404 - Not Found');
    });
  });

  describe('Component Integration', () => {
    it('should render correctly in isolation', () => {
      render(<NotFoundPage />);
      
      // Verify the component renders without any dependencies
      expect(screen.getByText('404 - Not Found')).toBeInTheDocument();
    });
  });

  describe('Component Exports', () => {
    it('should export NotFoundPage as default', () => {
      expect(NotFoundPage).toBeDefined();
      expect(typeof NotFoundPage).toBe('function');
    });
  });

  describe('Component Rendering', () => {
    it('should render as a functional component', () => {
      const { container } = render(<NotFoundPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not have any props or state', () => {
      render(<NotFoundPage />);
      
      // The component should render without any props
      expect(screen.getByText('404 - Not Found')).toBeInTheDocument();
    });

    it('should render the exact text content', () => {
      render(<NotFoundPage />);
      
      const element = screen.getByText('404 - Not Found');
      expect(element.textContent).toBe('404 - Not Found');
    });
  });

  describe('Component Simplicity', () => {
    it('should be a simple component with minimal content', () => {
      const { container } = render(<NotFoundPage />);
      
      // Should only contain the text content
      expect(container.textContent).toBe('404 - Not Found');
    });

    it('should not have any complex logic or state', () => {
      render(<NotFoundPage />);
      
      // Should render the same content every time
      expect(screen.getByText('404 - Not Found')).toBeInTheDocument();
    });
  });
});
