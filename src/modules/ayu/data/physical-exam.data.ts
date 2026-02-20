export type PhysicalExamAnswers = Record<string, string[]>;

export interface PhysicalExamOption {
  id: string;
  text: string;
  isCamera?: boolean;
  isExclusiveOption?: boolean;
  excludeFromMulti?: boolean;
}

export interface PhysicalExamQuestion {
  id: string;
  sectionLabel: string;
  categoryLabel: string;
  questionText: string;
  isRequired: boolean;
  isMultiChoice: boolean;
  jobAidType?: 'image' | 'video';
  jobAidFile?: string;
  options: PhysicalExamOption[];
  /** If set, only show this question when the parent question has the given option selected */
  showWhen?: { questionId: string; optionId: string };
  /** Protocol section key — matches the section name in perform-physical-exam (e.g. "Hands", "Throat") */
  sectionKey: string;
  /** Protocol question key — matches the question name in perform-physical-exam (e.g. "Nails cyanosis") */
  questionKey?: string;
}

/**
 * Parse the perform-physical-exam string from the protocol extension.
 * Format: "Section1:QuestionA;Section2:QuestionB;Section3:"
 * An empty question part means "show all questions in that section".
 * Returns a map of { sectionKey → string[] of allowed questionKeys (empty = all) }
 */
export const parsePhysicalExamFilter = (
  filterString: string
): Record<string, string[]> => {
  const result: Record<string, string[]> = {};
  if (!filterString) return result;
  filterString.split(';').forEach(entry => {
    const colonIdx = entry.indexOf(':');
    if (colonIdx === -1) return;
    const section = entry.substring(0, colonIdx).trim();
    const question = entry.substring(colonIdx + 1).trim();
    if (!section) return;
    if (!result[section]) result[section] = [];
    if (question) result[section].push(question);
  });
  return result;
};

/**
 * Filter the question list using a perform-physical-exam filter string.
 * If filterString is empty, all questions are returned.
 */
export const filterPhysicalExamQuestions = (
  questions: PhysicalExamQuestion[],
  filterString: string
): PhysicalExamQuestion[] => {
  const filter = parsePhysicalExamFilter(filterString);
  const sectionKeys = Object.keys(filter);
  if (sectionKeys.length === 0) return questions;

  return questions.filter(q => {
    const allowedQuestions = filter[q.sectionKey];
    if (allowedQuestions === undefined) return false; // section not in filter
    if (allowedQuestions.length === 0) return true; // all questions in section
    return (
      q.questionKey !== undefined && allowedQuestions.includes(q.questionKey)
    );
  });
};

