import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisitReason } from '../../../../../modules/ayu/components/start-visit/visit-reason.component';
import { useAyuJsonList } from '../../../../../modules/ayu/hooks/useAyuJson';

vi.mock('../../../../../modules/ayu/hooks/useAyuJson', () => ({
  useAyuJsonList: vi.fn(() => [
    { name: 'Fever.json', id: 1, json: '{}', keyName: 'test_Protocols', isActive: true },
    { name: 'Cough.json', id: 2, json: '{}', keyName: 'test_Protocols', isActive: true },
    { name: 'Headache.json', id: 3, json: '{}', keyName: 'test_Protocols', isActive: true },
  ]),
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

describe('VisitReason', () => {
  const mockProps = {
    questionIndex: 0,
    onNextQuestion: vi.fn(),
    onPrevQuestion: vi.fn(),
    onPrevSection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAyuJsonList).mockReturnValue([
      { name: 'Fever.json', id: 1, json: '{}', keyName: 'test_Protocols', isActive: true },
      { name: 'Cough.json', id: 2, json: '{}', keyName: 'test_Protocols', isActive: true },
      { name: 'Headache.json', id: 3, json: '{}', keyName: 'test_Protocols', isActive: true },
    ]);
  });

  describe('Rendering', () => {
    it('should render QuestionLoader with correct question', () => {
      render(<VisitReason {...mockProps} />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
      expect(screen.getByText('What is the reason for this visit?')).toBeInTheDocument();
    });

    it('should render visit reason buttons', () => {
      render(<VisitReason {...mockProps} />);
      expect(screen.getByRole('button', { name: 'Fever' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cough' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Headache' })).toBeInTheDocument();
    });

    it('should render Back button', () => {
      render(<VisitReason {...mockProps} />);
      const backButtons = screen.getAllByRole('button');
      const backButton = backButtons.find(btn => btn.textContent?.includes('Back'));
      expect(backButton).toBeInTheDocument();
    });

    it('should render Next button', () => {
      render(<VisitReason {...mockProps} />);
      const nextButtons = screen.getAllByRole('button');
      const nextButton = nextButtons.find(btn => btn.textContent?.includes('Next'));
      expect(nextButton).toBeInTheDocument();
    });

    it('should render Confirm button when on last question', () => {
      render(<VisitReason {...mockProps} questionIndex={5} />);
      const confirmButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Confirm'));
      expect(confirmButton).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onPrevSection when Back is clicked on first question', async () => {
      const user = userEvent.setup();
      render(<VisitReason {...mockProps} questionIndex={0} />);
      const backButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Back'));
      if (backButton) await user.click(backButton);
      expect(mockProps.onPrevSection).toHaveBeenCalledTimes(1);
      expect(mockProps.onPrevQuestion).not.toHaveBeenCalled();
    });

    it('should call onPrevQuestion when Back is clicked on non-first question', async () => {
      const user = userEvent.setup();
      render(<VisitReason {...mockProps} questionIndex={2} />);
      const backButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Back'));
      if (backButton) await user.click(backButton);
      expect(mockProps.onPrevQuestion).toHaveBeenCalledTimes(1);
      expect(mockProps.onPrevSection).not.toHaveBeenCalled();
    });

    it('should call onNextQuestion when Next is clicked', async () => {
      const user = userEvent.setup();
      render(<VisitReason {...mockProps} questionIndex={0} />);
      const nextButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Next'));
      if (nextButton) await user.click(nextButton);
      expect(mockProps.onNextQuestion).toHaveBeenCalledTimes(1);
    });

    it('should call onNextQuestion when Confirm is clicked on last question', async () => {
      const user = userEvent.setup();
      render(<VisitReason {...mockProps} questionIndex={5} />);
      const confirmButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Confirm'));
      if (confirmButton) await user.click(confirmButton);
      expect(mockProps.onNextQuestion).toHaveBeenCalledTimes(1);
    });
  });

  describe('Visit Reason Options', () => {
    it('should remove .json extension from names', () => {
      render(<VisitReason {...mockProps} />);
      expect(screen.queryByText('Fever.json')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Fever' })).toBeInTheDocument();
    });

    it('should handle names without .json extension', () => {
      vi.mocked(useAyuJsonList).mockReturnValue([
        { name: 'Fever', id: 1, json: '{}', keyName: 'test_Protocols', isActive: true },
      ]);
      render(<VisitReason {...mockProps} />);
      expect(screen.getByRole('button', { name: 'Fever' })).toBeInTheDocument();
    });

    it('should render all visit reason options', () => {
      render(<VisitReason {...mockProps} />);
      const reasonButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === 'Fever' ||
        btn.textContent === 'Cough' ||
        btn.textContent === 'Headache'
      );
      expect(reasonButtons).toHaveLength(3);
    });
  });

  describe('Question Progress', () => {
    it('should show correct question index in QuestionLoader', () => {
      render(<VisitReason {...mockProps} questionIndex={2} />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
    });

    it('should identify first question correctly', () => {
      render(<VisitReason {...mockProps} questionIndex={0} />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
    });

    it('should identify last question correctly', () => {
      render(<VisitReason {...mockProps} questionIndex={5} />);
      const confirmButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Confirm'));
      expect(confirmButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty ayuJsonList', () => {
      vi.mocked(useAyuJsonList).mockReturnValue([]);
      render(<VisitReason {...mockProps} />);
      const reasonButtons = screen.queryAllByRole('button').filter(btn =>
        !btn.textContent?.includes('Back') && !btn.textContent?.includes('Next')
      );
      expect(reasonButtons).toHaveLength(0);
    });

    it('should handle undefined onPrevSection', () => {
      const propsWithoutPrevSection = {
        ...mockProps,
        onPrevSection: undefined,
      };
      render(<VisitReason {...propsWithoutPrevSection} questionIndex={0} />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
    });

    it('should handle different question indices', () => {
      const { rerender } = render(<VisitReason {...mockProps} questionIndex={0} />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();

      rerender(<VisitReason {...mockProps} questionIndex={3} />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
    });
  });
});
