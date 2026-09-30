import { describe, expect, it } from 'vitest';
import {
  JOB_AID_ABDOMINAL_REGIONS,
  JOB_AID_FALLBACK,
  JOB_AID_THYROID_SWELLING,
  jobAidFallbackFor,
  validationMessageForReason,
  VALIDATION_ALL_COMPULSORY,
  VALIDATION_ENTER_VALUE,
  VALIDATION_OUT_OF_RANGE,
  VALIDATION_SELECT_OPTION,
  VALIDATION_UPLOAD_CAPTURED_IMAGE,
} from '../../../../modules/ayu/utils/ayu.constants';

describe('ayu.constants', () => {
  describe('JOB_AID_FALLBACK', () => {
    it('maps Abdomen "tenderness" to abdominal regions asset key', () => {
      expect(JOB_AID_FALLBACK['abdomen|tenderness']).toBe(
        JOB_AID_ABDOMINAL_REGIONS
      );
      expect(JOB_AID_FALLBACK['abdomen|tenderness']).toBe('abdominalregions9');
    });

    it('maps Neck "thyroid swelling" to thyroid swelling asset key', () => {
      expect(JOB_AID_FALLBACK['neck|thyroid swelling']).toBe(
        JOB_AID_THYROID_SWELLING
      );
      expect(JOB_AID_FALLBACK['neck|thyroid swelling']).toBe('thyroidswelling');
    });

    it('returns undefined for unmapped keys', () => {
      expect(JOB_AID_FALLBACK['jaundice']).toBeUndefined();
    });

    it('has exactly 2 entries', () => {
      expect(Object.keys(JOB_AID_FALLBACK)).toHaveLength(2);
    });

    it('uses lowercase keys for case-insensitive lookup', () => {
      Object.keys(JOB_AID_FALLBACK).forEach(key => {
        expect(key).toBe(key.toLowerCase());
      });
    });
  });

  describe('jobAidFallbackFor', () => {
    it('returns the abdominal regions image for Abdomen > Tenderness', () => {
      expect(jobAidFallbackFor('Abdomen', 'Tenderness')).toBe(
        JOB_AID_ABDOMINAL_REGIONS
      );
    });

    it('returns the thyroid image for Neck > Thyroid swelling', () => {
      expect(jobAidFallbackFor('Neck', 'Thyroid swelling')).toBe(
        JOB_AID_THYROID_SWELLING
      );
    });

    it.each(['Joint', 'Back'])(
      'returns undefined for %s > Tenderness (abdomen image must not leak)',
      section => {
        expect(jobAidFallbackFor(section, 'Tenderness')).toBeUndefined();
      }
    );

    it.each([
      ['Abdomen*', 'Tenderness', JOB_AID_ABDOMINAL_REGIONS],
      ['Abdomen', 'Tenderness*', JOB_AID_ABDOMINAL_REGIONS],
      [' Abdomen * ', ' Tenderness ', JOB_AID_ABDOMINAL_REGIONS],
      ['Neck**', 'Thyroid swelling *', JOB_AID_THYROID_SWELLING],
    ])(
      'tolerates trailing asterisk and whitespace: "%s" > "%s"',
      (section, question, expected) => {
        expect(jobAidFallbackFor(section, question)).toBe(expected);
      }
    );

    it('does not treat an asterisk inside the key as a marker', () => {
      expect(jobAidFallbackFor('Ab*domen', 'Tenderness')).toBeUndefined();
    });

    it('returns undefined when the section or question key is missing', () => {
      expect(jobAidFallbackFor(undefined, 'Tenderness')).toBeUndefined();
      expect(jobAidFallbackFor('Abdomen', undefined)).toBeUndefined();
    });

    it('returns undefined for empty-string section and/or question keys', () => {
      expect(jobAidFallbackFor('', 'Tenderness')).toBeUndefined();
      expect(jobAidFallbackFor('Abdomen', '')).toBeUndefined();
      expect(jobAidFallbackFor('', '')).toBeUndefined();
    });

    it('returns undefined for keys containing other special characters', () => {
      expect(jobAidFallbackFor('Abdomen!', 'Tenderness')).toBeUndefined();
      expect(jobAidFallbackFor('Abdomen', 'Tenderness?')).toBeUndefined();
      expect(jobAidFallbackFor('Abdo|men', 'Tenderness')).toBeUndefined();
    });
  });

  describe('validationMessageForReason', () => {
    it('returns upload captured image message for "uploadImage" reason', () => {
      expect(validationMessageForReason('uploadImage')).toBe(
        VALIDATION_UPLOAD_CAPTURED_IMAGE
      );
    });

    it('returns upload captured image message for "uploadCapturedImage" reason', () => {
      expect(validationMessageForReason('uploadCapturedImage')).toBe(
        VALIDATION_UPLOAD_CAPTURED_IMAGE
      );
    });

    it('returns all compulsory message for "allCompulsory" reason', () => {
      expect(validationMessageForReason('allCompulsory')).toBe(
        VALIDATION_ALL_COMPULSORY
      );
    });

    it('returns enter value message for "enterValue" reason', () => {
      expect(validationMessageForReason('enterValue')).toBe(
        VALIDATION_ENTER_VALUE
      );
    });

    it('returns out of range message for "outOfRange" reason', () => {
      expect(validationMessageForReason('outOfRange')).toBe(
        VALIDATION_OUT_OF_RANGE
      );
    });

    it('returns "Please answer Question N before proceeding" for outOfRange with questionNumber', () => {
      const result = validationMessageForReason('outOfRange', 7);
      expect(result).toBe('Please answer Question 7 before proceeding');
    });

    it('returns select option message for undefined reason (default)', () => {
      expect(validationMessageForReason(undefined)).toBe(
        VALIDATION_SELECT_OPTION
      );
    });

    it('prepends "Question N:" for uploadImage with questionNumber', () => {
      const result = validationMessageForReason('uploadImage', 3);
      expect(result).toBe(`Question 3: ${VALIDATION_UPLOAD_CAPTURED_IMAGE}`);
    });

    it('prepends "Question N:" for uploadCapturedImage with questionNumber', () => {
      const result = validationMessageForReason('uploadCapturedImage', 5);
      expect(result).toBe(`Question 5: ${VALIDATION_UPLOAD_CAPTURED_IMAGE}`);
    });

    it('returns "Please answer Question N before proceeding" for allCompulsory with questionNumber', () => {
      const result = validationMessageForReason('allCompulsory', 2);
      expect(result).toBe('Please answer Question 2 before proceeding');
    });

    it('returns "Please answer Question N before proceeding" for enterValue with questionNumber', () => {
      const result = validationMessageForReason('enterValue', 4);
      expect(result).toBe('Please answer Question 4 before proceeding');
    });

    it('returns "Please answer Question N before proceeding" for default reason with questionNumber', () => {
      const result = validationMessageForReason(undefined, 1);
      expect(result).toBe('Please answer Question 1 before proceeding');
    });

    it('does not prepend question number when questionNumber is 0 (falsy)', () => {
      const result = validationMessageForReason('allCompulsory', 0);
      expect(result).toBe(VALIDATION_ALL_COMPULSORY);
    });

    it('returns systolic BP range message when outOfRangeText contains "systolic"', () => {
      const result = validationMessageForReason('outOfRange', undefined, 'Enter systolic BP');
      expect(result).toBe('Systolic BP must be between 60–260');
    });

    it('returns diastolic BP range message when outOfRangeText contains "diastolic"', () => {
      const result = validationMessageForReason('outOfRange', undefined, 'Enter diastolic BP');
      expect(result).toBe('Diastolic BP must be between 30–150');
    });

    it('returns generic out-of-range message when outOfRangeText has no BP keyword', () => {
      const result = validationMessageForReason('outOfRange', undefined, 'Enter pulse rate');
      expect(result).toBe(VALIDATION_OUT_OF_RANGE);
    });

    it('returns generic out-of-range message when outOfRangeText is undefined', () => {
      const result = validationMessageForReason('outOfRange', undefined, undefined);
      expect(result).toBe(VALIDATION_OUT_OF_RANGE);
    });

    it('returns "Please answer Question N" for outOfRange with questionNumber and systolic text', () => {
      const result = validationMessageForReason('outOfRange', 5, 'Enter systolic BP');
      expect(result).toBe('Please answer Question 5 before proceeding');
    });
  });
});
