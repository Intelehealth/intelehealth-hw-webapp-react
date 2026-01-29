import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AyuGroup } from '../../../../../modules/ayu/components/common/ayu-group.component';
import type { AyuQuestion } from '../../../../../modules/ayu/types/ayu.types';

vi.mock('../../../../../modules/ayu/components/ayu-renderer.component', () => ({
  AyuRenderer: vi.fn(({ question }) => <div data-testid={`renderer-${question.linkId}`}>{question.text}</div>),
}));

describe('AyuGroup', () => {
  const mockChildQuestion1: AyuQuestion = {
    linkId: 'child-1',
    text: 'Child Question 1',
    type: 'string',
  };

  const mockChildQuestion2: AyuQuestion = {
    linkId: 'child-2',
    text: 'Child Question 2',
    type: 'integer',
  };

  const mockChildQuestion3: AyuQuestion = {
    linkId: 'child-3',
    text: 'Child Question 3',
    type: 'choice',
  };

  const mockGroupQuestion: AyuQuestion = {
    linkId: 'group-1',
    text: 'Group Title',
    type: 'group',
    item: [mockChildQuestion1, mockChildQuestion2, mockChildQuestion3],
  };

  describe('Rendering', () => {
    it('should render group with title', () => {
      render(<AyuGroup question={mockGroupQuestion} />);
      expect(screen.getByText('Group Title')).toBeInTheDocument();
    });

    it('should render without title when text is not provided', () => {
      const questionWithoutText: AyuQuestion = {
        ...mockGroupQuestion,
        text: undefined,
      };
      render(<AyuGroup question={questionWithoutText} />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render all child items', () => {
      render(<AyuGroup question={mockGroupQuestion} />);
      expect(screen.getByTestId('renderer-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('renderer-child-2')).toBeInTheDocument();
      expect(screen.getByTestId('renderer-child-3')).toBeInTheDocument();
    });

    it('should render child items in correct order', () => {
      const { container } = render(<AyuGroup question={mockGroupQuestion} />);
      const renderers = container.querySelectorAll('[data-testid^="renderer-"]');
      expect(renderers[0]).toHaveAttribute('data-testid', 'renderer-child-1');
      expect(renderers[1]).toHaveAttribute('data-testid', 'renderer-child-2');
      expect(renderers[2]).toHaveAttribute('data-testid', 'renderer-child-3');
    });

    it('should use linkId as key for child items', () => {
      render(<AyuGroup question={mockGroupQuestion} />);
      expect(screen.getByTestId('renderer-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('renderer-child-2')).toBeInTheDocument();
      expect(screen.getByTestId('renderer-child-3')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should have correct container CSS classes', () => {
      const { container } = render(<AyuGroup question={mockGroupQuestion} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-4', 'bg-gray-50', 'p-4', 'rounded-md', 'border', 'border-gray-200');
    });

    it('should have correct title CSS classes', () => {
      render(<AyuGroup question={mockGroupQuestion} />);
      const title = screen.getByText('Group Title');
      expect(title).toHaveClass('font-semibold', 'text-lg');
      expect(title.tagName).toBe('H3');
    });
  });

  describe('Child Items Handling', () => {
    it('should handle empty item array', () => {
      const questionWithNoItems: AyuQuestion = {
        ...mockGroupQuestion,
        item: [],
      };
      render(<AyuGroup question={questionWithNoItems} />);
      expect(screen.getByText('Group Title')).toBeInTheDocument();
      expect(screen.queryByTestId(/renderer-/)).not.toBeInTheDocument();
    });

    it('should handle undefined item array', () => {
      const questionWithUndefinedItems: AyuQuestion = {
        ...mockGroupQuestion,
        item: undefined,
      };
      render(<AyuGroup question={questionWithUndefinedItems} />);
      expect(screen.getByText('Group Title')).toBeInTheDocument();
      expect(screen.queryByTestId(/renderer-/)).not.toBeInTheDocument();
    });

    it('should handle single child item', () => {
      const singleItemQuestion: AyuQuestion = {
        ...mockGroupQuestion,
        item: [mockChildQuestion1],
      };
      render(<AyuGroup question={singleItemQuestion} />);
      expect(screen.getByTestId('renderer-child-1')).toBeInTheDocument();
      expect(screen.queryByTestId('renderer-child-2')).not.toBeInTheDocument();
    });

    it('should handle many child items', () => {
      const manyItems = Array.from({ length: 10 }, (_, i) => ({
        linkId: `child-${i}`,
        text: `Child ${i}`,
        type: 'string' as const,
      }));
      const manyItemsQuestion: AyuQuestion = {
        ...mockGroupQuestion,
        item: manyItems,
      };
      render(<AyuGroup question={manyItemsQuestion} />);
      for (let i = 0; i < 10; i++) {
        expect(screen.getByTestId(`renderer-child-${i}`)).toBeInTheDocument();
      }
    });
  });

  describe('AyuRenderer Integration', () => {
    it('should pass correct question prop to AyuRenderer', () => {
      render(<AyuGroup question={mockGroupQuestion} />);
      expect(screen.getByText('Child Question 1')).toBeInTheDocument();
      expect(screen.getByText('Child Question 2')).toBeInTheDocument();
      expect(screen.getByText('Child Question 3')).toBeInTheDocument();
    });

    it('should pass parent prop to AyuRenderer', () => {
      render(<AyuGroup question={mockGroupQuestion} />);
      expect(screen.getByTestId('renderer-child-1')).toBeInTheDocument();
    });

    it('should pass previousSibling prop correctly for first child', () => {
      render(<AyuGroup question={mockGroupQuestion} />);
      expect(screen.getByTestId('renderer-child-1')).toBeInTheDocument();
    });

    it('should pass previousSibling prop correctly for subsequent children', () => {
      render(<AyuGroup question={mockGroupQuestion} />);
      expect(screen.getByTestId('renderer-child-2')).toBeInTheDocument();
      expect(screen.getByTestId('renderer-child-3')).toBeInTheDocument();
    });
  });

  describe('Title Display', () => {
    it('should render title as h3 element', () => {
      render(<AyuGroup question={mockGroupQuestion} />);
      const title = screen.getByText('Group Title');
      expect(title.tagName).toBe('H3');
    });

    it('should not render h3 when text is empty string', () => {
      const emptyTextQuestion: AyuQuestion = {
        ...mockGroupQuestion,
        text: '',
      };
      render(<AyuGroup question={emptyTextQuestion} />);
      const h3Elements = screen.queryAllByRole('heading', { level: 3 });
      expect(h3Elements).toHaveLength(0);
    });

    it('should render title with special characters', () => {
      const specialTitleQuestion: AyuQuestion = {
        ...mockGroupQuestion,
        text: 'Title with <special> & "chars"',
      };
      render(<AyuGroup question={specialTitleQuestion} />);
      expect(screen.getByText('Title with <special> & "chars"')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle question with only text, no items', () => {
      const textOnlyQuestion: AyuQuestion = {
        linkId: 'text-only',
        text: 'Text Only Group',
        type: 'group',
      };
      render(<AyuGroup question={textOnlyQuestion} />);
      expect(screen.getByText('Text Only Group')).toBeInTheDocument();
    });

    it('should handle nested group structure', () => {
      const nestedGroupQuestion: AyuQuestion = {
        linkId: 'nested-group',
        text: 'Nested Group',
        type: 'group',
        item: [
          {
            linkId: 'inner-group',
            text: 'Inner Group',
            type: 'group',
            item: [],
          },
        ],
      };
      render(<AyuGroup question={nestedGroupQuestion} />);
      expect(screen.getByText('Nested Group')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should have space-y-4 for vertical spacing between items', () => {
      const { container } = render(<AyuGroup question={mockGroupQuestion} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-4');
    });

    it('should have background and border styling', () => {
      const { container } = render(<AyuGroup question={mockGroupQuestion} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('bg-gray-50', 'border', 'border-gray-200', 'rounded-md');
    });

    it('should have padding', () => {
      const { container } = render(<AyuGroup question={mockGroupQuestion} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('p-4');
    });
  });
});
