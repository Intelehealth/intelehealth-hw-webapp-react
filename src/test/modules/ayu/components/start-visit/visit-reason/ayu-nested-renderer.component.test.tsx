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
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [{ valueCoding: { code: 'opt-1', display: 'Parent Option' } }],
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            { question: 'parent-1', operator: '=', answerCoding: { code: 'opt-1' } },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'opt-1' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('Parent Option')).toBeInTheDocument();
    });

    it('should not display parent answer label for string types', () => {
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [{ valueString: 'Parent Option' }],
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'string',
          enableWhen: [
            { question: 'parent-1', operator: '=', answerString: 'Parent Option' },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'Parent Option' }}
          setAnswer={mockSetAnswer}
        />
      );

      // isStringType = true so the emerald label section is suppressed
      expect(screen.queryByText('Parent Option')).not.toBeInTheDocument();
    });

    it('should display the answerOption display when answerCoding code matches', () => {
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [{ valueCoding: { code: 'opt-1', display: 'Option One' } }],
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            { question: 'parent-1', operator: '=', answerCoding: { code: 'opt-1' } },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'opt-1' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('Option One')).toBeInTheDocument();
    });

    it('should display the answerOption valueString when answerString matches', () => {
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [{ valueString: 'yes' }],
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            { question: 'parent-1', operator: '=', answerString: 'yes' },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'yes' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('yes')).toBeInTheDocument();
    });

    it('should render arrow SVG icon for parent label', () => {
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [{ valueString: 'Parent Option' }],
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [
            { question: 'parent-1', operator: '=', answerString: 'Parent Option' },
          ],
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'Parent Option' }}
          setAnswer={mockSetAnswer}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '14');
      expect(svg).toHaveAttribute('height', '14');
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

      expect(mockSetAnswer).toHaveBeenCalledWith(items[0], 'new value');
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
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [{ valueString: 'Parent Option' }],
      };

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
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'Parent Option' }}
          setAnswer={mockSetAnswer}
        />
      );

      const labelContainer = container.querySelector('.text-emerald-600');
      expect(labelContainer).toBeInTheDocument();
      expect(labelContainer).toHaveClass('flex', 'items-center', 'gap-2', 'font-semibold');
    });
  });

  describe('getParentAnswerLabel - Behavior', () => {
    it('should not show label when parentQuestion is not provided', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'Child Question',
          type: 'choice',
          enableWhen: [{ question: 'parent-1', operator: '=', answerString: 'yes' }],
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          answers={{ 'parent-1': 'yes' }}
          setAnswer={mockSetAnswer}
        />
      );

      // No parentQuestion → getParentAnswerLabel returns null → no label rendered
      expect(container.querySelector('.text-emerald-600')).not.toBeInTheDocument();
    });

    it('should show label from valueCoding.display when answerCoding.code matches an option', () => {
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [{ valueCoding: { code: 'code-a', display: 'Option A' } }],
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          type: 'choice',
          enableWhen: [
            { question: 'parent-1', operator: '=', answerCoding: { code: 'code-a' } },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'code-a' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('Option A')).toBeInTheDocument();
    });

    it('should show label from valueString when answerString matches an option', () => {
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [{ valueString: 'Yes Option' }],
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          type: 'choice',
          enableWhen: [
            { question: 'parent-1', operator: '=', answerString: 'Yes Option' },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'Yes Option' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('Yes Option')).toBeInTheDocument();
    });

    it('should not show label when no matching answerOption is found in parentQuestion', () => {
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [{ valueCoding: { code: 'other', display: 'Other' } }],
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          type: 'choice',
          // opt-1 is enabled but parentQ has no option with code 'opt-1'
          enableWhen: [
            { question: 'parent-1', operator: '=', answerCoding: { code: 'opt-1' } },
          ],
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'opt-1' }}
          setAnswer={mockSetAnswer}
        />
      );

      // Item is enabled but no matching option in parentQ → label is null
      expect(container.querySelector('.text-emerald-600')).not.toBeInTheDocument();
    });

    it('should not show label when parentQuestion has no answerOption', () => {
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        // no answerOption
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          type: 'choice',
          enableWhen: [{ question: 'parent-1', operator: '=', answerString: 'yes' }],
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'yes' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(container.querySelector('.text-emerald-600')).not.toBeInTheDocument();
    });

    it('should use answerCoding.code as the lookup key when other enableWhen types are absent', () => {
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [{ valueCoding: { code: 'code-x', display: 'Code X Display' } }],
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          type: 'choice',
          enableWhen: [
            { question: 'parent-1', operator: '=', answerCoding: { code: 'code-x' } },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'code-x' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('Code X Display')).toBeInTheDocument();
    });

    it('should use answerString as the lookup key when answerBoolean is absent', () => {
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [{ valueString: 'answer-text' }],
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          type: 'choice',
          enableWhen: [
            { question: 'parent-1', operator: '=', answerString: 'answer-text' },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'answer-text' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('answer-text')).toBeInTheDocument();
    });

    it('should prefer valueCoding.display over valueString when option has both', () => {
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [
          { valueCoding: { code: 'c1', display: 'Coding Display' }, valueString: 'String Value' },
        ],
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          type: 'choice',
          enableWhen: [
            { question: 'parent-1', operator: '=', answerCoding: { code: 'c1' } },
          ],
        },
      ];

      render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'c1' }}
          setAnswer={mockSetAnswer}
        />
      );

      // valueCoding.display takes priority
      expect(screen.getByText('Coding Display')).toBeInTheDocument();
      expect(screen.queryByText('String Value')).not.toBeInTheDocument();
    });

    it('should not show label for string-type items even when parentQuestion is provided', () => {
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [{ valueString: 'yes' }],
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          type: 'string',
          enableWhen: [
            { question: 'parent-1', operator: '=', answerString: 'yes' },
          ],
        },
      ];

      const { container } = render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': 'yes' }}
          setAnswer={mockSetAnswer}
        />
      );

      // isStringType = true suppresses the label section
      expect(container.querySelector('.text-emerald-600')).not.toBeInTheDocument();
    });

    it('should handle enableWhen with array parent answer via includes check', () => {
      const parentQ: AyuQuestion = {
        linkId: 'parent-q',
        type: 'choice',
        text: 'Parent',
        answerOption: [{ valueCoding: { code: 'opt-a', display: 'Option A' } }],
      };

      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          type: 'choice',
          enableWhen: [
            { question: 'parent-1', operator: '=', answerCoding: { code: 'opt-a' } },
          ],
        },
      ];

      // Array answer: item is enabled because ['opt-a'].includes('opt-a')
      render(
        <AyuNestedRenderer
          items={items}
          parentQuestion={parentQ}
          answers={{ 'parent-1': ['opt-a'] }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(screen.getByText('Option A')).toBeInTheDocument();
    });
  });
});
