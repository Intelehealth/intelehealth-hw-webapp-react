import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AyuFrequencyInput } from '../../../../../modules/ayu/components/common/ayu-frequency-input.component';
import type { AyuQuestion } from '../../../../../modules/ayu-library/types/ayu.types';

const baseQuestion: AyuQuestion = {
  linkId: 'freq-1',
  text: 'Frequency',
  type: 'integer',
  extension: [
    { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 0 },
    {
      url: 'http://hl7.org/fhir/StructureDefinition/maxValue',
      valueInteger: 10,
    },
  ],
};

describe('AyuFrequencyInput', () => {
  describe('Rendering', () => {
    it('renders the hint with min/max from extensions', () => {
      render(<AyuFrequencyInput question={baseQuestion} />);
      expect(screen.getByText('Drag anywhere from 0 to 10')).toBeInTheDocument();
    });

    it('falls back to default min/max when extensions are missing', () => {
      const q: AyuQuestion = { linkId: 'freq-no-ext', type: 'integer' };
      render(<AyuFrequencyInput question={q} />);
      expect(screen.getByText('Drag anywhere from 0 to 10')).toBeInTheDocument();
    });

    it('renders one number button per visible level', () => {
      render(<AyuFrequencyInput question={baseQuestion} />);
      for (let i = 1; i <= 10; i++) {
        expect(
          screen.getByRole('button', { name: String(i) })
        ).toBeInTheDocument();
      }
    });

    it('does not render a "0" number button when min is 0 (treated as unselected)', () => {
      render(<AyuFrequencyInput question={baseQuestion} />);
      expect(screen.queryByRole('button', { name: '0' })).toBeNull();
    });

    it('renders one face button per level with aria-label "Level N"', () => {
      render(<AyuFrequencyInput question={baseQuestion} />);
      for (let i = 1; i <= 10; i++) {
        expect(
          screen.getByRole('button', { name: `Level ${i}` })
        ).toBeInTheDocument();
      }
    });

    it('renders a range slider with min=start, max=max and step=1', () => {
      render(<AyuFrequencyInput question={baseQuestion} />);
      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider).toHaveAttribute('min', '1');
      expect(slider).toHaveAttribute('max', '10');
      expect(slider).toHaveAttribute('step', '1');
    });

    it('uses the question linkId in the slider id', () => {
      render(<AyuFrequencyInput question={baseQuestion} />);
      expect(screen.getByRole('slider')).toHaveAttribute(
        'id',
        'ayu-frequency-freq-1'
      );
    });

    it('does not render the Level pill when no value is selected', () => {
      render(<AyuFrequencyInput question={baseQuestion} />);
      expect(screen.queryByText(/^Level /)).toBeNull();
    });

    it('does not render the Level pill when value is 0 (unselected)', () => {
      render(<AyuFrequencyInput question={baseQuestion} value={0} />);
      expect(screen.queryByText(/^Level /)).toBeNull();
    });

    it('renders the Level pill when value is a positive number', () => {
      render(<AyuFrequencyInput question={baseQuestion} value={7} />);
      expect(screen.getByText('Level 7')).toBeInTheDocument();
    });
  });

  describe('Value coercion', () => {
    it('accepts a numeric value', () => {
      render(<AyuFrequencyInput question={baseQuestion} value={5} />);
      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.value).toBe('5');
    });

    it('accepts a numeric string value', () => {
      render(<AyuFrequencyInput question={baseQuestion} value="3" />);
      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.value).toBe('3');
    });

    it('treats an empty string as no value (slider sits at start)', () => {
      render(<AyuFrequencyInput question={baseQuestion} value="" />);
      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.value).toBe('1');
    });

    it('treats an unsupported value type as no value', () => {
      render(<AyuFrequencyInput question={baseQuestion} value={true} />);
      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.value).toBe('1');
    });
  });

  describe('Interaction', () => {
    it('emits the level when a number button is clicked', () => {
      const onChange = vi.fn();
      render(
        <AyuFrequencyInput question={baseQuestion} onChange={onChange} />
      );
      fireEvent.click(screen.getByRole('button', { name: '4' }));
      expect(onChange).toHaveBeenCalledWith(4);
    });

    it('emits the level when a face button is clicked', () => {
      const onChange = vi.fn();
      render(
        <AyuFrequencyInput question={baseQuestion} onChange={onChange} />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Level 8' }));
      expect(onChange).toHaveBeenCalledWith(8);
    });

    it('emits a number when the slider value changes', () => {
      const onChange = vi.fn();
      render(
        <AyuFrequencyInput question={baseQuestion} onChange={onChange} />
      );
      fireEvent.change(screen.getByRole('slider'), { target: { value: '6' } });
      expect(onChange).toHaveBeenCalledWith(6);
    });

    it('does not throw if onChange is omitted', () => {
      render(<AyuFrequencyInput question={baseQuestion} />);
      expect(() =>
        fireEvent.click(screen.getByRole('button', { name: '2' }))
      ).not.toThrow();
    });
  });

  describe('Read-only', () => {
    it('disables every cell button and the slider when readOnly is true', () => {
      const onChange = vi.fn();
      render(
        <AyuFrequencyInput
          question={{ ...baseQuestion, readOnly: true }}
          onChange={onChange}
        />
      );
      expect(screen.getByRole('slider')).toBeDisabled();
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByRole('button', { name: String(i) })).toBeDisabled();
        expect(
          screen.getByRole('button', { name: `Level ${i}` })
        ).toBeDisabled();
      }
    });

    it('does not emit when a disabled number button is clicked', () => {
      const onChange = vi.fn();
      render(
        <AyuFrequencyInput
          question={{ ...baseQuestion, readOnly: true }}
          onChange={onChange}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Selected state', () => {
    it('marks the matching number button as selected', () => {
      render(<AyuFrequencyInput question={baseQuestion} value={3} />);
      const selected = screen.getByRole('button', { name: '3' });
      expect(selected.className).toContain('ayu-frequency-number--selected');
    });

    it('marks the matching face button as selected', () => {
      render(<AyuFrequencyInput question={baseQuestion} value={3} />);
      const selected = screen.getByRole('button', { name: 'Level 3' });
      expect(selected.className).toContain('ayu-frequency-face--selected');
    });
  });

  describe('Min/max edge cases', () => {
    it('honors a non-zero min from extensions (no offset to 1)', () => {
      const q: AyuQuestion = {
        linkId: 'freq-2',
        type: 'integer',
        extension: [
          {
            url: 'http://hl7.org/fhir/StructureDefinition/minValue',
            valueInteger: 3,
          },
          {
            url: 'http://hl7.org/fhir/StructureDefinition/maxValue',
            valueInteger: 6,
          },
        ],
      };
      render(<AyuFrequencyInput question={q} />);
      expect(screen.getByText('Drag anywhere from 3 to 6')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '6' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '2' })).toBeNull();
      expect(screen.queryByRole('button', { name: '7' })).toBeNull();
    });

    it('handles a degenerate range where start equals max', () => {
      const q: AyuQuestion = {
        linkId: 'freq-3',
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
      render(<AyuFrequencyInput question={q} />);
      expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    });
  });
});
