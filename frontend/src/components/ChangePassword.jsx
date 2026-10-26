import { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';

const ChangePassword = ({ isOpen, onClose, showNotification }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      showNotification('All fields are required', 'error');
      return;
    }

    if (formData.newPassword.length < 6) {
      showNotification('New password must be at least 6 characters long', 'error');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      showNotification('New password must be different from current password', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        showNotification(response.data.message || 'Password changed successfully', 'success');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        onClose();
      } else {
        showNotification(response.data.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Change password error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to change password';
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Change Password</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter new password (min. 6 characters)"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-800 font-medium mb-1">Password Requirements:</p>
            <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
              <li>At least 6 characters long</li>
              <li>Must be different from current password</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
