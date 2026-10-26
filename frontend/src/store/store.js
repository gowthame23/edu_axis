import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import reducers
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import usersReducer from './slices/usersSlice';
import coursesReducer from './slices/coursesSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  users: usersReducer,
  courses: coursesReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// Export types for TypeScript (optional, but good practice)
export const selectAuth = (state) => state.auth;
export const selectUI = (state) => state.ui;
export const selectUsers = (state) => state.users;
export const selectCourses = (state) => state.courses;
