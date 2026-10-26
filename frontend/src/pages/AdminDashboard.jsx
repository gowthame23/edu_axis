import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, BookOpen, Calendar, FileText, BarChart3, Settings, Shield, Database, IndianRupee, Library, GraduationCap, ClipboardList, Home, X, Search, Filter, Eye, Mail, Phone, MapPin, Trash2, UserPlus, Lock, Award, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import NotificationToast from '../components/NotificationToast';
import ClassManagement from '../components/ClassManagement.jsx';
import AdminLibraryManagement from '../components/adminComp/AdminLibraryManagement.jsx';
import TeacherSubjects from '../components/adminComp/TeacherSubjects.jsx';
import FeedbackDashboard from '../components/adminComp/FeedbackDashboard.jsx';

import FinancialAnalytics from '../components/adminComp/FinancialAnalytics.jsx';
import BulkImportExport from '../components/adminComp/BulkImportExport.jsx';
import AdminPaymentPlans from '../components/adminComp/AdminPaymentPlans.jsx';

// User creation validation schema
const userSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces')
    .test('no-leading-trailing-spaces', 'Name cannot start or end with spaces', 
      value => value ? value.trim() === value : true),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format')
    .max(100, 'Email must not exceed 100 characters')
    .test('no-spaces', 'Email cannot contain spaces', value => value ? !value.includes(' ') : true),
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^\d{10}$/, 'Phone number must be exactly 10 digits')
    .length(10, 'Phone number must be exactly 10 digits'),
  dateOfBirth: yup
    .string()
    .required('Date of birth is required')
    .matches(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/, 'Date must be in DD-MM-YYYY format')
    .test('valid-date', 'Please enter a valid date', function(value) {
      if (!value) return false;
      const [day, month, year] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
    })
    .test('age', 'User must be at least 5 years old', function(value) {
      if (!value) return false;
      const [day, month, year] = value.split('-').map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= 5;
      }
      return age >= 5;
    })
    .test('max-age', 'Please enter a valid date of birth', function(value) {
      if (!value) return false;
      const [day, month, year] = value.split('-').map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      return birthDate <= today;
    }),
  role: yup
    .string()
    .oneOf(['student', 'teacher', 'admin'], 'Please select a valid role')
    .required('Role is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters long')
    .max(50, 'Password must not exceed 50 characters')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  grade: yup
    .string()
    .when('role', {
      is: 'student',
      then: (schema) => schema
        .required('Grade is required for students')
        .matches(/^(1|2|3|4|5|6|7|8|9|10|11|12)$/, 'Please select a valid grade'),
      otherwise: (schema) => schema.notRequired()
    }),
  section: yup
    .string()
    .matches(/^[A-D]?$/, 'Section must be A, B, C, or D')
    .notRequired()
}).required();

// Course validation schema
const courseSchema = yup.object({
  name: yup
    .string()
    .required('Course name is required')
    .min(2, 'Course name must be at least 2 characters')
    .max(100, 'Course name must not exceed 100 characters')
    .matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9\s\-&().,]+$/, 'Course name must contain at least one letter and only valid characters')
    .trim(),
  code: yup
    .string()
    .required('Course code is required')
    .min(3, 'Course code must be at least 3 characters')
    .max(10, 'Course code must not exceed 10 characters')
    .matches(/^[A-Z0-9-]+$/, 'Course code must be uppercase letters, numbers, or hyphens')
    .trim(),
  description: yup
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .notRequired(),
  teacher: yup
    .string()
    .max(100, 'Teacher name must not exceed 100 characters')
    .notRequired(),
  credits: yup
    .number()
    .required('Credits are required')
    .min(1, 'Credits must be at least 1')
    .max(6, 'Credits cannot exceed 6')
    .integer('Credits must be a whole number'),
  grade: yup
    .number()
    .required('Grade is required')
    .min(1, 'Grade must be at least 1')
    .max(12, 'Grade cannot exceed 12')
    .integer('Grade must be a whole number'),
  status: yup
    .string()
    .oneOf(['active', 'inactive', 'archived'], 'Invalid status')
    .required('Status is required')
}).required();

