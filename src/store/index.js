import { configureStore } from '@reduxjs/toolkit';
import modulesReducer from './modulesSlice.js';

export const store = configureStore({
  reducer: {
    modules: modulesReducer
  }
});
