import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AyuRangeInput } from '../../../../../modules/ayu/components/common/ayu-range-input.component';
import type { AyuQuestion } from '../../../../../modules/ayu-library/types/ayu.types';

const baseQuestion: AyuQuestion = {
  linkId: 'range-1',
  text: 'How many episodes?',
  type: 'integer',
  extension: [
    { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 0 },
    {
      url: 'http://hl7.org/fhir/StructureDefinition/maxValue',
      valueInteger: 100,
    },
  ],
};

describe('AyuRangeInput', () => {
  describe('Rendering', () => {
    it('renders the hint with min/max from extensions', () => {
      render(<AyuRangeInput question={baseQuestion} />);
      expect(
        screen.getByText('Drag two capture range from 0 to 100')
      ).toBeInTheDocument();
    });

    it('falls back to default min/max when extensions are missing', () => {
      render(<AyuRangeInput question={{ linkId: 'r', type: 'integer' }} />);
      expect(
        screen.getByText('Drag two capture range from 0 to 100')
      ).toBeInTheDocument();
    });

    it('renders both lower and upper range inputs with the right id suffixes', () => {
      const { container } = render(<AyuRangeInput question={baseQuestion} />);
      expect(container.querySelector('#ayu-range-range-1-low')).not.toBeNull();
      expect(container.querySelector('#ayu-range-range-1-high')).not.toBeNull();
    });

    it('initializes both thumbs to min/max when no value is provided', () => {
      const lower = screen.queryAllByRole('slider')[0] as HTMLInputElement;
      const upper = screen.queryAllByRole('slider')[1] as HTMLInputElement;
      // Need a fresh render — the previous test rendered too.
      render(<AyuRangeInput question={baseQuestion} />);
      const all = screen.getAllByRole('slider');
      const low = all[all.length - 2] as HTMLInputElement;
      const high = all[all.length - 1] as HTMLInputElement;
      // Reference unused locals so eslint is happy without disabling.
      void lower;
      void upper;
      expect(low.value).toBe('0');
      expect(high.value).toBe('100');
    });

    it('shows both value bubbles', () => {
      render(<AyuRangeInput question={baseQuestion} value={{ low: 24, high: 69 }} />);
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText('69')).toBeInTheDocument();
    });

    it('renders a "X To Y" summary pill', () => {
      render(<AyuRangeInput question={baseQuestion} value={{ low: 10, high: 90 }} />);
      expect(screen.getByText('10 To 90')).toBeInTheDocument();
    });
  });

  describe('Value coercion', () => {
    it('uses provided low/high object', () => {
      render(<AyuRangeInput question={baseQuestion} value={{ low: 15, high: 80 }} />);
      const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
      expect(sliders[0].value).toBe('15');
      expect(sliders[1].value).toBe('80');
    });

    it('falls back to min/max when value is not a RangeAnswer object', () => {
      render(<AyuRangeInput question={baseQuestion} value={42} />);
      const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
      expect(sliders[0].value).toBe('0');
      expect(sliders[1].value).toBe('100');
    });

    it('falls back to min/max when value is null', () => {
      render(<AyuRangeInput question={baseQuestion} value={null} />);
      const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
      expect(sliders[0].value).toBe('0');
      expect(sliders[1].value).toBe('100');
    });

    it('falls back to min/max when value is an array', () => {
      render(<AyuRangeInput question={baseQuestion} value={[]} />);
      const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
      expect(sliders[0].value).toBe('0');
      expect(sliders[1].value).toBe('100');
    });

    it('uses min for low and max for high when partial RangeAnswer is given', () => {
      render(<AyuRangeInput question={baseQuestion} value={{ low: 25 }} />);
      const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
      expect(sliders[0].value).toBe('25');
      expect(sliders[1].value).toBe('100');
    });

    it('recognizes RangeAnswer with only high property (exercises right side of || at line 28)', () => {
      render(<AyuRangeInput question={baseQuestion} value={{ high: 75 }} />);
      const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
      // low defaults to min since it is not provided
      expect(sliders[0].value).toBe('0');
      expect(sliders[1].value).toBe('75');
    });
  });

  describe('Interaction', () => {
    it('emits both low and high when the lower thumb changes', () => {
      const onChange = vi.fn();
      render(
        <AyuRangeInput
          question={baseQuestion}
          value={{ low: 10, high: 90 }}
          onChange={onChange}
        />
      );
      const sliders = screen.getAllByRole('slider');
      fireEvent.change(sliders[0], { target: { value: '20' } });
      expect(onChange).toHaveBeenCalledWith({ low: 20, high: 90 });
    });

    it('emits both low and high when the upper thumb changes', () => {
      const onChange = vi.fn();
      render(
        <AyuRangeInput
          question={baseQuestion}
          value={{ low: 10, high: 90 }}
          onChange={onChange}
        />
      );
      const sliders = screen.getAllByRole('slider');
      fireEvent.change(sliders[1], { target: { value: '70' } });
      expect(onChange).toHaveBeenCalledWith({ low: 10, high: 70 });
    });

    it('clamps the lower thumb so it cannot exceed the upper', () => {
      const onChange = vi.fn();
      render(
        <AyuRangeInput
          question={baseQuestion}
          value={{ low: 10, high: 50 }}
          onChange={onChange}
        />
      );
      const sliders = screen.getAllByRole('slider');
      fireEvent.change(sliders[0], { target: { value: '80' } });
      expect(onChange).toHaveBeenCalledWith({ low: 50, high: 50 });
    });

    it('clamps the upper thumb so it cannot fall below the lower', () => {
      const onChange = vi.fn();
      render(
        <AyuRangeInput
          question={baseQuestion}
          value={{ low: 40, high: 70 }}
          onChange={onChange}
        />
      );
      const sliders = screen.getAllByRole('slider');
      fireEvent.change(sliders[1], { target: { value: '10' } });
      expect(onChange).toHaveBeenCalledWith({ low: 40, high: 40 });
    });

    it('does not throw if onChange is omitted', () => {
      render(<AyuRangeInput question={baseQuestion} />);
      const sliders = screen.getAllByRole('slider');
      expect(() =>
        fireEvent.change(sliders[0], { target: { value: '5' } })
      ).not.toThrow();
    });
  });

  describe('Read-only', () => {
    it('disables both range inputs', () => {
      render(
        <AyuRangeInput question={{ ...baseQuestion, readOnly: true }} />
      );
      const sliders = screen.getAllByRole('slider');
      expect(sliders[0]).toBeDisabled();
      expect(sliders[1]).toBeDisabled();
    });

    it('does not emit when a slider is changed in read-only mode', () => {
      const onChange = vi.fn();
      render(
        <AyuRangeInput
          question={{ ...baseQuestion, readOnly: true }}
          value={{ low: 10, high: 90 }}
          onChange={onChange}
        />
      );
      fireEvent.change(screen.getAllByRole('slider')[0], {
        target: { value: '20' },
      });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('handles a degenerate min===max range without dividing by zero', () => {
      const q: AyuQuestion = {
        linkId: 'r-degen',
        type: 'integer',
        extension: [
          {
            url: 'http://hl7.org/fhir/StructureDefinition/minValue',
            valueInteger: 5,
          },
          {
            url: 'http://hl7.org/fhir/StructureDefinition/maxValue',
            valueInteger: 5,
          },
        ],
      };
      expect(() => render(<AyuRangeInput question={q} />)).not.toThrow();
    });
  });
});