export const PHYSICAL_EXAM_QUESTIONS: PhysicalExamQuestion[] = [
  // ── General Exams ────────────────────────────────────────────────────────────
  {
    id: '5saf8na9hgasnsda8khh7jgqdm',
    sectionLabel: 'General Exams:',
    categoryLabel: 'Eyes: Jaundice',
    questionText: 'Is there jaundice?',
    isRequired: true,
    isMultiChoice: false,
    jobAidType: 'image',
    jobAidFile: 'jaundiceexample',
    sectionKey: 'General Exams',
    questionKey: 'Jaundice',
    options: [
      { id: '3gnt6celojtod43p771dq8ivr0', text: 'No' },
      { id: '0tniotfjt5upifs5ndt3grbstg', text: 'Yes' },
      {
        id: 'ID_1214278407',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: '3lntlnfs0va65rqdo136utmfmf',
    sectionLabel: 'General Exams:',
    categoryLabel: 'Eyes: Pallor',
    questionText: 'Is there pallor?',
    isRequired: true,
    isMultiChoice: false,
    jobAidType: 'video',
    jobAidFile: 'conjunctivaexample',
    sectionKey: 'General Exams',
    questionKey: 'Pallor',
    options: [
      { id: '2pt0hg68o89t624k0b2ngp16a2', text: 'Normal' },
      { id: '7o55cbfvcet2dtkj43ssip5je9', text: 'Pale' },
      {
        id: 'ID_1954219899',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: '6qtsmnaurf40drgsbpf55dbbef',
    sectionLabel: 'General Exams:',
    categoryLabel: 'Arm',
    questionText: 'Pinch skin',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'General Exams',
    questionKey: 'Pinch skin',
    options: [
      { id: '2ba1sf5pis2bk3lbe6hqjvm13c', text: 'Normal' },
      { id: '0u9urrb01daa0g0u9hi5bc2dr5', text: 'Slow' },
    ],
  },
  {
    id: '5s4jcisk6ipicrd2k55uvef0gg',
    sectionLabel: 'General Exams:',
    categoryLabel: 'Nail abnormality',
    questionText: 'Is there any nail abnormality?',
    isRequired: true,
    isMultiChoice: true,
    jobAidType: 'image',
    jobAidFile: 'abnormalnails',
    sectionKey: 'Hands',
    questionKey: 'Nails cyanosis',
    options: [
      {
        id: '31mlk01davo6blu1as82mim2u3',
        text: 'Nails are normal',
        excludeFromMulti: true,
      },
      { id: '3fp5hubboifaqe6hn9bsck3rq3', text: 'Clubbing' },
      { id: '6iq8nsiocdpje2eslgao0g5c4s', text: 'Spoon Nails' },
      { id: '6luvtcj14erouol995jtnm4rf7', text: 'Discolored' },
      {
        id: 'ID_428480652',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: 'ID_1109515145',
    sectionLabel: 'General Exams:',
    categoryLabel: 'Nail anemia',
    questionText: 'Are the nails pale?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Hands',
    questionKey: 'Nails pale',
    options: [
      { id: 'ID_377766203', text: 'Nails are normal' },
      { id: 'ID_1933772393', text: 'Nails are pale' },
      {
        id: 'ID_646885323',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: '3ufr8egutqs65irlr8u2gi8iid',
    sectionLabel: 'General Exams:',
    categoryLabel: 'Ankle',
    questionText: 'Is there ankle oedema?',
    isRequired: false,
    isMultiChoice: false,
    jobAidType: 'image',
    jobAidFile: 'ankleedemaexample',
    sectionKey: 'General Exams',
    questionKey: 'Ankle oedema',
    options: [
      { id: '7s72difltncg15eq8uk51djqv6', text: 'No oedema' },
      { id: '7266ke3fpvk3kv2bplvf7cqcl2', text: 'In left' },
      { id: 'ID_287551897', text: 'In right' },
      { id: 'ID_1390923199', text: 'Both' },
      {
        id: 'ID_1292783417',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  // ── Head ─────────────────────────────────────────────────────────────────────
  {
    id: '365fe3npmo15fs1idpt9qq4v4i',
    sectionLabel: 'Head:',
    categoryLabel: 'Injury',
    questionText: 'Inspect the head from all sides and look for injuries.',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Head',
    questionKey: 'Injury',
    options: [
      { id: '46ggknqga16skrkurisdrkmlga', text: 'No injury' },
      { id: '2mtljhbu43q7fn4nj8rn6c1f00', text: 'Injury at side of head' },
      {
        id: '3uukeqlno2pg63i0ftshkllst5',
        text: 'Injury in the middle of head',
      },
      {
        id: 'ID_1624337048',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: '5ge0k8tpp7b8dukmd0pm88mu8f',
    sectionLabel: 'Head:',
    categoryLabel: 'Swelling',
    questionText: 'Are there any swellings?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Head',
    questionKey: 'Swelling',
    options: [
      { id: '3p1cueosmgjfeab59c38smq1rs', text: 'No swelling' },
      { id: '7l32ahbdi2fkbb8od9l1u0coju', text: 'Swelling at side of head' },
      { id: '4dqpsgo07bkjp5ks5hgbqpvp6g', text: 'Swelling at middle of head' },
      {
        id: 'ID_1097524513',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  // ── Ear ──────────────────────────────────────────────────────────────────────
  {
    id: '096lo55ndv4h6fe645nt299mt5',
    sectionLabel: 'Ear:',
    categoryLabel: 'Bleeding',
    questionText: 'Is there any bleeding from ear?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Ear',
    questionKey: 'Bleeding',
    options: [
      { id: '74gfff8rpeuss6218bb4lma3dr', text: 'No' },
      { id: '2i5v2oc3gdosvo5m9n227p4bo5', text: 'Yes' },
      {
        id: 'ID_1278760897',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: '3ib4lpsg2rub7iorp5qlcm4086',
    sectionLabel: 'Ear:',
    categoryLabel: 'Discharge',
    questionText: 'Is there any discharge from the ear?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Ear',
    questionKey: 'Discharge',
    options: [
      { id: '60581gqn41acafejd4ai1491l0', text: 'No' },
      { id: '4turgn4sskcj3hvlvb78gu8il9', text: 'Yes' },
      {
        id: 'ID_1447435625',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: 'ID_1329408645',
    sectionLabel: 'Ear:',
    categoryLabel: 'Redness',
    questionText: 'Is there any redness in the ear?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Ear',
    questionKey: 'Redness',
    options: [
      { id: 'ID_1349928351', text: 'No' },
      { id: 'ID_1109132835', text: 'Yes' },
      {
        id: 'ID_260586471',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: 'ID_1965239296',
    sectionLabel: 'Ear:',
    categoryLabel: 'Swelling',
    questionText: 'Are there any swellings in the ear?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Ear',
    questionKey: 'Swelling',
    options: [
      { id: 'ID_1436663527', text: 'No' },
      { id: 'ID_1130685792', text: 'Yes' },
      {
        id: 'ID_1602694544',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  // ── Eyes ─────────────────────────────────────────────────────────────────────
  {
    id: '1a51vkv5a5mgu91ae0kk19kbil',
    sectionLabel: 'Eyes:',
    categoryLabel: 'Pupillary movement',
    questionText: 'Shine a torch and look for pupillary movements',
    isRequired: false,
    isMultiChoice: false,
    sectionKey: 'Eyes',
    questionKey: 'Pupillary movement',
    options: [
      { id: '2cl2p4oqmas4jqc4cl9oj1ce43', text: 'Moving' },
      { id: '4lp77jenv79emvs3g9q62d5hir', text: 'Not moving' },
    ],
  },
  {
    id: 'ID_674365352',
    sectionLabel: 'Eyes:',
    categoryLabel: 'Redness',
    questionText: 'Is there any redness in the eye(s)?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Eyes',
    questionKey: 'Redness',
    options: [
      { id: 'ID_270777114', text: 'No' },
      { id: 'ID_1992202071', text: 'Yes' },
      {
        id: 'ID_769598133',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: 'ID_566968371',
    sectionLabel: 'Eyes:',
    categoryLabel: 'Discharge',
    questionText: 'Is there any discharge from the eye?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Eyes',
    questionKey: 'Discharge',
    options: [
      { id: 'ID_1481304305', text: 'No' },
      { id: 'ID_540815308', text: 'Yes' },
      {
        id: 'ID_1815382231',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: 'ID_1250004705',
    sectionLabel: 'Eyes:',
    categoryLabel: 'Swelling',
    questionText: 'Is there any swelling of eyelid?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Eyes',
    questionKey: 'Swelling',
    options: [
      { id: 'ID_1444285590', text: 'No' },
      { id: 'ID_122639287', text: 'Yes' },
      {
        id: 'ID_1039325175',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  // ── Face ─────────────────────────────────────────────────────────────────────
  {
    id: '28h85njs3ksiv480ik83hukua6',
    sectionLabel: 'Face:',
    categoryLabel: 'Swollen Face',
    questionText: 'Does the face appear swollen/puffy?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Face',
    questionKey: 'Swollen face',
    options: [
      { id: '5fm4bpqfvupes9b5bu12fljiun', text: 'Normal' },
      { id: '4smb46om7l01kp76rk9qa5uu00', text: 'Swollen' },
      {
        id: 'ID_387823315',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  // ── Mouth ────────────────────────────────────────────────────────────────────
  {
    id: '5j44qfvarua6569agutns5s590',
    sectionLabel: 'Mouth:',
    categoryLabel: 'Tongue Dryness',
    questionText: 'Is the tongue dry?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Mouth',
    questionKey: 'Tongue dryness',
    options: [
      { id: '09rc564f4ctqqr5q0gtr2l0hvk', text: 'No' },
      { id: '06o03fpl9bs58km60o3r5k12nk', text: 'Yes' },
    ],
  },
  {
    id: '22oq936aiq3ijdibnlu0a2otu0',
    sectionLabel: 'Mouth:',
    categoryLabel: 'Discolouration of teeth',
    questionText:
      'Open mouth, shine a torch to affected part and look for black spots on teeth/discoloured teeth',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Mouth',
    questionKey: 'Teeth discolouration',
    options: [
      { id: '5tdoq169l36c0fdqngu5rdlt3p', text: 'Teeth normal' },
      { id: '47g8kpjfrdiijbt3jj7abue6mp', text: 'Teeth have black spots' },
      { id: '0vp1kncq7je5esav1oqe3smuto', text: 'Teeth discoloured' },
      {
        id: 'ID_1578504135',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: '1afo09f1e5ijjoum5sb3utlter',
    sectionLabel: 'Mouth:',
    categoryLabel: 'Swelling of Gums',
    questionText: 'Look for swelling on gums',
    isRequired: false,
    isMultiChoice: true,
    sectionKey: 'Mouth',
    questionKey: 'Gum swelling',
    options: [
      {
        id: '5dthi1ct8mq1snkua7oln8kb15',
        text: 'No',
        excludeFromMulti: true,
      },
      { id: '2l29uq49a8qk33g9ns8bfujo3u', text: 'Yes' },
      {
        id: 'ID_1573386216',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: 'ID_1525908874',
    sectionLabel: 'Mouth:',
    categoryLabel: 'Gum bleeding',
    questionText: 'Is there bleeding from gums?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Mouth',
    questionKey: 'Gum bleeding',
    options: [
      { id: 'ID_366660133', text: 'No' },
      { id: 'ID_1297637014', text: 'Yes' },
      {
        id: 'ID_1320828522',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: '6an5fe6s4b9n8c2fkmbmrc9l0o',
    sectionLabel: 'Mouth:',
    categoryLabel: 'Back of throat',
    questionText:
      'Ask patient to open mouth and stick tongue out. Shine a torch to examine the back of throat and look for swelling/redness',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Throat',
    questionKey: 'Back of throat',
    options: [
      { id: '2ha0ob31n8csdscu6g8ren1tll', text: 'Normal' },
      { id: '7j2f56orqds0jguel4tcb2hk6p', text: 'Redness' },
      { id: '1tllmv1vhq187gn8isto9nv6qo', text: 'Swelling' },
      {
        id: 'ID_1881322286',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  {
    id: 'ID_1860492995',
    sectionLabel: 'Mouth:',
    categoryLabel: 'Oral thrush',
    questionText:
      'Are there white coating/patches on the tongue, mouth, inner cheeks or the back of the throat?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'Throat',
    questionKey: 'Oral thrush',
    options: [
      { id: 'ID_65009506', text: 'No' },
      { id: 'ID_1480041052', text: 'Yes' },
      {
        id: 'ID_1854090323',
        text: 'Take a picture',
        isCamera: true,
        isExclusiveOption: true,
      },
    ],
  },
  // ── Neck ─────────────────────────────────────────────────────────────────────
  {
    id: '6sd6af4f1qgucbe17bq482fo2t',
    sectionLabel: 'Neck:',
    categoryLabel: 'Thyroid swelling',
    questionText: 'Is there visible swelling in the front of the neck?',
    isRequired: true,
    isMultiChoice: false,
    jobAidType: 'image',
    jobAidFile: 'thyroidswelling',
    sectionKey: 'Neck',
    questionKey: 'Thyroid swelling',
    options: [
      { id: '58sqse0lbig862ucj8b2fho5l1', text: 'No' },
      { id: '0og1s6ekirbe84jutgjr54ctdt', text: 'Yes' },
    ],
  },
  // Conditional: only shown when thyroid question answered "Yes"
  {
    id: 'ID_336426537',
    sectionLabel: 'Neck:',
    categoryLabel: 'Thyroid swelling',
    questionText:
      'Ask the patient to swallow with neck straight. Does the swelling move?',
    isRequired: false,
    isMultiChoice: false,
    sectionKey: 'Neck',
    questionKey: 'Thyroid movement',
    options: [
      { id: 'ID_1317721761', text: 'Moves' },
      { id: 'ID_1229096889', text: 'Does not move' },
    ],
    showWhen: {
      questionId: '6sd6af4f1qgucbe17bq482fo2t',
      optionId: '0og1s6ekirbe84jutgjr54ctdt',
    },
  },
];
