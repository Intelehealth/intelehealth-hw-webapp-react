import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AyuRenderer } from '../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-renderer.component';
import type { AyuQuestion } from '../../../../../../modules/ayu/types/ayu.types';

// Mock the component map and decision matrix
vi.mock('../../../../../../modules/ayu/pages/component-map', () => {
  const mockText = vi.fn(({ question, value, onChange }) => (
    <input
      data-testid="text-component"
      value={value || ''}
      onChange={e => onChange?.(e.target.value)}
      placeholder={question.text}
    />
  ));

  return {
    componentMap: {
      group: vi.fn(({ question }) => (
        <div data-testid="group-component">{question.text}</div>
      )),
      text: mockText,
      select: vi.fn(({ question }) => (
        <select data-testid="select-component">{question.text}</select>
      )),
      number: vi.fn(({ question }) => (
        <input data-testid="number-component" type="number" placeholder={question.text} />
      )),
      date: vi.fn(({ question }) => (
        <input data-testid="date-component" type="date" placeholder={question.text} />
      )),
      display: vi.fn(({ question }) => (
        <div data-testid="display-component">{question.text}</div>
      )),
      'multi-select': vi.fn(({ question }) => (
        <div data-testid="multi-select-component">{question.text}</div>
      )),
      quantity: vi.fn(({ question }) => (
        <div data-testid="quantity-component">{question.text}</div>
      )),
    },
  };
});

vi.mock('../../../../../../modules/ayu/pages/decision-matrix', () => ({
  resolveAyuComponent: vi.fn(),
}));

import { resolveAyuComponent } from '../../../../../../modules/ayu/pages/decision-matrix';
import { componentMap } from '../../../../../../modules/ayu/pages/component-map';

const mockResolveAyuComponent = vi.mocked(resolveAyuComponent);
const mockTextComponent = componentMap.text as ReturnType<typeof vi.fn>;

