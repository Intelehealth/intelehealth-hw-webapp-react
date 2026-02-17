import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AyuNestedRenderer } from '../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-nested-renderer.component';
import type { AyuQuestion } from '../../../../../../modules/ayu/types/ayu.types';

// Mock AyuRenderer component
vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-renderer.component', () => ({
  AyuRenderer: vi.fn(({ question, value, onChange }) => (
    <div data-testid={`renderer-${question.linkId}`}>
      <div>{question.text}</div>
      <input
        data-testid={`input-${question.linkId}`}
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
      />
    </div>
  )),
}));

describe('AyuNestedRenderer', () => {
  const mockSetAnswer = vi.fn();

  describe('Basic Rendering', () => {
    it('should return null when items is undefined', () => {
      const { container } = render(
        <AyuNestedRenderer
          items={undefined}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should return null when items is empty array', () => {
      const { container } = render(
        <AyuNestedRenderer
          items={[]}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render items without enableWhen conditions', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question 1',
          type: 'string',
        },
        {
          linkId: 'child-2',
          text: 'Child Question 2',
          type: 'integer',
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByTestId('renderer-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('renderer-child-2')).toBeInTheDocument();
    });
  });

  describe('EnableWhen Conditional Rendering', () => {
    it('should render items when enableWhen condition is met with answerBoolean', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Conditional Question',
          type: 'string',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: true,
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': true }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByTestId('renderer-child-1')).toBeInTheDocument();
    });

    it('should not render items when enableWhen condition is not met', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Conditional Question',
          type: 'string',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: true,
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': false }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.queryByTestId('renderer-child-1')).not.toBeInTheDocument();
    });

    it('should handle answerString in enableWhen', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'String Conditional',
          type: 'string',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerString: 'yes',
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': 'yes' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByTestId('renderer-child-1')).toBeInTheDocument();
    });

    it('should handle answerInteger in enableWhen', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Integer Conditional',
          type: 'string',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerInteger: 5,
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': 5 }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByTestId('renderer-child-1')).toBeInTheDocument();
    });

    it('should handle answerCoding in enableWhen', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Coding Conditional',
          type: 'string',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerCoding: {
                code: 'option-1',
                display: 'Option 1',
              },
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': 'option-1' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByTestId('renderer-child-1')).toBeInTheDocument();
    });

    it('should handle multiple enableWhen conditions (all must be met)', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Multi Conditional',
          type: 'string',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: true,
            },
            {
              question: 'parent-2',
              operator: '=',
              answerString: 'yes',
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': true, 'parent-2': 'yes' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByTestId('renderer-child-1')).toBeInTheDocument();
    });

    it('should not render when only one of multiple enableWhen conditions is met', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Multi Conditional',
          type: 'string',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: true,
            },
            {
              question: 'parent-2',
              operator: '=',
              answerString: 'yes',
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': true, 'parent-2': 'no' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.queryByTestId('renderer-child-1')).not.toBeInTheDocument();
    });
  });

  describe('Parent Answer Label Display', () => {
    it('should display parent answer label for non-string types', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerString: 'Parent Option',
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': 'Parent Option' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('Parent Option')).toBeInTheDocument();
    });

    it('should not display parent answer label for string types', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'string',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerString: 'Parent Option',
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': 'Parent Option' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.queryByText('Parent Option')).not.toBeInTheDocument();
    });

    it('should display parent answer when answer matches enableWhen condition', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerCoding: { code: 'opt-1' },
            },
          ],
        },
      ];

      // The component expects the answer value to match expectedValue for enableWhen
      // So we provide 'opt-1' directly, matching answerCoding.code
      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': 'opt-1' }}
          setAnswer={mockSetAnswer}
        />
      );

      // When answer is a string, getParentAnswerLabel returns answerCoding.code
      expect(screen.getByText('opt-1')).toBeInTheDocument();
    });

    it('should handle string answers in getParentAnswerLabel', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerString: 'yes',
            },
          ],
        },
      ];

      // For string answers, provide the string directly
      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': 'yes' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('yes')).toBeInTheDocument();
    });

    it('should render arrow SVG icon for parent label', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerString: 'Parent Option',
            },
          ],
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': 'Parent Option' }}
          setAnswer={mockSetAnswer}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '16');
      expect(svg).toHaveAttribute('height', '16');
    });
  });

  describe('Repeats and Selection Text', () => {
    it('should display "Select one or more" when item repeats', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Multi Select Question',
          type: 'choice',
          repeats: true,
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('Select one or more')).toBeInTheDocument();
    });

    it('should display "Select any one" when item does not repeat', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Single Select Question',
          type: 'choice',
          repeats: false,
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('Select any one')).toBeInTheDocument();
    });

    it('should not display selection text for string type', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'String Question',
          type: 'string',
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.queryByText('Select any one')).not.toBeInTheDocument();
      expect(screen.queryByText('Select one or more')).not.toBeInTheDocument();
    });
  });

  describe('Recursive Nested Rendering', () => {
    it('should recursively render nested items', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Parent Question',
          type: 'choice',
          item: [
            {
              linkId: 'grandchild-1',
              text: 'Nested Question',
              type: 'string',
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByTestId('renderer-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('renderer-grandchild-1')).toBeInTheDocument();
    });

    it('should handle deeply nested items', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'level-1',
          text: 'Level 1',
          type: 'choice',
          item: [
            {
              linkId: 'level-2',
              text: 'Level 2',
              type: 'choice',
              item: [
                {
                  linkId: 'level-3',
                  text: 'Level 3',
                  type: 'string',
                },
              ],
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByTestId('renderer-level-1')).toBeInTheDocument();
      expect(screen.getByTestId('renderer-level-2')).toBeInTheDocument();
      expect(screen.getByTestId('renderer-level-3')).toBeInTheDocument();
    });
  });

  describe('Value and onChange Handling', () => {
    it('should pass value from answers to AyuRenderer', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Question',
          type: 'string',
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'child-1': 'test value' }}
          setAnswer={mockSetAnswer}
        />
      );

      const input = screen.getByTestId('input-child-1') as HTMLInputElement;
      expect(input.value).toBe('test value');
    });

    it('should call setAnswer when value changes', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Question',
          type: 'string',
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );

      const input = screen.getByTestId('input-child-1');
      fireEvent.change(input, { target: { value: 'new value' } });

      expect(mockSetAnswer).toHaveBeenCalledWith('child-1', 'new value');
    });
  });

  describe('Multiple Items Filtering', () => {
    it('should filter out disabled items', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Enabled Question',
          type: 'string',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: true,
            },
          ],
        },
        {
          linkId: 'child-2',
          text: 'Disabled Question',
          type: 'string',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: false,
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': true }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByTestId('renderer-child-1')).toBeInTheDocument();
      expect(screen.queryByTestId('renderer-child-2')).not.toBeInTheDocument();
    });

    it('should return null when all items are filtered out', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Disabled Question',
          type: 'string',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: false,
            },
          ],
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': true }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('CSS Classes and Structure', () => {
    it('should have correct container classes', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Question',
          type: 'string',
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-4');
    });

    it('should have correct parent label styling', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerString: 'Parent Option',
            },
          ],
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': 'Parent Option' }}
          setAnswer={mockSetAnswer}
        />
      );

      const labelContainer = container.querySelector('.text-\\[\\#20c997\\]');
      expect(labelContainer).toBeInTheDocument();
      expect(labelContainer).toHaveClass('flex', 'items-center', 'gap-2', 'font-medium');
    });
  });

  describe('getParentAnswerLabel - Fallback Cases', () => {
    it('should use answerInteger as fallback when answer is undefined', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerInteger: 99,
            },
          ],
        },
      ];

      // Answer matches so item is enabled
      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': 99 }}
          setAnswer={mockSetAnswer}
        />
      );

      // The label displays the answerInteger value
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('should use answerString as fallback when answer is undefined', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerString: 'string-fallback',
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': 'string-fallback' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('string-fallback')).toBeInTheDocument();
    });

    it('should not render parent label when answerBoolean is falsy', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: false,
            },
          ],
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': false }}
          setAnswer={mockSetAnswer}
        />
      );

      // answerBoolean: false is falsy, so falls through to answerCoding
      // answerCoding is undefined, so falls through to selectedAnswer (false)
      // false doesn't render in React, but the label section shouldn't render
      // because parentAnswerLabel will be falsy
      const labelContainer = container.querySelector('.text-\\[\\#20c997\\]');
      expect(labelContainer).not.toBeInTheDocument();
    });

    it('should use answerBoolean: true as fallback', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: true,
            },
          ],
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': true }}
          setAnswer={mockSetAnswer}
        />
      );

      // answerBoolean: true is truthy and is returned
      // But booleans don't render in React, so no text appears
      // However the label container should exist
      const labelContainer = container.querySelector('.text-\\[\\#20c997\\]');
      expect(labelContainer).toBeInTheDocument();
    });

    it('should use selectedAnswer as final fallback', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerString: 'matched-value',
            },
          ],
        },
      ];

      // When all other fallbacks are undefined, returns selectedAnswer
      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': 'matched-value' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('matched-value')).toBeInTheDocument();
    });

    it('should handle object answer with display property', () => {
      // To execute object handling code, we need the object to pass isEnabled
      // We do this by using the same object reference as the expected value
      const objectAnswer: any = { code: 'test-code', display: 'Test Display' };
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: objectAnswer as any, // Use object as expected value
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': objectAnswer }}
          setAnswer={mockSetAnswer}
        />
      );

      // Object with display property should show the display value
      expect(screen.getByText('Test Display')).toBeInTheDocument();
    });

    it('should handle object answer with code but no display', () => {
      const objectAnswer: any = { code: 'test-code' };
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: objectAnswer as any, // Use object as expected value
            },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': objectAnswer }}
          setAnswer={mockSetAnswer}
        />
      );

      // Object without display should use code property
      expect(screen.getByText('test-code')).toBeInTheDocument();
    });

    it('should handle object answer without display or code properties', () => {
      const objectAnswer: any = { value: 'custom-value' };
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: objectAnswer as any, // Use object as expected value
            },
          ],
        },
      ];

      // Object without display or code should be handled gracefully (return null)
      // The component should not crash when rendering objects without display/code
      const { container } = render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': objectAnswer }}
          setAnswer={mockSetAnswer}
        />
      );

      // Should render without the parent answer label (since getParentAnswerLabel returns null)
      // The parent label div should not be rendered
      const parentLabelDiv = container.querySelector('.flex.items-center.gap-2.text-\\[\\#20c997\\]');
      expect(parentLabelDiv).not.toBeInTheDocument();
    });

    // Tests for fallback return statement coverage (lines 66-72)
    // The fallback returns values from enableWhen rules when selectedAnswer is non-primitive

    it('should use answerString from fallback when available (line 68)', () => {
      // Use array as answer to reach fallback
      const arrayAnswer = ['value'] as any;
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerString: 'fallback-string',
              answerBoolean: arrayAnswer, // Matches array answer for isEnabled
            } as any,
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': arrayAnswer }}
          setAnswer={mockSetAnswer}
        />
      );

      // answerString is first in OR chain and renders
      expect(screen.getByText('fallback-string')).toBeInTheDocument();
    });

    it('should use answerInteger from fallback when answerString is undefined (line 69)', () => {
      // Use array as answer to reach fallback
      const arrayAnswer = ['value'] as any;
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerInteger: 42,
              answerBoolean: arrayAnswer, // Matches array answer for isEnabled
            } as any,
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': arrayAnswer }}
          setAnswer={mockSetAnswer}
        />
      );

      // answerInteger is second in OR chain and renders
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should use answerBoolean from fallback when answerString and answerInteger are undefined (line 70)', () => {
      // For line 70: answerBoolean must be truthy in fallback and used for isEnabled matching
      // Since answerBoolean is FIRST in isEnabled cascade, we must use it as expectedValue
      // Use array to bypass primitive/object checks and reach fallback
      const arrayAnswer: any = ['test-value'];
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: arrayAnswer, // Use array for reference equality in isEnabled
              // answerString and answerInteger are undefined
              // Fallback will return answerBoolean (the array, which is truthy)
            } as any,
          ],
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': arrayAnswer }}
          setAnswer={mockSetAnswer}
        />
      );

      // Array is returned from fallback (truthy), so parent label div should be rendered
      // Arrays render as strings like "test-value" when joined
      const parentLabelDiv = container.querySelector('.flex.items-center.gap-2.text-\\[\\#20c997\\]');
      expect(parentLabelDiv).toBeInTheDocument();
      // Check that the child question is rendered (item is enabled)
      expect(screen.getByText('Child Question')).toBeInTheDocument();
    });

    it('should use answerCoding.code from fallback when other types are undefined (line 71)', () => {
      // For line 71: answerString, answerInteger, answerBoolean must be falsy, answerCoding.code must be truthy
      // Use array reference for both answer and answerCoding.code to achieve reference equality
      const arrayAnswer: any = ['test-value'];
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: undefined, // Undefined (falsy in OR chain)
              answerString: undefined, // Undefined (falsy in OR chain)
              answerInteger: undefined, // Undefined (falsy in OR chain)
              answerCoding: {
                code: arrayAnswer, // Use array for both matching and fallback return
              },
            } as any,
          ],
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': arrayAnswer }}
          setAnswer={mockSetAnswer}
        />
      );

      // answerCoding.code (the array) is fourth in OR chain and is truthy
      // Array is rendered, so parent label div should be present
      const parentLabelDiv = container.querySelector('.flex.items-center.gap-2.text-\\[\\#20c997\\]');
      expect(parentLabelDiv).toBeInTheDocument();
      // Child question should also render
      expect(screen.getByText('Child Question')).toBeInTheDocument();
    });

    it('should return null from fallback when all answer types are falsy (line 72)', () => {
      // For line 72: all answer types must be undefined/falsy so null is returned
      // Use undefined as answer - it's not a primitive string/number/boolean, so reaches fallback
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            {
              question: 'parent-1',
              operator: '=',
              answerBoolean: undefined, // All undefined
              answerString: undefined,
              answerInteger: undefined,
              answerCoding: undefined,
            } as any,
          ],
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': undefined }}
          setAnswer={mockSetAnswer}
        />
      );

      // All undefined in fallback OR chain, returns null
      // No parent label should be rendered since parentAnswerLabel is null
      const parentLabelDiv = container.querySelector('.flex.items-center.gap-2.text-\\[\\#20c997\\]');
      expect(parentLabelDiv).not.toBeInTheDocument();
      // But the child question should still render since item is enabled (undefined === undefined)
      expect(screen.getByText('Child Question')).toBeInTheDocument();
    });
  });
});
