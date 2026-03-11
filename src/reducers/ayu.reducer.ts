import type { AyuJsonItem } from '../modules/ayu-library/types/ayu-json.types';

interface AyuState {
  keyName: string | null;
  list: AyuJsonItem[];
}

const initialState: AyuState = {
  keyName: null,
  list: [] as AyuJsonItem[],
};

export type AuthAction = {
  type: 'SET_AYU_JSON_LIST';
  payload: { keyName: string; list: AyuJsonItem[] };
};

export const setAyuJsonList = (keyName: string, list: AyuJsonItem[]) => ({
  type: 'SET_AYU_JSON_LIST',
  payload: { keyName, list },
});

export const ayuReducer = (
  state = initialState,
  action: AuthAction | { type: string }
): AyuState => {
  switch (action.type) {
    case 'SET_AYU_JSON_LIST':
      return {
        ...state,
        keyName: (action as AuthAction).payload.keyName,
        list: (action as AuthAction).payload.list,
      };
    default:
      return state;
  }
};
