import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import AddPatientPage from '../../../pages/add-patient/add-patient.page';

describe('AddPatientPage', () => {
  beforeEach(() => {
    // Clear any mocks if needed
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<AddPatientPage />);
      expect(screen.getByText('Add New Patient')).toBeInTheDocument();
    });

    it('should render the main heading', () => {
      render(<AddPatientPage />);
      
      const heading = screen.getByText('Add New Patient');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('should render the access granted message', () => {
      render(<AddPatientPage />);
      
      expect(screen.getByText('Profile completion verified - Access granted!')).toBeInTheDocument();
    });

    it('should render the protection explanation', () => {
      render(<AddPatientPage />);
      
      expect(screen.getByText(/This page is protected by ProfileRouteGuard/i)).toBeInTheDocument();
      expect(screen.getByText(/Users with incomplete profiles will be redirected to profile page with a modal message/i)).toBeInTheDocument();
    });
  });

  describe('Component Styling', () => {
    it('should have correct CSS classes for root container', () => {
      const { container } = render(<AddPatientPage />);
      
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv).toHaveClass('p-6');
    });

    it('should have correct CSS classes for content card', () => {
      const { container } = render(<AddPatientPage />);
      
      const rootDiv = container.firstChild as HTMLElement;
      const cardDiv = rootDiv.firstChild as HTMLElement;
      expect(cardDiv).toHaveClass('bg-white', 'rounded-lg', 'shadow', 'p-6', 'text-center');
    });

    it('should have correct CSS classes for heading', () => {
      render(<AddPatientPage />);
      
      const heading = screen.getByText('Add New Patient');
      expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-gray-900', 'mb-4');
    });

    it('should have correct CSS classes for access message', () => {
      render(<AddPatientPage />);
      
      const message = screen.getByText('Profile completion verified - Access granted!');
      expect(message).toHaveClass('text-gray-600');
      expect(message.tagName).toBe('P');
    });

    it('should have correct CSS classes for explanation section', () => {
      const { container } = render(<AddPatientPage />);
      
      const explanationDiv = container.querySelector('.mt-6');
      expect(explanationDiv).toBeInTheDocument();
      
      const explanationText = explanationDiv?.querySelector('p');
      expect(explanationText).toHaveClass('text-sm', 'text-gray-500');
    });
  });

  describe('Component Integration', () => {
    it('should render all content elements correctly', () => {
      render(<AddPatientPage />);
      
      // Verify all text content is present
      expect(screen.getByText('Add New Patient')).toBeInTheDocument();
      expect(screen.getByText('Profile completion verified - Access granted!')).toBeInTheDocument();
      expect(screen.getByText(/This page is protected by ProfileRouteGuard/i)).toBeInTheDocument();
    });

    it('should render with correct DOM hierarchy', () => {
      const { container } = render(<AddPatientPage />);
      
      // Check root div structure
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.tagName).toBe('DIV');
      expect(rootDiv).toHaveClass('p-6');
      
      // Check card div structure
      const cardDiv = rootDiv.firstChild as HTMLElement;
      expect(cardDiv.tagName).toBe('DIV');
      expect(cardDiv).toHaveClass('bg-white', 'rounded-lg', 'shadow', 'p-6', 'text-center');
      
      // Check heading is inside card
      const heading = cardDiv.querySelector('h1');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('Add New Patient');
      
      // Check access message is inside card
      const accessMessage = cardDiv.querySelector('p.text-gray-600');
      expect(accessMessage).toBeInTheDocument();
      expect(accessMessage?.textContent).toBe('Profile completion verified - Access granted!');
      
      // Check explanation section is inside card
      const explanationDiv = cardDiv.querySelector('.mt-6');
      expect(explanationDiv).toBeInTheDocument();
    });
  });

  describe('Component Exports', () => {
    it('should export AddPatientPage as default', () => {
      expect(AddPatientPage).toBeDefined();
      expect(typeof AddPatientPage).toBe('function');
    });
  });

  describe('Component Rendering', () => {
    it('should render as a functional component', () => {
      const { container } = render(<AddPatientPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not have any props or state', () => {
      render(<AddPatientPage />);
      
      // The component should render without any props
      expect(screen.getByText('Add New Patient')).toBeInTheDocument();
    });

    it('should render all text content correctly', () => {
      render(<AddPatientPage />);
      
      // Verify all expected text is present
      expect(screen.getByText('Add New Patient')).toBeInTheDocument();
      expect(screen.getByText('Profile completion verified - Access granted!')).toBeInTheDocument();
      expect(screen.getByText(/This page is protected by ProfileRouteGuard/i)).toBeInTheDocument();
      expect(screen.getByText(/Users with incomplete profiles will be redirected to profile page with a modal message/i)).toBeInTheDocument();
    });

    it('should have proper semantic HTML structure', () => {
      const { container } = render(<AddPatientPage />);
      
      // Check for proper heading hierarchy
      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('Add New Patient');
      
      // Check for paragraph elements
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    });
  });
});

