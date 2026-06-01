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

// Captures the props passed to PhysicalExamCameraProvider so tests can
// invoke the resolver callbacks the orchestrator wires up
// (sectionCommentFor, jobAidUrlFor, jobAidTypeFor).
const capturedProviderProps: {
  current: Record<string, unknown> | null;
} = { current: null };
// When set to true the mocked usePhysicalExamCamera hook returns null so
// CameraImagesForCapture exercises its `camera == null` fallback branch.
const cameraConsumerReturnsNull = { value: false };

vi.mock(
  '../../../../../modules/ayu/components/start-visit/physical-examination/physical-exam-camera-context',
  () => {
    const cameraImagesFor = vi.fn((qId: string) =>
      qId === 'with-images' ? ['data:image/png;base64,xxx'] : []
    );
    return {
      PhysicalExamCameraProvider: (props: {
        children: React.ReactNode;
        [k: string]: unknown;
      }) => {
        capturedProviderProps.current = props;
        return <div data-testid="camera-provider">{props.children}</div>;
      },
      usePhysicalExamCamera: () =>
        cameraConsumerReturnsNull.value
          ? null
          : {
              cameraImagesFor,
              addCameraImage: vi.fn(),
              removeCameraImage: vi.fn(),
              clearCameraImages: vi.fn(),
              jobAidUrlFor: () => null,
              jobAidTypeFor: () => null,
            },
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
const mockVisitId: { value: string | null | undefined } = {
  value: 'test-visit-id',
};

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
    visitId: mockVisitId.value,
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

// Stub getJobAidUrl so jobAidUrlFor returns a predictable URL when the
// orchestrator wires it through the provider. Returns null for the magic
// filename "missing" so we can exercise the `?? null` fallback branch.
vi.mock('../../../../../modules/ayu/utils/physExamAssets', () => ({
  getJobAidUrl: (file: string) =>
    file === 'missing' ? null : `assets/${file}.png`,
  // Derives type from the bundled asset: 'vidfile' → video, 'imgfile' → image,
  // anything else → undefined (no bundled asset → fall back to FHIR type).
  getJobAidType: (file: string) =>
    file === 'vidfile' ? 'video' : file === 'imgfile' ? 'image' : undefined,
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
              // Forward job-aid extensions so the orchestrator's resolver
              // callbacks (jobAidUrlFor / jobAidTypeFor) can find them on the
              // transformed AyuQuestion.
              extension: q.extension?.filter(
                e =>
                  e.url ===
                    'https://intelehealth.org/fhir/StructureDefinition/job-aid-file' ||
                  e.url ===
                    'https://intelehealth.org/fhir/StructureDefinition/job-aid-type'
              ),
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
    capturedProviderProps.current = null;
    cameraConsumerReturnsNull.value = false;
    mockContextData = { physicalExam: null };
    mockVisitId.value = 'test-visit-id';
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

    it('shows "Picture Taken" when a camera answer has captured images', async () => {
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
      // camera answer code = the attachment's linkId (`<question>-cam`)
      capturedStepperProps._completeAnswers = {
        'with-images': ['with-images-cam'],
      };
      await user.click(screen.getByTestId('trigger-complete'));
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      expect(modalConfig.sections[0].items[0].value).toBe('Picture Taken');
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
      capturedStepperProps._completeAnswers = { 'no-images': ['no-images-cam'] };
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

  describe('orchestrator resolver callbacks', () => {
    const renderForCallbacks = (questions = [
      makeQuestion('q1', 'General', 'Jaundice', [
        { code: 'yes', display: 'Yes' },
      ]),
    ]) =>
      render(
        <PhysicalExamination
          {...defaultProps}
          ayuConfigFiles={makeAyuConfigFiles(questions)}
        />
      );

    it('sectionCommentFor returns the question\'s PE_SECTION_KEY when known', () => {
      renderForCallbacks();
      const fn = capturedProviderProps.current?.sectionCommentFor as (
        id: string
      ) => string;
      expect(fn('q1')).toBe('General');
    });

    it('sectionCommentFor falls back to "General Exams" for unknown question ids', () => {
      renderForCallbacks();
      const fn = capturedProviderProps.current?.sectionCommentFor as (
        id: string
      ) => string;
      expect(fn('unknown')).toBe('General Exams');
    });

    it('jobAidUrlFor returns null when the question has no job-aid file extension', () => {
      renderForCallbacks();
      const fn = capturedProviderProps.current?.jobAidUrlFor as (
        id: string
      ) => string | null;
      expect(fn('q1')).toBeNull();
    });

    it('jobAidUrlFor returns null for unknown question ids', () => {
      renderForCallbacks();
      const fn = capturedProviderProps.current?.jobAidUrlFor as (
        id: string
      ) => string | null;
      expect(fn('unknown')).toBeNull();
    });

    it('jobAidUrlFor returns the resolved URL when the question has a job-aid file', () => {
      const q = makeQuestion('q1', 'General', 'Jaundice', [
        { code: 'yes', display: 'Yes' },
      ]);
      q.extension = [
        ...(q.extension ?? []),
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/job-aid-file',
          valueString: 'jaundiceexample',
        },
      ];
      renderForCallbacks([q]);
      const fn = capturedProviderProps.current?.jobAidUrlFor as (
        id: string
      ) => string | null;
      expect(fn('q1')).toBe('assets/jaundiceexample.png');
    });

    it('jobAidUrlFor returns null when getJobAidUrl yields no asset for the file', () => {
      const q = makeQuestion('q1', 'General', 'Jaundice', [
        { code: 'yes', display: 'Yes' },
      ]);
      q.extension = [
        ...(q.extension ?? []),
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/job-aid-file',
          valueString: 'missing', // the mock returns null for this filename
        },
      ];
      renderForCallbacks([q]);
      const fn = capturedProviderProps.current?.jobAidUrlFor as (
        id: string
      ) => string | null;
      expect(fn('q1')).toBeNull();
    });

    it('jobAidTypeFor returns null for unknown question ids', () => {
      renderForCallbacks();
      const fn = capturedProviderProps.current?.jobAidTypeFor as (
        id: string
      ) => 'image' | 'video' | null;
      expect(fn('unknown')).toBeNull();
    });

    it('jobAidTypeFor returns null when the type extension is missing or invalid', () => {
      const q = makeQuestion('q1', 'General', 'Jaundice', [
        { code: 'yes', display: 'Yes' },
      ]);
      // No job-aid-type extension at all
      renderForCallbacks([q]);
      const fn = capturedProviderProps.current?.jobAidTypeFor as (
        id: string
      ) => 'image' | 'video' | null;
      expect(fn('q1')).toBeNull();
    });

    it('jobAidTypeFor returns the valid type when set to "image" or "video"', () => {
      const qImage = makeQuestion('q-img', 'General', 'Eyes', [
        { code: 'yes', display: 'Yes' },
      ]);
      qImage.extension = [
        ...(qImage.extension ?? []),
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/job-aid-type',
          valueString: 'image',
        },
      ];
      const qVideo = makeQuestion('q-vid', 'General', 'Pallor', [
        { code: 'yes', display: 'Yes' },
      ]);
      qVideo.extension = [
        ...(qVideo.extension ?? []),
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/job-aid-type',
          valueString: 'video',
        },
      ];
      const qBad = makeQuestion('q-bad', 'General', 'Other', [
        { code: 'yes', display: 'Yes' },
      ]);
      qBad.extension = [
        ...(qBad.extension ?? []),
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/job-aid-type',
          valueString: 'audio', // not image/video → null
        },
      ];
      renderForCallbacks([qImage, qVideo, qBad]);
      const fn = capturedProviderProps.current?.jobAidTypeFor as (
        id: string
      ) => 'image' | 'video' | null;
      expect(fn('q-img')).toBe('image');
      expect(fn('q-vid')).toBe('video');
      expect(fn('q-bad')).toBeNull();
    });

    it('jobAidTypeFor prefers the actual bundled asset type over the FHIR job-aid-type', () => {
      // job-aid-file resolves to an image asset even though the FHIR type
      // (mislabelled) says "video" — the actual file wins.
      const q = makeQuestion('q-file', 'General', 'Pallor', [
        { code: 'yes', display: 'Yes' },
      ]);
      q.extension = [
        ...(q.extension ?? []),
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/job-aid-file',
          valueString: 'imgfile',
        },
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/job-aid-type',
          valueString: 'video',
        },
      ];
      renderForCallbacks([q]);
      const fn = capturedProviderProps.current?.jobAidTypeFor as (
        id: string
      ) => 'image' | 'video' | null;
      expect(fn('q-file')).toBe('image');
    });

    it('jobAidTypeFor falls back to the FHIR job-aid-type when the file has no bundled asset', () => {
      // getJobAidType returns undefined for an unknown file → use FHIR type.
      const q = makeQuestion('q-fallback', 'General', 'Throat', [
        { code: 'yes', display: 'Yes' },
      ]);
      q.extension = [
        ...(q.extension ?? []),
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/job-aid-file',
          valueString: 'unbundled',
        },
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/job-aid-type',
          valueString: 'video',
        },
      ];
      renderForCallbacks([q]);
      const fn = capturedProviderProps.current?.jobAidTypeFor as (
        id: string
      ) => 'image' | 'video' | null;
      expect(fn('q-fallback')).toBe('video');
    });
  });

  describe('edge cases', () => {
    it('passes null visitId to the camera provider when no visit is in context', () => {
      mockVisitId.value = undefined;
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
      expect(capturedProviderProps.current?.visitId).toBeNull();
    });

    it('renders the loading placeholder when transformFhirPhysExamToAyu yields no items', () => {
      // physExam.json has the right shape but no section items → transform
      // returns root with empty item[] → topLevelItems is empty → loader
      render(
        <PhysicalExamination
          {...defaultProps}
          ayuConfigFiles={[
            {
              id: 1,
              name: 'physExam.json',
              keyName: 'physExam',
              isActive: true,
              json: {
                resourceType: 'Questionnaire' as const,
                title: 'Empty',
                item: [],
              },
            },
          ]}
        />
      );
      expect(screen.getByText(/Loading physical exam/i)).toBeInTheDocument();
    });

    it('forwards onProgressUpdate from the stepper to the parent', () => {
      const onProgressUpdate = vi.fn();
      const questions = [
        makeQuestion('q1', 'General', 'Jaundice', [
          { code: 'yes', display: 'Yes' },
        ]),
      ];
      render(
        <PhysicalExamination
          {...defaultProps}
          onProgressUpdate={onProgressUpdate}
          ayuConfigFiles={makeAyuConfigFiles(questions)}
        />
      );
      capturedStepperProps.onProgressUpdate?.(5, 2);
      expect(onProgressUpdate).toHaveBeenCalledWith(5, 2);
    });

    it('applies the protocol filter when physicalExamFilter is set', () => {
      const questions = [
        makeQuestion('q1', 'General', 'Jaundice', [
          { code: 'yes', display: 'Yes' },
        ]),
        makeQuestion('q2', 'Head', 'Injury', [{ code: 'yes', display: 'Yes' }]),
      ];
      render(
        <PhysicalExamination
          {...defaultProps}
          physicalExamFilter="Head:Injury"
          ayuConfigFiles={makeAyuConfigFiles(questions)}
        />
      );
      // Filter "Head:Injury" keeps q2 (matches) and drops q1 since its
      // section "General" isn't in the filter and isn't the always-included
      // section ("General Exams").
      const items = (
        capturedStepperProps.questionnaire as { item: { linkId: string }[] }
      ).item;
      expect(items.map(i => i.linkId)).toEqual(['q2']);
    });

    it('treats non-string, non-array answer values as empty arrays', async () => {
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
      // Numeric value isn't a string and isn't an array — should coerce to []
      capturedStepperProps._completeAnswers = {
        q1: 42 as unknown as string,
      };
      await user.click(screen.getByTestId('trigger-complete'));
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      modalConfig.onConfirm();
      expect(mockSetPhysicalExamData).toHaveBeenCalledWith(
        { q1: [] },
        expect.any(Array)
      );
    });

    it('CameraImagesForCapture writes null to the ref when no camera provider is mounted', async () => {
      // Force the consumer hook to return null so the ref-bridge takes its
      // `?? null` fallback branch — and supply a camera answer so the
      // handleStepperComplete loop actually invokes the () => [] fallback
      // function (covers the fallback lambda body too).
      cameraConsumerReturnsNull.value = true;
      const user = userEvent.setup();
      const questions = [
        makeQuestion('q1', 'General', 'Skin', [
          { code: 'CAM', display: 'Take a picture', camera: true },
        ]),
      ];
      render(
        <PhysicalExamination
          {...defaultProps}
          ayuConfigFiles={makeAyuConfigFiles(questions)}
        />
      );
      capturedStepperProps._completeAnswers = { q1: ['q1-cam'] };
      await user.click(screen.getByTestId('trigger-complete'));
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      // Fallback returned []; no images, so the camera answer drops out.
      expect(modalConfig.sections).toEqual([]);
    });

    it('skips stored answer codes that are no longer in the question options', async () => {
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
      // 'stale-code' isn't in q1's answerOption — orchestrator must `continue`
      // past it without contributing to the summary.
      capturedStepperProps._completeAnswers = { q1: ['stale-code'] };
      await user.click(screen.getByTestId('trigger-complete'));
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      expect(modalConfig.sections).toEqual([]);
    });

    it('treats an option without a display string as an empty value', async () => {
      const user = userEvent.setup();
      // Option with a code but display=undefined — exercises the `?? ''`
      // fallback. `?? ''` returns '' which is then dropped from the summary.
      const questions = [
        makeQuestion('q1', 'General', 'Jaundice', [
          { code: 'yes', display: '' },
        ]),
      ];
      // Strip the display property so it's undefined (not empty-string —
      // `??` only falls back on null/undefined).
      questions[0].answerOption![0].valueCoding!.display = undefined;
      render(
        <PhysicalExamination
          {...defaultProps}
          ayuConfigFiles={makeAyuConfigFiles(questions)}
        />
      );
      capturedStepperProps._completeAnswers = { q1: ['yes'] };
      await user.click(screen.getByTestId('trigger-complete'));
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      // Display was undefined → fallback '' → not pushed → no section.
      expect(modalConfig.sections).toEqual([]);
    });
  });
});
