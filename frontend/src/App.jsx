import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import Login from './components/Login'
import Register from './components/Register'
import SuperAdminLogin from './components/SuperAdminLogin'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import AdminDashboard from './pages/AdminDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'

const getDashboardPathByRole = (role) => {
  switch (role) {
    case 'student':
      return '/student/home';
    case 'teacher':
      return '/teacher/home';
    case 'admin':
      return '/administrator/home';
    case 'superadmin':
      return '/superadmin/home';
    default:
      return '/';
  }
};

function AppContent() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleShowLogin = () => {
    setShowLogin(true);
    setShowRegister(false);
  };

  const handleShowRegister = () => {
    setShowRegister(true);
    setShowLogin(false);
  };

  const handleCloseModals = () => {
    setShowLogin(false);
    setShowRegister(false);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Secret Super Admin Login Route */}
      <Route 
        path="/system-access" 
        element={
          user?.role === 'superadmin' ? (
            <Navigate to="/superadmin/home" replace />
          ) : (
            <SuperAdminLogin />
          )
        } 
      />
      
      {/* Landing Page Route - only accessible when not logged in */}
      <Route 
        path="/" 
        element={
          user ? (
            <Navigate to={getDashboardPathByRole(user.role)} replace />
          ) : (
            <>
              <LandingPage 
                onShowLogin={handleShowLogin} 
                onShowRegister={handleShowRegister} 
              />
              {showLogin && (
                <Login 
                  onClose={handleCloseModals}
                  onSwitchToRegister={handleShowRegister}
                />
              )}
              {showRegister && (
                <Register 
                  onClose={handleCloseModals}
                  onSwitchToLogin={handleShowLogin}
                />
              )}
            </>
          )
        } 
      />
      
      {/* Student Routes */}
      <Route 
        path="/student/*" 
        element={
          user?.role === 'student' ? (
            <StudentDashboard />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      
      {/* Teacher Routes */}
      <Route 
        path="/teacher/*" 
        element={
          user?.role === 'teacher' ? (
            <TeacherDashboard />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      
      {/* Administrator Routes */}
      <Route 
        path="/administrator/*" 
        element={
          user?.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      
      {/* Super Admin Routes */}
      <Route 
        path="/superadmin/*" 
        element={
          user?.role === 'superadmin' ? (
            <SuperAdminDashboard />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      
      {/* Catch all - redirect to landing or dashboard */}
      <Route 
        path="*" 
        element={
          user ? (
            <Navigate to={getDashboardPathByRole(user.role)} replace />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
    </Routes>
  )
}

function App() {
  return <AppContent />;
}

export default App
