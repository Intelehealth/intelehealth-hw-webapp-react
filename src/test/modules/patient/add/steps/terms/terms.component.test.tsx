import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientTermsComponent from '../../../../../../modules/patient/add/steps/terms/terms.component';

describe('PatientTermsComponent', () => {
  const mockOnNext = vi.fn();
  const mockOnPrev = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText('Processing Personal Data')
      ).toBeInTheDocument();
    });

    it('should render the main heading', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const heading = screen.getByText('Processing Personal Data');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('should have correct CSS classes for heading', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const heading = screen.getByText('Processing Personal Data');
      expect(heading).toHaveClass(
        'text-lg',
        'font-semibold',
        'text-gray-900',
        'mb-6'
      );
    });
  });

  describe('Introduction Text', () => {
    it('should render introductory paragraph', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(
          /Please read through the following statements and signify your consent/
        )
      ).toBeInTheDocument();
    });

    it('should have correct CSS classes for intro text', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const intro = screen.getByText(
        /Please read through the following statements and signify your consent/
      );
      expect(intro).toHaveClass('text-sm', 'mb-6');
    });
  });

  describe('Terms List', () => {
    it('should render all 13 terms points', () => {
      const { container } = render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBe(13);
    });

    it('should render term 1 about availing teleconsultation services', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/I am availing teleconsultation services/)
      ).toBeInTheDocument();
    });

    it('should render term 2 about personal data collection', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/RMP, health worker, and Intelehealth will ask/)
      ).toBeInTheDocument();
    });

    it('should render term 3 about data processing', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/Additionally, my personal data collected shall be processed/)
      ).toBeInTheDocument();
    });

    it('should render term 4 about anonymization', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(
          /Further, my personal data will be deidentified or anonymized/
        )
      ).toBeInTheDocument();
    });

    it('should render term 5 about terms of use and privacy policy', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(
          /The details of what and how my personal data would be processed/
        )
      ).toBeInTheDocument();
    });

    it('should render term 6 about notes and documents', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/Intelehealth, RMP, health worker may make notes/)
      ).toBeInTheDocument();
    });

    it('should render term 7 about right to access and rectify', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/I shall have a right to access, review, and rectify/)
      ).toBeInTheDocument();
    });

    it('should render term 8 about right to receive copy', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/I shall have a right to receive a copy of my personal data/)
      ).toBeInTheDocument();
    });

    it('should render term 9 about right to withdraw consent', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/I shall have a right to withdraw your consent/)
      ).toBeInTheDocument();
    });

    it('should render term 10 about processing per applicable law', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/Processing of my personal data will be as per applicable law/)
      ).toBeInTheDocument();
    });

    it('should render term 11 about no disclosure without consent', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/No information in an identifiable format will be disclosed/)
      ).toBeInTheDocument();
    });

    it('should render term 12 about safeguards', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/Intelehealth provides physical, electronic, and procedural safeguards/)
      ).toBeInTheDocument();
    });

    it('should render term 13 about reaching out with queries', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/I can reach out to Intelehealth if I have any queries/)
      ).toBeInTheDocument();
    });

    it('should have correct CSS classes for list', () => {
      const { container } = render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const list = container.querySelector('ul');
      expect(list).toHaveClass(
        'list-decimal',
        'list-inside',
        'text-sm',
        'mt-1',
        'space-y-1'
      );
    });

    it('should have correct spacing for list items', () => {
      const { container } = render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const listItems = container.querySelectorAll('li');
      listItems.forEach(item => {
        expect(item).toHaveClass('mb-5');
      });
    });
  });

  describe('Consent Section', () => {
    it('should render consent heading', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(screen.getByText('Concent:')).toBeInTheDocument();
    });

    it('should render consent statement', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/I have read and understood the notice for consent/)
      ).toBeInTheDocument();
    });

    it('should have correct CSS classes for consent heading', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const heading = screen.getByText('Concent:');
      expect(heading).toHaveClass('text-base', 'mb-1', 'font-semibold');
    });

    it('should have correct CSS classes for consent text', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const consentText = screen.getByText(
        /I have read and understood the notice for consent/
      );
      expect(consentText).toHaveClass('text-sm');
    });
  });

  describe('Buttons', () => {
    it('should render Decline button', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const declineButton = screen.getByRole('button', { name: /Decline/i });
      expect(declineButton).toBeInTheDocument();
      expect(declineButton).toHaveAttribute('type', 'button');
    });

    it('should render Accept button', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const acceptButton = screen.getByRole('button', { name: /Accept/i });
      expect(acceptButton).toBeInTheDocument();
      expect(acceptButton).toHaveAttribute('type', 'button');
    });

    it('should call onPrev when Decline button is clicked', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const declineButton = screen.getByRole('button', { name: /Decline/i });
      fireEvent.click(declineButton);
      expect(mockOnPrev).toHaveBeenCalledTimes(1);
      expect(mockOnNext).not.toHaveBeenCalled();
    });

    it('should call onNext with termsAccepted: true when Accept button is clicked', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const acceptButton = screen.getByRole('button', { name: /Accept/i });
      fireEvent.click(acceptButton);
      expect(mockOnNext).toHaveBeenCalledTimes(1);
      expect(mockOnNext).toHaveBeenCalledWith({ termsAccepted: true });
      expect(mockOnPrev).not.toHaveBeenCalled();
    });
  });

  describe('Layout and Styling', () => {
    it('should have correct root container classes', () => {
      const { container } = render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('w-full', 'flex', 'flex-col', 'h-full');
    });

    it('should render button container with flex layout', () => {
      const { container } = render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const buttonContainer = container.querySelector(
        '.flex.flex-col.md\\:flex-row'
      );
      expect(buttonContainer).toBeInTheDocument();
      expect(buttonContainer).toHaveClass('justify-center', 'gap-3', 'pb-6');
    });

    it('should render sections with correct spacing', () => {
      const { container } = render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const sections = container.querySelectorAll('section');
      sections.forEach(section => {
        expect(section).toHaveClass('mb-6');
      });
    });
  });

  describe('Component Props', () => {
    it('should accept and use onNext prop', () => {
      const customOnNext = vi.fn();
      render(
        <PatientTermsComponent onNext={customOnNext} onPrev={mockOnPrev} />
      );
      const acceptButton = screen.getByRole('button', { name: /Accept/i });
      fireEvent.click(acceptButton);
      expect(customOnNext).toHaveBeenCalled();
    });

    it('should accept and use onPrev prop', () => {
      const customOnPrev = vi.fn();
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={customOnPrev} />
      );
      const declineButton = screen.getByRole('button', { name: /Decline/i });
      fireEvent.click(declineButton);
      expect(customOnPrev).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible buttons', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should render heading hierarchy correctly', () => {
      const { container } = render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      const h1 = container.querySelector('h1');
      const h2 = container.querySelector('h2');
      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
    });
  });

  describe('Content Verification', () => {
    it('should mention support email', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/support@intelehealth.org/)
      ).toBeInTheDocument();
    });

    it('should mention terms of use URL', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/www.intelehealth.org\/terms-of-use\//)
      ).toBeInTheDocument();
    });

    it('should mention privacy policy URL', () => {
      render(
        <PatientTermsComponent onNext={mockOnNext} onPrev={mockOnPrev} />
      );
      expect(
        screen.getByText(/www.intelehealth.org\/privacy-policy/)
      ).toBeInTheDocument();
    });
  });
});
