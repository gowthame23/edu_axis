import { createContext, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, logoutUser } from '../store/slices/authSlice';
import { selectAuth } from '../store/store';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector(selectAuth);

  // Restore user from localStorage on mount (if not already in Redux)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        if (!user) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            dispatch(setUser(userData));
          }
        }
      } catch (error) {
        console.error('Error restoring user session:', error);
        localStorage.removeItem('user');
      }
    };

    restoreSession();
  }, [dispatch, user]);

  const login = (userData) => {
    if (!userData || !userData.role) {
      console.error('Valid user data with role is required for login');
      return false;
    }
    
    dispatch(setUser(userData));
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Navigate to appropriate dashboard
    if (userData.role === 'student') {
      navigate('/student/home');
    } else if (userData.role === 'teacher') {
      navigate('/teacher/home');
    } else if (userData.role === 'admin') {
      navigate('/administrator/home');
    }
    
    return true;
  };

  const logout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigate('/');
    }
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
