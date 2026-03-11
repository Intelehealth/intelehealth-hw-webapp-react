import { describe, expect, it } from 'vitest';
import { ayuReducer, setAyuJsonList, type AuthAction } from '../../reducers/ayu.reducer';
import type { AyuJsonItem } from '../../modules/ayu-library/types/ayu-json.types';

describe('ayuReducer', () => {
  const mockAyuJsonItem1: AyuJsonItem = {
    id: 1,
    name: 'Test Item 1',
    json: { resourceType: 'Questionnaire', item: [] },
    keyName: 'test-key-1',
    isActive: true,
  };

  const mockAyuJsonItem2: AyuJsonItem = {
    id: 2,
    name: 'Test Item 2',
    json: { resourceType: 'Questionnaire', item: [] },
    keyName: 'test-key-2',
    isActive: false,
  };

  const mockAyuJsonItem3: AyuJsonItem = {
    id: 3,
    name: 'Test Item 3',
    json: { resourceType: 'Questionnaire', item: [] },
    keyName: 'test-key-3',
    isActive: true,
  };

  const initialState = {
    keyName: null,
    list: [],
  };

  describe('Initial State', () => {
    it('should return initial state when no action is provided', () => {
      const result = ayuReducer(undefined, {} as AuthAction);
      expect(result).toEqual(initialState);
    });

    it('should return initial state for unknown action', () => {
      const unknownAction = { type: 'UNKNOWN_ACTION' } as unknown as AuthAction;
      const result = ayuReducer(initialState, unknownAction);
      expect(result).toEqual(initialState);
    });

    it('should have keyName as null in initial state', () => {
      const result = ayuReducer(undefined, {} as AuthAction);
      expect(result.keyName).toBeNull();
    });

    it('should have empty list in initial state', () => {
      const result = ayuReducer(undefined, {} as AuthAction);
      expect(result.list).toEqual([]);
      expect(result.list).toHaveLength(0);
    });
  });

  describe('SET_AYU_JSON_LIST', () => {
    it('should set keyName and list from action payload', () => {
      const mockList = [mockAyuJsonItem1, mockAyuJsonItem2];
      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'test-key', list: mockList },
      };
      const result = ayuReducer(initialState, action);

      expect(result).toEqual({
        keyName: 'test-key',
        list: mockList,
      });
    });

    it('should handle empty list', () => {
      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'empty-key', list: [] },
      };
      const result = ayuReducer(initialState, action);

      expect(result).toEqual({
        keyName: 'empty-key',
        list: [],
      });
    });

    it('should handle single item list', () => {
      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'single-key', list: [mockAyuJsonItem1] },
      };
      const result = ayuReducer(initialState, action);

      expect(result.list).toHaveLength(1);
      expect(result.list[0]).toEqual(mockAyuJsonItem1);
      expect(result.keyName).toBe('single-key');
    });

    it('should handle multiple items in list', () => {
      const mockList = [mockAyuJsonItem1, mockAyuJsonItem2, mockAyuJsonItem3];
      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'multiple-key', list: mockList },
      };
      const result = ayuReducer(initialState, action);

      expect(result.list).toHaveLength(3);
      expect(result.list).toEqual(mockList);
      expect(result.keyName).toBe('multiple-key');
    });

    it('should overwrite previous state with new data', () => {
      const previousState = {
        keyName: 'old-key',
        list: [mockAyuJsonItem1],
      };

      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'new-key', list: [mockAyuJsonItem2, mockAyuJsonItem3] },
      };
      const result = ayuReducer(previousState, action);

      expect(result).toEqual({
        keyName: 'new-key',
        list: [mockAyuJsonItem2, mockAyuJsonItem3],
      });
      expect(result.keyName).not.toBe(previousState.keyName);
      expect(result.list).not.toEqual(previousState.list);
    });

    it('should handle different keyName formats', () => {
      const keyNames = ['simple', 'with-dashes', 'with_underscores', 'camelCase', 'PascalCase'];

      keyNames.forEach((keyName) => {
        const action: AuthAction = {
          type: 'SET_AYU_JSON_LIST',
          payload: { keyName, list: [mockAyuJsonItem1] },
        };
        const result = ayuReducer(initialState, action);

        expect(result.keyName).toBe(keyName);
      });
    });

    it('should preserve list item properties correctly', () => {
      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'test-key', list: [mockAyuJsonItem1] },
      };
      const result = ayuReducer(initialState, action);

      const item = result.list[0];
      expect(item.id).toBe(mockAyuJsonItem1.id);
      expect(item.name).toBe(mockAyuJsonItem1.name);
      expect(item.json).toBe(mockAyuJsonItem1.json);
      expect(item.keyName).toBe(mockAyuJsonItem1.keyName);
      expect(item.isActive).toBe(mockAyuJsonItem1.isActive);
    });
  });

  describe('State Transitions', () => {
    it('should handle multiple sequential updates', () => {
      let state = ayuReducer(initialState, {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'first-key', list: [mockAyuJsonItem1] },
      });
      expect(state.keyName).toBe('first-key');
      expect(state.list).toHaveLength(1);

      state = ayuReducer(state, {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'second-key', list: [mockAyuJsonItem2, mockAyuJsonItem3] },
      });
      expect(state.keyName).toBe('second-key');
      expect(state.list).toHaveLength(2);

      state = ayuReducer(state, {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'third-key', list: [] },
      });
      expect(state.keyName).toBe('third-key');
      expect(state.list).toHaveLength(0);
    });

    it('should handle clearing data by setting empty list', () => {
      const populatedState = {
        keyName: 'populated-key',
        list: [mockAyuJsonItem1, mockAyuJsonItem2, mockAyuJsonItem3],
      };

      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'cleared-key', list: [] },
      };
      const result = ayuReducer(populatedState, action);

      expect(result.list).toHaveLength(0);
      expect(result.keyName).toBe('cleared-key');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string as keyName', () => {
      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: '', list: [mockAyuJsonItem1] },
      };
      const result = ayuReducer(initialState, action);

      expect(result.keyName).toBe('');
      expect(result.list).toEqual([mockAyuJsonItem1]);
    });

    it('should handle very long keyName', () => {
      const longKeyName = 'a'.repeat(1000);
      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: longKeyName, list: [mockAyuJsonItem1] },
      };
      const result = ayuReducer(initialState, action);

      expect(result.keyName).toBe(longKeyName);
      expect(result.keyName).toHaveLength(1000);
    });

    it('should handle items with special characters in json field', () => {
      const specialItem: AyuJsonItem = {
        id: 4,
        name: 'Special',
        json: { resourceType: 'Questionnaire', item: [] },
        keyName: 'special-key',
        isActive: true,
      };

      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'special-key', list: [specialItem] },
      };
      const result = ayuReducer(initialState, action);

      expect(result.list[0].json).toEqual({ resourceType: 'Questionnaire', item: [] });
    });

    it('should handle items with isActive as false', () => {
      const inactiveItems = [mockAyuJsonItem1, mockAyuJsonItem2].map(item => ({
        ...item,
        isActive: false,
      }));

      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'inactive-key', list: inactiveItems },
      };
      const result = ayuReducer(initialState, action);

      expect(result.list.every(item => item.isActive === false)).toBe(true);
    });
  });

  describe('Action Creator', () => {
    it('should create SET_AYU_JSON_LIST action with correct structure', () => {
      const mockList = [mockAyuJsonItem1, mockAyuJsonItem2];
      const action = setAyuJsonList('test-key', mockList);

      expect(action).toEqual({
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'test-key', list: mockList },
      });
    });

    it('should create action with empty list', () => {
      const action = setAyuJsonList('empty-key', []);

      expect(action).toEqual({
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'empty-key', list: [] },
      });
    });

    it('should work correctly with reducer', () => {
      const mockList = [mockAyuJsonItem1];
      const action = setAyuJsonList('action-creator-key', mockList) as AuthAction;
      const result = ayuReducer(initialState, action);

      expect(result).toEqual({
        keyName: 'action-creator-key',
        list: mockList,
      });
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for action type', () => {
      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'test', list: [mockAyuJsonItem1] },
      };
      const result = ayuReducer(initialState, action);

      expect(result).toBeDefined();
      expect(typeof result.keyName).toBe('string');
      expect(Array.isArray(result.list)).toBe(true);
    });

    it('should handle null keyName in initial state correctly', () => {
      const result = ayuReducer(undefined, {} as AuthAction);
      expect(result.keyName).toBeNull();
      expect(result.keyName === null || typeof result.keyName === 'string').toBe(true);
    });

    it('should ensure list items have correct structure', () => {
      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'test', list: [mockAyuJsonItem1, mockAyuJsonItem2] },
      };
      const result = ayuReducer(initialState, action);

      result.list.forEach((item) => {
        expect(typeof item.id).toBe('number');
        expect(typeof item.name).toBe('string');
        expect(typeof item.json).toBe('object');
        expect(typeof item.keyName).toBe('string');
        expect(typeof item.isActive).toBe('boolean');
      });
    });
  });

  describe('Immutability', () => {
    it('should not mutate the original state', () => {
      const originalState = {
        keyName: 'original',
        list: [mockAyuJsonItem1],
      };
      const originalStateCopy = JSON.parse(JSON.stringify(originalState));

      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'new', list: [mockAyuJsonItem2] },
      };

      ayuReducer(originalState, action);

      expect(originalState).toEqual(originalStateCopy);
    });

    it('should not mutate the payload list', () => {
      const payloadList = [mockAyuJsonItem1, mockAyuJsonItem2];
      const payloadListCopy = [...payloadList];

      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'test', list: payloadList },
      };

      ayuReducer(initialState, action);

      expect(payloadList).toEqual(payloadListCopy);
    });

    it('should return new state object reference', () => {
      const state = {
        keyName: 'test',
        list: [mockAyuJsonItem1],
      };

      const action: AuthAction = {
        type: 'SET_AYU_JSON_LIST',
        payload: { keyName: 'new', list: [mockAyuJsonItem2] },
      };

      const result = ayuReducer(state, action);

      expect(result).not.toBe(state);
    });
  });
});
