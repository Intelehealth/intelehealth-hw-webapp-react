import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { SectionCompletionLoader } from '../../../../../modules/ayu/components/loaders/section-completion-loader.component';
import type { SectionProgress } from '../../../../../modules/ayu/components/loaders/loader.types';

describe('SectionCompletionLoader', () => {
  const mockSections: SectionProgress[] = [
    { totalQuestions: 10, answeredQuestions: 5 },
    { totalQuestions: 8, answeredQuestions: 0 },
    { totalQuestions: 6, answeredQuestions: 0 },
    { totalQuestions: 5, answeredQuestions: 0 },
  ];

  describe('Rendering', () => {
    it('should render correct number of section bars', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={0}
          currentQuestionIndex={0}
        />
      );
      const bars = container.querySelectorAll('.flex-1');
      expect(bars).toHaveLength(4);
    });

    it('should render single section', () => {
      const singleSection: SectionProgress[] = [
        { totalQuestions: 5, answeredQuestions: 0 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={singleSection}
          currentSectionIndex={0}
          currentQuestionIndex={0}
        />
      );
      const bars = container.querySelectorAll('.flex-1');
      expect(bars).toHaveLength(1);
    });

    it('should render multiple sections', () => {
      const manySections: SectionProgress[] = Array.from({ length: 10 }, () => ({
        totalQuestions: 5,
        answeredQuestions: 0,
      }));
      const { container } = render(
        <SectionCompletionLoader
          sections={manySections}
          currentSectionIndex={0}
          currentQuestionIndex={0}
        />
      );
      const bars = container.querySelectorAll('.flex-1');
      expect(bars).toHaveLength(10);
    });
  });

  describe('Completed Sections', () => {
    it('should show 100% width for completed section', () => {
      const completedSections: SectionProgress[] = [
        { totalQuestions: 5, answeredQuestions: 5 },
        { totalQuestions: 8, answeredQuestions: 0 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={completedSections}
          currentSectionIndex={1}
          currentQuestionIndex={0}
        />
      );
      const progressBars = container.querySelectorAll('.bg-emerald-400');
      expect(progressBars[0]).toHaveStyle({ width: '100%' });
    });

    it('should identify completed section correctly', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 10, answeredQuestions: 10 },
        { totalQuestions: 8, answeredQuestions: 8 },
        { totalQuestions: 6, answeredQuestions: 3 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={2}
          currentQuestionIndex={0}
        />
      );
      const progressBars = container.querySelectorAll('.bg-emerald-400');
      expect(progressBars[0]).toHaveStyle({ width: '100%' });
      expect(progressBars[1]).toHaveStyle({ width: '100%' });
    });

    it('should show 100% when answeredQuestions exceeds totalQuestions', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 5, answeredQuestions: 10 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={0}
          currentQuestionIndex={0}
        />
      );
      const progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('Current Section Progress', () => {
    it('should calculate progress for current section', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={0}
          currentQuestionIndex={4}
        />
      );
      const progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    it('should show 10% progress for 1 out of 10 questions', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 10, answeredQuestions: 0 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={0}
          currentQuestionIndex={0}
        />
      );
      const progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '10%' });
    });

    it('should show 100% when on last question of section', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 5, answeredQuestions: 0 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={0}
          currentQuestionIndex={4}
        />
      );
      const progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('should not exceed 100% for current section', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 5, answeredQuestions: 0 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={0}
          currentQuestionIndex={10}
        />
      );
      const progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('Uncompleted Sections', () => {
    it('should show 0% for uncompleted sections', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={0}
          currentQuestionIndex={0}
        />
      );
      const progressBars = container.querySelectorAll('.bg-emerald-400');
      expect(progressBars[2]).toHaveStyle({ width: '0%' });
      expect(progressBars[3]).toHaveStyle({ width: '0%' });
    });

    it('should show 0% for future sections', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={1}
          currentQuestionIndex={0}
        />
      );
      const progressBars = container.querySelectorAll('.bg-emerald-400');
      expect(progressBars[2]).toHaveStyle({ width: '0%' });
      expect(progressBars[3]).toHaveStyle({ width: '0%' });
    });
  });

  describe('CSS Classes', () => {
    it('should have flex container with gap', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={0}
          currentQuestionIndex={0}
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'w-full', 'gap-2');
    });

    it('should have correct bar container classes', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={0}
          currentQuestionIndex={0}
        />
      );
      const bars = container.querySelectorAll('.flex-1');
      bars.forEach(bar => {
        expect(bar).toHaveClass('flex-1', 'h-[3px]', 'rounded', 'bg-gray-200', 'overflow-hidden');
      });
    });

    it('should have progress bar with transition classes', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={0}
          currentQuestionIndex={0}
        />
      );
      const progressBars = container.querySelectorAll('.bg-emerald-400');
      progressBars.forEach(bar => {
        expect(bar).toHaveClass('h-full', 'bg-emerald-400', 'transition-all', 'duration-300', 'ease-out');
      });
    });
  });

  describe('Progress Transitions', () => {
    it('should update progress when moving to next question', () => {
      const { container, rerender } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={0}
          currentQuestionIndex={0}
        />
      );
      let progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '10%' });

      rerender(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={0}
          currentQuestionIndex={4}
        />
      );
      progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    it('should update when moving to next section', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 5, answeredQuestions: 5 },
        { totalQuestions: 5, answeredQuestions: 0 },
      ];
      const { container, rerender } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={0}
          currentQuestionIndex={4}
        />
      );

      rerender(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={1}
          currentQuestionIndex={0}
        />
      );
      const progressBars = container.querySelectorAll('.bg-emerald-400');
      expect(progressBars[0]).toHaveStyle({ width: '100%' });
      expect(progressBars[1]).toHaveStyle({ width: '20%' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sections array', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={[]}
          currentSectionIndex={0}
          currentQuestionIndex={0}
        />
      );
      const bars = container.querySelectorAll('.flex-1');
      expect(bars).toHaveLength(0);
    });

    it('should handle section with zero total questions', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 0, answeredQuestions: 0 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={0}
          currentQuestionIndex={0}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle negative current section index', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={-1}
          currentQuestionIndex={0}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle current section index exceeding sections length', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={10}
          currentQuestionIndex={0}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
