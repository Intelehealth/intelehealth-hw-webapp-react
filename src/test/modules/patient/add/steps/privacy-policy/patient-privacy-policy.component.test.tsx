import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientPrivacyPolicyComponent from '../../../../../../modules/patient/add/steps/privacy-policy/patient-privacy-policy.component';

describe('PatientPrivacyPolicyComponent', () => {
  const mockOnNext = vi.fn();
  const mockOnPrev = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });

    it('should render the main heading', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const heading = screen.getByText('Privacy Policy');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('should have correct CSS classes for heading', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const heading = screen.getByText('Privacy Policy');
      expect(heading).toHaveClass(
        'text-lg',
        'font-semibold',
        'text-gray-900',
        'mb-6'
      );
    });
  });

  describe('Content Sections', () => {
    it('should render Personal Information section', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(
        screen.getByText(/Health Worker will collect personal information/)
      ).toBeInTheDocument();
    });

    it('should render Use section', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      expect(screen.getByText('Use')).toBeInTheDocument();
      expect(screen.getByText('Your information is:')).toBeInTheDocument();
    });

    it('should render Use section list items', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      expect(
        screen.getByText(/used for diagnosing and treating you/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/used to send you reminders, prescription information/)
      ).toBeInTheDocument();
    });

    it('should render Protection Measures section', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      expect(screen.getByText('Protection Measures')).toBeInTheDocument();
      expect(
        screen.getByText(
          /We provide physical, electronic, and procedural safeguards/
        )
      ).toBeInTheDocument();
    });

    it('should render Access and Correction section', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      expect(screen.getByText('Access and Correction')).toBeInTheDocument();
      expect(
        screen.getByText(/You have the right to ask for a copy/)
      ).toBeInTheDocument();
    });

    it('should render consent statement', () => {
      const { container } = render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const consentText = container.textContent;
      // Check for the text without the quotes since they might be formatted differently
      expect(consentText).toContain('On clicking');
      expect(consentText).toContain('Accept');
      expect(consentText).toContain('I consent');
    });
  });

  describe('External Links', () => {
    it('should render privacy policy link with correct href', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const link = screen.getByText(
        'https://www.intelehealth.org/privacy-policy'
      );
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        'href',
        'https://www.intelehealth.org/privacy-policy'
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render email link with correct href', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const link = screen.getByText('support@intelehealth.io');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'mailto:support@intelehealth.io');
    });

    it('should have correct CSS classes for links', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const link = screen.getByText(
        'https://www.intelehealth.org/privacy-policy'
      );
      expect(link).toHaveClass('text-indigo-600', 'underline');
    });
  });

  describe('Buttons', () => {
    it('should render Decline button', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const declineButton = screen.getByRole('button', { name: /Decline/i });
      expect(declineButton).toBeInTheDocument();
      expect(declineButton).toHaveAttribute('type', 'button');
    });

    it('should render Accept button', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const acceptButton = screen.getByRole('button', { name: /Accept/i });
      expect(acceptButton).toBeInTheDocument();
      expect(acceptButton).toHaveAttribute('type', 'button');
    });

    it('should call onPrev when Decline button is clicked', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const declineButton = screen.getByRole('button', { name: /Decline/i });
      fireEvent.click(declineButton);
      expect(mockOnPrev).toHaveBeenCalledTimes(1);
      expect(mockOnNext).not.toHaveBeenCalled();
    });

    it('should call onNext with privacyPolicyAccepted: true when Accept button is clicked', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const acceptButton = screen.getByRole('button', { name: /Accept/i });
      fireEvent.click(acceptButton);
      expect(mockOnNext).toHaveBeenCalledTimes(1);
      expect(mockOnNext).toHaveBeenCalledWith({ privacyPolicyAccepted: true });
      expect(mockOnPrev).not.toHaveBeenCalled();
    });
  });

  describe('Layout and Styling', () => {
    it('should have correct container classes', () => {
      const { container } = render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('w-full');
    });

    it('should render sections with correct spacing', () => {
      const { container } = render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBe(4);
      sections.forEach(section => {
        expect(section).toHaveClass('mb-6');
      });
    });

    it('should render button container with flex layout', () => {
      const { container } = render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const buttonContainer = container.querySelector(
        '.flex.flex-col.md\\:flex-row'
      );
      expect(buttonContainer).toBeInTheDocument();
      expect(buttonContainer).toHaveClass(
        'justify-center',
        'gap-3',
        'mt-8'
      );
    });
  });

  describe('Section Headings', () => {
    it('should render all section headings as H2', () => {
      const { container } = render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const h2Headings = container.querySelectorAll('h2');
      expect(h2Headings.length).toBe(4);

      const headingTexts = Array.from(h2Headings).map(h => h.textContent);
      expect(headingTexts).toContain('Personal Information');
      expect(headingTexts).toContain('Use');
      expect(headingTexts).toContain('Protection Measures');
      expect(headingTexts).toContain('Access and Correction');
    });

    it('should have correct CSS classes for section headings', () => {
      const { container } = render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const h2Headings = container.querySelectorAll('h2');
      h2Headings.forEach(heading => {
        expect(heading).toHaveClass(
          'text-base',
          'mb-1',
          'font-semibold'
        );
      });
    });
  });

  describe('Text Content Styling', () => {
    it('should render paragraphs with correct text size', () => {
      const { container } = render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const paragraphs = container.querySelectorAll('p.text-sm');
      expect(paragraphs.length).toBeGreaterThan(0);
    });

    it('should render list with correct classes', () => {
      const { container } = render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const list = container.querySelector('ul');
      expect(list).toHaveClass('list-none', 'text-sm', 'mt-1', 'space-y-1');
    });
  });

  describe('Component Props', () => {
    it('should accept and use onNext prop', () => {
      const customOnNext = vi.fn();
      render(
        <PatientPrivacyPolicyComponent
          onNext={customOnNext}
          onPrev={mockOnPrev}
        />
      );
      const acceptButton = screen.getByRole('button', { name: /Accept/i });
      fireEvent.click(acceptButton);
      expect(customOnNext).toHaveBeenCalled();
    });

    it('should accept and use onPrev prop', () => {
      const customOnPrev = vi.fn();
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={customOnPrev}
        />
      );
      const declineButton = screen.getByRole('button', { name: /Decline/i });
      fireEvent.click(declineButton);
      expect(customOnPrev).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible buttons', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have external links with secure attributes', () => {
      render(
        <PatientPrivacyPolicyComponent
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const externalLink = screen.getByText(
        'https://www.intelehealth.org/privacy-policy'
      );
      expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
