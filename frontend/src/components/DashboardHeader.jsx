import { GraduationCap, LogOut, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import NotificationToast from './NotificationToast';
import ChangePassword from './ChangePassword';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, selectAuth } from '../store/slices/authSlice';

export default function DashboardHeader({ title, userRole }) {
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuth);
  const { logout: contextLogout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleLogout = async () => {
    try {
      // Dispatch Redux logout action
      await dispatch(logoutUser()).unwrap();
      // Also call context logout for navigation
      await contextLogout();
      showNotification('Logged out successfully!', 'success');
    } catch (err) {
      showNotification('Failed to logout', 'error');
    }
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    handleLogout();
  };

  // Role-based styling (using full class names for Tailwind)
  const roleStyles = {
    student: {
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      userIconColor: 'text-blue-600'
    },
    teacher: {
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      userIconColor: 'text-green-600'
    },
    admin: {
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
      userIconColor: 'text-purple-600'
    },
    superadmin: {
      iconColor: 'text-red-600',
      bgColor: 'bg-red-100',
      userIconColor: 'text-red-600'
    }
  };

  const currentRole = userRole || user?.role || 'student';
  const styles = roleStyles[currentRole] || roleStyles.student;

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 ml-5">
            {/* Left: Logo and Title */}
            <div className="flex items-center space-x-2">
              <GraduationCap className={`w-8 h-8 ${styles.iconColor}`} />
              <span className="text-xl font-bold text-slate-900">{title}</span>
            </div>

            {/* Right: User Info and Logout */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 ">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{user?.name || 'User'}</p>
                  <div className="flex items-center justify-end gap-2">
                    <p className="text-xs text-slate-600">
                      {user?.studentId || user?.teacherId || 
                       (currentRole === 'admin' ? 'Administrator' : currentRole ? currentRole.charAt(0).toUpperCase() + currentRole.slice(1) : 'User')}
                    </p>
                    {currentRole === 'student' && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <span>Grade {user?.grade || '—'}</span>
                        <span>•</span>
                        <span>Sec {user?.section || 'Not assigned'}</span>
                      </span>
                    )}
                    {currentRole === 'superadmin' && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-semibold">
                        <span>🔐 System Admin</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-10 h-10 ${styles.bgColor} rounded-full flex items-center justify-center`}>
                  <User className={`w-5 h-5 ${styles.userIconColor}`} />
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => setShowChangePassword(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors duration-200"
                title="Change Password"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Password</span>
              </button>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 "
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirm Logout</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Change Password Modal */}
      <ChangePassword 
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        showNotification={showNotification}
      />
    </>
  );
}
