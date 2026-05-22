import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MedicalHistory } from '../../../../../../modules/ayu/components/start-visit/medical-history/medical-history.component';
import type { AyuJsonItem } from '../../../../../../modules/ayu-library/types/ayu-json.types';

const mockNavigate = vi.fn();
const mockLocation = { pathname: '/ayu', search: '', hash: '', state: null, key: 'default' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useLocation: () => mockLocation };
});

const mockSetMedicalHistoryData = vi.fn();
const mockSetMedicalHistoryAnswers = vi.fn();
const mockSaveSectionToTemp = vi.fn().mockResolvedValue(undefined);
const mockContextMedicalHistoryAnswers: {
  value: Record<string, Record<string, unknown>> | null;
} = { value: null };

vi.mock('../../../../../../modules/ayu/context/start-visit.context', () => ({
  useStartVisitData: () => ({
    data: {
      vitals: null,
      visitReason: null,
      physicalExam: null,
      medicalHistory: null,
      medicalHistoryAnswers: mockContextMedicalHistoryAnswers.value,
    },
    patientUuid: null,
    visitId: 'test-visit-id',
    tempRecordId: null,
    isRestoring: false,
    restoredSectionIndex: null,
    lastSectionIndex: 0,
    setLastSectionIndex: vi.fn(),
    setPatientUuid: vi.fn(),
    setVitalsData: vi.fn(),
    setVisitReasonData: vi.fn(),
    setPhysicalExamData: vi.fn(),
    setMedicalHistoryData: mockSetMedicalHistoryData,
    setMedicalHistoryAnswers: mockSetMedicalHistoryAnswers,
    saveSectionToTemp: mockSaveSectionToTemp,
    clearVisitId: vi.fn(),
  }),
}));

const mockShowVitalConfirmationModal = vi.fn();
vi.mock('../../../../../../components/modal/global-modal-context', () => ({
  useGlobalModal: () => ({
    showVitalConfirmationModal: mockShowVitalConfirmationModal,
  }),
}));

let capturedStepperProps: Record<string, unknown>[] = [];
const mockConfirm = vi.fn();
vi.mock(
  '../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-stepper-container.component',
  async () => {
    const React = await vi.importActual<typeof import('react')>('react');
    const { forwardRef, useImperativeHandle } = React;
    return {
      AyuStepperContainer: forwardRef((props: Record<string, unknown>, ref: any) => {
        capturedStepperProps.push(props);
        useImperativeHandle(ref, () => ({ confirm: mockConfirm }));
        return (
          <div data-testid="ayu-stepper-container">
            <button
              data-testid="trigger-complete"
              onClick={() =>
                (props.onComplete as (a: Record<string, unknown>) => void)({
                  q1: 'answer1',
                })
              }
            >
              Complete
            </button>
            <button
              data-testid="trigger-progress"
              onClick={() =>
                (props.onProgressUpdate as (t: number, a: number) => void)(5, 3)
              }
            >
              Progress
            </button>
          </div>
        );
      }),
    };
  }
);

