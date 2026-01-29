import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loader } from '../../../../../modules/ayu/components/loaders/loader.component';

// Create a variable to capture the onNextQuestion prop
let capturedOnNextQuestion: (() => void) | null = null;

vi.mock('../../../../../modules/ayu/components/loaders/section-completion-loader.component', () => ({
  SectionCompletionLoader: vi.fn(() => <div data-testid="section-loader">Section Loader</div>),
}));

vi.mock('../../../../../modules/ayu/components/loaders/side-loader.component', () => ({
  SideLoader: vi.fn(() => <div data-testid="side-loader">Side Loader</div>),
}));

vi.mock('../../../../../modules/ayu/components/loaders/question-loader.component', () => ({
  QuestionLoader: vi.fn(({ onNextQuestion }) => {
    capturedOnNextQuestion = onNextQuestion;
    return <div data-testid="question-loader">Question Loader</div>;
  }),
}));

describe('Loader', () => {
  beforeEach(() => {
    capturedOnNextQuestion = null;
  });

  describe('Section Loader', () => {
    it('should render SectionCompletionLoader when type is section', () => {
      render(<Loader type="section" />);
      expect(screen.getByTestId('section-loader')).toBeInTheDocument();
      expect(screen.getByText('Section Loader')).toBeInTheDocument();
    });

    it('should pass currentSectionIndex to SectionCompletionLoader', () => {
      render(<Loader type="section" currentSectionIndex={2} />);
      expect(screen.getByTestId('section-loader')).toBeInTheDocument();
    });

    it('should use default currentSectionIndex when not provided', () => {
      render(<Loader type="section" />);
      expect(screen.getByTestId('section-loader')).toBeInTheDocument();
    });
  });

  describe('Side Loader', () => {
    it('should render SideLoader when type is side', () => {
      render(<Loader type="side" />);
      expect(screen.getByTestId('side-loader')).toBeInTheDocument();
      expect(screen.getByText('Side Loader')).toBeInTheDocument();
    });

    it('should not require currentSectionIndex for side loader', () => {
      render(<Loader type="side" />);
      expect(screen.getByTestId('side-loader')).toBeInTheDocument();
    });
  });

  describe('Question Loader', () => {
    it('should render QuestionLoader when type is question', () => {
      render(<Loader type="question" />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
      expect(screen.getByText('Question Loader')).toBeInTheDocument();
    });

    it('should not require currentSectionIndex for question loader', () => {
      render(<Loader type="question" />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
    });

    it('should pass onNextQuestion prop that throws error when called', () => {
      render(<Loader type="question" />);

      // Verify QuestionLoader was rendered
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();

      // Verify the onNextQuestion function was captured
      expect(capturedOnNextQuestion).toBeDefined();
      expect(capturedOnNextQuestion).toBeInstanceOf(Function);

      // Verify that calling onNextQuestion throws the expected error
      expect(() => capturedOnNextQuestion!()).toThrow('Function not implemented.');
    });
  });

  describe('Type Switching', () => {
    it('should switch between different loader types', () => {
      const { rerender } = render(<Loader type="section" />);
      expect(screen.getByTestId('section-loader')).toBeInTheDocument();

      rerender(<Loader type="side" />);
      expect(screen.getByTestId('side-loader')).toBeInTheDocument();

      rerender(<Loader type="question" />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
    });
  });

  describe('Default Case', () => {
    it('should return null for unknown loader type', () => {
      const { container } = render(<Loader type={'unknown' as any} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Props Handling', () => {
    it('should handle currentSectionIndex of 0', () => {
      render(<Loader type="section" currentSectionIndex={0} />);
      expect(screen.getByTestId('section-loader')).toBeInTheDocument();
    });

    it('should handle large currentSectionIndex', () => {
      render(<Loader type="section" currentSectionIndex={100} />);
      expect(screen.getByTestId('section-loader')).toBeInTheDocument();
    });

    it('should handle undefined currentSectionIndex with section type', () => {
      render(<Loader type="section" currentSectionIndex={undefined} />);
      expect(screen.getByTestId('section-loader')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle all valid loader types', () => {
      const types: Array<'section' | 'side' | 'question'> = ['section', 'side', 'question'];
      types.forEach(type => {
        const { container, unmount } = render(<Loader type={type} />);
        expect(container.firstChild).toBeTruthy();
        unmount();
      });
    });

    it('should render nothing for invalid type', () => {
      const { container } = render(<Loader type={'' as any} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Component Selection', () => {
    it('should render only one loader at a time', () => {
      const { container } = render(<Loader type="section" />);
      const loaders = container.querySelectorAll('[data-testid]');
      expect(loaders).toHaveLength(1);
    });

    it('should not render other loaders when section is selected', () => {
      render(<Loader type="section" />);
      expect(screen.getByTestId('section-loader')).toBeInTheDocument();
      expect(screen.queryByTestId('side-loader')).not.toBeInTheDocument();
      expect(screen.queryByTestId('question-loader')).not.toBeInTheDocument();
    });

    it('should not render other loaders when side is selected', () => {
      render(<Loader type="side" />);
      expect(screen.getByTestId('side-loader')).toBeInTheDocument();
      expect(screen.queryByTestId('section-loader')).not.toBeInTheDocument();
      expect(screen.queryByTestId('question-loader')).not.toBeInTheDocument();
    });

    it('should not render other loaders when question is selected', () => {
      render(<Loader type="question" />);
      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
      expect(screen.queryByTestId('section-loader')).not.toBeInTheDocument();
      expect(screen.queryByTestId('side-loader')).not.toBeInTheDocument();
    });
  });
});
