import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notification: null,
  sidebarOpen: true,
  loading: {},
  errors: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showNotification: (state, action) => {
      state.notification = {
        message: action.payload.message,
        type: action.payload.type || 'success',
        timestamp: Date.now(),
      };
    },
    hideNotification: (state) => {
      state.notification = null;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    setError: (state, action) => {
      const { key, value } = action.payload;
      state.errors[key] = value;
    },
    clearError: (state, action) => {
      const key = action.payload;
      delete state.errors[key];
    },
    clearAllErrors: (state) => {
      state.errors = {};
    },
  },
});

export const {
  showNotification,
  hideNotification,
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  setError,
  clearError,
  clearAllErrors,
} = uiSlice.actions;

// Selectors
export const selectUI = (state) => state.ui;

export default uiSlice.reducer;
