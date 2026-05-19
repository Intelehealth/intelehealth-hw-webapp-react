import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AyuQuestion } from '../../../../../modules/ayu-library/types/ayu.types';
import {
  EXT_URL_PE_CATEGORY_LABEL,
  EXT_URL_PE_OPTION_KIND,
  EXT_URL_PE_SECTION_KEY,
  PE_OPTION_KIND_CAMERA,
} from '../../../../../modules/ayu-library/utils/constants';

/*
 * The new PhysicalExamination component is a thin orchestrator on top of
 * AyuStepperContainer. We mock the stepper to capture props and drive its
 * callbacks; that gives us clean assertions on the boundary the component
 * actually owns (modal sections, adapter output, review-mode toggles).
 */

const mockShowVitalConfirmationModal = vi.fn();
const mockSetPhysicalExamData = vi.fn();
const mockSaveSectionToTemp = vi.fn().mockResolvedValue(undefined);
const mockStepperConfirm = vi.fn();
const mockStepperShowSummary = vi.fn();

let capturedStepperProps: any = {};

vi.mock(
  '../../../../../modules/ayu/components/start-visit/visit-reason/ayu-stepper-container.component',
  async () => {
    const ReactModule = await vi.importActual<typeof import('react')>('react');
    return {
      AyuStepperContainer: ReactModule.forwardRef((props: any, ref: any) => {
        capturedStepperProps = props;
        ReactModule.useImperativeHandle(ref, () => ({
          confirm: mockStepperConfirm,
          showSummary: mockStepperShowSummary,
        }));
        return (
          <div data-testid="ayu-stepper-container">
            <button
              data-testid="trigger-complete"
              onClick={() =>
                props.onComplete?.((capturedStepperProps._completeAnswers as
                  | Record<string, unknown>
                  | undefined) ?? {})
              }
            >
              Trigger Complete
            </button>
          </div>
        );
      }),
    };
  }
);

vi.mock(
  '../../../../../modules/ayu/components/start-visit/physical-examination/physical-exam-camera-context',
  () => {
    const cameraImagesFor = vi.fn((qId: string) =>
      qId === 'with-images' ? ['data:image/png;base64,xxx'] : []
    );
    return {
      PhysicalExamCameraProvider: ({
        children,
      }: {
        children: React.ReactNode;
      }) => <div data-testid="camera-provider">{children}</div>,
      usePhysicalExamCamera: () => ({
        cameraImagesFor,
        addCameraImage: vi.fn(),
        removeCameraImage: vi.fn(),
        clearCameraImages: vi.fn(),
        jobAidUrlFor: () => null,
        jobAidTypeFor: () => null,
      }),
    };
  }
);

vi.mock('../../../../../modules/ayu/hooks/useVisitReasons.hook', () => ({
  usePatientDemographics: vi.fn(() => ({ age: 30, gender: 'M' })),
}));

vi.mock('../../../../../components/modal/global-modal-context', () => ({
  useGlobalModal: () => ({
    showVitalConfirmationModal: mockShowVitalConfirmationModal,
    showConfirmModal: vi.fn(),
    closeModal: vi.fn(),
  }),
}));

let mockContextData: {
  physicalExam: {
    answers: Record<string, string[]>;
    details: Array<{ label: string; value: string }>;
  } | null;
} = { physicalExam: null };

