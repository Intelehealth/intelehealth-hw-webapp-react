import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AyuAssociatedSymptoms } from '../../../../../modules/ayu/components/common/ayu-associated-symptoms.component';
import type { AyuQuestion } from '../../../../../modules/ayu-library/types/ayu.types';
import { AyuNestedRenderer as MockedAyuNestedRenderer } from '../../../../../modules/ayu/components/start-visit/visit-reason/ayu-nested-renderer.component';

// Mock SVG imports
vi.mock('../../../../../modules/ayu/assets/yes.svg', () => ({ default: 'yes-icon.svg' }));
vi.mock('../../../../../modules/ayu/assets/no.svg', () => ({ default: 'no-icon.svg' }));

// Mock AyuButton
vi.mock('../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: vi.fn(({ children, onClick, className, leftIcon }) => (
    <button onClick={onClick} className={className} data-testid={`btn-${String(children).toLowerCase()}`}>
      {leftIcon}
      {children}
    </button>
  )),
}));

// Mock AyuNestedRenderer
vi.mock('../../../../../modules/ayu/components/start-visit/visit-reason/ayu-nested-renderer.component', () => ({
  AyuNestedRenderer: vi.fn(({ items }) => (
    <div data-testid="nested-renderer">
      {items?.map((item: AyuQuestion) => (
        <div key={item.linkId} data-testid={`nested-${item.linkId}`}>
          {item.text}
        </div>
      ))}
    </div>
  )),
}));

const baseQuestion: AyuQuestion = {
  linkId: 'symptoms-q',
  text: 'Associated Symptoms',
  type: 'choice',
  repeats: true,
  answerOption: [
    { valueCoding: { code: 'fever', display: 'Fever' } },
    { valueCoding: { code: 'cough', display: 'Cough' } },
    { valueCoding: { code: 'fatigue', display: 'Fatigue' } },
  ],
};

