import { useEffect, useRef, useState } from 'react';
import { X, Mail, Lock, User, Phone, Calendar, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, selectAuth } from '../store/slices/authSlice';

export default function Register({ onClose, onSwitchToLogin }) {
  const { login } = useAuth();
  const dispatch = useDispatch();
  const { loading: authLoading, error: authError } = useSelector(selectAuth);
  const dialogRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    phone: '',
    dateOfBirth: '',
    grade: '',
    section: '',
    schoolCode: ''
  });
  const [error, setError] = useState('');
  const loading = authLoading;

  // Sync Redux auth error to local error state
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation
    if (!formData.name || formData.name.length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (!formData.phone) {
      setError('Phone number is required');
      return;
    }

    if (!formData.dateOfBirth) {
      setError('Date of birth is required');
      return;
    }

    // Student-specific validation
    if (formData.role === 'student') {
      const validGrades = ['1','2','3','4','5','6','7','8','9','10','11','12'];
      if (!formData.grade || !validGrades.includes(formData.grade)) {
        setError('Please select a valid grade (1-12)');
        return;
      }
    }

    try {
      // Dispatch registerUser Redux thunk
      const result = await dispatch(registerUser(formData)).unwrap();
      
      if (result.success && result.user) {
        // Cookie is set automatically by backend!
        // Just pass user data to Context for navigation
        const loginSuccess = login(result.user);
        if (loginSuccess !== false) {
          onClose(); // Only close on successful registration
        }
      } else {
        // Registration failed - keep form open and show error
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.message || 
        'Registration failed. Please try again.'
      );
    }
  };

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-scroll scrollbar-hide"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
            <p className="text-slate-600 mt-2">Join EduAxis today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-shake">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Register As
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['student', 'teacher'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData({ ...formData, role })}
                    className={`py-2 px-4 rounded-lg font-medium transition-all ${
                      formData.role === role
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="your.email@example.com"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Use your school email if available</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                School Code
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.schoolCode}
                  onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value.toUpperCase() })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase"
                  placeholder="SCH001"
                  maxLength="10"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Enter your school code or leave blank if using school email domain</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Student: Grade & Section */}
            {formData.role === 'student' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Grade</label>
                    <select
                      required
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                      <option value="" disabled>Select grade</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={String(i+1)}>{i+1}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Section (optional)</label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                      <option value="">I don't know yet</option>
                      {['A','B','C','D'].map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-slate-500">If you don't know your section, choose "I don't know yet". Your section can be assigned by the school later.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Create a strong password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="flex items-start">
              <input type="checkbox" required className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-1" />
              <label className="ml-2 text-sm text-slate-600">
                I agree to the <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
