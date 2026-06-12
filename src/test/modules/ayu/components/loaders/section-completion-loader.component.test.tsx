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
    it('should render a single progress bar for the current section', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={0}
        />
      );
      const progressBars = container.querySelectorAll('.bg-emerald-400');
      expect(progressBars).toHaveLength(1);
    });

    it('should render the "Assessment Progress" label and LIVE badge', () => {
      const { getByText } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={0}
        />
      );
      expect(getByText('Assessment Progress')).toBeInTheDocument();
      expect(getByText('LIVE')).toBeInTheDocument();
    });

    it('should render the percentage for the current section', () => {
      const { getByText } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={0}
        />
      );
      expect(getByText('50')).toBeInTheDocument();
    });
  });

  describe('Completed Sections', () => {
    it('should show 100% width when the current section is complete', () => {
      const completedSections: SectionProgress[] = [
        { totalQuestions: 5, answeredQuestions: 0 },
        { totalQuestions: 8, answeredQuestions: 8 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={completedSections}
          currentSectionIndex={1}
        />
      );
      const progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('should show 100% when answeredQuestions exceeds totalQuestions', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 5, answeredQuestions: 10 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={0}
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
        />
      );
      const progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    it('should show 10% progress for 1 out of 10 questions', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 10, answeredQuestions: 1 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={0}
        />
      );
      const progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '10%' });
    });

    it('should show 100% when on last question of section', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 5, answeredQuestions: 5 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={0}
        />
      );
      const progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('should not exceed 100% for current section', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 5, answeredQuestions: 10 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={0}
        />
      );
      const progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('should reflect only the current section, not earlier ones', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 10, answeredQuestions: 10 },
        { totalQuestions: 8, answeredQuestions: 2 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={1}
        />
      );
      const progressBars = container.querySelectorAll('.bg-emerald-400');
      expect(progressBars).toHaveLength(1);
      expect(progressBars[0]).toHaveStyle({ width: '25%' });
    });
  });

  describe('CSS Classes', () => {
    it('should have a vertical flex container', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={0}
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'flex-col', 'gap-2', 'w-full');
    });

    it('should have progress bar with transition classes', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={0}
        />
      );
      const progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveClass(
        'h-full',
        'bg-emerald-400',
        'transition-all',
        'duration-300',
        'ease-out'
      );
    });
  });

  describe('Progress Transitions', () => {
    it('should update progress when moving to next question', () => {
      const initialSections: SectionProgress[] = [
        { totalQuestions: 10, answeredQuestions: 1 },
        { totalQuestions: 8, answeredQuestions: 0 },
      ];
      const updatedSections: SectionProgress[] = [
        { totalQuestions: 10, answeredQuestions: 5 },
        { totalQuestions: 8, answeredQuestions: 0 },
      ];

      const { container, rerender } = render(
        <SectionCompletionLoader
          sections={initialSections}
          currentSectionIndex={0}
        />
      );
      let progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '10%' });

      rerender(
        <SectionCompletionLoader
          sections={updatedSections}
          currentSectionIndex={0}
        />
      );
      progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    it('should update when moving to next section', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 5, answeredQuestions: 5 },
        { totalQuestions: 5, answeredQuestions: 1 },
      ];
      const { container, rerender } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={0}
        />
      );
      let progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '100%' });

      rerender(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={1}
        />
      );
      progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toHaveStyle({ width: '20%' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sections array', () => {
      const { container } = render(
        <SectionCompletionLoader sections={[]} currentSectionIndex={0} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle section with zero total questions', () => {
      const sections: SectionProgress[] = [
        { totalQuestions: 0, answeredQuestions: 0 },
      ];
      const { container } = render(
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={0}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle negative current section index', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={-1}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle current section index exceeding sections length', () => {
      const { container } = render(
        <SectionCompletionLoader
          sections={mockSections}
          currentSectionIndex={10}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