describe('AyuAssociatedSymptoms', () => {
  const mockOnChange = vi.fn();
  const mockSetAnswer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render question text', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(screen.getByText('Associated Symptoms')).toBeInTheDocument();
    });

    it('should render extension display text instead of question.text when EXT_URL_DISPLAY_TEXT extension is present', () => {
      const questionWithDisplayExt: AyuQuestion = {
        ...baseQuestion,
        extension: [
          {
            url: 'https://intelehealth.org/fhir/StructureDefinition/display',
            valueString: 'Custom Display Label',
          },
        ],
      };
      render(
        <AyuAssociatedSymptoms
          question={questionWithDisplayExt}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(screen.getByText('Custom Display Label')).toBeInTheDocument();
      expect(screen.queryByText('Associated Symptoms')).not.toBeInTheDocument();
    });

    it('should render instruction text', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(screen.getByText('Select yes or no')).toBeInTheDocument();
    });

    it('should render all answer options', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(screen.getByText('1. Fever')).toBeInTheDocument();
      expect(screen.getByText('2. Cough')).toBeInTheDocument();
      expect(screen.getByText('3. Fatigue')).toBeInTheDocument();
    });

    it('should render Yes and No buttons for each option', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const yesButtons = screen.getAllByTestId('btn-yes');
      const noButtons = screen.getAllByTestId('btn-no');
      expect(yesButtons).toHaveLength(3);
      expect(noButtons).toHaveLength(3);
    });

    it('should not render required asterisk (asterisk is disabled)', () => {
      const requiredQuestion = { ...baseQuestion, required: true };
      render(
        <AyuAssociatedSymptoms
          question={requiredQuestion}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('Answer Option Display', () => {
    it('should display option with valueString when valueCoding is not present', () => {
      const question: AyuQuestion = {
        ...baseQuestion,
        answerOption: [{ valueString: 'Headache' }],
      };
      render(
        <AyuAssociatedSymptoms
          question={question}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(screen.getByText('1. Headache')).toBeInTheDocument();
    });

    it('should handle options without answerOption gracefully', () => {
      const question: AyuQuestion = { ...baseQuestion, answerOption: undefined };
      const { container } = render(
        <AyuAssociatedSymptoms
          question={question}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('should show numbered list starting from 1', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(screen.getByText('1. Fever')).toBeInTheDocument();
      expect(screen.getByText('2. Cough')).toBeInTheDocument();
      expect(screen.getByText('3. Fatigue')).toBeInTheDocument();
    });
  });

  describe('Value Parsing', () => {
    it('should parse yes values from value array (plain codes)', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={['fever', 'cough']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      // fever and cough are in yesValues, so their yes buttons get highlighted
      // This is reflected in the className
      const yesButtons = screen.getAllByTestId('btn-yes');
      expect(yesButtons[0].className).toContain('bg-emerald-500');
      expect(yesButtons[1].className).toContain('bg-emerald-500');
      expect(yesButtons[2].className).not.toContain('bg-emerald-500');
    });

    it('should parse no values from value array (NO_ prefixed codes)', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={['NO_fever', 'NO_cough']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const noButtons = screen.getAllByTestId('btn-no');
      expect(noButtons[0].className).toContain('bg-emerald-500');
      expect(noButtons[1].className).toContain('bg-emerald-500');
      expect(noButtons[2].className).not.toContain('bg-emerald-500');
    });

    it('should handle mixed yes and no values', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={['fever', 'NO_cough']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const yesButtons = screen.getAllByTestId('btn-yes');
      const noButtons = screen.getAllByTestId('btn-no');

      // fever is in yes
      expect(yesButtons[0].className).toContain('bg-emerald-500');
      // cough is in no
      expect(noButtons[1].className).toContain('bg-emerald-500');
      // fatigue is neither
      expect(yesButtons[2].className).not.toContain('bg-emerald-500');
      expect(noButtons[2].className).not.toContain('bg-emerald-500');
    });

    it('should handle non-array value', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value="some-string"
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      // No yes/no selections
      const yesButtons = screen.getAllByTestId('btn-yes');
      yesButtons.forEach(btn => {
        expect(btn.className).not.toContain('bg-emerald-500');
      });
    });

    it('should handle null value', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={null}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(screen.getByText('Associated Symptoms')).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={undefined}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(screen.getByText('Associated Symptoms')).toBeInTheDocument();
    });

    it('should handle empty array value', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const yesButtons = screen.getAllByTestId('btn-yes');
      yesButtons.forEach(btn => {
        expect(btn.className).not.toContain('bg-emerald-500');
      });
    });
  });

  describe('Toggle Behavior - Yes Button', () => {
    it('should call onChange with code added to yesValues when Yes is clicked for unselected option', async () => {
      const user = userEvent.setup();
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const yesButtons = screen.getAllByTestId('btn-yes');
      await user.click(yesButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith(['fever']);
    });

    it('should move code from noValues to yesValues when Yes clicked for a No-selected option', async () => {
      const user = userEvent.setup();
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={['NO_fever']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const yesButtons = screen.getAllByTestId('btn-yes');
      await user.click(yesButtons[0]);

      // fever should be in yes, not in no
      expect(mockOnChange).toHaveBeenCalledWith(['fever']);
    });

    it('should keep existing yes selections when adding a new yes', async () => {
      const user = userEvent.setup();
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={['cough']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const yesButtons = screen.getAllByTestId('btn-yes');
      await user.click(yesButtons[0]); // click Yes for fever

      expect(mockOnChange).toHaveBeenCalledWith(expect.arrayContaining(['cough', 'fever']));
    });

    it('should keep code in yesValues when Yes clicked again (already selected)', async () => {
      const user = userEvent.setup();
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={['fever']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const yesButtons = screen.getAllByTestId('btn-yes');
      await user.click(yesButtons[0]); // click Yes again for fever

      // fever stays in yes
      expect(mockOnChange).toHaveBeenCalledWith(['fever']);
    });
  });

  describe('Toggle Behavior - No Button', () => {
    it('should call onChange with NO_code when No is clicked for unselected option', async () => {
      const user = userEvent.setup();
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const noButtons = screen.getAllByTestId('btn-no');
      await user.click(noButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith(['NO_fever']);
    });

    it('should move code from yesValues to noValues when No clicked for a Yes-selected option', async () => {
      const user = userEvent.setup();
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={['fever']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const noButtons = screen.getAllByTestId('btn-no');
      await user.click(noButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith(['NO_fever']);
    });

    it('should keep existing no selections when adding a new no', async () => {
      const user = userEvent.setup();
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={['NO_cough']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const noButtons = screen.getAllByTestId('btn-no');
      await user.click(noButtons[0]); // click No for fever

      expect(mockOnChange).toHaveBeenCalledWith(expect.arrayContaining(['NO_cough', 'NO_fever']));
    });

    it('should keep code in noValues when No clicked again (already selected)', async () => {
      const user = userEvent.setup();
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={['NO_fever']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const noButtons = screen.getAllByTestId('btn-no');
      await user.click(noButtons[0]); // click No again for fever

      expect(mockOnChange).toHaveBeenCalledWith(['NO_fever']);
    });
  });

  describe('onChange Optional', () => {
    it('should not throw when onChange is not provided and Yes is clicked', async () => {
      const user = userEvent.setup();
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const yesButtons = screen.getAllByTestId('btn-yes');
      await expect(user.click(yesButtons[0])).resolves.not.toThrow();
    });

    it('should not throw when onChange is not provided and No is clicked', async () => {
      const user = userEvent.setup();
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const noButtons = screen.getAllByTestId('btn-no');
      await expect(user.click(noButtons[0])).resolves.not.toThrow();
    });
  });

  describe('Nested Questions', () => {
    it('should render AyuNestedRenderer when question has matching nested items with enableWhen', () => {
      const questionWithNested: AyuQuestion = {
        ...baseQuestion,
        item: [
          {
            linkId: 'nested-q1',
            text: 'Duration',
            type: 'string',
            enableWhen: [
              {
                question: 'symptoms-q',
                operator: '=',
                answerCoding: { code: 'fever' },
              },
            ],
          },
        ],
      };
      render(
        <AyuAssociatedSymptoms
          question={questionWithNested}
          value={['fever']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(screen.getByTestId('nested-renderer')).toBeInTheDocument();
    });

    it('should not render AyuNestedRenderer when question has no nested items', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(screen.queryByTestId('nested-renderer')).not.toBeInTheDocument();
    });

    it('should not render AyuNestedRenderer when nested items have no matching enableWhen', () => {
      const questionWithNested: AyuQuestion = {
        ...baseQuestion,
        item: [
          {
            linkId: 'nested-q1',
            text: 'Duration',
            type: 'string',
            enableWhen: [
              {
                question: 'symptoms-q',
                operator: '=',
                answerCoding: { code: 'other-code' },
              },
            ],
          },
        ],
      };
      render(
        <AyuAssociatedSymptoms
          question={questionWithNested}
          value={['fever']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      expect(screen.queryByTestId('nested-renderer')).not.toBeInTheDocument();
    });

    it('should pass yesValues as answers for nested renderer', () => {
      const MockedRenderer = vi.mocked(MockedAyuNestedRenderer);

      const questionWithNested: AyuQuestion = {
        ...baseQuestion,
        item: [
          {
            linkId: 'nested-q1',
            text: 'Duration',
            type: 'string',
            enableWhen: [
              {
                question: 'symptoms-q',
                operator: '=',
                answerCoding: { code: 'fever' },
              },
            ],
          },
        ],
      };
      render(
        <AyuAssociatedSymptoms
          question={questionWithNested}
          value={['fever', 'NO_cough']}
          onChange={mockOnChange}
          answers={{ 'other-q': 'val' }}
          setAnswer={mockSetAnswer}
        />
      );

      expect(MockedRenderer).toHaveBeenCalledWith(
        expect.objectContaining({
          answers: expect.objectContaining({
            'symptoms-q': ['fever'],
          }),
          setAnswer: mockSetAnswer,
          showAllTriangles: true,
        }),
        undefined
      );
    });

    it('should render nested items for each matching option', () => {
      const questionWithNested: AyuQuestion = {
        ...baseQuestion,
        item: [
          {
            linkId: 'nested-fever',
            text: 'Fever Duration',
            type: 'string',
            enableWhen: [
              {
                question: 'symptoms-q',
                operator: '=',
                answerCoding: { code: 'fever' },
              },
            ],
          },
          {
            linkId: 'nested-cough',
            text: 'Cough Duration',
            type: 'string',
            enableWhen: [
              {
                question: 'symptoms-q',
                operator: '=',
                answerCoding: { code: 'cough' },
              },
            ],
          },
        ],
      };
      render(
        <AyuAssociatedSymptoms
          question={questionWithNested}
          value={['fever', 'cough']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      // Both options have nested items rendered
      const renderers = screen.getAllByTestId('nested-renderer');
      expect(renderers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('CSS Classes', () => {
    it('should have correct outer container classes', () => {
      const { container } = render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('bg-emerald-50', 'p-4', 'rounded-xl');
    });

    it('should apply selected class to Yes button when option is selected yes', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={['fever']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const yesButtons = screen.getAllByTestId('btn-yes');
      expect(yesButtons[0].className).toContain('bg-emerald-500');
      expect(yesButtons[0].className).toContain('text-white');
    });

    it('should apply selected class to No button when option is selected no', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={['NO_fever']}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const noButtons = screen.getAllByTestId('btn-no');
      expect(noButtons[0].className).toContain('bg-emerald-500');
      expect(noButtons[0].className).toContain('text-white');
    });
  });

  describe('valueString-based options', () => {
    it('should use valueString as code when valueCoding is absent', async () => {
      const user = userEvent.setup();
      const question: AyuQuestion = {
        ...baseQuestion,
        answerOption: [{ valueString: 'Nausea' }],
      };
      render(
        <AyuAssociatedSymptoms
          question={question}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const yesButton = screen.getByTestId('btn-yes');
      await user.click(yesButton);

      expect(mockOnChange).toHaveBeenCalledWith(['Nausea']);
    });

    it('should prefix valueString code with NO_ when No clicked', async () => {
      const user = userEvent.setup();
      const question: AyuQuestion = {
        ...baseQuestion,
        answerOption: [{ valueString: 'Nausea' }],
      };
      render(
        <AyuAssociatedSymptoms
          question={question}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const noButton = screen.getByTestId('btn-no');
      await user.click(noButton);

      expect(mockOnChange).toHaveBeenCalledWith(['NO_Nausea']);
    });
  });

  describe('Edge Cases - Empty Code Fallback', () => {
    it('should handle option with neither valueCoding.code nor valueString (empty string fallback)', () => {
      const question: AyuQuestion = {
        ...baseQuestion,
        answerOption: [{ valueCoding: { display: 'Unknown Option' } } as any],
      };
      render(
        <AyuAssociatedSymptoms
          question={question}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      // Should render with empty code fallback
      expect(screen.getByText('1. Unknown Option')).toBeInTheDocument();
    });
  });

  describe('fireEvent interactions', () => {
    it('should call onChange when Yes button is clicked via fireEvent', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const yesButtons = screen.getAllByTestId('btn-yes');
      fireEvent.click(yesButtons[0]);
      expect(mockOnChange).toHaveBeenCalledWith(['fever']);
    });

    it('should call onChange when No button is clicked via fireEvent', () => {
      render(
        <AyuAssociatedSymptoms
          question={baseQuestion}
          value={[]}
          onChange={mockOnChange}
          answers={{}}
          setAnswer={mockSetAnswer}
        />
      );
      const noButtons = screen.getAllByTestId('btn-no');
      fireEvent.click(noButtons[1]);
      expect(mockOnChange).toHaveBeenCalledWith(['NO_cough']);
    });
  });
});
