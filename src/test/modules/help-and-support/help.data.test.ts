import { describe, expect, it } from 'vitest';
import {
  helpCategories,
  videoCategories,
  videoList,
  questionAnswerList,
} from '../../../assets/data/help.data';
import type { HelpVideoProps, HelpFaqProps } from '../../../assets/data/help.data';

describe('help.data', () => {
  describe('helpCategories', () => {
    it('should be an array of strings', () => {
      expect(Array.isArray(helpCategories)).toBe(true);
      helpCategories.forEach(category => {
        expect(typeof category).toBe('string');
      });
    });

    it('should contain expected categories', () => {
      expect(helpCategories).toEqual([
        'All',
        'Check-up',
        'Appointment',
        'Registration',
        'Visit',
      ]);
    });

    it('should have "All" as the first category', () => {
      expect(helpCategories[0]).toBe('All');
    });
  });

  describe('videoCategories', () => {
    it('should be an array of strings', () => {
      expect(Array.isArray(videoCategories)).toBe(true);
      videoCategories.forEach(category => {
        expect(typeof category).toBe('string');
      });
    });

    it('should contain expected categories', () => {
      expect(videoCategories).toEqual([
        'All',
        'Check-up',
        'Appointment',
        'Registration',
        'Visit',
      ]);
    });
  });

  describe('videoList', () => {
    it('should be a non-empty array', () => {
      expect(Array.isArray(videoList)).toBe(true);
      expect(videoList.length).toBeGreaterThan(0);
    });

    it('should have required properties on each video', () => {
      videoList.forEach(video => {
        expect(video).toHaveProperty('title');
        expect(video).toHaveProperty('duration');
        expect(video).toHaveProperty('thumbnail');
        expect(video).toHaveProperty('videoUrl');
        expect(video).toHaveProperty('category');
      });
    });

    it('should have valid string values for all properties', () => {
      videoList.forEach(video => {
        expect(typeof video.title).toBe('string');
        expect(typeof video.duration).toBe('string');
        expect(typeof video.thumbnail).toBe('string');
        expect(typeof video.videoUrl).toBe('string');
        expect(typeof video.category).toBe('string');
      });
    });

    it('should have categories that exist in helpCategories (excluding "All")', () => {
      const validCategories = helpCategories.filter(c => c !== 'All');
      videoList.forEach(video => {
        expect(validCategories).toContain(video.category);
      });
    });
  });

  describe('questionAnswerList', () => {
    it('should be a non-empty array', () => {
      expect(Array.isArray(questionAnswerList)).toBe(true);
      expect(questionAnswerList.length).toBeGreaterThan(0);
    });

    it('should have required properties on each item', () => {
      questionAnswerList.forEach(item => {
        expect(item).toHaveProperty('question');
        expect(item).toHaveProperty('answer');
        expect(item).toHaveProperty('category');
      });
    });

    it('should have valid string values for all properties', () => {
      questionAnswerList.forEach(item => {
        expect(typeof item.question).toBe('string');
        expect(typeof item.answer).toBe('string');
        expect(typeof item.category).toBe('string');
      });
    });

    it('should have categories that exist in helpCategories (excluding "All")', () => {
      const validCategories = helpCategories.filter(c => c !== 'All');
      questionAnswerList.forEach(item => {
        expect(validCategories).toContain(item.category);
      });
    });
  });

  describe('Type exports', () => {
    it('should have valid HelpVideoProps type', () => {
      const props: HelpVideoProps = {
        searchQuery: 'test',
        onSearchChange: () => {},
        showAll: true,
      };
      expect(props.searchQuery).toBe('test');
      expect(props.showAll).toBe(true);
    });

    it('should allow optional properties in HelpVideoProps', () => {
      const props: HelpVideoProps = {};
      expect(props.searchQuery).toBeUndefined();
      expect(props.onSearchChange).toBeUndefined();
      expect(props.showAll).toBeUndefined();
    });

    it('should have valid HelpFaqProps type', () => {
      const props: HelpFaqProps = {
        searchQuery: 'test',
        onSearchChange: () => {},
      };
      expect(props.searchQuery).toBe('test');
    });

    it('should allow optional properties in HelpFaqProps', () => {
      const props: HelpFaqProps = {};
      expect(props.searchQuery).toBeUndefined();
      expect(props.onSearchChange).toBeUndefined();
    });
  });
});
