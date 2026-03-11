import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MedicalHistory } from '../../../../../../modules/ayu/components/start-visit/medical-history/medical-history.component';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: vi.fn(({ children, onClick, leftIcon, ...props }) => (
    <button onClick={onClick} {...props}>
      {leftIcon}
      {children}
    </button>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/common/ayu-selectable-option.component', () => ({
  AyuSelectableOption: vi.fn(({ label, value, selected, onClick }) => (
    <button
      data-testid={`selectable-${value}`}
      data-selected={selected}
      onClick={onClick}
    >
      {label}
    </button>
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
      expect(screen.getByText("Please provide the patient's family's medical history")).toBeInTheDocument();
      expect(screen.getByText('Select yes or no')).toBeInTheDocument();
      expect(screen.getByText('8 questions')).toBeInTheDocument();
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

    it('should render Yes and No buttons for each condition', () => {
      renderWithRouter(<MedicalHistory />);
      const yesButtons = screen.getAllByRole('button', { name: /Yes/i });
      const noButtons = screen.getAllByRole('button', { name: /No/i });
      expect(yesButtons).toHaveLength(8);
      expect(noButtons).toHaveLength(8);
    });
  });

  describe('Yes/No Button Interactions', () => {
    it('should show relation options when Yes is clicked on Stroke', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const yesButtons = screen.getAllByRole('button', { name: /Yes/i });
      // Stroke is index 2
      await user.click(yesButtons[2]);

      expect(screen.getByTestId('selectable-Mother')).toBeInTheDocument();
      expect(screen.getByTestId('selectable-Father')).toBeInTheDocument();
    });

    it('should not show relation fields when No is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const noButtons = screen.getAllByRole('button', { name: /No/i });
      // Click No on Stroke
      await user.click(noButtons[2]);

      expect(screen.queryByTestId('selectable-Mother')).not.toBeInTheDocument();
    });
  });

  describe('Relation Fields', () => {
    it('should show relation options when Stroke is selected as Yes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const yesButtons = screen.getAllByRole('button', { name: /Yes/i });
      await user.click(yesButtons[2]);

      expect(screen.getByText('Mother')).toBeInTheDocument();
      expect(screen.getByText('Father')).toBeInTheDocument();
      expect(screen.getByText('Sister')).toBeInTheDocument();
    });

    it('should show relation options when Cancer/Tumour is selected as Yes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const yesButtons = screen.getAllByRole('button', { name: /Yes/i });
      await user.click(yesButtons[5]);

      expect(screen.getByText('Mother')).toBeInTheDocument();
      expect(screen.getByText('Father')).toBeInTheDocument();
    });

    it('should show relation options when Other is selected as Yes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const yesButtons = screen.getAllByRole('button', { name: /Yes/i });
      await user.click(yesButtons[7]);

      expect(screen.getByText('Mother')).toBeInTheDocument();
      expect(screen.getByText('Father')).toBeInTheDocument();
    });

    it('should not show relation fields for conditions that do not need them', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const yesButtons = screen.getAllByRole('button', { name: /Yes/i });
      // High blood pressure (index 0) does not need relation
      await user.click(yesButtons[0]);

      const motherButtons = screen.queryAllByText('Mother');
      expect(motherButtons).toHaveLength(0);
    });
  });

  describe('Describe Relation Field', () => {
    it('should show "Describe relation" input when Other relation is selected for Stroke', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const yesButtons = screen.getAllByRole('button', { name: /Yes/i });
      await user.click(yesButtons[2]);

      await user.click(screen.getByTestId('selectable-Other'));

      expect(screen.getByText('Describe relation')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Grandfather')).toBeInTheDocument();
    });

    it('should update describeRelation state when typing in the input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const yesButtons = screen.getAllByRole('button', { name: /Yes/i });
      await user.click(yesButtons[2]);

      await user.click(screen.getByTestId('selectable-Other'));

      const input = screen.getByPlaceholderText('Grandfather');
      await user.type(input, 'Uncle');

      expect(input).toHaveValue('Uncle');
    });

    it('should not show "Describe relation" when a non-Other relation is selected', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const yesButtons = screen.getAllByRole('button', { name: /Yes/i });
      await user.click(yesButtons[2]);

      await user.click(screen.getByTestId('selectable-Mother'));

      expect(screen.queryByText('Describe relation')).not.toBeInTheDocument();
    });
  });

  describe('Describe Illness Field', () => {
    it('should show "Describe illness" field only for Other condition when Yes is selected', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const yesButtons = screen.getAllByRole('button', { name: /Yes/i });
      await user.click(yesButtons[7]);

      expect(screen.getByText('Describe illness')).toBeInTheDocument();
    });

    it('should update describeIllness state when typing in the input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const yesButtons = screen.getAllByRole('button', { name: /Yes/i });
      await user.click(yesButtons[7]);

      await user.click(screen.getByTestId('selectable-Other'));

      const inputs = screen.getAllByPlaceholderText('Grandfather');
      const describeIllnessInput = inputs[1];
      await user.type(describeIllnessInput, 'Hypertension');

      expect(describeIllnessInput).toHaveValue('Hypertension');
    });
  });

  describe('Submit Button', () => {
    it('should navigate to /visit-summary when Submit is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MedicalHistory />);

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      expect(mockNavigate).toHaveBeenCalledWith('/visit-summary');
    });
  });

  describe('UI Elements', () => {
    it('should have emerald background container', () => {
      const { container } = renderWithRouter(<MedicalHistory />);
      const emeraldBg = container.querySelector('.bg-emerald-50');
      expect(emeraldBg).toBeInTheDocument();
    });

    it('should have rounded-xl container matching associated symptoms style', () => {
      const { container } = renderWithRouter(<MedicalHistory />);
      const roundedContainer = container.querySelector('.rounded-xl');
      expect(roundedContainer).toBeInTheDocument();
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