// Fee form validation schema
const feeSchema = yup.object({
  title: yup
    .string()
    .required('Fee title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.,]+$/, 'Title can only contain letters, numbers, spaces, and basic punctuation')
    .test('no-leading-trailing-spaces', 'Title cannot start or end with spaces', 
      value => value ? value.trim() === value : true),
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be a positive number')
    .min(1, 'Amount must be at least 1')
    .max(1000000, 'Amount must not exceed 1,000,000')
    .typeError('Amount must be a valid number'),
  description: yup
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .notRequired(),
  dueDate: yup
    .string()
    .required('Due date is required')
    .test('future-date', 'Due date must be today or in the future', function(value) {
      if (!value) return false;
      const dueDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today;
    }),
  semester: yup
    .string()
    .oneOf(['Annual', 'Fall', 'Spring', 'Summer'], 'Please select a valid semester')
    .required('Semester is required'),
  appliesTo: yup
    .string()
    .oneOf(['all', 'grade-specific'], 'Invalid option')
    .required('Please specify who this fee applies to'),
  grades: yup
    .array()
    .of(yup.string().matches(/^(1|2|3|4|5|6|7|8|9|10|11|12)$/, 'Invalid grade'))
    .when('appliesTo', {
      is: 'grade-specific',
      then: (schema) => schema.min(1, 'Select at least one grade'),
      otherwise: (schema) => schema.notRequired()
    })
}).required();

export default function AdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // User Management States
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const usersPerPage = 10;

  // User form with React Hook Form
  const {
    register: registerUser,
    handleSubmit: handleUserFormSubmit,
    watch: watchUser,
    setValue: setUserValue,
    reset: resetUserForm,
    formState: { errors: userErrors }
  } = useForm({
    resolver: yupResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'student',
      phone: '',
      dateOfBirth: '',
      grade: '',
      section: ''
    }
  });

  const currentUserRole = watchUser('role');

  // Fee Management States
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [showDeleteFeeModal, setShowDeleteFeeModal] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState(null);
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [feesLoading, setFeesLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentStats, setPaymentStats] = useState({ total: 0, completed: 0, totalAmount: 0 });
  const [currentFeePage, setCurrentFeePage] = useState(1);
  const [currentPaymentPage, setCurrentPaymentPage] = useState(1);
  const feesPerPage = 6;
  const paymentsPerPage = 10;

  // Course Management States
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState('all');
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditUserMode, setIsEditUserMode] = useState(false);
  const [currentCoursePage, setCurrentCoursePage] = useState(1);
  const coursesPerPage = 9;

  // Teacher Subjects Modal States
  const [showTeacherSubjects, setShowTeacherSubjects] = useState(false);
  const [teacherSubjectsData, setTeacherSubjectsData] = useState(null);
  const [teacherSubjectsLoading, setTeacherSubjectsLoading] = useState(false);

  // Leave Request States
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveRequestsLoading, setLeaveRequestsLoading] = useState(false);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');
  const [leaveRoleFilter, setLeaveRoleFilter] = useState('all');
  const [leaveSearchQuery, setLeaveSearchQuery] = useState('');
  const [leaveCurrentPage, setLeaveCurrentPage] = useState(1);
  const leaveRequestsPerPage = 5;
  const [notification, setNotification] = useState(null);
  const [processingLeaveIds, setProcessingLeaveIds] = useState({});
  const [leaveRejectionReason, setLeaveRejectionReason] = useState({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeaveForReject, setSelectedLeaveForReject] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch dashboard data on initial load
  useEffect(() => {
    fetchCourses();
    fetchPayments();
  }, []);

  // Fee form with React Hook Form
  const {
    register: registerFee,
    handleSubmit: handleFeeFormSubmit,
    watch: watchFee,
    setValue: setFeeValue,
    reset: resetFeeForm,
    formState: { errors: feeErrors }
  } = useForm({
    resolver: yupResolver(feeSchema),
    defaultValues: {
      title: '',
      amount: '',
      description: '',
      dueDate: '',
      semester: 'Annual',
      appliesTo: 'all',
      grades: []
    }
  });

  const feeAppliesTo = watchFee('appliesTo');
  const feeGrades = watchFee('grades');

  // Course form with React Hook Form
  const {
    register: registerCourse,
    handleSubmit: handleCourseFormSubmit,
    reset: resetCourseForm,
    setValue: setCourseValue,
    formState: { errors: courseErrors }
  } = useForm({
    resolver: yupResolver(courseSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      teacher: '',
      teacherId: '',
      credits: 3,
      grade: 1,
      status: 'active'
    }
  });

  // Fetch users function (defined here so handleCreateUser can use it)
  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const res = await adminAPI.getUsers();
      // Expecting res.data to be either { users: [...] } or [...]
      const raw = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      // Normalize to UI shape
      const normalized = raw.map((u) => ({
        id: u._id || u.id,
        name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        email: u.email,
        role: (u.role || u.type || 'student').toLowerCase(),
        phone: u.phone || u.mobile || 'N/A',
        status: (u.status || 'active').toLowerCase(),
        dateOfBirth: u.dateOfBirth || u.dob || '—',
        enrollmentDate: u.enrollmentDate || u.joinedAt || u.createdAt || '—',
        joinDate: u.joinDate || u.hiredAt || u.createdAt || '—',
        grade: u.grade || u.classLevel || undefined,
        subject: u.subject || u.department || undefined,
        address: u.address || '—',
      }));
      setUsers(normalized);
      setFilteredUsers(normalized);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsersError(err.response?.data?.message || err.message || 'Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch users from API on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch leave requests
  const fetchLeaveRequests = async () => {
    setLeaveRequestsLoading(true);
    try {
      const res = await adminAPI.getLeaveRequests({ status: 'all' });
      if (res.data.success) {
        setLeaveRequests(res.data.leaveRequests || []);
      }
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
      showNotification('Failed to load leave requests', 'error');
    } finally {
      setLeaveRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname === '/administrator/leave') {
      fetchLeaveRequests();
    }
  }, [location.pathname]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setLeaveCurrentPage(1);
  }, [leaveStatusFilter, leaveRoleFilter, leaveSearchQuery]);

  // Handle leave decision
  const handleLeaveDecision = async (id, action, remarks) => {
    try {
      setProcessingLeaveIds(prev => ({ ...prev, [id]: true }));
      const res = await adminAPI.decideLeaveRequest(id, action, remarks);
      if (res.data.success) {
        showNotification(`Leave ${action}d successfully`, 'success');
        const updated = res.data.leaveRequest;
        setLeaveRequests(prev => {
          if (!updated || !updated._id) return prev;
          if (leaveStatusFilter !== 'all' && leaveStatusFilter !== updated.status) {
            return prev.filter(r => r._id !== id);
          }
          return prev.map(r => {
            if (r._id === id) {
              // Merge updated data while preserving requesterId if it exists
              return {
                ...r,
                ...updated,
                requesterId: updated.requesterId || r.requesterId
              };
            }
            return r;
          });
        });
      }
    } catch (err) {
      console.error('Failed to decide leave request:', err);
      showNotification(err.response?.data?.message || 'Failed to process request', 'error');
    } finally {
      setProcessingLeaveIds(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  // Fetch fees and payments when fees module is active
  useEffect(() => {
    if (location.pathname === '/administrator/fees') {
      fetchFees();
      fetchPayments();
    }
  }, [location.pathname]);

  // Fetch courses when courses module is active
  useEffect(() => {
    if (location.pathname === '/administrator/courses') {
      fetchCourses();
    }
  }, [location.pathname]);

  // Filter payments
  useEffect(() => {
    let result = payments;

    // Filter by payment method
    if (paymentMethodFilter !== 'all') {
      result = result.filter(p => p.paymentMethod === paymentMethodFilter);
    }

    // Filter by status
    if (paymentStatusFilter !== 'all') {
      result = result.filter(p => p.status === paymentStatusFilter);
    }

    // Search by student name or email
    if (paymentSearchQuery.trim()) {
      result = result.filter(p =>
        p.studentName.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
        p.studentEmail.toLowerCase().includes(paymentSearchQuery.toLowerCase())
      );
    }

    setFilteredPayments(result);
    // Reset to first page when filters change
    setCurrentPaymentPage(1);
  }, [paymentSearchQuery, paymentMethodFilter, paymentStatusFilter, payments]);

  // Fetch functions
  const fetchFees = async () => {
    setFeesLoading(true);
    try {
      const res = await adminAPI.getFees();
      setFees(res.data?.fees || []);
    } catch (err) {
      console.error('Failed to fetch fees:', err);
    } finally {
      setFeesLoading(false);
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await adminAPI.getPayments({});
      setPayments(res.data?.payments || []);
      setFilteredPayments(res.data?.payments || []);
      setPaymentStats(res.data?.stats || { total: 0, completed: 0, totalAmount: 0 });
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleCreateFee = async (data) => {
    try {
      const res = await adminAPI.createFee(data);
      if (res.data.success) {
        setShowFeeForm(false);
        resetFeeForm();
        fetchFees();
        showNotification('Fee created successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to create fee:', err);
      showNotification(err.response?.data?.message || 'Failed to create fee', 'error');
    }
  };

  const confirmDeleteFee = (feeId) => {
    setFeeToDelete(feeId);
    setShowDeleteFeeModal(true);
  };

  const handleDeleteFee = async () => {
    if (!feeToDelete) return;

    try {
      setShowDeleteFeeModal(false);
      const res = await adminAPI.deleteFee(feeToDelete);
      if (res.data.success) {
        setFeeToDelete(null);
        fetchFees();
        showNotification('Fee deleted successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to delete fee:', err);
      showNotification(err.response?.data?.message || 'Failed to delete fee', 'error');
    }
  };

  // Filter and search users
  useEffect(() => {
    let result = users;

    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    // Search by name or email
    if (searchQuery.trim()) {
      result = result.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(result);
    // Reset to first page when filters change
    setCurrentUserPage(1);
  }, [searchQuery, roleFilter, users]);

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleCreateUser = async (data) => {
    try {
      setUsersLoading(true);
      
      // Convert DD-MM-YYYY to YYYY-MM-DD for backend
      const dateOfBirthFormatted = data.dateOfBirth
        ? data.dateOfBirth.split('-').reverse().join('-')
        : undefined;
      
      // Build user data based on role
      const userData = {
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone,
        dateOfBirth: dateOfBirthFormatted
      };
      
      // Only include password if provided (for create or optional update)
      if (data.password) {
        userData.password = data.password;
      }
      
      // Only include grade and section for students
      if (data.role === 'student') {
        userData.grade = data.grade || undefined;
        userData.section = data.section || undefined;
      }
      
      let response;
      if (isEditUserMode && selectedUser) {
        response = await adminAPI.updateUser(selectedUser.id, userData);
      } else {
        response = await adminAPI.createUser(userData);
      }
      
      if (response.data.success) {
        setShowUserForm(false);
        setIsEditUserMode(false);
        setSelectedUser(null);
        resetUserForm();
        fetchUsers();
        showNotification(isEditUserMode ? 'User updated successfully!' : 'User created successfully!', 'success');
      }
    } catch (err) {
      console.error(isEditUserMode ? 'Failed to update user:' : 'Failed to create user:', err);
      showNotification(err.response?.data?.message || (isEditUserMode ? 'Failed to update user' : 'Failed to create user'), 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  const confirmDeleteUser = (userId) => {
    setUserToDelete(userId);
    setShowDeleteUserModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setUsersLoading(true);
      setShowDeleteUserModal(false);
      const response = await adminAPI.deleteUser(userToDelete);
      
      if (response.data.success) {
        setShowUserDetails(false);
        setSelectedUser(null);
        setUserToDelete(null);
        fetchUsers();
        showNotification('User deleted successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      showNotification(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  // Course Management Functions
  const fetchCourses = async () => {
    setCoursesLoading(true);
    setCoursesError('');
    try {
      const res = await adminAPI.getCourses();
      const coursesData = res.data?.courses || [];
      setCourses(coursesData);
      setFilteredCourses(coursesData);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setCoursesError(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchTeacherSubjects = async (teacherId) => {
    setTeacherSubjectsLoading(true);
    try {
      const res = await adminAPI.getTeacherSubjects(teacherId);
      setTeacherSubjectsData(res.data);
      setShowTeacherSubjects(true);
    } catch (err) {
      console.error('Failed to fetch teacher subjects:', err);
      showNotification(err.response?.data?.message || 'Failed to fetch teacher subjects', 'error');
    } finally {
      setTeacherSubjectsLoading(false);
    }
  };

  const handleCreateCourse = async (data) => {
    try {
      setCoursesLoading(true);
      // Attach teacher name when teacherId is provided
      const payload = { ...data };
      if (data.teacherId) {
        const teacher = users.find(u => u.id === data.teacherId);
        payload.teacher = teacher ? teacher.name : '';
      }

      const response = await adminAPI.createCourse(payload);
      
      if (response.data.success) {
        setShowCourseForm(false);
        setIsEditMode(false);
        resetCourseForm();
        fetchCourses();
        showNotification('Course created successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to create course:', err);
      showNotification(err.response?.data?.message || 'Failed to create course', 'error');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleUpdateCourse = async (data) => {
    try {
      setCoursesLoading(true);
      const payload = { ...data };
      if (data.teacherId) {
        const teacher = users.find(u => u.id === data.teacherId);
        payload.teacher = teacher ? teacher.name : '';
      }

      const response = await adminAPI.updateCourse(selectedCourse._id, payload);
      
      if (response.data.success) {
        setShowCourseForm(false);
        setIsEditMode(false);
        setSelectedCourse(null);
        resetCourseForm();
        fetchCourses();
        showNotification('Course updated successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to update course:', err);
      showNotification(err.response?.data?.message || 'Failed to update course', 'error');
    } finally {
      setCoursesLoading(false);
    }
  };

  const confirmDeleteCourse = (courseId) => {
    setCourseToDelete(courseId);
    setShowDeleteCourseModal(true);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      setCoursesLoading(true);
      setShowDeleteCourseModal(false);
      const response = await adminAPI.deleteCourse(courseToDelete);
      
      if (response.data.success) {
        setShowCourseDetails(false);
        setSelectedCourse(null);
        setCourseToDelete(null);
        fetchCourses();
        showNotification('Course deleted successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to delete course:', err);
      showNotification(err.response?.data?.message || 'Failed to delete course', 'error');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setIsEditMode(true);
    setCourseValue('name', course.name);
    setCourseValue('code', course.code);
    setCourseValue('description', course.description || '');
  setCourseValue('teacher', course.teacher || '');
  setCourseValue('teacherId', course.teacherId || '');
    setCourseValue('credits', course.credits);
    setCourseValue('grade', course.grade);
    setCourseValue('status', course.status);
    setShowCourseForm(true);
  };

  const handleViewCourseDetails = (course) => {
    setSelectedCourse(course);
    setShowCourseDetails(true);
  };

  // Filter courses
  useEffect(() => {
    let result = courses;

    // Filter by status
    if (courseStatusFilter !== 'all') {
      result = result.filter(c => c.status === courseStatusFilter);
    }

    // Search by name or code
    if (courseSearchQuery.trim()) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        (c.teacher && c.teacher.toLowerCase().includes(courseSearchQuery.toLowerCase()))
      );
    }

    setFilteredCourses(result);
    // Reset to first page when filters change
    setCurrentCoursePage(1);
  }, [courseSearchQuery, courseStatusFilter, courses]);

  const modules = [
    { id: 'home', icon: Home, title: 'Home', description: 'Overview and statistics' },
    { id: 'users', icon: Users, title: 'User Management', description: 'Manage students, teachers & staff' },
    { id: 'courses', icon: BookOpen, title: 'Course Management', description: 'Create and manage courses' },
    { id: 'teacher-subjects', icon: Award, title: 'Teacher Subjects', description: 'View subjects taught by teachers' },
    { id: 'fees', icon: IndianRupee, title: 'Fee Management', description: 'Manage fee structure & payments' },
    { id: 'payment-plans', icon: CreditCard, title: 'Payment Plans', description: 'Subscribe to school plans' },
    { id: 'financial-analytics', icon: BarChart3, title: 'Financial Analytics', description: 'Track payments & collections' },
    { id: 'classes', icon: GraduationCap, title: 'Class Management', description: 'Manage classes and sections' },
    { id: 'library', icon: Library, title: 'Library Management', description: 'Upload and manage library resources' },
    { id: 'leave', icon: Mail, title: 'Leave Requests', description: 'Review leave applications' },
    { id: 'feedback', icon: FileText, title: 'Feedback Dashboard', description: 'Review student feedback' },
    { id: 'bulk-import', icon: Database, title: 'Bulk Import/Export', description: 'Import/export data' },
  ];

  const renderMainContent = () => {
    switch (location.pathname) {
      case '/administrator':
      case '/administrator/home':
        return (
          <div>
            {/* Welcome Banner */}
            <div className="bg-linear-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-lg">
              <h1 className="text-3xl font-bold mb-2">Administrator Dashboard</h1>
              <p className="text-purple-100">Complete control over your school management system.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Students</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{users.filter(u => u.role === 'student').length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Teachers</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{users.filter(u => u.role === 'teacher').length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Active Courses</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">{courses.filter(c => c.status === 'active').length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">₹{paymentStats.totalAmount ? (paymentStats.totalAmount / 1000).toFixed(1) + 'K' : '0'}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/administrator/users')}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
                >
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-slate-700 group-hover:text-purple-900 font-medium">Add New User</span>
                </button>
                <button
                  onClick={() => navigate('/administrator/courses')}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
                >
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <span className="text-slate-700 group-hover:text-purple-900 font-medium">Create Course</span>
                </button>
               
              </div>
            </div>
          </div>
        );

      case '/administrator/users':
        return (
          <div>
            {/* Header with Stats */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                  <p className="text-slate-600 mt-1">Manage students, teachers, and staff members</p>
                </div>
                <button 
                  onClick={() => setShowUserForm(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add New User</span>
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-blue-600 text-sm font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {users.filter(u => u.role === 'student').length}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p className="text-green-600 text-sm font-medium">Total Teachers</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {users.filter(u => u.role === 'teacher').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Role Filter */}
                <div className="relative">
                  <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-4 text-sm text-slate-600">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {usersLoading ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                          Loading users...
                        </td>
                      </tr>
                    ) : usersError ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-red-600">
                          {usersError}
                        </td>
                      </tr>
                    ) : filteredUsers.length > 0 ? (
                      (() => {
                        const indexOfLastUser = currentUserPage * usersPerPage;
                        const indexOfFirstUser = indexOfLastUser - usersPerPage;
                        const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
                        return currentUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                  user.role === 'student' ? 'bg-blue-500' : user.role === 'teacher' ? 'bg-green-500' : 'bg-purple-500'
                                }`}>
                                  {(user.name || '?').charAt(0)}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-slate-900">{user.name || 'Unnamed'}</p>
                                  <p className="text-xs text-slate-500">{user.phone || '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm text-slate-900">{user.email}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'student' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : user.role === 'teacher'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleViewDetails(user)}
                                  className="text-purple-600 hover:text-purple-900 font-medium flex items-center space-x-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={() => confirmDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900 font-medium flex items-center space-x-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">No users found matching your criteria</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredUsers.length > usersPerPage && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Showing {((currentUserPage - 1) * usersPerPage) + 1} to {Math.min(currentUserPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentUserPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentUserPage === 1}
                        className="px-3 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.ceil(filteredUsers.length / usersPerPage) }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentUserPage(page)}
                            className={`px-3 py-1 rounded-lg transition-colors ${
                              currentUserPage === page
                                ? 'bg-purple-600 text-white'
                                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentUserPage(prev => Math.min(prev + 1, Math.ceil(filteredUsers.length / usersPerPage)))}
                        disabled={currentUserPage === Math.ceil(filteredUsers.length / usersPerPage)}
                        className="px-3 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Details Modal */}
            {showUserDetails && selectedUser && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 ${
                        selectedUser.role === 'student' ? 'bg-blue-500' : 'bg-green-500'
                      }`}>
                        {selectedUser.name.charAt(0)}
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h2>
                      <p className="text-slate-600 mt-1">{selectedUser.email}</p>
                      <div className="flex items-center justify-center space-x-2 mt-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          selectedUser.role === 'student' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                        </span>
                         
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start space-x-3">
                          <Mail className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Email Address</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedUser.email}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Phone className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Phone Number</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedUser.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Calendar className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Date of Birth</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedUser.dateOfBirth}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Address</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedUser.address}</p>
                          </div>
                        </div>

                        {selectedUser.role === 'student' && (
                          <>
                            <div className="flex items-start space-x-3">
                              <GraduationCap className="w-5 h-5 text-purple-600 mt-1" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Grade</p>
                                <p className="text-sm text-slate-900 mt-1">{selectedUser.grade}</p>
                              </div>
                            </div>

                            <div className="flex items-start space-x-3">
                              <Calendar className="w-5 h-5 text-purple-600 mt-1" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Enrollment Date</p>
                                <p className="text-sm text-slate-900 mt-1">{selectedUser.enrollmentDate}</p>
                              </div>
                            </div>
                          </>
                        )}

                        {selectedUser.role === 'teacher' && (
                          <>
                            <div className="flex items-start space-x-3">
                              <BookOpen className="w-5 h-5 text-purple-600 mt-1" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Subject</p>
                                <p className="text-sm text-slate-900 mt-1">{selectedUser.subject}</p>
                              </div>
                            </div>

                            <div className="flex items-start space-x-3">
                              <Calendar className="w-5 h-5 text-purple-600 mt-1" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Join Date</p>
                                <p className="text-sm text-slate-900 mt-1">{selectedUser.joinDate}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-6 border-t border-slate-200">
                        {selectedUser.role === 'teacher' && (
                          <button 
                            onClick={() => {
                              setShowUserDetails(false);
                              fetchTeacherSubjects(selectedUser.id);
                            }}
                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>View Subjects</span>
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setShowUserDetails(false);
                            setShowUserForm(true);
                            setIsEditUserMode(true);
                            resetUserForm({
                              name: selectedUser.name,
                              email: selectedUser.email,
                              role: selectedUser.role,
                              studentId: selectedUser.studentId || '',
                              teacherId: selectedUser.teacherId || '',
                              phone: selectedUser.phone || '',
                              grade: selectedUser.grade || '',
                              section: selectedUser.section || '',
                              dateOfBirth: selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toISOString().split('T')[0] : '',
                              address: selectedUser.address || ''
                            });
                          }}
                          className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          Edit User
                        </button>
                        <button 
                          onClick={() => confirmDeleteUser(selectedUser.id)}
                          className="px-4 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add User Modal */}
            {showUserForm && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => {
                      setShowUserForm(false);
                      setIsEditUserMode(false);
                      setSelectedUser(null);
                      resetUserForm();
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="p-8">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="w-8 h-8 text-purple-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900">{isEditUserMode ? 'Edit User' : 'Add New User'}</h2>
                      <p className="text-slate-600 mt-2">{isEditUserMode ? 'Update user information' : 'Create a new account for student, teacher, or admin'}</p>
                    </div>

                    <form onSubmit={handleUserFormSubmit(handleCreateUser)} className="space-y-5">
                      {/* Role Selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          User Role
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['student', 'teacher', 'admin'].map((role) => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => setUserValue('role', role)}
                              className={`py-2 px-4 rounded-lg font-medium transition-all ${
                                currentUserRole === role
                                  ? 'bg-purple-600 text-white shadow-md'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </button>
                          ))}
                        </div>
                        {userErrors.role && (
                          <p className="mt-1 text-sm text-red-600">{userErrors.role.message}</p>
                        )}
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          {...registerUser('name')}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                            userErrors.name ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="Enter full name"
                        />
                        {userErrors.name && (
                          <p className="mt-1 text-sm text-red-600">{userErrors.name.message}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                        <input
                          type="text"
                          {...registerUser('email')}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                            userErrors.email ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="Enter email address"
                          autoComplete="email"
                        />
                        {userErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{userErrors.email.message}</p>
                        )}
                      </div>

                      {/* Phone and DOB in Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                          <input
                            type="text"
                            {...registerUser('phone')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                              userErrors.phone ? 'border-red-500' : 'border-slate-300'
                            }`}
                            placeholder="1234567890"
                            maxLength={10}
                          />
                          {userErrors.phone && (
                            <p className="mt-1 text-sm text-red-600">{userErrors.phone.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth (DD-MM-YYYY)</label>
                          <input
                            type="text"
                            {...registerUser('dateOfBirth')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                              userErrors.dateOfBirth ? 'border-red-500' : 'border-slate-300'
                            }`}
                            placeholder="DD-MM-YYYY"
                            maxLength={10}
                          />
                          {userErrors.dateOfBirth && (
                            <p className="mt-1 text-sm text-red-600">{userErrors.dateOfBirth.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Student-specific fields */}
                      {currentUserRole === 'student' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Grade</label>
                            <select
                              {...registerUser('grade')}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white ${
                                userErrors.grade ? 'border-red-500' : 'border-slate-300'
                              }`}
                            >
                              <option value="">Select grade</option>
                              {[...Array(12)].map((_, i) => (
                                <option key={i+1} value={String(i+1)}>{i+1}</option>
                              ))}
                            </select>
                            {userErrors.grade && (
                              <p className="mt-1 text-sm text-red-600">{userErrors.grade.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Section (optional)</label>
                            <select
                              {...registerUser('section')}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white"
                            >
                              <option value="">Select section</option>
                              {['A','B','C','D'].map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Password */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                        <input
                          type="password"
                          {...registerUser('password')}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                            userErrors.password ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="Create a strong password"
                        />
                        {userErrors.password && (
                          <p className="mt-1 text-sm text-red-600">{userErrors.password.message}</p>
                        )}
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserForm(false);
                            resetUserForm();
                          }}
                          className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={usersLoading}
                          className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {usersLoading ? 'Creating User...' : 'Create User'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case '/administrator/fees':
        return (
          <div>
            {/* Fee Management Header */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Fee Management</h2>
                  <p className="text-slate-600 mt-1">Set fees and track all student payments</p>
                </div>
                <button
                  onClick={() => setShowFeeForm(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <IndianRupee className="w-4 h-4" />
                  <span>Set New Fee</span>
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p className="text-green-600 text-sm font-medium">Total Payments</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{paymentStats.total}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-blue-600 text-sm font-medium">Completed Payments</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{paymentStats.completed}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <p className="text-purple-600 text-sm font-medium">Total Amount Collected</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">₹{paymentStats.totalAmount?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>

            {/* Current Fees List */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Current Fees</h3>
              {feesLoading ? (
                <p className="text-slate-500 text-center py-8">Loading fees...</p>
              ) : fees.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(() => {
                      const indexOfLastFee = currentFeePage * feesPerPage;
                      const indexOfFirstFee = indexOfLastFee - feesPerPage;
                      const currentFees = fees.slice(indexOfFirstFee, indexOfLastFee);
                      return currentFees.map((fee) => (
                        <div key={fee._id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-slate-900 flex-1">{fee.title}</h4>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                fee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {fee.status}
                              </span>
                              <button
                                onClick={() => confirmDeleteFee(fee._id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete fee"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-purple-600 mb-2">₹{fee.amount}</p>
                          <p className="text-sm text-slate-600 mb-2">{fee.description}</p>
                          <div className="text-xs text-slate-500 space-y-1">
                            <p>Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                            <p>Semester: {fee.semester}</p>
                            <p>
                              Scope: {fee.appliesTo === 'all' ? 'All students' : `Grades: ${(fee.grades || []).join(', ')}`}
                            </p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  
                  {/* Fees Pagination */}
                  {fees.length > feesPerPage && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-slate-600">
                        Showing {((currentFeePage - 1) * feesPerPage) + 1} to {Math.min(currentFeePage * feesPerPage, fees.length)} of {fees.length} fees
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentFeePage(prev => Math.max(prev - 1, 1))}
                          disabled={currentFeePage === 1}
                          className="px-3 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.ceil(fees.length / feesPerPage) }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentFeePage(page)}
                              className={`px-3 py-1 rounded-lg transition-colors ${
                                currentFeePage === page
                                  ? 'bg-purple-600 text-white'
                                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentFeePage(prev => Math.min(prev + 1, Math.ceil(fees.length / feesPerPage)))}
                          disabled={currentFeePage === Math.ceil(fees.length / feesPerPage)}
                          className="px-3 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-500 text-center py-8">No fees set yet. Click "Set New Fee" to create one.</p>
              )}
            </div>

            {/* Payment Filters */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Payment Records</h3>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by student name or email..."
                    value={paymentSearchQuery}
                    onChange={(e) => setPaymentSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Payment Method Filter */}
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online Payment">Online Payment</option>
                  <option value="UPI">UPI</option>
                  <option value="Check">Check</option>
                </select>

                {/* Status Filter */}
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Showing {filteredPayments.length} of {payments.length} payments
              </p>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Fee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paymentsLoading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading payments...</td>
                      </tr>
                    ) : filteredPayments.length > 0 ? (
                      (() => {
                        const indexOfLastPayment = currentPaymentPage * paymentsPerPage;
                        const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
                        const currentPayments = filteredPayments.slice(indexOfFirstPayment, indexOfLastPayment);
                        return currentPayments.map((payment) => (
                          <tr key={payment._id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{payment.studentName}</p>
                                <p className="text-xs text-slate-500">{payment.studentEmail}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">{payment.feeTitle}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-purple-600">₹{payment.amount}</td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {payment.paymentMethod}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 text-xs rounded-full ${
                                payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ));
                      })()
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <IndianRupee className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">No payments found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payments Pagination */}
              {filteredPayments.length > paymentsPerPage && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Showing {((currentPaymentPage - 1) * paymentsPerPage) + 1} to {Math.min(currentPaymentPage * paymentsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPaymentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPaymentPage === 1}
                        className="px-3 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.ceil(filteredPayments.length / paymentsPerPage) }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPaymentPage(page)}
                            className={`px-3 py-1 rounded-lg transition-colors ${
                              currentPaymentPage === page
                                ? 'bg-purple-600 text-white'
                                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPaymentPage(prev => Math.min(prev + 1, Math.ceil(filteredPayments.length / paymentsPerPage)))}
                        disabled={currentPaymentPage === Math.ceil(filteredPayments.length / paymentsPerPage)}
                        className="px-3 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fee Form Modal */}
            {showFeeForm && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => {
                      setShowFeeForm(false);
                      resetFeeForm();
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Set New Fee</h2>
                    <form onSubmit={handleFeeFormSubmit(handleCreateFee)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fee Title</label>
                        <input
                          type="text"
                          {...registerFee('title')}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            feeErrors.title ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="e.g., Tuition Fee - Fall 2025"
                        />
                        {feeErrors.title && (
                          <p className="mt-1 text-sm text-red-600">{feeErrors.title.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          {...registerFee('amount')}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            feeErrors.amount ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="5000"
                        />
                        {feeErrors.amount && (
                          <p className="mt-1 text-sm text-red-600">{feeErrors.amount.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                          {...registerFee('description')}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows="3"
                          placeholder="Optional description"
                        />
                        {feeErrors.description && (
                          <p className="mt-1 text-sm text-red-600">{feeErrors.description.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                        <input
                          type="date"
                          {...registerFee('dueDate')}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            feeErrors.dueDate ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        {feeErrors.dueDate && (
                          <p className="mt-1 text-sm text-red-600">{feeErrors.dueDate.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                        <select
                          {...registerFee('semester')}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Annual">Annual</option>
                          <option value="Fall">Fall</option>
                          <option value="Spring">Spring</option>
                          <option value="Summer">Summer</option>
                        </select>
                        {feeErrors.semester && (
                          <p className="mt-1 text-sm text-red-600">{feeErrors.semester.message}</p>
                        )}
                      </div>

                      {/* Applies To: All vs Grade-specific */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Applies To</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFeeValue('appliesTo', 'all');
                              setFeeValue('grades', []);
                            }}
                            className={`py-2 px-4 rounded-lg font-medium transition-all ${feeAppliesTo === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                          >
                            All Students
                          </button>
                          <button
                            type="button"
                            onClick={() => setFeeValue('appliesTo', 'grade-specific')}
                            className={`py-2 px-4 rounded-lg font-medium transition-all ${feeAppliesTo === 'grade-specific' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                          >
                            Specific Grades
                          </button>
                        </div>
                        {feeErrors.appliesTo && (
                          <p className="mt-1 text-sm text-red-600">{feeErrors.appliesTo.message}</p>
                        )}
                      </div>

                      {/* Grade multi-select when grade-specific */}
                      {feeAppliesTo === 'grade-specific' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Select Grades</label>
                          <div className="grid grid-cols-6 gap-2">
                            {[...Array(12)].map((_, i) => {
                              const g = String(i + 1);
                              const selected = feeGrades.includes(g);
                              return (
                                <button
                                  type="button"
                                  key={g}
                                  onClick={() => {
                                    const grades = selected
                                      ? feeGrades.filter(x => x !== g)
                                      : [...feeGrades, g];
                                    setFeeValue('grades', grades);
                                  }}
                                  className={`text-sm py-2 rounded border ${selected ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                                >
                                  {g}
                                </button>
                              );
                            })}
                          </div>
                          {feeErrors.grades && (
                            <p className="mt-1 text-sm text-red-600">{feeErrors.grades.message}</p>
                          )}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        Create Fee
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case '/administrator/courses':
        return (
          <div>
            {/* Header with Stats */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Course Management</h2>
                  <p className="text-slate-600 mt-1">Create and manage all courses in the system</p>
                </div>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setSelectedCourse(null);
                    resetCourseForm();
                    setShowCourseForm(true);
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Add New Course</span>
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-blue-600 text-sm font-medium">Total Courses</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{courses.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p className="text-green-600 text-sm font-medium">Active Courses</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {courses.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <p className="text-orange-600 text-sm font-medium">Inactive Courses</p>
                  <p className="text-2xl font-bold text-orange-700 mt-1">
                    {courses.filter(c => c.status === 'inactive').length}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <p className="text-purple-600 text-sm font-medium">Archived Courses</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">
                    {courses.filter(c => c.status === 'archived').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by course name, code, or teacher..."
                    value={courseSearchQuery}
                    onChange={(e) => setCourseSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={courseStatusFilter}
                    onChange={(e) => setCourseStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-4 text-sm text-slate-600">
                Showing {filteredCourses.length} of {courses.length} courses
              </div>
            </div>

            {/* Courses Grid */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {coursesLoading ? (
                  <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
                    <p className="text-slate-500">Loading courses...</p>
                  </div>
                ) : coursesError ? (
                  <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
                    <p className="text-red-600">{coursesError}</p>
                  </div>
                ) : filteredCourses.length > 0 ? (
                  (() => {
                    const indexOfLastCourse = currentCoursePage * coursesPerPage;
                    const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
                    const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
                    return currentCourses.map((course) => (
                  <div
                    key={course._id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-100"
                  >
                    <div className="p-6">
                      {/* Course Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 mb-1">{course.name}</h3>
                          <p className="text-sm font-medium text-purple-600">{course.code}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          course.status === 'active' ? 'bg-green-100 text-green-700' :
                          course.status === 'inactive' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {course.status}
                        </span>
                      </div>

                      {/* Course Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-slate-600">
                          <Users className="w-4 h-4 mr-2 text-slate-400" />
                          <span>Teacher: {course.teacher || 'TBD'}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                          <span>Credits: {course.credits}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <GraduationCap className="w-4 h-4 mr-2 text-slate-400" />
                          <span>Grade: {course.grade}</span>
                        </div>
                      </div>

                      {course.description && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => handleViewCourseDetails(course)}
                          className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleEditCourse(course)}
                          className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDeleteCourse(course._id)}
                          className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ));
                  })()
                ) : (
                  <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">No courses found</p>
                    <button
                      onClick={() => {
                        setIsEditMode(false);
                        setSelectedCourse(null);
                        resetCourseForm();
                        setShowCourseForm(true);
                      }}
                      className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Add Your First Course</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Courses Pagination */}
              {filteredCourses.length > coursesPerPage && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Showing {((currentCoursePage - 1) * coursesPerPage) + 1} to {Math.min(currentCoursePage * coursesPerPage, filteredCourses.length)} of {filteredCourses.length} courses
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentCoursePage(prev => Math.max(prev - 1, 1))}
                        disabled={currentCoursePage === 1}
                        className="px-3 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.ceil(filteredCourses.length / coursesPerPage) }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentCoursePage(page)}
                            className={`px-3 py-1 rounded-lg transition-colors ${
                              currentCoursePage === page
                                ? 'bg-purple-600 text-white'
                                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentCoursePage(prev => Math.min(prev + 1, Math.ceil(filteredCourses.length / coursesPerPage)))}
                        disabled={currentCoursePage === Math.ceil(filteredCourses.length / coursesPerPage)}
                        className="px-3 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Course Form Modal */}
            {showCourseForm && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => {
                      setShowCourseForm(false);
                      setIsEditMode(false);
                      setSelectedCourse(null);
                      resetCourseForm();
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="p-8">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-purple-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900">
                        {isEditMode ? 'Edit Course' : 'Add New Course'}
                      </h2>
                      <p className="text-slate-600 mt-2">
                        {isEditMode ? 'Update course information' : 'Create a new course'}
                      </p>
                    </div>

                    <form
                      onSubmit={handleCourseFormSubmit(isEditMode ? handleUpdateCourse : handleCreateCourse)}
                      className="space-y-5"
                    >
                      {/* Course Name and Code */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Course Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            {...registerCourse('name')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                              courseErrors.name ? 'border-red-500' : 'border-slate-300'
                            }`}
                            placeholder="e.g., Introduction to Computer Science"
                          />
                          {courseErrors.name && (
                            <p className="mt-1 text-sm text-red-600">{courseErrors.name.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Course Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            {...registerCourse('code')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all uppercase ${
                              courseErrors.code ? 'border-red-500' : 'border-slate-300'
                            }`}
                            placeholder="e.g., CS-101"
                            maxLength={10}
                            disabled={isEditMode}
                          />
                          {courseErrors.code && (
                            <p className="mt-1 text-sm text-red-600">{courseErrors.code.message}</p>
                          )}
                          {isEditMode && (
                            <p className="mt-1 text-xs text-slate-500">Course code cannot be changed</p>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                        <textarea
                          {...registerCourse('description')}
                          rows={3}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                            courseErrors.description ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="Brief description of the course..."
                          maxLength={500}
                        />
                        {courseErrors.description && (
                          <p className="mt-1 text-sm text-red-600">{courseErrors.description.message}</p>
                        )}
                      </div>

                      {/* Teacher Selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Assign Teacher
                        </label>
                        <select
                          {...registerCourse('teacherId')}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white ${
                            courseErrors.teacher ? 'border-red-500' : 'border-slate-300'
                          }`}
                        >
                          <option value="">Select a teacher (optional)</option>
                          {users
                            .filter(u => u.role === 'teacher')
                            .map(teacher => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.name} - {teacher.email}
                              </option>
                            ))}
                        </select>
                        {courseErrors.teacher && (
                          <p className="mt-1 text-sm text-red-600">{courseErrors.teacher.message}</p>
                        )}
                        {users.filter(u => u.role === 'teacher').length === 0 && (
                          <p className="mt-1 text-xs text-amber-600">No teachers available. Add teachers first.</p>
                        )}
                      </div>

                      {/* Credits, Semester, Status */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Credits <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            {...registerCourse('credits')}
                            min={1}
                            max={6}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                              courseErrors.credits ? 'border-red-500' : 'border-slate-300'
                            }`}
                          />
                          {courseErrors.credits && (
                            <p className="mt-1 text-sm text-red-600">{courseErrors.credits.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Grade <span className="text-red-500">*</span>
                          </label>
                          <select
                            {...registerCourse('grade')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white ${
                              courseErrors.grade ? 'border-red-500' : 'border-slate-300'
                            }`}
                          >
                            <option value="">Select grade</option>
                            {[...Array(12)].map((_, i) => (
                              <option key={i+1} value={i+1}>{i+1}</option>
                            ))}
                          </select>
                          {courseErrors.grade && (
                            <p className="mt-1 text-sm text-red-600">{courseErrors.grade.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Status <span className="text-red-500">*</span>
                          </label>
                          <select
                            {...registerCourse('status')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white ${
                              courseErrors.status ? 'border-red-500' : 'border-slate-300'
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="archived">Archived</option>
                          </select>
                          {courseErrors.status && (
                            <p className="mt-1 text-sm text-red-600">{courseErrors.status.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCourseForm(false);
                            setIsEditMode(false);
                            setSelectedCourse(null);
                            resetCourseForm();
                          }}
                          className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={coursesLoading}
                          className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {coursesLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Course' : 'Create Course')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Course Details Modal */}
            {showCourseDetails && selectedCourse && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => {
                      setShowCourseDetails(false);
                      setSelectedCourse(null);
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-10 h-10 text-purple-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedCourse.name}</h2>
                      <p className="text-purple-600 font-semibold mt-2">{selectedCourse.code}</p>
                      <div className="flex items-center justify-center mt-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          selectedCourse.status === 'active' ? 'bg-green-100 text-green-700' :
                          selectedCourse.status === 'inactive' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {selectedCourse.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start space-x-3">
                          <Users className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Teacher</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedCourse.teacher || 'TBD'}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <BookOpen className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Credits</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedCourse.credits}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <GraduationCap className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Grade</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedCourse.grade}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Users className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">Students Enrolled</p>
                            <p className="text-sm text-slate-900 mt-1">{selectedCourse.students || 0}</p>
                          </div>
                        </div>
                      </div>

                      {selectedCourse.description && (
                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-xs text-slate-500 uppercase font-medium mb-2">Description</p>
                          <p className="text-sm text-slate-700">{selectedCourse.description}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-6 border-t border-slate-200">
                        <button
                          onClick={() => {
                            setShowCourseDetails(false);
                            handleEditCourse(selectedCourse);
                          }}
                          className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          Edit Course
                        </button>
                        <button
                          onClick={() => {
                            setShowCourseDetails(false);
                            handleDeleteCourse(selectedCourse._id);
                          }}
                          className="px-4 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case '/administrator/classes':
        return <ClassManagement />;

      case '/administrator/teacher-subjects':
        return <TeacherSubjects />;

      case '/administrator/library':
        return <AdminLibraryManagement showNotification={showNotification} />;

      case '/administrator/leave':
        // Calculate stats
        const pendingCount = leaveRequests.filter(req => req.status === 'pending').length;
        const approvedCount = leaveRequests.filter(req => req.status === 'approved').length;
        const rejectedCount = leaveRequests.filter(req => req.status === 'rejected').length;
        const totalCount = leaveRequests.length;

        // Filter by status, role, and search
        const filteredLeaveRequests = leaveRequests.filter(req => {
          const matchesStatus = leaveStatusFilter === 'all' || req.status === leaveStatusFilter;
          const matchesRole = leaveRoleFilter === 'all' || req.requesterRole === leaveRoleFilter;
          const matchesSearch = !leaveSearchQuery || 
            req.requesterId?.name?.toLowerCase().includes(leaveSearchQuery.toLowerCase()) ||
            req.requesterId?.email?.toLowerCase().includes(leaveSearchQuery.toLowerCase()) ||
            req.type?.toLowerCase().includes(leaveSearchQuery.toLowerCase());
          return matchesStatus && matchesRole && matchesSearch;
        });

        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Leave Requests</h1>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div 
                onClick={() => setLeaveStatusFilter('all')}
                className={`bg-white rounded-lg shadow-md p-4 border-2 cursor-pointer transition-all hover:shadow-lg ${
                  leaveStatusFilter === 'all' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Total Requests</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{totalCount}</p>
                  </div>
                  <ClipboardList className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
              </div>

              <div 
                onClick={() => setLeaveStatusFilter('pending')}
                className={`bg-white rounded-lg shadow-md p-4 border-2 cursor-pointer transition-all hover:shadow-lg ${
                  leaveStatusFilter === 'pending' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
                  </div>
                  <Calendar className="w-10 h-10 text-yellow-500 opacity-20" />
                </div>
              </div>

              <div 
                onClick={() => setLeaveStatusFilter('approved')}
                className={`bg-white rounded-lg shadow-md p-4 border-2 cursor-pointer transition-all hover:shadow-lg ${
                  leaveStatusFilter === 'approved' ? 'border-green-500 ring-2 ring-green-200' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{approvedCount}</p>
                  </div>
                  <Calendar className="w-10 h-10 text-green-500 opacity-20" />
                </div>
              </div>

              <div 
                onClick={() => setLeaveStatusFilter('rejected')}
                className={`bg-white rounded-lg shadow-md p-4 border-2 cursor-pointer transition-all hover:shadow-lg ${
                  leaveStatusFilter === 'rejected' ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Rejected</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{rejectedCount}</p>
                  </div>
                  <Calendar className="w-10 h-10 text-red-500 opacity-20" />
                </div>
              </div>
            </div>

            {/* Search and Role Filter */}
            <div className="mb-6 bg-white rounded-xl shadow-md p-4 border border-slate-100">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={leaveSearchQuery}
                    onChange={(e) => setLeaveSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or leave type..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-slate-600" />
                  <select
                    value={leaveRoleFilter}
                    onChange={(e) => setLeaveRoleFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Users</option>
                    <option value="teacher">Teachers</option>
                    <option value="student">Students</option>
                  </select>
                </div>
              </div>
            </div>

            {leaveRequestsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-600 mt-4">Loading leave requests...</p>
              </div>
            ) : filteredLeaveRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
                <Mail className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">
                  {leaveSearchQuery ? 'No leave requests match your search' : 'No leave requests found'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {filteredLeaveRequests
                    .slice((leaveCurrentPage - 1) * leaveRequestsPerPage, leaveCurrentPage * leaveRequestsPerPage)
                    .map((req) => (
                    <div key={req._id} className="bg-white rounded-lg shadow-md p-4 border border-slate-100">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{req.requesterId?.name || 'Unknown'}</h3>
                          <p className="text-xs text-slate-600">
                            {req.requesterId?.email} • {req.requesterRole === 'teacher' ? 'Teacher' : `Grade ${req.requesterId?.grade}${req.requesterId?.section ? ` - ${req.requesterId?.section}` : ''}`}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          req.status === 'approved' ? 'bg-green-100 text-green-700' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div>
                          <span className="font-medium text-slate-700">Type:</span> <span className="capitalize">{req.type}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-slate-700">Period:</span> {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mb-3 p-2 bg-slate-50 rounded">
                        <p className="text-xs font-medium text-slate-700 mb-1">Reason:</p>
                        <p className="text-xs text-slate-700">{req.reason}</p>
                      </div>
                      {req.reviewRemarks && (
                        <div className={`mb-3 p-3 rounded border-l-4 ${
                          req.status === 'rejected' 
                            ? 'bg-red-50 border-red-500' 
                            : 'bg-blue-50 border-blue-500'
                        }`}>
                          <p className={`text-xs font-medium mb-1 ${
                            req.status === 'rejected' ? 'text-red-700' : 'text-blue-700'
                          }`}>
                            {req.status === 'rejected' ? 'Rejection Reason:' : 'Administrator Remarks:'}
                          </p>
                          <p className={`text-xs ${
                            req.status === 'rejected' ? 'text-red-600' : 'text-blue-600'
                          }`}>{req.reviewRemarks}</p>
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mb-2">Submitted: {new Date(req.createdAt).toLocaleString()}</div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLeaveDecision(req._id, 'approve', '')}
                            disabled={!!processingLeaveIds[req._id]}
                            className={`flex-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium text-white ${
                              processingLeaveIds[req._id]
                                ? 'bg-green-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {processingLeaveIds[req._id] ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLeaveForReject(req);
                              setShowRejectModal(true);
                              setLeaveRejectionReason({ [req._id]: '' });
                            }}
                            disabled={!!processingLeaveIds[req._id]}
                            className={`flex-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium text-white ${
                              processingLeaveIds[req._id]
                                ? 'bg-red-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                          >
                            {processingLeaveIds[req._id] ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {filteredLeaveRequests.length > leaveRequestsPerPage && (
                  <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-md p-4 border border-slate-100">
                    <div className="text-sm text-slate-600">
                      Showing {((leaveCurrentPage - 1) * leaveRequestsPerPage) + 1} to {Math.min(leaveCurrentPage * leaveRequestsPerPage, filteredLeaveRequests.length)} of {filteredLeaveRequests.length} requests
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLeaveCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={leaveCurrentPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          leaveCurrentPage === 1
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.ceil(filteredLeaveRequests.length / leaveRequestsPerPage) }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setLeaveCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                              leaveCurrentPage === page
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setLeaveCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredLeaveRequests.length / leaveRequestsPerPage)))}
                        disabled={leaveCurrentPage === Math.ceil(filteredLeaveRequests.length / leaveRequestsPerPage)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          leaveCurrentPage === Math.ceil(filteredLeaveRequests.length / leaveRequestsPerPage)
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case '/administrator/financial-analytics':
        return <FinancialAnalytics showNotification={showNotification} />;

      case '/administrator/payment-plans':
        return <AdminPaymentPlans />;

      case '/administrator/feedback':
        return <FeedbackDashboard showNotification={showNotification} />;

      case '/administrator/bulk-import':
        return <BulkImportExport showNotification={showNotification} />;

      default:
        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {modules.find(m => location.pathname.includes(m.id))?.title}
            </h2>
            <p className="text-slate-600">
              {modules.find(m => location.pathname.includes(m.id))?.description}
            </p>
            <div className="mt-6 p-8 bg-slate-50 rounded-lg text-center">
              <Settings className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-slate-500">This feature is under development...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <DashboardHeader title="Administrator Portal" userRole="admin" />

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {notification.message}
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 min-h-screen overflow-hidden`}>
          <nav className="p-4 space-y-1">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => navigate(`/administrator/${module.id}`)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  location.pathname === `/administrator/${module.id}` || (module.id === 'home' && location.pathname === '/administrator')
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <module.icon className="w-5 h-5" />
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">{module.title}</p>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          {/* Toggle Sidebar Button */}
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <p className="text-sm text-slate-600">
              {modules.find(m => location.pathname === `/administrator/${m.id}` || (m.id === 'home' && location.pathname === '/administrator'))?.title || 'Dashboard'}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* Footer */}
      <DashboardFooter />

      {/* Reject Leave Modal */}
      {showRejectModal && selectedLeaveForReject && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Reject Leave Request</h3>
            <p className="text-sm text-slate-600 mb-4">
              {selectedLeaveForReject.requesterId?.name} - {new Date(selectedLeaveForReject.startDate).toLocaleDateString()} to {new Date(selectedLeaveForReject.endDate).toLocaleDateString()}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Rejection Reason *</label>
              <textarea
                value={leaveRejectionReason[selectedLeaveForReject._id] || ''}
                onChange={(e) => setLeaveRejectionReason({ ...leaveRejectionReason, [selectedLeaveForReject._id]: e.target.value })}
                placeholder="Explain why this leave request is being rejected..."
                rows="4"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                maxLength={300}
              />
              <p className="text-xs text-slate-500 mt-1">
                {(leaveRejectionReason[selectedLeaveForReject._id] || '').length}/300
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedLeaveForReject(null);
                  setLeaveRejectionReason({});
                }}
                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reason = leaveRejectionReason[selectedLeaveForReject._id] || '';
                  if (!reason.trim()) {
                    showNotification('Please provide a rejection reason', 'error');
                    return;
                  }
                  handleLeaveDecision(selectedLeaveForReject._id, 'reject', reason);
                  setShowRejectModal(false);
                  setSelectedLeaveForReject(null);
                  setLeaveRejectionReason({});
                }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteUserModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete User</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteUserModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Fee Confirmation Modal */}
      {showDeleteFeeModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Fee</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this fee? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteFeeModal(false);
                  setFeeToDelete(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFee}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      {showDeleteCourseModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Course</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this course? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteCourseModal(false);
                  setCourseToDelete(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Subjects Modal */}
      {showTeacherSubjects && teacherSubjectsData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowTeacherSubjects(false);
                setTeacherSubjectsData(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{teacherSubjectsData.teacher.name}</h2>
                <p className="text-slate-600 mt-1">{teacherSubjectsData.teacher.email}</p>
                <div className="flex items-center justify-center space-x-4 mt-4">
                  <div className="bg-indigo-50 px-4 py-2 rounded-lg">
                    <p className="text-xs text-indigo-600 uppercase font-medium">Total Subjects</p>
                    <p className="text-2xl font-bold text-indigo-700 mt-1">{teacherSubjectsData.totalSubjects}</p>
                  </div>
                  <div className="bg-green-50 px-4 py-2 rounded-lg">
                    <p className="text-xs text-green-600 uppercase font-medium">Active Subjects</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">{teacherSubjectsData.activeSubjects}</p>
                  </div>
                </div>
              </div>

              {/* Subjects List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-slate-900 border-b pb-2">Subjects Teaching</h3>
                {teacherSubjectsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-slate-500 mt-4">Loading subjects...</p>
                  </div>
                ) : teacherSubjectsData.subjects.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {teacherSubjectsData.subjects.map((subject) => (
                      <div
                        key={subject._id}
                        className="bg-slate-50 p-4 rounded-lg border border-slate-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-slate-900">{subject.name}</h4>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                subject.status === 'active' 
                                  ? 'bg-green-100 text-green-700' 
                                  : subject.status === 'inactive'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {subject.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{subject.code}</p>
                            {subject.description && (
                              <p className="text-sm text-slate-600 mb-3">{subject.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-slate-600">
                              <div className="flex items-center space-x-1">
                                <GraduationCap className="w-4 h-4" />
                                <span>Grade {subject.grade}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <BookOpen className="w-4 h-4" />
                                <span>{subject.credits} Credits</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{subject.students} Students</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{subject.semester}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-lg">
                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No subjects assigned to this teacher yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <NotificationToast
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
