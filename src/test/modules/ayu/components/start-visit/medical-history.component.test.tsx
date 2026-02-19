import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MedicalHistory } from '../../../../../modules/ayu/components/start-visit/medical-history/medical-history.component';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: vi.fn(({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )),
}));

vi.mock('../../../../../modules/ayu/components/common/ayu-yes-no-button.component', () => ({
  AyuYesNoButton: vi.fn(({ value, onChange }) => (
    <div data-testid="yes-no-button">
      <button onClick={() => onChange('Yes')}>Yes</button>
      <button onClick={() => onChange('No')}>No</button>
      <span data-testid="current-value">{value || 'null'}</span>
    </div>
  )),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('MedicalHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with header', () => {
      renderWithRouter(<MedicalHistory />);
      expect(screen.getByText('8 questions')).toBeInTheDocument();
      expect(screen.getByText("Please provide the patient's family's medical history")).toBeInTheDocument();
    });

    it('should render all 8 medical conditions', () => {
      renderWithRouter(<MedicalHistory />);
      expect(screen.getByText(/High blood pressure/)).toBeInTheDocument();
      expect(screen.getByText(/Heart problems/)).toBeInTheDocument();
      expect(screen.getByText(/Stroke/)).toBeInTheDocument();
      expect(screen.getByText(/Diabetes/)).toBeInTheDocument();
      expect(screen.getByText(/Asthama/)).toBeInTheDocument();
      expect(screen.getByText(/Cancer\/Tumour/)).toBeInTheDocument();
      expect(screen.getByText(/Operation/)).toBeInTheDocument();
      expect(screen.getByText(/8\. Other/)).toBeInTheDocument();
    });

    it('should render Submit button', () => {
      renderWithRouter(<MedicalHistory />);
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
    });

    it('should render Yes/No buttons for each condition', () => {
      renderWithRouter(<MedicalHistory />);
      const yesNoButtons = screen.getAllByTestId('yes-no-button');
      expect(yesNoButtons).toHaveLength(8);
    });
  });

  describe('Yes/No Button Interactions', () => {
    it('should update condition when Yes is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const yesNoButtons = screen.getAllByTestId('yes-no-button');
      const firstYesButton = yesNoButtons[0].querySelector('button:first-child');

      if (firstYesButton) {
        await user.click(firstYesButton);
      }

      expect(yesNoButtons[0].querySelector('[data-testid="current-value"]')).toHaveTextContent('Yes');
    });

    it('should update condition when No is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const yesNoButtons = screen.getAllByTestId('yes-no-button');
      const firstNoButton = yesNoButtons[0].querySelectorAll('button')[1];

      if (firstNoButton) {
        await user.click(firstNoButton);
      }

      expect(yesNoButtons[0].querySelector('[data-testid="current-value"]')).toHaveTextContent('No');
    });
  });

  describe('Relation Fields', () => {
    it('should show relation options when Stroke is selected as Yes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      // Find Stroke condition (index 2)
      const yesNoButtons = screen.getAllByTestId('yes-no-button');
      const strokeYesButton = yesNoButtons[2].querySelector('button:first-child');

      if (strokeYesButton) {
        await user.click(strokeYesButton);
      }

      // Should show relation buttons
      expect(screen.getByText('Mother')).toBeInTheDocument();
      expect(screen.getByText('Father')).toBeInTheDocument();
      expect(screen.getByText('Sister')).toBeInTheDocument();
    });

    it('should show relation options when Cancer/Tumour is selected as Yes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      // Find Cancer/Tumour condition (index 5)
      const yesNoButtons = screen.getAllByTestId('yes-no-button');
      const cancerYesButton = yesNoButtons[5].querySelector('button:first-child');

      if (cancerYesButton) {
        await user.click(cancerYesButton);
      }

      // Should show relation buttons
      expect(screen.getByText('Mother')).toBeInTheDocument();
      expect(screen.getByText('Father')).toBeInTheDocument();
    });

    it('should show relation options when Other is selected as Yes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      // Find Other condition (index 7)
      const yesNoButtons = screen.getAllByTestId('yes-no-button');
      const otherYesButton = yesNoButtons[7].querySelector('button:first-child');

      if (otherYesButton) {
        await user.click(otherYesButton);
      }

      // Should show relation buttons
      expect(screen.getByText('Mother')).toBeInTheDocument();
      expect(screen.getByText('Father')).toBeInTheDocument();
    });

    it('should not show relation fields for conditions that do not need them', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      // Select High blood pressure (index 0) as Yes
      const yesNoButtons = screen.getAllByTestId('yes-no-button');
      const highBpYesButton = yesNoButtons[0].querySelector('button:first-child');

      if (highBpYesButton) {
        await user.click(highBpYesButton);
      }

      // Should NOT show relation buttons (before clicking other conditions)
      const motherButtons = screen.queryAllByText('Mother');
      expect(motherButtons).toHaveLength(0);
    });
  });

  describe('Describe Illness Field', () => {
    it('should show "Describe illness" field only for Other condition when Yes is selected', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      // Find Other condition (index 7)
      const yesNoButtons = screen.getAllByTestId('yes-no-button');
      const otherYesButton = yesNoButtons[7].querySelector('button:first-child');

      if (otherYesButton) {
        await user.click(otherYesButton);
      }

      // Should show "Describe illness" label
      expect(screen.getByText('Describe illness')).toBeInTheDocument();
    });
  });

  describe('Submit Button', () => {
    it('should call navigate and log data when Submit is clicked', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'log');
      renderWithRouter(<MedicalHistory />);

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      expect(consoleSpy).toHaveBeenCalledWith('Medical History Complete:', expect.any(Array));
      expect(mockNavigate).toHaveBeenCalledWith('/ayu/renders');
    });
  });

  describe('UI Elements', () => {
    it('should render diamond icon with document SVG', () => {
      const { container } = renderWithRouter(<MedicalHistory />);
      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveClass('w-4', 'h-4', 'text-white', '-rotate-45');
    });

    it('should have scrollable container with hidden scrollbar', () => {
      const { container } = renderWithRouter(<MedicalHistory />);
      const scrollContainer = container.querySelector('.hide-scrollbar');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('overflow-y-auto');
    });

    it('should render with emerald background for question cards', () => {
      const { container } = renderWithRouter(<MedicalHistory />);
      const emeraldBg = container.querySelector('.bg-emerald-50');
      expect(emeraldBg).toBeInTheDocument();
    });
  });

  describe('Medical Conditions Structure', () => {
    it('should have 8 conditions in correct order', () => {
      renderWithRouter(<MedicalHistory />);

      const conditions = [
        'High blood pressure',
        'Heart problems',
        'Stroke',
        'Diabetes',
        'Asthama',
        'Cancer/Tumour',
        'Operation',
        'Other',
      ];

      conditions.forEach((condition, index) => {
        expect(screen.getByText(new RegExp(`${index + 1}\\. ${condition}`))).toBeInTheDocument();
      });
    });
  });
});
