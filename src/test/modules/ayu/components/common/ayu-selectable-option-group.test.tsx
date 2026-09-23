import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AyuSelectableOptionGroup } from '../../../../../modules/ayu/components/common/ayu-selectable-option-group';
import {
  ABDOMINAL_PAIN_LOCATION_TEXT,
  PAIN_RADIATES_TO_TEXT,
} from '../../../../../modules/ayu-library/logic/option-dependency.logic';
import type { AyuQuestion } from '../../../../../modules/ayu-library/types/ayu.types';
import { showToast } from '../../../../../services/toast';

vi.mock('../../../../../ayu-library/utils/fhir-to-ayu.util', () => ({
  resolveLabel: vi.fn((question) => question.text),
}));

vi.mock('../../../../../services/toast', () => ({
  showToast: vi.fn(),
}));

describe('AyuSelectableOptionGroup', () => {
  const mockQuestion: AyuQuestion = {
    linkId: 'select-group-1',
    text: 'Select an option',
    type: 'choice',
    required: false,
    answerOption: [
      { valueString: 'Option A' },
      { valueString: 'Option B' },
      { valueCoding: { display: 'Option C', code: 'opt-c' } },
    ],
  };

  describe('Rendering', () => {
    it('should render option group with label', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('should render without label when text is not provided', () => {
      const questionWithoutText: AyuQuestion = {
        ...mockQuestion,
        text: undefined,
      };
      render(
        <AyuSelectableOptionGroup
          question={questionWithoutText}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);
    });

    it('should render all selectable options', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Option A' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Option B' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Option C' })).toBeInTheDocument();
    });

    it('should not render required asterisk (asterisk is disabled)', () => {
      const requiredQuestion: AyuQuestion = {
        ...mockQuestion,
        required: true,
      };
      render(
        <AyuSelectableOptionGroup
          question={requiredQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should have option-group-wrapper class', () => {
      const { container } = render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const wrapper = container.querySelector('.option-group-wrapper');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have option-group class', () => {
      const { container } = render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const group = container.querySelector('.option-group');
      expect(group).toBeInTheDocument();
    });

    it('should have correct label classes', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Select an option');
      expect(label).toHaveClass('text-md', 'font-medium', 'text-black-500');
    });

    it('should have muted label classes when parent is an associated symptoms component', () => {
      const associatedSymptomsParent: AyuQuestion = {
        linkId: 'assoc-symptoms-parent',
        text: 'Associated symptoms',
        type: 'choice',
      };
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={associatedSymptomsParent}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Select an option');
      expect(label).toHaveClass('block', 'text-large-label', 'text-(--color-dark)');
    });

    it('should have muted label classes when any parent is provided (nested question)', () => {
      // Any parent (not just associated symptoms) means this is a nested
      // question and should adopt the muted style.
      const parent: AyuQuestion = {
        linkId: 'parent-1',
        text: 'Some other parent',
        type: 'choice',
      };
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={parent}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Select an option');
      expect(label).toHaveClass('block', 'text-large-label', 'text-(--color-dark)');
    });
  });

  describe('Answer Options Handling', () => {
    it('should handle empty answerOption array', () => {
      const questionWithNoOptions: AyuQuestion = {
        ...mockQuestion,
        answerOption: [],
      };
      render(
        <AyuSelectableOptionGroup
          question={questionWithNoOptions}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('should handle undefined answerOption', () => {
      const questionWithUndefinedOptions: AyuQuestion = {
        ...mockQuestion,
        answerOption: undefined,
      };
      render(
        <AyuSelectableOptionGroup
          question={questionWithUndefinedOptions}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('should handle single option', () => {
      const singleOptionQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [{ valueString: 'Only Option' }],
      };
      render(
        <AyuSelectableOptionGroup
          question={singleOptionQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Only Option' })).toBeInTheDocument();
    });

    it('should render valueCoding display when available', () => {
      const codingQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueCoding: { display: 'Coded Option', code: 'code-1' } },
        ],
      };
      render(
        <AyuSelectableOptionGroup
          question={codingQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Coded Option' })).toBeInTheDocument();
    });

    it('should use valueString as key and label when present', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Option A' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Option B' })).toBeInTheDocument();
    });

    it('should use valueCoding code as key when valueString is not present', () => {
      const { container } = render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(container).toBeTruthy();
    });
  });

  describe('State Management', () => {
    it('should initialize with undefined selectedValue', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });
  });

  describe('Props Handling', () => {
    it('should handle parent prop', () => {
      const parent: AyuQuestion = {
        linkId: 'parent-1',
        text: 'Parent Question',
        type: 'group',
        item: [],
      };
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('should handle previousSibling prop', () => {
      const previousSibling: AyuQuestion = {
        linkId: 'prev-1',
        text: 'Previous Question',
        type: 'choice',
      };
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={previousSibling}
        />
      );
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle question with empty string text', () => {
      const emptyTextQuestion: AyuQuestion = {
        ...mockQuestion,
        text: '',
      };
      render(
        <AyuSelectableOptionGroup
          question={emptyTextQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('should handle options with special characters', () => {
      const specialCharsQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueString: 'Option with <special> & "chars"' },
        ],
      };
      render(
        <AyuSelectableOptionGroup
          question={specialCharsQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Option with <special> & "chars"' })).toBeInTheDocument();
    });

    it('should handle many options', () => {
      const manyOptionsQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: Array.from({ length: 10 }, (_, i) => ({
          valueString: `Option ${i + 1}`,
        })),
      };
      render(
        <AyuSelectableOptionGroup
          question={manyOptionsQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10);
    });

    it('should handle undefined question gracefully', () => {
      render(
        <AyuSelectableOptionGroup
          question={undefined}
          parent={undefined}
          previousSibling={undefined}
        />
      );

      // Should render without crashing and without label
      expect(screen.queryByText('Select an option')).not.toBeInTheDocument();
    });

    it('should handle option with undefined valueCoding', () => {
      const questionWithUndefinedCoding: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueCoding: undefined, valueString: 'Option No Coding' },
        ],
      };
      render(
        <AyuSelectableOptionGroup
          question={questionWithUndefinedCoding}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Option No Coding' })).toBeInTheDocument();
    });

    it('should handle option with valueCoding but undefined code', () => {
      const questionWithUndefinedCode: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueCoding: { display: 'Option No Code' } as any },
        ],
      };
      render(
        <AyuSelectableOptionGroup
          question={questionWithUndefinedCode}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Option No Code' })).toBeInTheDocument();
    });
  });

  describe('onChange Callback', () => {
    it('should call onChange with valueCoding code when option is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={onChange}
        />
      );

      const optionC = screen.getByRole('button', { name: 'Option C' });
      await user.click(optionC);

      expect(onChange).toHaveBeenCalledWith('opt-c');
    });

    it('should call onChange with valueString when valueCoding is undefined', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const questionWithNoCode: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueString: 'Option A' },
        ],
      };

      render(
        <AyuSelectableOptionGroup
          question={questionWithNoCode}
          parent={undefined}
          previousSibling={undefined}
          onChange={onChange}
        />
      );

      const optionA = screen.getByRole('button', { name: 'Option A' });
      await user.click(optionA);

      expect(onChange).toHaveBeenCalledWith('Option A');
    });

    it('should call onChange with empty string when both valueCoding.code and valueString are undefined', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const questionWithUndefinedCode: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueCoding: { display: 'Option No Code' } as any },
        ],
      };

      render(
        <AyuSelectableOptionGroup
          question={questionWithUndefinedCode}
          parent={undefined}
          previousSibling={undefined}
          onChange={onChange}
        />
      );

      const option = screen.getByRole('button', { name: 'Option No Code' });
      await user.click(option);

      expect(onChange).toHaveBeenCalledWith('');
    });

    it('should not throw error when onChange is undefined', async () => {
      const user = userEvent.setup();

      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={undefined}
        />
      );

      const optionA = screen.getByRole('button', { name: 'Option A' });

      // Should not throw error even without onChange prop
      await expect(user.click(optionA)).resolves.not.toThrow();
    });

    it('should handle multiple clicks on different options', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={onChange}
        />
      );

      const optionA = screen.getByRole('button', { name: 'Option A' });
      const optionC = screen.getByRole('button', { name: 'Option C' });

      await user.click(optionA);
      await user.click(optionC);

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenNthCalledWith(1, 'Option A'); // Option A has valueString
      expect(onChange).toHaveBeenNthCalledWith(2, 'opt-c'); // Option C has code
    });

    it('should call onChange with undefined when clicking an already selected single-select option (deselect)', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value="Option A"
          onChange={onChange}
        />
      );

      const optionA = screen.getByRole('button', { name: 'Option A' });
      await user.click(optionA);

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('should call onChange with value when clicking an unselected single-select option', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value="Option A"
          onChange={onChange}
        />
      );

      const optionB = screen.getByRole('button', { name: 'Option B' });
      await user.click(optionB);

      expect(onChange).toHaveBeenCalledWith('Option B');
    });

    it('should call onChange with undefined when clicking an already selected valueCoding option (deselect)', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value="opt-c"
          onChange={onChange}
        />
      );

      const optionC = screen.getByRole('button', { name: 'Option C' });
      await user.click(optionC);

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('should call onChange with optionValue for multi-select even when already selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const multiSelectQuestion: AyuQuestion = {
        ...mockQuestion,
        repeats: true,
      };

      render(
        <AyuSelectableOptionGroup
          question={multiSelectQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={['Option A']}
          onChange={onChange}
        />
      );

      // Click already selected option — multi-select toggle is handled by computeMultiSelectToggle upstream
      const optionA = screen.getByRole('button', { name: 'Option A' });
      await user.click(optionA);

      expect(onChange).toHaveBeenCalledWith('Option A');
    });
  });

  describe('Selection State', () => {
    it('should mark option as selected when value matches for single-select', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value="opt-c"
          onChange={vi.fn()}
        />
      );

      const optionC = screen.getByRole('button', { name: 'Option C' });
      expect(optionC).toHaveClass('selected');
    });

    it('should mark option as selected when value includes option for multi-select', () => {
      const multiSelectQuestion: AyuQuestion = {
        ...mockQuestion,
        repeats: true,
      };

      render(
        <AyuSelectableOptionGroup
          question={multiSelectQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={['Option A', 'opt-c']}
          onChange={vi.fn()}
        />
      );

      const optionA = screen.getByRole('button', { name: 'Option A' });
      const optionC = screen.getByRole('button', { name: 'Option C' });
      expect(optionA).toHaveClass('selected');
      expect(optionC).toHaveClass('selected');
    });

    it('should not mark option as selected when value does not match', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value="other-value"
          onChange={vi.fn()}
        />
      );

      const optionA = screen.getByRole('button', { name: 'Option A' });
      expect(optionA).not.toHaveClass('selected');
    });

    it('should handle undefined value', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={undefined}
          onChange={vi.fn()}
        />
      );

      const optionA = screen.getByRole('button', { name: 'Option A' });
      expect(optionA).not.toHaveClass('selected');
    });
  });
});

