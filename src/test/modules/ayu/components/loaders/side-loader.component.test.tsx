import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { SideLoader } from '../../../../../modules/ayu/components/loaders/side-loader.component';

describe('SideLoader', () => {
  describe('Rendering', () => {
    it('should render correct number of dots', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={0} />);
      const dots = container.querySelectorAll('span');
      expect(dots).toHaveLength(5);
    });

    it('should render single dot for single question', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 1 }]} currentSectionIndex={0} currentQuestionIndex={0} />);
      const dots = container.querySelectorAll('span');
      expect(dots).toHaveLength(1);
    });

    it('should render many dots for many questions', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 20 }]} currentSectionIndex={0} currentQuestionIndex={0} />);
      const dots = container.querySelectorAll('span');
      expect(dots).toHaveLength(20);
    });
  });

  describe('Active State', () => {
    it('should mark first dot as active', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={0} />);
      const dots = container.querySelectorAll('span');
      expect(dots[0]).toHaveClass('bg-emerald-500');
    });

    it('should mark middle dot as active', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={2} />);
      const dots = container.querySelectorAll('span');
      expect(dots[2]).toHaveClass('bg-emerald-500');
    });

    it('should mark last dot as active', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={4} />);
      const dots = container.querySelectorAll('span');
      expect(dots[4]).toHaveClass('bg-emerald-500');
    });

    it('should mark only one dot as active', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={2} />);
      const activeDots = container.querySelectorAll('.bg-emerald-500');
      expect(activeDots).toHaveLength(1);
    });
  });

  describe('Inactive State', () => {
    it('should mark non-active dots with lighter color', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={0} />);
      const dots = container.querySelectorAll('span');
      expect(dots[1]).toHaveClass('bg-emerald-100');
      expect(dots[2]).toHaveClass('bg-emerald-100');
      expect(dots[3]).toHaveClass('bg-emerald-100');
      expect(dots[4]).toHaveClass('bg-emerald-100');
    });

    it('should have correct number of inactive dots', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 10 }]} currentSectionIndex={0} currentQuestionIndex={3} />);
      const inactiveDots = container.querySelectorAll('.bg-emerald-100');
      expect(inactiveDots).toHaveLength(9);
    });
  });

  describe('CSS Classes', () => {
    it('should have fixed positioning anchored below the top section loader', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={0} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('fixed', 'right-12', 'top-60', 'bottom-8');
    });

    it('should have flex column layout centered within its band', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={0} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'flex-col', 'justify-center', 'gap-3');
    });

    it('should allow scrolling so dots are not clipped when they exceed the band', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={0} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('overflow-y-auto');
    });

    it('should tighten the gap when there are many questions', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 20 }]} currentSectionIndex={0} currentQuestionIndex={0} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('gap-1.5');
      expect(wrapper).not.toHaveClass('gap-3');
    });

    it('should have correct dot size classes', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={0} />);
      const dots = container.querySelectorAll('span');
      dots.forEach(dot => {
        expect(dot).toHaveClass('w-1.5', 'h-1.5', 'rounded-full');
      });
    });

    it('should have transition classes', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={0} />);
      const dots = container.querySelectorAll('span');
      dots.forEach(dot => {
        expect(dot).toHaveClass('transition-colors', 'duration-200');
      });
    });
  });

  describe('Question Progress', () => {
    it('should update active dot when question changes', () => {
      const { container, rerender } = render(
        <SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={0} />
      );
      let dots = container.querySelectorAll('span');
      expect(dots[0]).toHaveClass('bg-emerald-500');

      rerender(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={2} />);
      dots = container.querySelectorAll('span');
      expect(dots[2]).toHaveClass('bg-emerald-500');
      expect(dots[0]).toHaveClass('bg-emerald-100');
    });

    it('should handle progression through all questions', () => {
      const { container, rerender } = render(
        <SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={0} />
      );

      for (let i = 0; i < 5; i++) {
        rerender(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={i} />);
        const dots = container.querySelectorAll('span');
        expect(dots[i]).toHaveClass('bg-emerald-500');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero questions', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 0 }]} currentSectionIndex={0} currentQuestionIndex={0} />);
      const dots = container.querySelectorAll('span');
      expect(dots).toHaveLength(0);
    });

    it('should handle negative current index gracefully', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={-1} />);
      const activeDots = container.querySelectorAll('.bg-emerald-500');
      expect(activeDots).toHaveLength(0);
    });

    it('should handle current index exceeding total', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={10} />);
      const activeDots = container.querySelectorAll('.bg-emerald-500');
      expect(activeDots).toHaveLength(0);
    });

    it('should handle very large number of questions', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 100 }]} currentSectionIndex={0} currentQuestionIndex={50} />);
      const dots = container.querySelectorAll('span');
      expect(dots).toHaveLength(100);
      expect(dots[50]).toHaveClass('bg-emerald-500');
    });
  });

  describe('Dot Styling', () => {
    it('should render dots as rounded circles', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={0} />);
      const dots = container.querySelectorAll('span');
      dots.forEach(dot => {
        expect(dot).toHaveClass('rounded-full');
      });
    });

    it('should have consistent size for all dots', () => {
      const { container } = render(<SideLoader sections={[{ totalQuestions: 5 }]} currentSectionIndex={0} currentQuestionIndex={2} />);
      const dots = container.querySelectorAll('span');
      dots.forEach(dot => {
        expect(dot).toHaveClass('w-1.5', 'h-1.5');
      });
    });
  });
});
