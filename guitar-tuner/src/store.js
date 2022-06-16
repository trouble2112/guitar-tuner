import { configureStore } from "@reduxjs/toolkit";
import noteReducer from "./components/noteSlice";

export default configureStore({
  reducer: {
    note: noteReducer,
  },
});
