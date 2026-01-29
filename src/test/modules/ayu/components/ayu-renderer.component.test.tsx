import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AyuRenderer } from '../../../../modules/ayu/components/ayu-renderer.component';
import type { AyuQuestion } from '../../../../modules/ayu/types/ayu.types';

vi.mock('../../../../modules/ayu/pages/decision-matrix', () => ({
  resolveAyuComponent: vi.fn(),
}));

vi.mock('../../../../modules/ayu/pages/component-map', () => ({
  componentMap: {
    'text': vi.fn(({ question }) => <div data-testid="text">{question.text}</div>),
    'number': vi.fn(({ question }) => <div data-testid="number">{question.text}</div>),
    'select': vi.fn(({ question }) => <div data-testid="select">{question.text}</div>),
    'display': vi.fn(({ question }) => <div data-testid="display">{question.text}</div>),
    'group': vi.fn(({ question }) => <div data-testid="group">{question.text}</div>),
    'selectableOptionGroup': vi.fn(({ question }) => <div data-testid="selectableOptionGroup">{question.text}</div>),
  },
}));

import { resolveAyuComponent } from '../../../../modules/ayu/pages/decision-matrix';
import { componentMap } from '../../../../modules/ayu/pages/component-map';

describe('AyuRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockQuestion: AyuQuestion = {
    linkId: 'q1',
    text: 'Test Question',
    type: 'string',
  };

  const mockParent: AyuQuestion = {
    linkId: 'parent-1',
    text: 'Parent Question',
    type: 'group',
    item: [],
  };

  const mockPreviousSibling: AyuQuestion = {
    linkId: 'prev-1',
    text: 'Previous Question',
    type: 'string',
  };

  describe('Component Resolution', () => {
    it('should call resolveAyuComponent with question', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      render(<AyuRenderer question={mockQuestion} />);
      expect(vi.mocked(resolveAyuComponent)).toHaveBeenCalledWith(mockQuestion);
    });

    it('should render the correct component based on resolved type', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      render(<AyuRenderer question={mockQuestion} />);
      expect(screen.getByTestId('text')).toBeInTheDocument();
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    });

    it('should render number-input component', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('number');
      const numberQuestion: AyuQuestion = {
        ...mockQuestion,
        type: 'integer',
      };
      render(<AyuRenderer question={numberQuestion} />);
      expect(screen.getByTestId('number')).toBeInTheDocument();
    });

    it('should render select component', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('select');
      const selectQuestion: AyuQuestion = {
        ...mockQuestion,
        type: 'choice',
      };
      render(<AyuRenderer question={selectQuestion} />);
      expect(screen.getByTestId('select')).toBeInTheDocument();
    });

    it('should render display component', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('display');
      const displayQuestion: AyuQuestion = {
        ...mockQuestion,
        type: 'display',
      };
      render(<AyuRenderer question={displayQuestion} />);
      expect(screen.getByTestId('display')).toBeInTheDocument();
    });

    it('should render group component', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('group');
      const groupQuestion: AyuQuestion = {
        ...mockQuestion,
        type: 'group',
        item: [],
      };
      render(<AyuRenderer question={groupQuestion} />);
      expect(screen.getByTestId('group')).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass question prop to rendered component', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      render(<AyuRenderer question={mockQuestion} />);
      expect(vi.mocked(componentMap)['text']).toHaveBeenCalledWith(
        expect.objectContaining({ question: mockQuestion }),
        undefined
      );
    });

    it('should pass parent prop to rendered component', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      render(<AyuRenderer question={mockQuestion} parent={mockParent} />);
      expect(vi.mocked(componentMap)['text']).toHaveBeenCalledWith(
        expect.objectContaining({
          question: mockQuestion,
          parent: mockParent,
        }),
        undefined
      );
    });

    it('should pass previousSibling prop to rendered component', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      render(
        <AyuRenderer
          question={mockQuestion}
          previousSibling={mockPreviousSibling}
        />
      );
      expect(vi.mocked(componentMap)['text']).toHaveBeenCalledWith(
        expect.objectContaining({
          question: mockQuestion,
          previousSibling: mockPreviousSibling,
        }),
        undefined
      );
    });

    it('should pass all props together', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      render(
        <AyuRenderer
          question={mockQuestion}
          parent={mockParent}
          previousSibling={mockPreviousSibling}
        />
      );
      expect(vi.mocked(componentMap)['text']).toHaveBeenCalledWith(
        expect.objectContaining({
          question: mockQuestion,
          parent: mockParent,
          previousSibling: mockPreviousSibling,
        }),
        undefined
      );
    });

    it('should handle undefined parent', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      render(<AyuRenderer question={mockQuestion} parent={undefined} />);
      expect(vi.mocked(componentMap)['text']).toHaveBeenCalledWith(
        expect.objectContaining({
          question: mockQuestion,
          parent: undefined,
        }),
        undefined
      );
    });

    it('should handle undefined previousSibling', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      render(
        <AyuRenderer question={mockQuestion} previousSibling={undefined} />
      );
      expect(vi.mocked(componentMap)['text']).toHaveBeenCalledWith(
        expect.objectContaining({
          question: mockQuestion,
          previousSibling: undefined,
        }),
        undefined
      );
    });
  });

  describe('Question Type Variations', () => {
    it('should handle string type questions', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      const stringQuestion: AyuQuestion = {
        linkId: 'q1',
        text: 'String Question',
        type: 'string',
      };
      render(<AyuRenderer question={stringQuestion} />);
      expect(screen.getByTestId('text')).toBeInTheDocument();
    });

    it('should handle integer type questions', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('number');
      const integerQuestion: AyuQuestion = {
        linkId: 'q2',
        text: 'Integer Question',
        type: 'integer',
      };
      render(<AyuRenderer question={integerQuestion} />);
      expect(screen.getByTestId('number')).toBeInTheDocument();
    });

    it('should handle choice type questions', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('select');
      const choiceQuestion: AyuQuestion = {
        linkId: 'q3',
        text: 'Choice Question',
        type: 'choice',
      };
      render(<AyuRenderer question={choiceQuestion} />);
      expect(screen.getByTestId('select')).toBeInTheDocument();
    });

    it('should handle display type questions', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('display');
      const displayQuestion: AyuQuestion = {
        linkId: 'q4',
        text: 'Display Text',
        type: 'display',
      };
      render(<AyuRenderer question={displayQuestion} />);
      expect(screen.getByTestId('display')).toBeInTheDocument();
    });

    it('should handle group type questions', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('group');
      const groupQuestion: AyuQuestion = {
        linkId: 'q5',
        text: 'Group Question',
        type: 'group',
        item: [],
      };
      render(<AyuRenderer question={groupQuestion} />);
      expect(screen.getByTestId('group')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle question with minimal properties', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      const minimalQuestion: AyuQuestion = {
        linkId: 'minimal',
        type: 'string',
      };
      render(<AyuRenderer question={minimalQuestion} />);
      expect(screen.getByTestId('text')).toBeInTheDocument();
    });

    it('should handle question with many properties', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      const complexQuestion: AyuQuestion = {
        linkId: 'complex',
        text: 'Complex Question',
        type: 'string',
        required: true,
        readOnly: false,
        answerOption: [],
      };
      render(<AyuRenderer question={complexQuestion} />);
      expect(screen.getByTestId('text')).toBeInTheDocument();
    });

    it('should call resolveAyuComponent only once per render', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      render(<AyuRenderer question={mockQuestion} />);
      expect(vi.mocked(resolveAyuComponent)).toHaveBeenCalledTimes(1);
    });

    it('should re-resolve component type when question changes', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      const { rerender } = render(<AyuRenderer question={mockQuestion} />);
      expect(vi.mocked(resolveAyuComponent)).toHaveBeenCalledTimes(1);

      const newQuestion: AyuQuestion = {
        ...mockQuestion,
        linkId: 'q2',
      };
      rerender(<AyuRenderer question={newQuestion} />);
      expect(vi.mocked(resolveAyuComponent)).toHaveBeenCalledTimes(2);
    });
  });

  describe('Component Map Integration', () => {
    it('should access component from componentMap', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      render(<AyuRenderer question={mockQuestion} />);
      expect(vi.mocked(componentMap)['text']).toHaveBeenCalled();
    });

    it('should use resolved type as key for componentMap', () => {
      const resolvedType = 'number';
      vi.mocked(resolveAyuComponent).mockReturnValue(resolvedType);
      render(<AyuRenderer question={mockQuestion} />);
      expect(vi.mocked(componentMap)[resolvedType]).toHaveBeenCalled();
    });
  });

  describe('Rendering Different Components', () => {
    it('should switch components when question type changes', () => {
      vi.mocked(resolveAyuComponent).mockReturnValue('text');
      const { rerender } = render(<AyuRenderer question={mockQuestion} />);
      expect(screen.getByTestId('text')).toBeInTheDocument();

      vi.mocked(resolveAyuComponent).mockReturnValue('number');
      const numberQuestion: AyuQuestion = {
        ...mockQuestion,
        type: 'integer',
      };
      rerender(<AyuRenderer question={numberQuestion} />);
      expect(screen.getByTestId('number')).toBeInTheDocument();
      expect(screen.queryByTestId('text')).not.toBeInTheDocument();
    });
  });
});