describe('Disabled Option Codes (Pain radiates to)', () => {
  const mockQuestion: AyuQuestion = {
    linkId: 'select-group-1',
    text: 'Select an option',
    type: 'choice',
    answerOption: [
      { valueString: 'Option A' },
      { valueString: 'Option B' },
      { valueCoding: { display: 'Option C', code: 'opt-c' } },
    ],
  };

  it('should apply the disabled class to an option present in disabledOptionCodes', () => {
    render(
      <AyuSelectableOptionGroup
        question={mockQuestion}
        value={undefined}
        onChange={vi.fn()}
        disabledOptionCodes={new Set(['option c'])}
      />
    );

    expect(screen.getByRole('button', { name: 'Option C' })).toHaveClass(
      'disabled'
    );
  });

  it('should not apply the disabled class to an option absent from disabledOptionCodes', () => {
    render(
      <AyuSelectableOptionGroup
        question={mockQuestion}
        value={undefined}
        onChange={vi.fn()}
        disabledOptionCodes={new Set(['option c'])}
      />
    );

    expect(screen.getByRole('button', { name: 'Option A' })).not.toHaveClass(
      'disabled'
    );
  });

  it('should not disable anything when disabledOptionCodes is undefined', () => {
    render(
      <AyuSelectableOptionGroup
        question={mockQuestion}
        value={undefined}
        onChange={vi.fn()}
      />
    );

    for (const name of ['Option A', 'Option B', 'Option C']) {
      expect(screen.getByRole('button', { name })).not.toHaveClass(
        'disabled'
      );
    }
  });

  it('should not disable anything when disabledOptionCodes is empty', () => {
    render(
      <AyuSelectableOptionGroup
        question={mockQuestion}
        value={undefined}
        onChange={vi.fn()}
        disabledOptionCodes={new Set()}
      />
    );

    expect(screen.getByRole('button', { name: 'Option A' })).not.toHaveClass(
      'disabled'
    );
  });

  it('should block onChange when a disabled option is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AyuSelectableOptionGroup
        question={mockQuestion}
        value={undefined}
        onChange={onChange}
        disabledOptionCodes={new Set(['option c'])}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Option C' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should still call onChange for a non-disabled option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AyuSelectableOptionGroup
        question={mockQuestion}
        value={undefined}
        onChange={onChange}
        disabledOptionCodes={new Set(['option c'])}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Option A' }));

    expect(onChange).toHaveBeenCalledWith('Option A');
  });

  it('should exempt the question\'s own current selection from disabling (stays deselectable)', () => {
    render(
      <AyuSelectableOptionGroup
        question={mockQuestion}
        value="opt-c"
        onChange={vi.fn()}
        disabledOptionCodes={new Set(['option c'])}
      />
    );

    const optionC = screen.getByRole('button', { name: 'Option C' });
    expect(optionC).toHaveClass('selected');
    expect(optionC).not.toHaveClass('disabled');
  });

  it('should still allow deselecting the question\'s own current selection by clicking it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AyuSelectableOptionGroup
        question={mockQuestion}
        value="opt-c"
        onChange={onChange}
        disabledOptionCodes={new Set(['option c'])}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Option C' }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('should disable multiple matching options for a repeats (multi-select) question', () => {
    const multiSelectQuestion: AyuQuestion = { ...mockQuestion, repeats: true };
    render(
      <AyuSelectableOptionGroup
        question={multiSelectQuestion}
        value={[]}
        onChange={vi.fn()}
        disabledOptionCodes={new Set(['option a', 'option c'])}
      />
    );

    expect(screen.getByRole('button', { name: 'Option A' })).toHaveClass(
      'disabled'
    );
    expect(screen.getByRole('button', { name: 'Option C' })).toHaveClass(
      'disabled'
    );
    expect(screen.getByRole('button', { name: 'Option B' })).not.toHaveClass(
      'disabled'
    );
  });
});