vi.mock(
  '../../../../../../modules/ayu/components/common/ayu-button.component',
  () => ({
    default: vi.fn(({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    )),
  })
);

const mockTransformFhirToAyu = vi.fn();
vi.mock('../../../../../../modules/ayu-library/utils/fhir-to-ayu.util', () => ({
  transformFhirToAyu: (...args: unknown[]) => mockTransformFhirToAyu(...args),
  parsePatientAgeYears: (raw: unknown) =>
    raw == null || raw === '' ? null : Number(raw),
}));

const mockBuildVisitSummary = vi.fn();
vi.mock('../../../../../../modules/ayu/utils/visit-summary.util', () => ({
  buildVisitSummary: (...args: unknown[]) => mockBuildVisitSummary(...args),
}));

vi.mock('../../../../../assets/icons/visit-reason.svg', () => ({
  default: 'visit-reason-icon.svg',
}));

vi.mock('../../../../../../modules/ayu/utils/ayu.constants', () => ({
  BUTTON_BACK: 'Back',
  BUTTON_CONFIRM: 'Confirm',
  BUTTON_SAVE_NEXT: 'Save & Next',
  MEDICAL_HISTORY_SUMMARY_TITLE: '4/4. Medical history summary',
  SUMMARY_CONFIRM_TEXT: 'Confirm',
  SUMMARY_CANCEL_TEXT: 'Back',
  PATIENT_AGE_KEY: 'patientAge',
  PATIENT_GENDER_KEY: 'patientGender',
}));

function makeFakeSchema(name: string) {
  return {
    text: `${name} title`,
    title: `${name} title`,
    item: [
      { linkId: 'q1', text: 'Question 1', type: 'string' },
    ],
  };
}

function makeConfigFile(name: string): AyuJsonItem {
  return {
    id: 1,
    name: `${name}.json`,
    json: { title: `${name} title` } as any,
    keyName: name,
    isActive: true,
  };
}

function buildDefaultProps(overrides: Record<string, unknown> = {}) {
  return {
    questionIndex: 0,
    onNextQuestion: vi.fn(),
    onPrevQuestion: vi.fn(),
    onPrevSection: vi.fn(),
    onProgressUpdate: vi.fn(),
    onSubtitleChange: vi.fn(),
    ayuConfigFiles: [makeConfigFile('patHist'), makeConfigFile('famHist')],
    ...overrides,
  };
}

describe('MedicalHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedStepperProps = [];

    mockContextMedicalHistoryAnswers.value = null;

    mockTransformFhirToAyu.mockImplementation((json: any) =>
      makeFakeSchema(json?.title ?? 'unknown')
    );

    mockBuildVisitSummary.mockReturnValue([
      {
        title: 'Section',
        items: [{ type: 'labelValue' as const, label: 'Q1', value: 'A1' }],
      },
    ]);
  });

  describe('Rendering', () => {
    it('should show loading message when ayuConfigFiles is empty', () => {
      const props = buildDefaultProps({ ayuConfigFiles: [] });
      render(<MedicalHistory {...props} />);
      expect(screen.getByText('Loading medical history...')).toBeInTheDocument();
    });

    it('should show loading message when ayuConfigFiles is undefined', () => {
      const props = buildDefaultProps({ ayuConfigFiles: undefined });
      render(<MedicalHistory {...props} />);
      expect(screen.getByText('Loading medical history...')).toBeInTheDocument();
    });

    it('should render AyuStepperContainer when history files are provided', () => {
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);
      expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
    });

    it('should render a Back button', () => {
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should call transformFhirToAyu for each history file', () => {
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);
      expect(mockTransformFhirToAyu).toHaveBeenCalledTimes(2);
    });
  });

  describe('onSubtitleChange', () => {
    it('should call onSubtitleChange with the current schema title on mount', () => {
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);
      expect(props.onSubtitleChange).toHaveBeenCalledWith('patHist title');
    });
  });

  describe('Back button', () => {
    it('should call onPrevSection when on the first step', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByText('Back'));
      expect(props.onPrevSection).toHaveBeenCalledTimes(1);
    });

    it('should go to the previous file when on step > 0', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));

      await user.click(screen.getByText('Back'));
      expect(props.onPrevSection).not.toHaveBeenCalled();
    });
  });

  describe('Stepper completion', () => {
    it('should advance to the next file when completing a non-final step', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));

      const lastProps = capturedStepperProps[capturedStepperProps.length - 1];
      expect((lastProps.questionnaire as any).text).toBe('famHist title title');
    });

    it('should call buildVisitSummary when a step completes', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));
      expect(mockBuildVisitSummary).toHaveBeenCalledTimes(1);
    });

    it('should show the combined summary modal when the last file completes', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));
      expect(mockShowVitalConfirmationModal).not.toHaveBeenCalled();

      await user.click(screen.getByTestId('trigger-complete'));
      expect(mockShowVitalConfirmationModal).toHaveBeenCalledTimes(1);
    });
  });

  describe('Combined summary modal', () => {
    it('should pass correct config to showVitalConfirmationModal', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));
      await user.click(screen.getByTestId('trigger-complete'));

      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      expect(modalConfig.title).toBe('4/4. Medical history summary');
      expect(modalConfig.confirmText).toBe('Confirm');
      expect(modalConfig.cancelText).toBe('Back');
      expect(modalConfig.type).toBe('vitalConfirm');
      expect(modalConfig.size).toBe('lg');
      expect(modalConfig.sections).toBeDefined();
      expect(modalConfig.onConfirm).toBeInstanceOf(Function);
    });

    it('should navigate to visit-summary when modal confirm is invoked', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));
      await user.click(screen.getByTestId('trigger-complete'));

      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      modalConfig.onConfirm();

      expect(mockSetMedicalHistoryData).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/ayu/visit-summary');
    });

    it('should include sections from all completed files', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));
      await user.click(screen.getByTestId('trigger-complete'));

      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];

      expect(modalConfig.sections.length).toBe(2);
      modalConfig.sections.forEach((section: any) => {
        expect(section.onChange).toBeInstanceOf(Function);
      });
    });

    it('should backfill earlier file sections from restored answers after refresh', async () => {
      mockContextMedicalHistoryAnswers.value = {
        patHist: { q1: 'patAnswer' },
        famHist: { q1: 'famAnswer' },
      };

      mockBuildVisitSummary.mockImplementation((_items, _map, sectionTitle) => [
        {
          title: sectionTitle,
          items: [
            {
              type: 'labelValue' as const,
              label: 'Q1',
              value: `value-from-${sectionTitle}`,
            },
          ],
        },
      ]);

      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));

      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      expect(modalConfig.sections.length).toBe(2);

      const titles = modalConfig.sections.map((s: any) => s.title);
      expect(titles).toEqual(['patHist title title', 'famHist title title']);

      expect(modalConfig.sections[0].items[0].value).toBe(
        'value-from-patHist title title'
      );
      expect(modalConfig.sections[1].items[0].value).toBe(
        'value-from-famHist title title'
      );
    });
  });

  describe('onProgressUpdate', () => {
    it('should call onProgressUpdate when the stepper reports progress', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-progress'));
      expect(props.onProgressUpdate).toHaveBeenCalledWith(5, 3);
    });
  });

  describe('Review mode', () => {
    it('should not show Confirm button on initial render', () => {
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);
      expect(screen.queryByText('Save & Next')).not.toBeInTheDocument();
    });

    it('should show Confirm button when returning to a completed step via modal onChange', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      const { rerender } = render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));
      await user.click(screen.getByTestId('trigger-complete'));

      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      modalConfig.sections[0].onChange();

      rerender(<MedicalHistory {...props} />);

      expect(screen.getByText('Save & Next')).toBeInTheDocument();
    });

    it('should call stepperRef.confirm when Confirm button is clicked in review mode', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      const { rerender } = render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));
      await user.click(screen.getByTestId('trigger-complete'));

      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      modalConfig.sections[0].onChange();
      rerender(<MedicalHistory {...props} />);

      await user.click(screen.getByText('Save & Next'));
      expect(mockConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should filter out config files that do not match HISTORY_JSON_NAMES', () => {
      const props = buildDefaultProps({
        ayuConfigFiles: [
          makeConfigFile('patHist'),
          makeConfigFile('unrelatedFile'),
        ],
      });
      render(<MedicalHistory {...props} />);

      expect(mockTransformFhirToAyu).toHaveBeenCalledTimes(1);
    });

    it('should pass skipSummary=true to AyuStepperContainer', () => {
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);
      const stepperProps = capturedStepperProps[0];
      expect(stepperProps.skipSummary).toBe(true);
    });

    it('should pass summaryTitle to AyuStepperContainer', () => {
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);
      const stepperProps = capturedStepperProps[0];
      expect(stepperProps.summaryTitle).toBe('4/4. Medical history summary');
    });

    it('should not throw when onSubtitleChange is undefined', () => {
      const props = buildDefaultProps({ onSubtitleChange: undefined });
      expect(() => render(<MedicalHistory {...props} />)).not.toThrow();
    });

    it('should produce empty sections when buildVisitSummary returns no items', async () => {
      const user = userEvent.setup();

      mockBuildVisitSummary.mockReturnValue([]);
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));
      await user.click(screen.getByTestId('trigger-complete'));

      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];

      expect(modalConfig.sections).toEqual([]);
    });
  });

  describe('currentStep restoration from context', () => {
    it('should compute currentStep from completedFiles when answers exist', () => {

      mockContextMedicalHistoryAnswers.value = {
        patHist: { q1: 'answered' },
      };
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      const firstProps = capturedStepperProps[0];
      expect((firstProps.questionnaire as any).text).toBe('famHist title title');
    });

    it('should clamp currentStep to max valid index when all files completed', () => {

      mockContextMedicalHistoryAnswers.value = {
        patHist: { q1: 'a' },
        famHist: { q2: 'b' },
      };
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      const firstProps = capturedStepperProps[0];
      expect((firstProps.questionnaire as any).text).toBe('famHist title title');
    });

    it('should fall back to file name when json.title is missing', () => {

      const props = buildDefaultProps({
        ayuConfigFiles: [
          { name: 'patHist.json', json: {} as any },
          { name: 'famHist.json', json: {} as any },
        ],
      });
      render(<MedicalHistory {...props} />);

      expect(capturedStepperProps.length).toBeGreaterThan(0);
    });

    it('should pass undefined for totalQuestionsOverride when precomputedTotal is 0', () => {

      mockTransformFhirToAyu.mockImplementation(() => ({
        linkId: 'root',
        type: 'group' as const,
        item: [],
      }));
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      const firstProps = capturedStepperProps[0];
      expect(firstProps.totalQuestionsOverride).toBeUndefined();
    });

    it('should handle schemas with no item array (|| [] fallback)', () => {

      mockTransformFhirToAyu.mockImplementation(() => ({
        linkId: 'root',
        type: 'group' as const,

      }));
      const props = buildDefaultProps();

      expect(() => render(<MedicalHistory {...props} />)).not.toThrow();
    });

    it('should handle empty fileResultsRef sections on combined summary confirm', async () => {

      mockBuildVisitSummary.mockReturnValue([]);

      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));
      await user.click(screen.getByTestId('trigger-complete'));

      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      await act(async () => {
        modalConfig.onConfirm();
      });

      expect(mockSetMedicalHistoryData).toHaveBeenCalled();
    });

    it('should fall back to schema.title when schema.text is missing', async () => {

      mockTransformFhirToAyu.mockImplementation((json: any) => ({

        title: `${json?.title ?? 'unknown'} title`,
        item: [{ linkId: 'q1', text: 'Q1', type: 'string' as const }],
      }));

      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));

      expect(mockBuildVisitSummary).toHaveBeenCalled();
    });

    it('line 120: should use ?? [] fallback when fileResultsRef[1] is undefined on confirm', async () => {
      // Simulate only one history file so fileResultsRef[1] is never populated
      const user = userEvent.setup();
      const props = buildDefaultProps({
        ayuConfigFiles: [makeConfigFile('patHist')],
      });
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-complete'));

      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      await act(async () => {
        modalConfig.onConfirm();
      });

      // The famHist array should be empty since there is no second file
      expect(mockSetMedicalHistoryData).toHaveBeenCalledWith(
        expect.any(Array),
        []
      );
    });

    it('line 162+183: should handle buildResult when s.schema.item is undefined for first file', async () => {
      // First file has a schema with item undefined, second file is normal
      let callCount = 0;
      mockTransformFhirToAyu.mockImplementation((json: any) => {
        callCount++;
        if (callCount === 1) {
          // patHist: returns schema with no item array but text is present
          return { text: 'patHist title title', title: 'patHist title title' };
        }
        return makeFakeSchema(json?.title ?? 'unknown');
      });

      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      // Complete step 0 (patHist — schema with no .item uses `|| []` fallback)
      await user.click(screen.getByTestId('trigger-complete'));
      // Complete step 1 (famHist)
      await user.click(screen.getByTestId('trigger-complete'));

      // The modal should appear even though first schema had no .item
      expect(mockShowVitalConfirmationModal).toHaveBeenCalled();
    });

    it('lines 116+183: should use ?? [] fallback when fileResultsRef[0] is undefined and schemas[0].schema is null', async () => {
      // First file transforms to null schema, second file is valid.
      // Restored answers have famHist so component starts at step 1.
      let callCount = 0;
      mockTransformFhirToAyu.mockImplementation((json: any) => {
        callCount++;
        if (callCount === 1) {
          // patHist: returns null — schemas[0].schema will be null
          return null;
        }
        return makeFakeSchema(json?.title ?? 'unknown');
      });

      // Restore answers for famHist so currentStep starts at 1
      mockContextMedicalHistoryAnswers.value = {
        famHist: { q1: 'answer1' },
      };

      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      // Step 1 (famHist) should be rendering since schemas[1].schema is valid
      // Complete step 1
      await user.click(screen.getByTestId('trigger-complete'));

      // showCombinedSummary should be triggered (last step)
      expect(mockShowVitalConfirmationModal).toHaveBeenCalled();

      // Now trigger onConfirm - fileResultsRef.current[0] should be undefined
      // because the for loop skipped schemas[0] (schema is null) via line 183 continue
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      await act(async () => {
        modalConfig.onConfirm();
      });

      // patHist should be empty array (via ?? []) since fileResultsRef[0] is undefined
      expect(mockSetMedicalHistoryData).toHaveBeenCalledWith(
        [],
        expect.any(Array)
      );
    });
  });
});
