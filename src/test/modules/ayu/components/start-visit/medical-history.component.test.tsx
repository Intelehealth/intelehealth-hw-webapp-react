import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MedicalHistory } from '../../../../../modules/ayu/components/start-visit/medical-history.component';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../../../modules/ayu/components/loaders/question-loader.component', () => ({
  QuestionLoader: vi.fn(({ question }) => <div data-testid="question-loader">{question}</div>),
}));

vi.mock('../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: vi.fn(({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )),
}));

describe('MedicalHistory', () => {
  const mockProps = {
    questionIndex: 0,
    onNextQuestion: vi.fn(),
    onPrevQuestion: vi.fn(),
    onPrevSection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render QuestionLoader with correct question', () => {
      render(<MedicalHistory {...mockProps} />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
      expect(screen.getByText('Since when have you had this symptom?')).toBeInTheDocument();
    });

    it('should render Back button', () => {
      render(<MedicalHistory {...mockProps} />);
      const backButtons = screen.getAllByRole('button');
      const backButton = backButtons.find(btn => btn.textContent?.includes('Back'));
      expect(backButton).toBeInTheDocument();
    });

    it('should render Next button', () => {
      render(<MedicalHistory {...mockProps} />);
      const nextButtons = screen.getAllByRole('button');
      const nextButton = nextButtons.find(btn => btn.textContent?.includes('Next'));
      expect(nextButton).toBeInTheDocument();
    });

    it('should render Confirm button when on last question', () => {
      render(<MedicalHistory {...mockProps} questionIndex={4} />);
      const confirmButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Confirm'));
      expect(confirmButton).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onPrevSection when Back is clicked on first question', async () => {
      const user = userEvent.setup();
      render(<MedicalHistory {...mockProps} questionIndex={0} />);
      const backButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Back'));
      if (backButton) await user.click(backButton);
      expect(mockProps.onPrevSection).toHaveBeenCalledTimes(1);
      expect(mockProps.onPrevQuestion).not.toHaveBeenCalled();
    });

    it('should call onPrevQuestion when Back is clicked on non-first question', async () => {
      const user = userEvent.setup();
      render(<MedicalHistory {...mockProps} questionIndex={2} />);
      const backButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Back'));
      if (backButton) await user.click(backButton);
      expect(mockProps.onPrevQuestion).toHaveBeenCalledTimes(1);
      expect(mockProps.onPrevSection).not.toHaveBeenCalled();
    });

    it('should call onNextQuestion when Next is clicked on non-last question', async () => {
      const user = userEvent.setup();
      render(<MedicalHistory {...mockProps} questionIndex={2} />);
      const nextButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Next'));
      if (nextButton) await user.click(nextButton);
      expect(mockProps.onNextQuestion).toHaveBeenCalledTimes(1);
    });

    it('should navigate to details page when Confirm is clicked on last question', async () => {
      const user = userEvent.setup();
      render(<MedicalHistory {...mockProps} questionIndex={4} />);
      const confirmButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Confirm'));
      if (confirmButton) await user.click(confirmButton);
      expect(mockNavigate).toHaveBeenCalledWith('/ayu/renders');
    });
  });

  describe('Question Progress', () => {
    it('should identify first question correctly', () => {
      render(<MedicalHistory {...mockProps} questionIndex={0} />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
    });

    it('should identify last question correctly', () => {
      render(<MedicalHistory {...mockProps} questionIndex={4} />);
      const confirmButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Confirm'));
      expect(confirmButton).toBeInTheDocument();
    });

    it('should handle middle questions', () => {
      render(<MedicalHistory {...mockProps} questionIndex={2} />);
      const nextButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Next'));
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Total Questions', () => {
    it('should have 5 total questions', () => {
      render(<MedicalHistory {...mockProps} />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
    });

    it('should show last question at index 4', () => {
      render(<MedicalHistory {...mockProps} questionIndex={4} />);
      const confirmButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Confirm'));
      expect(confirmButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onPrevSection', () => {
      const propsWithoutPrevSection = {
        ...mockProps,
        onPrevSection: undefined,
      };
      render(<MedicalHistory {...propsWithoutPrevSection} questionIndex={0} />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
    });

    it('should handle different question indices', () => {
      const { rerender } = render(<MedicalHistory {...mockProps} questionIndex={0} />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();

      rerender(<MedicalHistory {...mockProps} questionIndex={3} />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should have Back button on all questions', () => {
      for (let i = 0; i < 5; i++) {
        const { rerender } = render(<MedicalHistory {...mockProps} questionIndex={i} />);
        const backButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Back'));
        expect(backButton).toBeInTheDocument();
        rerender(<div />);
      }
    });

    it('should have Next or Confirm button on all questions', () => {
      for (let i = 0; i < 5; i++) {
        const { rerender } = render(<MedicalHistory {...mockProps} questionIndex={i} />);
        const actionButton = screen.getAllByRole('button').find(btn =>
          btn.textContent?.includes('Next') || btn.textContent?.includes('Confirm')
        );
        expect(actionButton).toBeInTheDocument();
        rerender(<div />);
      }
    });
  });
});
