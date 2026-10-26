import { describe, expect, it } from 'vitest';
import reducer, {
  clearAllErrors,
  clearError,
  hideNotification,
  selectUI,
  setError,
  setLoading,
  setSidebarOpen,
  showNotification,
  toggleSidebar
} from './uiSlice';

describe('uiSlice', () => {
  it('creates and hides notifications', () => {
    const shown = reducer(undefined, showNotification({ message: 'Saved', type: 'success' }));

    expect(shown.notification.message).toBe('Saved');
    expect(shown.notification.type).toBe('success');

    const hidden = reducer(shown, hideNotification());

    expect(hidden.notification).toBeNull();
  });

  it('toggles sidebar and sets it explicitly', () => {
    const toggled = reducer(undefined, toggleSidebar());
    expect(toggled.sidebarOpen).toBe(false);

    const open = reducer(toggled, setSidebarOpen(true));
    expect(open.sidebarOpen).toBe(true);
  });

  it('manages loading and error state by key', () => {
    const loadingState = reducer(undefined, setLoading({ key: 'dashboard', value: true }));
    const errorState = reducer(loadingState, setError({ key: 'dashboard', value: 'Failed' }));
    const clearedErrorState = reducer(errorState, clearError('dashboard'));
    const clearedAllState = reducer(clearedErrorState, clearAllErrors());

    expect(loadingState.loading.dashboard).toBe(true);
    expect(errorState.errors.dashboard).toBe('Failed');
    expect(clearedErrorState.errors.dashboard).toBeUndefined();
    expect(clearedAllState.errors).toEqual({});
  });

  it('selects the ui slice', () => {
    const state = selectUI({ ui: { notification: null, sidebarOpen: true } });

    expect(state).toEqual({ notification: null, sidebarOpen: true });
  });
});