import { createSlice } from "@reduxjs/toolkit";

export const noteSlice = createSlice({
  name: "note",
  initialState: {
    data: {
      S6: { frequency: 82.41, sn: 6, name: "E" },
      S5: { frequency: 110, sn: 5, name: "A" },
      S4: { frequency: 146.83, sn: 4, name: "D" },
      S3: { frequency: 196, sn: 3, name: "G" },
      S2: { frequency: 246.94, sn: 2, name: "B" },
      S1: { frequency: 329.63, sn: 1, name: "E" },
      selected: null,
    },
  },
  reducers: {
    updateData: (state, action) => {
      state.data = { ...state.data, ...action.payload };
    },
    updateSelected: (state, action) => {
      state.data = { ...state.data, selected: action.payload };
    },
  },
});

export const { updateData, updateSelected } = noteSlice.actions;

export default noteSlice.reducer;
