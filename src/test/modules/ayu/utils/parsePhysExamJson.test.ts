import { describe, expect, it } from 'vitest';
import {
  parsePhysExamJson,
  type PhysExamRawRoot,
} from '../../../../modules/ayu/utils/parsePhysExamJson';

describe('parsePhysExamJson', () => {
  it('should return empty array when root has no options', () => {
    const raw: PhysExamRawRoot = { id: 'root', text: 'Physical Exam' };
    expect(parsePhysExamJson(raw)).toEqual([]);
  });

  it('should return empty array when root options is empty', () => {
    const raw: PhysExamRawRoot = { id: 'root', text: 'Physical Exam', options: [] };
    expect(parsePhysExamJson(raw)).toEqual([]);
  });

  it('should handle section with no options (no categories)', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [{ id: 'sec1', text: 'head' }],
    };
    expect(parsePhysExamJson(raw)).toEqual([]);
  });

  it('should handle category with no options (no questions)', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [
        {
          id: 'sec1',
          text: 'head',
          options: [{ id: 'cat1', text: 'Eyes' }],
        },
      ],
    };
    expect(parsePhysExamJson(raw)).toEqual([]);
  });

  it('should parse a full tree with all nested levels', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [
        {
          id: 'sec1',
          text: 'head and neck',
          options: [
            {
              id: 'cat1',
              text: 'Eyes',
              options: [
                {
                  id: 'q1',
                  text: 'Eye color*',
                  isRequired: 'true',
                  'multi-choice': true,
                  options: [
                    { id: 'opt1', text: 'Normal' },
                    { id: 'opt2', text: 'Abnormal' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = parsePhysExamJson(raw);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'q1',
        sectionKey: 'Head And Neck',
        sectionLabel: 'Head And Neck:',
        categoryLabel: 'Eyes',
        questionText: 'Eye color',
        isRequired: true,
        isMultiChoice: true,
        questionKey: 'Eyes',
        options: [
          { id: 'opt1', text: 'Normal' },
          { id: 'opt2', text: 'Abnormal' },
        ],
      })
    );
  });

  it('should use section language when available and not %', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [
        {
          id: 'sec1',
          text: 'hands',
          language: 'Mains:',
          options: [
            {
              id: 'cat1',
              text: 'Nails',
              options: [
                { id: 'q1', text: 'Color', options: [] },
              ],
            },
          ],
        },
      ],
    };

    const result = parsePhysExamJson(raw);
    expect(result[0].sectionLabel).toBe('Mains:');
  });

  it('should fall back to sectionKey when language is %', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [
        {
          id: 'sec1',
          text: 'hands',
          language: '%',
          options: [
            {
              id: 'cat1',
              text: 'Nails',
              options: [
                { id: 'q1', text: 'Color', options: [] },
              ],
            },
          ],
        },
      ],
    };

    const result = parsePhysExamJson(raw);
    expect(result[0].sectionLabel).toBe('Hands:');
  });

  it('should handle question with no options (empty answers)', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [
        {
          id: 'sec1',
          text: 'head',
          options: [
            {
              id: 'cat1',
              text: 'Eyes',
              options: [
                { id: 'q1', text: 'Note', isRequired: false },
              ],
            },
          ],
        },
      ],
    };

    const result = parsePhysExamJson(raw);
    expect(result).toHaveLength(1);
    expect(result[0].options).toEqual([]);
    expect(result[0].isRequired).toBe(false);
    expect(result[0].isMultiChoice).toBe(false);
  });

  it('should map camera input-type option', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [
        {
          id: 'sec1',
          text: 'skin',
          options: [
            {
              id: 'cat1',
              text: 'Rash',
              options: [
                {
                  id: 'q1',
                  text: 'Photo',
                  options: [
                    { id: 'opt1', text: 'Take Photo', 'input-type': 'camera' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = parsePhysExamJson(raw);
    expect(result[0].options[0]).toEqual(
      expect.objectContaining({ isCamera: true })
    );
  });

  it('should map is-exclusive-option (string "true")', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [
        {
          id: 'sec1',
          text: 'head',
          options: [
            {
              id: 'cat1',
              text: 'Eyes',
              options: [
                {
                  id: 'q1',
                  text: 'Check',
                  options: [
                    { id: 'opt1', text: 'Normal', 'is-exclusive-option': 'true' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = parsePhysExamJson(raw);
    expect(result[0].options[0]).toEqual(
      expect.objectContaining({ isExclusiveOption: true })
    );
  });

  it('should map is-exclusive-option (boolean true)', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [
        {
          id: 'sec1',
          text: 'head',
          options: [
            {
              id: 'cat1',
              text: 'Eyes',
              options: [
                {
                  id: 'q1',
                  text: 'Check',
                  options: [
                    { id: 'opt1', text: 'Normal', 'is-exclusive-option': true },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = parsePhysExamJson(raw);
    expect(result[0].options[0]).toEqual(
      expect.objectContaining({ isExclusiveOption: true })
    );
  });

  it('should map exclude-from-multi-choice', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [
        {
          id: 'sec1',
          text: 'head',
          options: [
            {
              id: 'cat1',
              text: 'Eyes',
              options: [
                {
                  id: 'q1',
                  text: 'Check',
                  options: [
                    { id: 'opt1', text: 'None', 'exclude-from-multi-choice': true },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = parsePhysExamJson(raw);
    expect(result[0].options[0]).toEqual(
      expect.objectContaining({ excludeFromMulti: true })
    );
  });

  it('should handle job-aid-type and job-aid-file', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [
        {
          id: 'sec1',
          text: 'chest',
          options: [
            {
              id: 'cat1',
              text: 'Lungs',
              options: [
                {
                  id: 'q1',
                  text: 'Auscultation',
                  'job-aid-type': 'image',
                  'job-aid-file': 'lungs.png',
                  options: [],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = parsePhysExamJson(raw);
    expect(result[0]).toEqual(
      expect.objectContaining({ jobAidType: 'image', jobAidFile: 'lungs.png' })
    );
  });

  it('should handle job-aid-type video', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [
        {
          id: 'sec1',
          text: 'chest',
          options: [
            {
              id: 'cat1',
              text: 'Heart',
              options: [
                {
                  id: 'q1',
                  text: 'Auscultation',
                  'job-aid-type': 'video',
                  options: [],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = parsePhysExamJson(raw);
    expect(result[0]).toEqual(expect.objectContaining({ jobAidType: 'video' }));
  });

  it('should handle isRequired as boolean true', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [
        {
          id: 'sec1',
          text: 'head',
          options: [
            {
              id: 'cat1',
              text: 'Eyes',
              options: [
                { id: 'q1', text: 'Check', isRequired: true, options: [] },
              ],
            },
          ],
        },
      ],
    };

    const result = parsePhysExamJson(raw);
    expect(result[0].isRequired).toBe(true);
  });

  it('should parse multiple sections, categories, and questions', () => {
    const raw: PhysExamRawRoot = {
      id: 'root',
      text: 'Physical Exam',
      options: [
        {
          id: 'sec1',
          text: 'head',
          options: [
            {
              id: 'cat1',
              text: 'Eyes',
              options: [
                { id: 'q1', text: 'Color', options: [] },
                { id: 'q2', text: 'Pupils', options: [] },
              ],
            },
            {
              id: 'cat2',
              text: 'Ears',
              options: [
                { id: 'q3', text: 'Canal', options: [] },
              ],
            },
          ],
        },
        {
          id: 'sec2',
          text: 'chest',
          options: [
            {
              id: 'cat3',
              text: 'Lungs',
              options: [
                { id: 'q4', text: 'Breath sounds', options: [] },
              ],
            },
          ],
        },
      ],
    };

    const result = parsePhysExamJson(raw);
    expect(result).toHaveLength(4);
    expect(result[0].sectionKey).toBe('Head');
    expect(result[0].categoryLabel).toBe('Eyes');
    expect(result[2].categoryLabel).toBe('Ears');
    expect(result[3].sectionKey).toBe('Chest');
  });
});
