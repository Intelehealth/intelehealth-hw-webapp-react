import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuthCardTitle from '../../../../modules/auth/common/auth-card-title.component';

describe('AuthCardTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<AuthCardTitle title="Test Title" description="Test Description" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render with required props', () => {
      render(<AuthCardTitle title="Test Title" description="Test Description" />);
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should render with all props including icon', () => {
      render(
        <AuthCardTitle 
          title="Test Title" 
          description="Test Description" 
          icon="test-icon.png" 
        />
      );
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByAltText('icon')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should display title correctly', () => {
      render(<AuthCardTitle title="Custom Title" description="Test Description" />);
      
      const titleElement = screen.getByText('Custom Title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveClass('text-2xl', 'font-bold', 'text-(--color-primary)');
    });

    it('should display description correctly', () => {
      render(<AuthCardTitle title="Test Title" description="Custom Description" />);
      
      const descriptionElement = screen.getByText('Custom Description');
      expect(descriptionElement).toBeInTheDocument();
      expect(descriptionElement).toHaveClass('text-lg', 'text-(--color-primary)', 'mt-2', 'mb-2');
    });

    it('should handle empty title', () => {
      const { container } = render(<AuthCardTitle title="" description="Test Description" />);
      
      const titleElement = container.querySelector('h3');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('');
    });

    it('should handle empty description', () => {
      const { container } = render(<AuthCardTitle title="Test Title" description="" />);
      
      const descriptionElement = container.querySelector('p');
      expect(descriptionElement).toBeInTheDocument();
      expect(descriptionElement).toHaveTextContent('');
    });
  });

  describe('Icon Handling', () => {
    it('should render icon when provided', () => {
      render(
        <AuthCardTitle 
          title="Test Title" 
          description="Test Description" 
          icon="test-icon.png" 
        />
      );
      
      const iconElement = screen.getByAltText('icon');
      expect(iconElement).toBeInTheDocument();
      expect(iconElement).toHaveAttribute('src', 'test-icon.png');
      expect(iconElement).toHaveClass('w-[80px]');
    });

    it('should not render icon when not provided', () => {
      render(<AuthCardTitle title="Test Title" description="Test Description" />);
      
      expect(screen.queryByAltText('icon')).not.toBeInTheDocument();
    });

    it('should handle empty icon string', () => {
      render(
        <AuthCardTitle 
          title="Test Title" 
          description="Test Description" 
          icon="" 
        />
      );
      
      expect(screen.queryByAltText('icon')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have correct container classes', () => {
      const { container } = render(
        <AuthCardTitle title="Test Title" description="Test Description" />
      );
      
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('flex', 'items-center', 'space-x-4', 'w-full');
    });

    it('should have correct text content container classes', () => {
      const { container } = render(
        <AuthCardTitle title="Test Title" description="Test Description" />
      );
      
      const textContainer = container.querySelector('.w-\\[70\\%\\]');
      expect(textContainer).toBeInTheDocument();
    });

    it('should have correct icon container classes', () => {
      const { container } = render(
        <AuthCardTitle 
          title="Test Title" 
          description="Test Description" 
          icon="test-icon.png" 
        />
      );
      
      const iconContainer = container.querySelector('.w-\\[30\\%\\]');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('flex', 'items-center', 'justify-center', 'w-[30%]');
    });
  });

  describe('Component Integration', () => {
    it('should render all elements together correctly', () => {
      render(
        <AuthCardTitle 
          title="Integration Test" 
          description="Testing all components together" 
          icon="integration-icon.png" 
        />
      );
      
      // Check all elements are present
      expect(screen.getByText('Integration Test')).toBeInTheDocument();
      expect(screen.getByText('Testing all components together')).toBeInTheDocument();
      expect(screen.getByAltText('icon')).toBeInTheDocument();
    });

    it('should maintain proper structure without icon', () => {
      const { container } = render(
        <AuthCardTitle title="No Icon Test" description="Testing without icon" />
      );
      
      // Check structure is maintained
      expect(screen.getByText('No Icon Test')).toBeInTheDocument();
      expect(screen.getByText('Testing without icon')).toBeInTheDocument();
      expect(container.querySelector('.w-\\[30\\%\\]')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long title', () => {
      const longTitle = 'This is a very long title that might cause layout issues if not handled properly';
      render(<AuthCardTitle title={longTitle} description="Test Description" />);
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very long description', () => {
      const longDescription = 'This is a very long description that might cause layout issues if not handled properly and should still be displayed correctly';
      render(<AuthCardTitle title="Test Title" description={longDescription} />);
      
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle special characters in title and description', () => {
      render(
        <AuthCardTitle 
          title="Special Chars: !@#$%^&*()" 
          description="Description with émojis 🚀 and symbols" 
        />
      );
      
      expect(screen.getByText('Special Chars: !@#$%^&*()')).toBeInTheDocument();
      expect(screen.getByText('Description with émojis 🚀 and symbols')).toBeInTheDocument();
    });
  });

  describe('Component Exports', () => {
    it('should export AuthCardTitle as default', () => {
      expect(AuthCardTitle).toBeDefined();
      expect(typeof AuthCardTitle).toBe('function');
    });
  });
});
