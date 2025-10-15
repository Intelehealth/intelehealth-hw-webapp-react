import { describe, expect, it } from 'vitest';
import { loaderReducer, startLoading, stopLoading } from '../../reducers/loader.reducer';

describe('loaderReducer', () => {
  const initialState = {
    globalLoading: false,
    globalCount: 0,
    sections: {},
  };

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = loaderReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('startLoading', () => {
    it('should start global loading when no section ID provided', () => {
      const action = startLoading();
      const state = loaderReducer(initialState, action);

      expect(state.globalLoading).toBe(true);
      expect(state.globalCount).toBe(1);
      expect(state.sections).toEqual({});
    });

    it('should increment global count for multiple global loading calls', () => {
      let state = loaderReducer(initialState, startLoading());
      expect(state.globalCount).toBe(1);

      state = loaderReducer(state, startLoading());
      expect(state.globalCount).toBe(2);

      state = loaderReducer(state, startLoading());
      expect(state.globalCount).toBe(3);
      expect(state.globalLoading).toBe(true);
    });

    it('should start section loading when section ID provided', () => {
      const action = startLoading('section1');
      const state = loaderReducer(initialState, action);

      expect(state.globalLoading).toBe(false);
      expect(state.globalCount).toBe(0);
      expect(state.sections).toEqual({ section1: 1 });
    });

    it('should increment section count for multiple calls with same section ID', () => {
      let state = loaderReducer(initialState, startLoading('section1'));
      expect(state.sections.section1).toBe(1);

      state = loaderReducer(state, startLoading('section1'));
      expect(state.sections.section1).toBe(2);

      state = loaderReducer(state, startLoading('section1'));
      expect(state.sections.section1).toBe(3);
    });

    it('should handle multiple different sections', () => {
      let state = loaderReducer(initialState, startLoading('section1'));
      state = loaderReducer(state, startLoading('section2'));
      state = loaderReducer(state, startLoading('section1'));

      expect(state.sections).toEqual({
        section1: 2,
        section2: 1,
      });
      expect(state.globalLoading).toBe(false);
      expect(state.globalCount).toBe(0);
    });

    it('should handle mixed global and section loading', () => {
      let state = loaderReducer(initialState, startLoading());
      state = loaderReducer(state, startLoading('section1'));
      state = loaderReducer(state, startLoading());

      expect(state.globalLoading).toBe(true);
      expect(state.globalCount).toBe(2);
      expect(state.sections).toEqual({ section1: 1 });
    });

    it('should handle undefined section ID', () => {
      const action = startLoading(undefined);
      const state = loaderReducer(initialState, action);

      expect(state.globalLoading).toBe(true);
      expect(state.globalCount).toBe(1);
      expect(state.sections).toEqual({});
    });

    it('should handle empty string section ID', () => {
      const action = startLoading('');
      const state = loaderReducer(initialState, action);

      expect(state.globalLoading).toBe(true); // Empty string is falsy, so treated as global
      expect(state.globalCount).toBe(1);
      expect(state.sections).toEqual({});
    });
  });

  describe('stopLoading', () => {
    it('should stop global loading when no section ID provided', () => {
      const stateWithLoading = {
        globalLoading: true,
        globalCount: 1,
        sections: {},
      };

      const action = stopLoading();
      const state = loaderReducer(stateWithLoading, action);

      expect(state.globalLoading).toBe(false);
      expect(state.globalCount).toBe(0);
    });

    it('should decrement global count for multiple global loading calls', () => {
      const stateWithMultipleLoading = {
        globalLoading: true,
        globalCount: 3,
        sections: {},
      };

      let state = loaderReducer(stateWithMultipleLoading, stopLoading());
      expect(state.globalCount).toBe(2);
      expect(state.globalLoading).toBe(true);

      state = loaderReducer(state, stopLoading());
      expect(state.globalCount).toBe(1);
      expect(state.globalLoading).toBe(true);

      state = loaderReducer(state, stopLoading());
      expect(state.globalCount).toBe(0);
      expect(state.globalLoading).toBe(false);
    });

    it('should stop section loading when section ID provided', () => {
      const stateWithSectionLoading = {
        globalLoading: false,
        globalCount: 0,
        sections: { section1: 1 },
      };

      const action = stopLoading('section1');
      const state = loaderReducer(stateWithSectionLoading, action);

      expect(state.sections).toEqual({});
      expect(state.globalLoading).toBe(false);
      expect(state.globalCount).toBe(0);
    });

    it('should decrement section count for multiple calls with same section ID', () => {
      const stateWithMultipleSectionLoading = {
        globalLoading: false,
        globalCount: 0,
        sections: { section1: 3 },
      };

      let state = loaderReducer(stateWithMultipleSectionLoading, stopLoading('section1'));
      expect(state.sections.section1).toBe(2);

      state = loaderReducer(state, stopLoading('section1'));
      expect(state.sections.section1).toBe(1);

      state = loaderReducer(state, stopLoading('section1'));
      expect(state.sections).toEqual({});
    });

    it('should handle stopping non-existent section', () => {
      const action = stopLoading('nonexistent');
      const state = loaderReducer(initialState, action);

      expect(state.sections).toEqual({});
      expect(state.globalLoading).toBe(false);
      expect(state.globalCount).toBe(0);
    });

    it('should handle stopping section with count 0', () => {
      const stateWithZeroCount = {
        globalLoading: false,
        globalCount: 0,
        sections: { section1: 0 },
      };

      const action = stopLoading('section1');
      const state = loaderReducer(stateWithZeroCount, action);

      expect(state.sections).toEqual({ section1: 0 }); // Section with 0 count is not deleted
    });

    it('should handle stopping global loading when count is 0', () => {
      const stateWithZeroGlobalCount = {
        globalLoading: false,
        globalCount: 0,
        sections: {},
      };

      const action = stopLoading();
      const state = loaderReducer(stateWithZeroGlobalCount, action);

      expect(state.globalCount).toBe(0);
      expect(state.globalLoading).toBe(false);
    });

    it('should handle mixed global and section stopping', () => {
      const mixedState = {
        globalLoading: true,
        globalCount: 2,
        sections: { section1: 2, section2: 1 },
      };

      let state = loaderReducer(mixedState, stopLoading());
      expect(state.globalCount).toBe(1);
      expect(state.globalLoading).toBe(true);

      state = loaderReducer(state, stopLoading('section1'));
      expect(state.sections).toEqual({ section1: 1, section2: 1 });

      state = loaderReducer(state, stopLoading('section2'));
      expect(state.sections).toEqual({ section1: 1 });

      state = loaderReducer(state, stopLoading());
      expect(state.globalCount).toBe(0);
      expect(state.globalLoading).toBe(false);
    });

    it('should handle undefined section ID', () => {
      const stateWithLoading = {
        globalLoading: true,
        globalCount: 1,
        sections: {},
      };

      const action = stopLoading(undefined);
      const state = loaderReducer(stateWithLoading, action);

      expect(state.globalLoading).toBe(false);
      expect(state.globalCount).toBe(0);
    });

    it('should handle empty string section ID', () => {
      const stateWithEmptySection = {
        globalLoading: false,
        globalCount: 0,
        sections: { '': 1 },
      };

      const action = stopLoading('');
      const state = loaderReducer(stateWithEmptySection, action);

      expect(state.sections).toEqual({ '': 1 }); // Empty string section is not deleted
    });
  });

  describe('resetLoader', () => {
    it('should reset to initial state', () => {
      const complexState = {
        globalLoading: true,
        globalCount: 5,
        sections: { section1: 3, section2: 2, section3: 1 },
      };

      const action = { type: 'loader/resetLoader' };
      const state = loaderReducer(complexState, action);

      expect(state).toEqual(initialState);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle complete loading cycle', () => {
      let state = loaderReducer(initialState, startLoading());
      expect(state.globalLoading).toBe(true);
      expect(state.globalCount).toBe(1);

      state = loaderReducer(state, startLoading('section1'));
      expect(state.sections.section1).toBe(1);

      state = loaderReducer(state, stopLoading('section1'));
      expect(state.sections).toEqual({});

      state = loaderReducer(state, stopLoading());
      expect(state.globalLoading).toBe(false);
      expect(state.globalCount).toBe(0);
    });

    it('should handle multiple sections with different counts', () => {
      let state = loaderReducer(initialState, startLoading('section1'));
      state = loaderReducer(state, startLoading('section1'));
      state = loaderReducer(state, startLoading('section2'));
      state = loaderReducer(state, startLoading('section1'));

      expect(state.sections).toEqual({
        section1: 3,
        section2: 1,
      });

      state = loaderReducer(state, stopLoading('section1'));
      expect(state.sections).toEqual({
        section1: 2,
        section2: 1,
      });

      state = loaderReducer(state, stopLoading('section2'));
      expect(state.sections).toEqual({
        section1: 2,
      });

      state = loaderReducer(state, stopLoading('section1'));
      state = loaderReducer(state, stopLoading('section1'));
      expect(state.sections).toEqual({});
    });

    it('should handle rapid start/stop cycles', () => {
      let state = loaderReducer(initialState, startLoading('section1'));
      state = loaderReducer(state, stopLoading('section1'));
      state = loaderReducer(state, startLoading('section1'));
      state = loaderReducer(state, startLoading('section1'));
      state = loaderReducer(state, stopLoading('section1'));

      expect(state.sections).toEqual({ section1: 1 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large counts', () => {
      const stateWithLargeCount = {
        globalLoading: true,
        globalCount: 1000,
        sections: { section1: 500 },
      };

      let state = loaderReducer(stateWithLargeCount, stopLoading());
      expect(state.globalCount).toBe(999);

      state = loaderReducer(state, stopLoading('section1'));
      expect(state.sections.section1).toBe(499);
    });

    it('should handle negative counts gracefully', () => {
      const stateWithNegativeCount = {
        globalLoading: false,
        globalCount: -1,
        sections: { section1: -1 },
      };

      let state = loaderReducer(stateWithNegativeCount, stopLoading());
      expect(state.globalCount).toBe(0);

      state = loaderReducer(state, stopLoading('section1'));
      expect(state.sections).toEqual({});
    });

    it('should handle special characters in section IDs', () => {
      const specialSectionId = 'section-with-special-chars_123!@#';
      let state = loaderReducer(initialState, startLoading(specialSectionId));
      expect(state.sections[specialSectionId]).toBe(1);

      state = loaderReducer(state, stopLoading(specialSectionId));
      expect(state.sections).toEqual({});
    });
  });

  describe('Type Safety', () => {
    it('should maintain correct types for all state properties', () => {
      let state = loaderReducer(initialState, startLoading());
      expect(typeof state.globalLoading).toBe('boolean');
      expect(typeof state.globalCount).toBe('number');
      expect(typeof state.sections).toBe('object');

      state = loaderReducer(state, startLoading('section1'));
      expect(typeof state.sections.section1).toBe('number');
    });
  });
});