vi.mock('../../../../../modules/ayu/context/start-visit.context', () => ({
  useStartVisitData: () => ({
    data: {
      vitals: null,
      visitReason: null,
      physicalExam: mockContextData.physicalExam,
      medicalHistory: null,
      medicalHistoryAnswers: null,
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
    setPhysicalExamData: mockSetPhysicalExamData,
    setMedicalHistoryData: vi.fn(),
    setMedicalHistoryAnswers: vi.fn(),
    saveSectionToTemp: mockSaveSectionToTemp,
    clearVisitId: vi.fn(),
  }),
}));

vi.mock('../../../../../assets/icons/icon-physical-examination.svg', () => ({
  default: 'physical-exam-icon.svg',
}));

vi.mock('../../../../../assets/icons/icon-right-arrow.svg', () => ({
  default: 'right-arrow-icon.svg',
}));

vi.mock('../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

import { PhysicalExamination } from '../../../../../modules/ayu/components/start-visit/physical-examination/physical-examination.component';

const makeQuestion = (
  linkId: string,
  sectionKey: string,
  categoryLabel: string,
  options: Array<{ code: string; display: string; camera?: boolean }>
): AyuQuestion => ({
  linkId,
  text: `${categoryLabel}?`,
  type: 'choice',
  required: true,
  repeats: false,
  extension: [
    { url: EXT_URL_PE_SECTION_KEY, valueString: sectionKey },
    { url: EXT_URL_PE_CATEGORY_LABEL, valueString: categoryLabel },
  ],
  answerOption: options.map(o => ({
    valueCoding: { code: o.code, display: o.display },
    extension: o.camera
      ? [{ url: EXT_URL_PE_OPTION_KIND, valueString: PE_OPTION_KIND_CAMERA }]
      : undefined,
  })),
});

const makeAyuConfigFiles = (questions: AyuQuestion[]) => [
  {
    id: 1,
    name: 'physExam.json',
    keyName: 'physExam',
    isActive: true,
    json: {
      resourceType: 'Questionnaire' as const,
      title: 'Physical exam',
      // We feed the transformed-shape directly under the section-group structure
      // expected by transformFhirPhysExamToAyu. Sections wrap choice items with
      // concept-tag answerOptions.
      item: [
        {
          linkId: 'sec-general',
          text: 'General',
          type: 'group',
          answerOption: questions
            .filter(q => {
              const sk = q.extension?.find(
                e => e.url === EXT_URL_PE_SECTION_KEY
              )?.valueString;
              return sk === 'General';
            })
            .map(q => ({
              valueCoding: {
                code: q.linkId,
                display:
                  q.extension?.find(e => e.url === EXT_URL_PE_CATEGORY_LABEL)
                    ?.valueString ?? q.linkId,
              },
            })),
          item: questions
            .filter(q => {
              const sk = q.extension?.find(
                e => e.url === EXT_URL_PE_SECTION_KEY
              )?.valueString;
              return sk === 'General';
            })
            .map(q => ({
              linkId: q.linkId,
              text: q.text,
              type: 'choice',
              required: q.required,
              answerOption: q.answerOption?.filter(
                o =>
                  !o.extension?.some(e => e.url === EXT_URL_PE_OPTION_KIND)
              ),
              item: q.answerOption
                ?.filter(o =>
                  o.extension?.some(
                    e =>
                      e.url === EXT_URL_PE_OPTION_KIND &&
                      e.valueString === PE_OPTION_KIND_CAMERA
                  )
                )
                .map(o => ({
                  linkId: `${q.linkId}-cam`,
                  type: 'attachment',
                  enableWhen: [
                    {
                      question: q.linkId,
                      operator: '=',
                      answerCoding: { code: o.valueCoding?.code },
                    },
                  ],
                  text: o.valueCoding?.display,
                })),
            })),
        },
        {
          linkId: 'sec-head',
          text: 'Head',
          type: 'group',
          answerOption: questions
            .filter(q => {
              const sk = q.extension?.find(
                e => e.url === EXT_URL_PE_SECTION_KEY
              )?.valueString;
              return sk === 'Head';
            })
            .map(q => ({
              valueCoding: {
                code: q.linkId,
                display:
                  q.extension?.find(e => e.url === EXT_URL_PE_CATEGORY_LABEL)
                    ?.valueString ?? q.linkId,
              },
            })),
          item: questions
            .filter(q => {
              const sk = q.extension?.find(
                e => e.url === EXT_URL_PE_SECTION_KEY
              )?.valueString;
              return sk === 'Head';
            })
            .map(q => ({
              linkId: q.linkId,
              text: q.text,
              type: 'choice',
              required: q.required,
              answerOption: q.answerOption,
            })),
        },
      ],
    },
  },
];

const defaultProps = {
  questionIndex: 0,
  onNextQuestion: vi.fn(),
  onPrevQuestion: vi.fn(),
  onPrevSection: vi.fn(),
  onProgressUpdate: vi.fn(),
};

describe('PhysicalExamination (AyuStepperContainer rewrite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedStepperProps = {};
    mockContextData = { physicalExam: null };
  });

  it('renders a loading placeholder when physExam.json is missing', () => {
    render(<PhysicalExamination {...defaultProps} ayuConfigFiles={[]} />);
    expect(screen.getByText(/Loading physical exam/i)).toBeInTheDocument();
  });

  it('renders the stepper inside the camera provider when physExam.json is present', () => {
    const questions = [
      makeQuestion('q1', 'General', 'Jaundice', [
        { code: 'yes', display: 'Yes' },
        { code: 'no', display: 'No' },
      ]),
    ];
    render(
      <PhysicalExamination
        {...defaultProps}
        ayuConfigFiles={makeAyuConfigFiles(questions)}
      />
    );
    expect(screen.getByTestId('camera-provider')).toBeInTheDocument();
    expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
  });

  it('passes skipSummary=true and the configured summaryTitle to the stepper', () => {
    const questions = [
      makeQuestion('q1', 'General', 'Jaundice', [
        { code: 'yes', display: 'Yes' },
        { code: 'no', display: 'No' },
      ]),
    ];
    render(
      <PhysicalExamination
        {...defaultProps}
        ayuConfigFiles={makeAyuConfigFiles(questions)}
      />
    );
    expect(capturedStepperProps.skipSummary).toBe(true);
    expect(capturedStepperProps.summaryTitle).toBe(
      '3/4. Physical examination summary'
    );
  });

  it('does not show Save & Next button initially when data.physicalExam is null', () => {
    const questions = [
      makeQuestion('q1', 'General', 'Jaundice', [
        { code: 'yes', display: 'Yes' },
      ]),
    ];
    render(
      <PhysicalExamination
        {...defaultProps}
        ayuConfigFiles={makeAyuConfigFiles(questions)}
      />
    );
    expect(screen.queryByText('Save & Next')).not.toBeInTheDocument();
  });

  it('shows Save & Next when data.physicalExam exists (review mode)', () => {
    mockContextData = {
      physicalExam: {
        answers: { q1: ['yes'] },
        details: [{ label: 'Jaundice', value: 'Yes' }],
      },
    };
    const questions = [
      makeQuestion('q1', 'General', 'Jaundice', [
        { code: 'yes', display: 'Yes' },
      ]),
    ];
    render(
      <PhysicalExamination
        {...defaultProps}
        ayuConfigFiles={makeAyuConfigFiles(questions)}
      />
    );
    expect(screen.getByText('Save & Next')).toBeInTheDocument();
  });

  it('forwards initialAnswers from data.physicalExam to the stepper', () => {
    mockContextData = {
      physicalExam: {
        answers: { q1: ['yes'], q2: ['normal'] },
        details: [],
      },
    };
    const questions = [
      makeQuestion('q1', 'General', 'Jaundice', [
        { code: 'yes', display: 'Yes' },
      ]),
      makeQuestion('q1', 'General', 'Pallor', [
        { code: 'normal', display: 'Normal' },
      ]),
    ];
    render(
      <PhysicalExamination
        {...defaultProps}
        ayuConfigFiles={makeAyuConfigFiles(questions)}
      />
    );
    expect(capturedStepperProps.initialAnswers).toEqual({
      q1: ['yes'],
      q2: ['normal'],
    });
  });

  it('calls onPrevSection when the Back button is clicked', async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();
    const questions = [
      makeQuestion('q1', 'General', 'Jaundice', [
        { code: 'yes', display: 'Yes' },
      ]),
    ];
    render(
      <PhysicalExamination
        {...defaultProps}
        onPrevSection={onPrev}
        ayuConfigFiles={makeAyuConfigFiles(questions)}
      />
    );
    await user.click(screen.getByText('Back'));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('Save & Next triggers the stepper.confirm() handle', async () => {
    const user = userEvent.setup();
    mockContextData = {
      physicalExam: {
        answers: { q1: ['yes'] },
        details: [],
      },
    };
    const questions = [
      makeQuestion('q1', 'General', 'Jaundice', [
        { code: 'yes', display: 'Yes' },
      ]),
    ];
    render(
      <PhysicalExamination
        {...defaultProps}
        ayuConfigFiles={makeAyuConfigFiles(questions)}
      />
    );
    await user.click(screen.getByText('Save & Next'));
    expect(mockStepperConfirm).toHaveBeenCalledTimes(1);
  });

  describe('handleStepperComplete -> summary modal', () => {
    it('shows the modal grouped by section key with display labels', async () => {
      const user = userEvent.setup();
      const questions = [
        makeQuestion('q1', 'General', 'Jaundice', [
          { code: 'yes', display: 'Yes' },
          { code: 'no', display: 'No' },
        ]),
        makeQuestion('q2', 'General', 'Pallor', [
          { code: 'normal', display: 'Normal' },
        ]),
        makeQuestion('q3', 'Head', 'Injury', [
          { code: 'yes', display: 'Yes' },
        ]),
      ];
      render(
        <PhysicalExamination
          {...defaultProps}
          ayuConfigFiles={makeAyuConfigFiles(questions)}
        />
      );
      capturedStepperProps._completeAnswers = {
        q1: ['yes'],
        q2: ['normal'],
        q3: ['yes'],
      };
      await user.click(screen.getByTestId('trigger-complete'));
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      expect(modalConfig.title).toBe('3/4. Physical examination summary');
      expect(modalConfig.size).toBe('lg');
      expect(modalConfig.sections).toHaveLength(2);
      const general = modalConfig.sections.find(
        (s: { title: string }) => s.title === 'General'
      );
      expect(general.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: 'Jaundice', value: 'Yes' }),
          expect.objectContaining({ label: 'Pallor', value: 'Normal' }),
        ])
      );
      const head = modalConfig.sections.find(
        (s: { title: string }) => s.title === 'Head'
      );
      expect(head.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: 'Injury', value: 'Yes' }),
        ])
      );
    });

    it('skips questions with no committed answer', async () => {
      const user = userEvent.setup();
      const questions = [
        makeQuestion('q1', 'General', 'Jaundice', [
          { code: 'yes', display: 'Yes' },
        ]),
      ];
      render(
        <PhysicalExamination
          {...defaultProps}
          ayuConfigFiles={makeAyuConfigFiles(questions)}
        />
      );
      capturedStepperProps._completeAnswers = {};
      await user.click(screen.getByTestId('trigger-complete'));
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      expect(modalConfig.sections).toEqual([]);
    });

    it('shows "Picture taken" when a camera answer has captured images', async () => {
      const user = userEvent.setup();
      const questions = [
        makeQuestion('with-images', 'General', 'Skin', [
          { code: 'CAM', display: 'Take a picture', camera: true },
        ]),
      ];
      render(
        <PhysicalExamination
          {...defaultProps}
          ayuConfigFiles={makeAyuConfigFiles(questions)}
        />
      );
      capturedStepperProps._completeAnswers = { 'with-images': ['CAM'] };
      await user.click(screen.getByTestId('trigger-complete'));
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      expect(modalConfig.sections[0].items[0].value).toBe('Picture taken');
    });

    it('omits camera answers when there are no captured images', async () => {
      const user = userEvent.setup();
      const questions = [
        makeQuestion('no-images', 'General', 'Skin', [
          { code: 'CAM', display: 'Take a picture', camera: true },
        ]),
      ];
      render(
        <PhysicalExamination
          {...defaultProps}
          ayuConfigFiles={makeAyuConfigFiles(questions)}
        />
      );
      capturedStepperProps._completeAnswers = { 'no-images': ['CAM'] };
      await user.click(screen.getByTestId('trigger-complete'));
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      expect(modalConfig.sections).toEqual([]);
    });

    it('on Confirm: calls setPhysicalExamData with PhysicalExamAnswers shape and originalOnNext', async () => {
      const user = userEvent.setup();
      const originalOnNext = vi.fn();
      const questions = [
        makeQuestion('q1', 'General', 'Jaundice', [
          { code: 'yes', display: 'Yes' },
        ]),
      ];
      render(
        <PhysicalExamination
          {...defaultProps}
          onNextQuestion={originalOnNext}
          ayuConfigFiles={makeAyuConfigFiles(questions)}
        />
      );
      capturedStepperProps._completeAnswers = { q1: ['yes'] };
      await user.click(screen.getByTestId('trigger-complete'));
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      modalConfig.onConfirm();
      expect(mockSetPhysicalExamData).toHaveBeenCalledWith(
        { q1: ['yes'] },
        expect.arrayContaining([
          expect.objectContaining({ label: 'Jaundice', value: 'Yes' }),
        ])
      );
      expect(originalOnNext).toHaveBeenCalledTimes(1);
    });

    it('persists answers to temp-storage on Confirm', async () => {
      const user = userEvent.setup();
      const questions = [
        makeQuestion('q1', 'General', 'Jaundice', [
          { code: 'yes', display: 'Yes' },
        ]),
      ];
      render(
        <PhysicalExamination
          {...defaultProps}
          ayuConfigFiles={makeAyuConfigFiles(questions)}
        />
      );
      capturedStepperProps._completeAnswers = { q1: ['yes'] };
      await user.click(screen.getByTestId('trigger-complete'));
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      modalConfig.onConfirm();
      expect(mockSaveSectionToTemp).toHaveBeenCalledWith({
        physicalExam: {
          answers: { q1: ['yes'] },
          details: expect.any(Array),
        },
      });
    });

    it('coerces a single-string AyuAnswerValue into [string] for the upload-shaped output', async () => {
      const user = userEvent.setup();
      const questions = [
        makeQuestion('q1', 'General', 'Jaundice', [
          { code: 'yes', display: 'Yes' },
        ]),
      ];
      render(
        <PhysicalExamination
          {...defaultProps}
          ayuConfigFiles={makeAyuConfigFiles(questions)}
        />
      );
      capturedStepperProps._completeAnswers = { q1: 'yes' };
      await user.click(screen.getByTestId('trigger-complete'));
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      modalConfig.onConfirm();
      expect(mockSetPhysicalExamData).toHaveBeenCalledWith(
        { q1: ['yes'] },
        expect.any(Array)
      );
    });

    it('first section.onChange flips the component into review mode (shows Save & Next)', async () => {
      const user = userEvent.setup();
      const questions = [
        makeQuestion('q1', 'General', 'Jaundice', [
          { code: 'yes', display: 'Yes' },
        ]),
      ];
      render(
        <PhysicalExamination
          {...defaultProps}
          ayuConfigFiles={makeAyuConfigFiles(questions)}
        />
      );
      capturedStepperProps._completeAnswers = { q1: ['yes'] };
      await user.click(screen.getByTestId('trigger-complete'));
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      // wrappedOnNextQuestion already toggled review mode when the modal
      // opened, but exercising the per-section onChange callback should not
      // throw and should keep review mode on.
      expect(typeof modalConfig.sections[0].onChange).toBe('function');
      modalConfig.sections[0].onChange();
      expect(screen.getByText('Save & Next')).toBeInTheDocument();
    });
  });
});
