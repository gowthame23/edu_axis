import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn()
  }
}));

import reducer, { clearAuth, clearError, loginUser, selectAuth, setUser } from './authSlice';

describe('authSlice', () => {
  beforeEach(() => {
    global.localStorage = {
      setItem: vi.fn(),
      removeItem: vi.fn(),
      getItem: vi.fn(),
      clear: vi.fn()
    };
  });

  it('sets the user and authentication flag', () => {
    const state = reducer(undefined, setUser({ _id: '1', role: 'student' }));

    expect(state.user).toEqual({ _id: '1', role: 'student' });
    expect(state.isAuthenticated).toBe(true);
  });

  it('clears auth state on clearAuth', () => {
    const currentState = {
      user: { _id: '1' },
      isAuthenticated: true,
      loading: false,
      error: 'boom'
    };

    const state = reducer(currentState, clearAuth());

    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBeNull();
  });

  it('stores the logged-in user when login succeeds', () => {
    const action = {
      type: loginUser.fulfilled.type,
      payload: { user: { _id: '7', name: 'Admin User' } }
    };

    const state = reducer(undefined, action);

    expect(state.loading).toBe(false);
    expect(state.user).toEqual({ _id: '7', name: 'Admin User' });
    expect(state.isAuthenticated).toBe(true);
    expect(global.localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ _id: '7', name: 'Admin User' }));
  });

  it('captures login errors and marks the user unauthenticated', () => {
    const state = reducer(undefined, {
      type: loginUser.rejected.type,
      payload: 'Login failed'
    });

    expect(state.loading).toBe(false);
    expect(state.error).toBe('Login failed');
    expect(state.isAuthenticated).toBe(false);
  });

  it('selects the auth slice', () => {
    const state = selectAuth({ auth: { user: null, isAuthenticated: false } });

    expect(state).toEqual({ user: null, isAuthenticated: false });
  });
});