describe('AyuRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Type Resolution', () => {
    it('should render group component for group type', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Group Question',
        type: 'group',
      };
      mockResolveAyuComponent.mockReturnValue('group');

      render(<AyuRenderer question={question} />);

      expect(mockResolveAyuComponent).toHaveBeenCalledWith(question);
      expect(screen.getByTestId('group-component')).toBeInTheDocument();
      expect(screen.getByText('Group Question')).toBeInTheDocument();
    });

    it('should render text component for text type', () => {
      const question: AyuQuestion = {
        linkId: 'q2',
        text: 'Text Question',
        type: 'string',
      };
      mockResolveAyuComponent.mockReturnValue('text');

      render(<AyuRenderer question={question} />);

      expect(mockResolveAyuComponent).toHaveBeenCalledWith(question);
      expect(screen.getByTestId('text-component')).toBeInTheDocument();
    });

    it('should render select component for select type', () => {
      const question: AyuQuestion = {
        linkId: 'q3',
        text: 'Select Question',
        type: 'choice',
      };
      mockResolveAyuComponent.mockReturnValue('select');

      render(<AyuRenderer question={question} />);

      expect(mockResolveAyuComponent).toHaveBeenCalledWith(question);
      expect(screen.getByTestId('select-component')).toBeInTheDocument();
    });

    it('should render number component for number type', () => {
      const question: AyuQuestion = {
        linkId: 'q4',
        text: 'Number Question',
        type: 'integer',
      };
      mockResolveAyuComponent.mockReturnValue('number');

      render(<AyuRenderer question={question} />);

      expect(mockResolveAyuComponent).toHaveBeenCalledWith(question);
      expect(screen.getByTestId('number-component')).toBeInTheDocument();
    });

    it('should render date component for date type', () => {
      const question: AyuQuestion = {
        linkId: 'q5',
        text: 'Date Question',
        type: 'date',
      };
      mockResolveAyuComponent.mockReturnValue('date');

      render(<AyuRenderer question={question} />);

      expect(mockResolveAyuComponent).toHaveBeenCalledWith(question);
      expect(screen.getByTestId('date-component')).toBeInTheDocument();
    });

    it('should render display component for display type', () => {
      const question: AyuQuestion = {
        linkId: 'q6',
        text: 'Display Text',
        type: 'display',
      };
      mockResolveAyuComponent.mockReturnValue('display');

      render(<AyuRenderer question={question} />);

      expect(mockResolveAyuComponent).toHaveBeenCalledWith(question);
      expect(screen.getByTestId('display-component')).toBeInTheDocument();
    });

    it('should render multi-select component for multi-select type', () => {
      const question: AyuQuestion = {
        linkId: 'q7',
        text: 'Multi Select Question',
        type: 'choice',
        repeats: true,
      };
      mockResolveAyuComponent.mockReturnValue('multi-select');

      render(<AyuRenderer question={question} />);

      expect(mockResolveAyuComponent).toHaveBeenCalledWith(question);
      expect(screen.getByTestId('multi-select-component')).toBeInTheDocument();
    });

    it('should render quantity component for quantity type', () => {
      const question: AyuQuestion = {
        linkId: 'q8',
        text: 'Quantity Question',
        type: 'quantity',
      };
      mockResolveAyuComponent.mockReturnValue('quantity');

      render(<AyuRenderer question={question} />);

      expect(mockResolveAyuComponent).toHaveBeenCalledWith(question);
      expect(screen.getByTestId('quantity-component')).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass question prop to component', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Test Question',
        type: 'string',
      };
      mockResolveAyuComponent.mockReturnValue('text');

      render(<AyuRenderer question={question} />);

      expect(mockTextComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          question: question,
        }),
        undefined
      );
    });

    it('should pass parent prop to component', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Child Question',
        type: 'string',
      };
      const parent: AyuQuestion = {
        linkId: 'parent',
        text: 'Parent Question',
        type: 'group',
      };
      mockResolveAyuComponent.mockReturnValue('text');

      render(<AyuRenderer question={question} parent={parent} />);

      expect(mockTextComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          parent: parent,
        }),
        undefined
      );
    });

    it('should pass previousSibling prop to component', () => {
      const question: AyuQuestion = {
        linkId: 'q2',
        text: 'Second Question',
        type: 'string',
      };
      const previousSibling: AyuQuestion = {
        linkId: 'q1',
        text: 'First Question',
        type: 'string',
      };
      mockResolveAyuComponent.mockReturnValue('text');

      render(<AyuRenderer question={question} previousSibling={previousSibling} />);

      expect(mockTextComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          previousSibling: previousSibling,
        }),
        undefined
      );
    });

    it('should pass value prop to component', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Text Question',
        type: 'string',
      };
      mockResolveAyuComponent.mockReturnValue('text');

      render(<AyuRenderer question={question} value="test value" />);

      expect(mockTextComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'test value',
        }),
        undefined
      );
    });

    it('should pass onChange prop to component', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Text Question',
        type: 'string',
      };
      const mockOnChange = vi.fn();
      mockResolveAyuComponent.mockReturnValue('text');

      render(<AyuRenderer question={question} onChange={mockOnChange} />);

      expect(mockTextComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          onChange: mockOnChange,
        }),
        undefined
      );
    });

    it('should pass all props together to component', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Test Question',
        type: 'string',
      };
      const parent: AyuQuestion = {
        linkId: 'parent',
        text: 'Parent',
        type: 'group',
      };
      const previousSibling: AyuQuestion = {
        linkId: 'sibling',
        text: 'Sibling',
        type: 'string',
      };
      const mockOnChange = vi.fn();
      mockResolveAyuComponent.mockReturnValue('text');

      render(
        <AyuRenderer
          question={question}
          parent={parent}
          previousSibling={previousSibling}
          value="test"
          onChange={mockOnChange}
        />
      );

      expect(mockTextComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          question: question,
          parent: parent,
          previousSibling: previousSibling,
          value: 'test',
          onChange: mockOnChange,
        }),
        undefined
      );
    });
  });

  describe('Value Types', () => {
    beforeEach(() => {
      mockResolveAyuComponent.mockReturnValue('text');
    });

    it('should handle string value', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
      };

      render(<AyuRenderer question={question} value="string value" />);

      const input = screen.getByTestId('text-component') as HTMLInputElement;
      expect(input.value).toBe('string value');
    });

    it('should handle number value', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
      };

      render(<AyuRenderer question={question} value={42} />);

      expect(mockTextComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 42,
        }),
        undefined
      );
    });

    it('should handle boolean value', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
      };

      render(<AyuRenderer question={question} value={true} />);

      expect(mockTextComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          value: true,
        }),
        undefined
      );
    });

    it('should handle object value', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
      };
      const objectValue = { code: 'test', display: 'Test' };

      render(<AyuRenderer question={question} value={objectValue as any} />);

      expect(mockTextComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          value: objectValue,
        }),
        undefined
      );
    });

    it('should handle null value', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
      };

      render(<AyuRenderer question={question} value={null} />);

      expect(mockTextComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          value: null,
        }),
        undefined
      );
    });

    it('should handle undefined value', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
      };

      render(<AyuRenderer question={question} value={undefined} />);

      expect(mockTextComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          value: undefined,
        }),
        undefined
      );
    });
  });

  describe('onChange Callback', () => {
    it('should call onChange with new value', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Text Question',
        type: 'string',
      };
      const mockOnChange = vi.fn();
      mockResolveAyuComponent.mockReturnValue('text');

      render(<AyuRenderer question={question} onChange={mockOnChange} />);

      const input = screen.getByTestId('text-component');
      fireEvent.change(input, { target: { value: 'new value' } });

      expect(mockOnChange).toHaveBeenCalledWith('new value');
    });

    it('should handle onChange being undefined', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Text Question',
        type: 'string',
      };
      mockResolveAyuComponent.mockReturnValue('text');

      expect(() => {
        render(<AyuRenderer question={question} />);
      }).not.toThrow();
    });
  });

  describe('Component Resolution Logic', () => {
    it('should call resolveAyuComponent with the question', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Test',
        type: 'string',
        required: true,
        repeats: false,
      };
      mockResolveAyuComponent.mockReturnValue('text');

      render(<AyuRenderer question={question} />);

      expect(mockResolveAyuComponent).toHaveBeenCalledWith(question);
      expect(mockResolveAyuComponent).toHaveBeenCalledTimes(1);
    });

    it('should use the resolved component type from decision matrix', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'choice',
      };
      mockResolveAyuComponent.mockReturnValue('select');

      render(<AyuRenderer question={question} />);

      expect(screen.getByTestId('select-component')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle question without text', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        type: 'string',
      };
      mockResolveAyuComponent.mockReturnValue('text');

      expect(() => {
        render(<AyuRenderer question={question} />);
      }).not.toThrow();
    });

    it('should handle question with complex nested structure', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent',
        type: 'group',
        item: [
          {
            linkId: 'q1.1',
            text: 'Child',
            type: 'string',
          },
        ],
      };
      mockResolveAyuComponent.mockReturnValue('group');

      expect(() => {
        render(<AyuRenderer question={question} />);
      }).not.toThrow();
    });

    it('should handle question with all optional properties', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Full Question',
        type: 'choice',
        required: true,
        readOnly: false,
        repeats: true,
        enableWhen: [
          {
            question: 'parent',
            operator: '=',
            answerBoolean: true,
          },
        ],
        answerOption: [
          { valueString: 'Option 1' },
          { valueString: 'Option 2' },
        ],
      };
      mockResolveAyuComponent.mockReturnValue('multi-select');

      expect(() => {
        render(<AyuRenderer question={question} />);
      }).not.toThrow();
    });
  });
});
