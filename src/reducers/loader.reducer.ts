import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface LoaderState {
  globalLoading: boolean;
  globalCount: number;
  sections: Record<string, number>; // sectionId -> count
}

const initialState: LoaderState = {
  globalLoading: false,
  globalCount: 0,
  sections: {},
};
const loaderSlice = createSlice({
  name: 'loader',
  initialState,
  reducers: {
    startLoading: (state, action: PayloadAction<string | undefined>) => {
      const id = action.payload;
      if (id) {
        state.sections[id] = (state.sections[id] || 0) + 1; //multiple api call
      } else {
        state.globalCount += 1; // multiple api call
        state.globalLoading = true;
      }
    },

    stopLoading: (state, action: PayloadAction<string | undefined>) => {
      const id = action.payload;
      if (id) {
        if (state.sections[id]) {
          state.sections[id] = Math.max(0, state.sections[id] - 1);
          if (state.sections[id] === 0) delete state.sections[id];
        }
      } else {
        state.globalCount = Math.max(0, state.globalCount - 1);
        state.globalLoading = state.globalCount > 0;
      }
    },
    resetLoader: () => initialState,
  },
});

export const loaderReducer = loaderSlice.reducer;
export const { startLoading, stopLoading } = loaderSlice.actions;
export default loaderSlice.reducer;