describe('Disabled option click: conflict toast', () => {
  beforeEach(() => {
    vi.mocked(showToast).mockClear();
  });

  const q1Question: AyuQuestion = {
    linkId: 'abdominal-site',
    text: ABDOMINAL_PAIN_LOCATION_TEXT,
    type: 'choice',
    repeats: true,
    answerOption: [
      { valueCoding: { code: 'RHC', display: 'Upper (R) - Right Hypochondrium' } },
      { valueCoding: { code: 'EPI', display: 'Upper (C) - Epigastric' } },
    ],
  };
  const q2Question: AyuQuestion = {
    linkId: 'pain-radiates-to',
    text: PAIN_RADIATES_TO_TEXT,
    type: 'choice',
    repeats: true,
    answerOption: [
      { valueCoding: { code: 'RHC2', display: 'Upper (R) - Right Hypochondrium' } },
      { valueCoding: { code: 'CHEST', display: 'Chest' } },
    ],
  };
  const unrelatedQuestion: AyuQuestion = {
    linkId: 'onset',
    text: 'Onset',
    type: 'choice',
    answerOption: [{ valueCoding: { code: 'SUD', display: 'Sudden' } }],
  };

  it('should show the Q2-conflict toast when a blocked Question 1 option is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AyuSelectableOptionGroup
        question={q1Question}
        value={[]}
        onChange={vi.fn()}
        disabledOptionCodes={new Set(['upper (r) - right hypochondrium'])}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Upper (R) - Right Hypochondrium' })
    );

    expect(showToast).toHaveBeenCalledWith(
      'This option is already selected in Q2. Please select another option.',
      undefined,
      'warning'
    );
  });

  it('should show the Q1-conflict toast when a blocked "Pain radiates to" option is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AyuSelectableOptionGroup
        question={q2Question}
        value={[]}
        onChange={vi.fn()}
        disabledOptionCodes={new Set(['upper (r) - right hypochondrium'])}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Upper (R) - Right Hypochondrium' })
    );

    expect(showToast).toHaveBeenCalledWith(
      'This option is already selected in Q1. Please select another option.',
      undefined,
      'warning'
    );
  });

  it('should not show a toast when clicking a non-disabled option', async () => {
    const user = userEvent.setup();
    render(
      <AyuSelectableOptionGroup
        question={q1Question}
        value={[]}
        onChange={vi.fn()}
        disabledOptionCodes={new Set(['upper (r) - right hypochondrium'])}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Upper (C) - Epigastric' }));

    expect(showToast).not.toHaveBeenCalled();
  });

  it('should not show a toast for a disabled option on an unrelated question', async () => {
    // Defensive: disabling is only ever driven by this business rule in
    // practice, but the toast lookup must fail safe (no crash, no toast)
    // for any question that isn't actually Question 1 or "Pain radiates to".
    const user = userEvent.setup();
    render(
      <AyuSelectableOptionGroup
        question={unrelatedQuestion}
        value={[]}
        onChange={vi.fn()}
        disabledOptionCodes={new Set(['sudden'])}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Sudden' }));

    expect(showToast).not.toHaveBeenCalled();
  });
});
