import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MedicalHistory } from '../../../../../../modules/ayu/components/start-visit/medical-history/medical-history.component';
import type { AyuJsonItem } from '../../../../../../modules/ayu-library/types/ayu-json.types';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockLocation = { pathname: '/ayu', search: '', hash: '', state: null, key: 'default' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useLocation: () => mockLocation };
});

const mockSetMedicalHistoryData = vi.fn();
vi.mock('../../../../../../modules/ayu/context/start-visit.context', () => ({
  useStartVisitData: () => ({
    data: { vitals: null, visitReason: null, physicalExam: null, medicalHistory: null },
    patientUuid: null,
    setPatientUuid: vi.fn(),
    setVitalsData: vi.fn(),
    setVisitReasonData: vi.fn(),
    setPhysicalExamData: vi.fn(),
    setMedicalHistoryData: mockSetMedicalHistoryData,
  }),
}));

const mockShowVitalConfirmationModal = vi.fn();
vi.mock('../../../../../../components/modal/global-modal-context', () => ({
  useGlobalModal: () => ({
    showVitalConfirmationModal: mockShowVitalConfirmationModal,
  }),
}));

// Capture props passed to each AyuStepperContainer render
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
  MEDICAL_HISTORY_SUMMARY_TITLE: '4/4. Medical history summary',
  SUMMARY_CONFIRM_TEXT: 'Confirm',
  SUMMARY_CANCEL_TEXT: 'Back',
}));

// ── Helpers ────────────────────────────────────────────────────────────

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

// ── Tests ──────────────────────────────────────────────────────────────

describe('MedicalHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedStepperProps = [];

    // Default: transformFhirToAyu returns a schema with items
    mockTransformFhirToAyu.mockImplementation((json: any) =>
      makeFakeSchema(json?.title ?? 'unknown')
    );

    // Default: buildVisitSummary returns one section with items
    mockBuildVisitSummary.mockReturnValue([
      {
        title: 'Section',
        items: [{ type: 'labelValue' as const, label: 'Q1', value: 'A1' }],
      },
    ]);
  });

  // ── Rendering ──────────────────────────────────────────────────────

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

  // ── Subtitle change ───────────────────────────────────────────────

  describe('onSubtitleChange', () => {
    it('should call onSubtitleChange with the current schema title on mount', () => {
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);
      expect(props.onSubtitleChange).toHaveBeenCalledWith('patHist title');
    });
  });

  // ── Back button ───────────────────────────────────────────────────

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

      // Advance to step 1 by completing step 0
      await user.click(screen.getByTestId('trigger-complete'));

      // Now on step 1 (famHist) – clicking Back should NOT call onPrevSection
      await user.click(screen.getByText('Back'));
      expect(props.onPrevSection).not.toHaveBeenCalled();
    });
  });

  // ── Stepper completion / advancing ────────────────────────────────

  describe('Stepper completion', () => {
    it('should advance to the next file when completing a non-final step', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      // Complete patHist (step 0)
      await user.click(screen.getByTestId('trigger-complete'));

      // The stepper should re-render for famHist
      // capturedStepperProps last entry should reference famHist schema
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

      // Complete step 0 (patHist)
      await user.click(screen.getByTestId('trigger-complete'));
      expect(mockShowVitalConfirmationModal).not.toHaveBeenCalled();

      // Complete step 1 (famHist) — should trigger modal
      await user.click(screen.getByTestId('trigger-complete'));
      expect(mockShowVitalConfirmationModal).toHaveBeenCalledTimes(1);
    });
  });

  // ── Combined summary modal ───────────────────────────────────────

  describe('Combined summary modal', () => {
    it('should pass correct config to showVitalConfirmationModal', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      // Complete both steps
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
      // 2 files, each producing 1 section => 2 sections with onChange callbacks
      expect(modalConfig.sections.length).toBe(2);
      modalConfig.sections.forEach((section: any) => {
        expect(section.onChange).toBeInstanceOf(Function);
      });
    });
  });

  // ── Progress tracking ─────────────────────────────────────────────

  describe('onProgressUpdate', () => {
    it('should call onProgressUpdate when the stepper reports progress', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      await user.click(screen.getByTestId('trigger-progress'));
      expect(props.onProgressUpdate).toHaveBeenCalledWith(5, 3);
    });
  });

  // ── Review mode (Confirm button) ─────────────────────────────────

  describe('Review mode', () => {
    it('should not show Confirm button on initial render', () => {
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    });

    it('should show Confirm button when returning to a completed step via modal onChange', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      const { rerender } = render(<MedicalHistory {...props} />);

      // Complete both steps to trigger modal
      await user.click(screen.getByTestId('trigger-complete'));
      await user.click(screen.getByTestId('trigger-complete'));

      // Simulate clicking "Change" on the first section in the modal
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      modalConfig.sections[0].onChange();

      // Re-render to reflect state change (setCurrentStep back to 0)
      rerender(<MedicalHistory {...props} />);

      // Now on step 0 in review mode — Confirm button should appear
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should call stepperRef.confirm when Confirm button is clicked in review mode', async () => {
      const user = userEvent.setup();
      const props = buildDefaultProps();
      const { rerender } = render(<MedicalHistory {...props} />);

      // Complete both steps
      await user.click(screen.getByTestId('trigger-complete'));
      await user.click(screen.getByTestId('trigger-complete'));

      // Go back to step 0 via modal onChange
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      modalConfig.sections[0].onChange();
      rerender(<MedicalHistory {...props} />);

      await user.click(screen.getByText('Confirm'));
      expect(mockConfirm).toHaveBeenCalledTimes(1);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should filter out config files that do not match HISTORY_JSON_NAMES', () => {
      const props = buildDefaultProps({
        ayuConfigFiles: [
          makeConfigFile('patHist'),
          makeConfigFile('unrelatedFile'),
        ],
      });
      render(<MedicalHistory {...props} />);
      // transformFhirToAyu should only be called for the patHist file
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
      // Return sections with empty items so mergedItems.length === 0
      mockBuildVisitSummary.mockReturnValue([]);
      const props = buildDefaultProps();
      render(<MedicalHistory {...props} />);

      // Complete both steps
      await user.click(screen.getByTestId('trigger-complete'));
      await user.click(screen.getByTestId('trigger-complete'));

      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      // With empty merged items the component produces no sections per file
      expect(modalConfig.sections).toEqual([]);
    });
  });
});
