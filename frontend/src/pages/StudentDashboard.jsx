import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { X } from 'lucide-react';
import { getSocketBaseUrl } from '../config/runtime';

// Context & AP
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../services/api';

// Custom Hooks
import { useNotification } from '../hooks/useNotification';

// Components
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import StudentInbox from '../components/StudentInbox';
import NotificationToast from '../components/NotificationToast';
import CourseDetailsModal from '../components/student/CourseDetailsModal';
import StudentHome from '../components/student/StudentHome';
import StudentCourses from '../components/student/StudentCourses';
import StudentAssignments from '../components/student/StudentAssignments';
import StudentGrades from '../components/student/StudentGrades';
import StudentAttendance from '../components/student/StudentAttendance';
import StudentTimetable from '../components/student/StudentTimetable';
import StudentSchedule from '../components/student/StudentSchedule';
import StudentAnnouncements from '../components/student/StudentAnnouncements';
import StudentLibrary from '../components/student/StudentLibrary';
import StudentLeave from '../components/student/StudentLeave';
import StudentFees from '../components/student/StudentFees';
import StudentMaterials from '../components/student/StudentMaterials';
import CourseRegistration from '../components/student/CourseRegistration';
import StudentFeedbackDashboard from '../components/student/StudentFeedbackDashboard';
import PerformanceAnalytics from '../components/student/PerformanceAnalytics';

import { STUDENT_MODULES } from '../config/studentModules';

export default function StudentDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCourses: 0,
    attendance: 0,
    completedAssignments: 0,
    totalAssignments: 0,
    pendingAssignments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Module-specific states
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [timetable, setTimetable] = useState(null);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [library, setLibrary] = useState(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const joinedRef = useRef(null);

  // Leave Request States
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveRequestsLoading, setLeaveRequestsLoading] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    type: 'casual',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [leaveCurrentPage, setLeaveCurrentPage] = useState(1);
  const leaveRequestsPerPage = 5;

  // Course Details Modal States
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [courseDetailsLoading, setCourseDetailsLoading] = useState(false);

  // Fee Management States
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [feeSummary, setFeeSummary] = useState({
    totalFees: 0,
    totalPaid: 0,
    pending: 0,
    lateFees: 0,
    totalDue: 0
  });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    paymentMethod: 'Cash',
    transactionId: '',
    remarks: ''
  });
  const [feesLoading, setFeesLoading] = useState(false);
  
  // Custom hooks
  const { notification, showNotification, hideNotification } = useNotification();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Initialize Socket.IO connection once
  useEffect(() => {
    if (!socketRef.current) {
      const socket = io(getSocketBaseUrl(), { withCredentials: true });
      socketRef.current = socket;
      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
      // Join room after socket connects if user present
      socket.on('connect', () => {
        if (user) {
          try {
            const joinId = user._id || user.id; // Prefer database _id for socket room
            if (!joinId) {
              console.warn('No MongoDB _id found on user for socket join');
            } else {
              socket.emit('join', { userId: joinId });
              joinedRef.current = joinId;
            }
          } catch (err) {
            console.error('Socket join error', err);
          }
        }
      });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketConnected(false);
        joinedRef.current = null;
      }
    };
  }, []);

  // Ensure we join the user room when user becomes available after initial connect
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const joinId = user?._id || user?.id;
    if (socketConnected && joinId && joinedRef.current !== joinId) {
      try {
        socket.emit('join', { userId: joinId });
        joinedRef.current = joinId;
      } catch (err) {
        console.error('Deferred socket join error', err);
      }
    }
  }, [socketConnected, user]);

  useEffect(() => {
    if (user && location.pathname === '/student/fees') {
      fetchFeeData();
    }
  }, [user, location.pathname]);

  // Fetch data when switching modules
  useEffect(() => {
    if (!user) return;

    switch (location.pathname) {
      case '/student/courses':
        fetchCourses();
        break;
      case '/student/grades':
        fetchGrades();
        break;
      case '/student/attendance':
        fetchAttendance();
        break;
      case '/student/assignments':
        fetchAssignments();
        break;
      case '/student/timetable':
        fetchTimetable();
        break;
      case '/student/announcements':
        fetchAnnouncements();
        break;
      case '/student/library':
        fetchLibrary();
        break;
      case '/student/leave':
        fetchLeaveRequests();
        setLeaveCurrentPage(1); // Reset to first page when opening leave module
        break;
      default:
        break;
    }
  }, [user, location.pathname]);

  // Responsive: auto-collapse sidebar on narrower (half-screen) widths
  useEffect(() => {
    const handleResize = () => {
      // Treat < 1100px as half / constrained view for side-by-side testing
      if (window.innerWidth < 1100) {
        setSidebarOpen(false);
        
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Realtime: Listen for attendance updates and refresh when relevant
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || location.pathname !== '/student/attendance') return;
    const handler = (payload) => {
      const myId = user?._id || user?.id || user?.studentId;
      if (!myId) return;
      if (String(payload.studentId) === String(myId)) {
        fetchAttendance();
      }
    };
    socket.on('attendanceUpdated', handler);
    return () => {
      socket.off('attendanceUpdated', handler);
    };
  }, [location.pathname, user]);

  // Realtime: Listen for assignment creation events (teacher emits) and refresh if viewing assignments
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user) return;
    // Incoming private messages
    const msgHandler = (payload) => {
      const sender = payload?.sender?.name || payload?.sender?.email || 'Someone';
      const text = payload?.text || '';
      showNotification(`${sender}: ${text}`, 'success');
    };
    socket.on('message:received', msgHandler);
    const handler = (payload) => {
      // Only react if assignment targets the student's grade
      if (!payload || String(payload.grade) !== String(user.grade)) return;
      // Refresh list if on assignments module; else skip to avoid unnecessary requests
      if (location.pathname === '/student/assignments') {
        fetchAssignments();
      }
    };
    socket.on('assignmentCreated', handler);
    return () => {
      socket.off('assignmentCreated', handler);
      socket.off('message:received', msgHandler);
    };
  }, [location.pathname, user]);

  // Realtime: Listen for announcement creation events (teacher posts) and refresh if viewing announcements
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user) return;
    const handler = (payload) => {
      // Only react if announcement is for student's grade
      if (!payload || String(payload.grade) !== String(user.grade)) return;
      // Refresh announcements if on that module
      if (location.pathname === '/student/announcements') {
        fetchAnnouncements();
      }
    };
    socket.on('announcementCreated', handler);
    return () => {
      socket.off('announcementCreated', handler);
    };
  }, [location.pathname, user]);

  const fetchFeeData = async () => {
    try {
      setFeesLoading(true);
      const response = await studentAPI.getFees();
      
      if (response.data.success) {
        setFees(response.data.fees || []);
        setPayments(response.data.payments || []);
        setFeeSummary(response.data.summary || {
          totalFees: 0,
          totalPaid: 0,
          pending: 0,
          lateFees: 0,
          totalDue: 0
        });
      }
    } catch (error) {
      console.error('Error fetching fee data:', error);
    } finally {
      setFeesLoading(false);
    }
  };

  const ensureRazorpayLoaded = () => {
    if (window.Razorpay) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFee) return;

    try {
      setFeesLoading(true);
      
      const razorpayReady = await ensureRazorpayLoaded();
      if (!razorpayReady) {
        showNotification('Unable to load Razorpay checkout. Please try again.', 'error');
        return;
      }

      const paymentData = {
        feeId: selectedFee._id,
        amount: selectedFee.amount,
        paymentMethod: 'Online Payment',
        remarks: paymentFormData.remarks
      };

      const response = await studentAPI.createFeeRazorpayOrder(paymentData);
      
      if (response.data.success) {
        const options = {
          key: response.data.key,
          amount: response.data.amount,
          currency: response.data.currency,
          name: 'EduAxis',
          description: selectedFee.title || 'Fee Payment',
          order_id: response.data.orderId,
          prefill: {
            name: user?.name || response.data.studentName,
            email: user?.email || response.data.studentEmail,
            contact: user?.phone || ''
          },
          theme: {
            color: '#dc2626'
          },
          handler: async (rzpResponse) => {
            try {
              const verifyResponse = await studentAPI.verifyFeeRazorpayPayment({
                paymentId: response.data.paymentId,
                razorpayOrderId: rzpResponse.razorpay_order_id,
                razorpayPaymentId: rzpResponse.razorpay_payment_id,
                razorpaySignature: rzpResponse.razorpay_signature
              });

              if (verifyResponse.data.success) {
                showNotification('Payment successful and verified!', 'success');
                setShowPaymentForm(false);
                setSelectedFee(null);
                setPaymentFormData({
                  paymentMethod: 'Cash',
                  transactionId: '',
                  remarks: ''
                });
                fetchFeeData();
              }
            } catch (verifyError) {
              console.error('Error verifying payment:', verifyError);
              showNotification(verifyError.response?.data?.message || 'Payment verification failed', 'error');
            }
          }
        };

        const razorpayCheckout = new window.Razorpay(options);
        razorpayCheckout.on('payment.failed', () => {
          showNotification('Payment failed. Please try again.', 'error');
        });
        razorpayCheckout.open();
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      showNotification(error.response?.data?.message || 'Failed to submit payment', 'error');
    } finally {
      setFeesLoading(false);
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const response = await studentAPI.downloadReceipt(paymentId);
      
      if (response.data.success) {
        const receipt = response.data.receipt;
        // For now, show receipt details in alert (later we'll generate PDF)
        alert(`Receipt: ${receipt.receiptNumber}\nAmount: ₹${receipt.amount}\nDate: ${new Date(receipt.paymentDate).toLocaleDateString()}`);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const studentId = user?._id || user?.id || user?.studentId;
      
      if (!studentId) {
        throw new Error('Student ID not found');
      }

      const response = await studentAPI.getDashboard(studentId);
      
      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Courses (now fetches enrollments to show only enrolled courses)
  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const studentId = user?._id || user?.id;
      const response = await studentAPI.getEnrollments(studentId);
      if (response.data.success) {
        // Map enrollments to course format with enrollmentId
        const enrolledCourses = (response.data.data || []).map(enrollment => ({
          ...enrollment.courseId,
          enrollmentId: enrollment._id, // Add enrollmentId for dropping courses
          enrollmentStatus: enrollment.status
        }));
        setCourses(enrolledCourses);
      } else {
        showNotification(response.data.message || 'Failed to load courses', 'error');
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load enrolled courses';
      showNotification(errorMsg, 'error');
    } finally {
      setCoursesLoading(false);
    }
  }, [showNotification, user]);

  // Fetch Course Details
  const fetchCourseDetails = useCallback(async (courseId) => {
    try {
      setCourseDetailsLoading(true);
      setCourseDetails(null);
      const response = await studentAPI.getCourseDetails(courseId);
      if (response.data.success) {
        setCourseDetails(response.data.course);
      } else {
        showNotification(response.data.message || 'Failed to load course details', 'error');
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load course details';
      showNotification(errorMsg, 'error');
    } finally {
      setCourseDetailsLoading(false);
    }
  }, [showNotification]);

  const openCourseDetails = (course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
    if (course?._id) {
      fetchCourseDetails(course._id);
    }
  };

  // Handle dropping/unenrolling from a course
  const handleDropCourse = useCallback(async (enrollmentId, courseName) => {
    if (!window.confirm(`Are you sure you want to drop "${courseName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await studentAPI.dropCourse(enrollmentId);
      
      if (response.data.success) {
        showNotification('Course dropped successfully', 'success');
        // Refresh the courses list
        fetchCourses();
      } else {
        showNotification(response.data.message || 'Failed to drop course', 'error');
      }
    } catch (error) {
      console.error('Error dropping course:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to drop course';
      showNotification(errorMsg, 'error');
    }
  }, [showNotification, fetchCourses]);

  // Fetch Grades
  const fetchGrades = useCallback(async () => {
    try {
      setGradesLoading(true);
      const studentId = user?._id || user?.id || user?.studentId;
      const response = await studentAPI.getGrades(studentId);
      if (response.data.success) {
        setGrades(response.data.grades || []);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
      showNotification('Failed to load grades', 'error');
    } finally {
      setGradesLoading(false);
    }
  }, [user, showNotification]);

  // Fetch Attendance
  const fetchAttendance = useCallback(async () => {
    try {
      setAttendanceLoading(true);
      const studentId = user?._id || user?.id || user?.studentId;
      const response = await studentAPI.getAttendance(studentId);
      if (response.data.success) {
        setAttendance(response.data.attendance);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      showNotification('Failed to load attendance', 'error');
    } finally {
      setAttendanceLoading(false);
    }
  }, [user, showNotification]);

  // Fetch Assignments
  const fetchAssignments = useCallback(async () => {
    try {
      setAssignmentsLoading(true);
      const studentId = user?._id || user?.id || user?.studentId;
      const response = await studentAPI.getAssignments(studentId);
      if (response.data.success) {
        setAssignments(response.data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      showNotification('Failed to load assignments', 'error');
    } finally {
      setAssignmentsLoading(false);
    }
  }, [user, showNotification]);

  // Fetch Timetable
  const fetchTimetable = useCallback(async () => {
    try {
      setTimetableLoading(true);
      const response = await studentAPI.getTimetable();
      if (response.data.success) {
        setTimetable(response.data.timetable);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      showNotification('Failed to load timetable', 'error');
    } finally {
      setTimetableLoading(false);
    }
  }, [showNotification]);

  // Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      setAnnouncementsLoading(true);
      const response = await studentAPI.getAnnouncements();
      if (response.data.success) {
        setAnnouncements(response.data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showNotification('Failed to load announcements', 'error');
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [showNotification]);

  // Fetch Library
  const fetchLibrary = useCallback(async (params = {}) => {
    try {
      setLibraryLoading(true);
      const response = await studentAPI.getLibrary(params);
      if (response.data.success) {
        setLibrary(response.data.library);
      } else {
        showNotification(response.data.message || 'Failed to load library', 'error');
      }
    } catch (error) {
      console.error('Error fetching library:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load library';
      showNotification(errorMsg, 'error');
    } finally {
      setLibraryLoading(false);
    }
  }, [showNotification]);

  // Fetch Leave Requests
  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLeaveRequestsLoading(true);
      const response = await studentAPI.getLeaveRequests();
      if (response.data.success) {
        setLeaveRequests(response.data.leaveRequests || []);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      showNotification('Failed to load leave requests', 'error');
    } finally {
      setLeaveRequestsLoading(false);
    }
  }, [showNotification]);

  // Submit leave request
  const handleLeaveSubmit = useCallback(async (e) => {
    e.preventDefault();
    // Frontend validation for dates
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(leaveFormData.startDate);
    const end = new Date(leaveFormData.endDate);

    if (!leaveFormData.startDate || !leaveFormData.endDate) {
      showNotification('Please select both start and end dates', 'error');
      return;
    }
    if (start < today) {
      showNotification('Start date cannot be in the past', 'error');
      return;
    }
    if (end < start) {
      showNotification('End date cannot be before start date', 'error');
      return;
    }
    try {
      const response = await studentAPI.createLeaveRequest(leaveFormData);
      if (response.data.success) {
        showNotification('Leave request submitted successfully', 'success');
        setShowLeaveForm(false);
        setLeaveFormData({ type: 'casual', startDate: '', endDate: '', reason: '' });
        fetchLeaveRequests();
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      showNotification(error.response?.data?.message || 'Failed to submit leave request', 'error');
    }
  }, [leaveFormData, showNotification, fetchLeaveRequests]);

  // Use imported module configuration

  const renderMainContent = () => {
    switch (location.pathname) {
      case '/student':
      case '/student/home':
        return <StudentHome 
          user={user} 
          stats={stats} 
          loading={loading} 
          error={error} 
          fetchDashboardData={fetchDashboardData}
        />;
      
      case '/student/courses':
        return <StudentCourses 
          courses={courses} 
          coursesLoading={coursesLoading}
          openCourseDetails={openCourseDetails}
          handleDropCourse={handleDropCourse}
          showNotification={showNotification}
        />;
      
      case '/student/assignments':
        return <StudentAssignments 
          assignments={assignments}
          assignmentsLoading={assignmentsLoading}
          showNotification={showNotification}
        />;

      case '/student/fees':
        return <StudentFees 
          fees={fees}
          feesLoading={feesLoading}
          payments={payments}
          feeSummary={feeSummary}
          showPaymentForm={showPaymentForm}
          setShowPaymentForm={setShowPaymentForm}
          selectedFee={selectedFee}
          setSelectedFee={setSelectedFee}
          paymentFormData={paymentFormData}
          setPaymentFormData={setPaymentFormData}
          handlePaymentSubmit={handlePaymentSubmit}
          handleDownloadReceipt={handleDownloadReceipt}
        />;

      case '/student/grades':
        return <StudentGrades 
          grades={grades}
          gradesLoading={gradesLoading}
        />;

      case '/student/attendance':
        return <StudentAttendance 
          attendance={attendance}
          attendanceLoading={attendanceLoading}
        />;

      case '/student/timetable':
        return <StudentTimetable 
          timetable={timetable}
          timetableLoading={timetableLoading}
        />;
      case '/student/schedule':
        return <StudentSchedule />;

      case '/student/announcements':
        return <StudentAnnouncements 
          announcements={announcements}
          announcementsLoading={announcementsLoading}
          onAnnouncementsUpdate={fetchAnnouncements}
          showNotification={showNotification}
        />;

      case '/student/messages':
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Messages</h1>
              <p className="text-slate-600">Chat with your teachers</p>
            </div>
            <StudentInbox user={user} socket={socketRef.current} />
          </div>
        );

      case '/student/library':
        return <StudentLibrary 
          library={library}
          libraryLoading={libraryLoading}
          onSearch={(params) => fetchLibrary(params)}
        />;

      case '/student/leave':
        return <StudentLeave 
          leaveRequests={leaveRequests}
          leaveRequestsLoading={leaveRequestsLoading}
          showLeaveForm={showLeaveForm}
          setShowLeaveForm={setShowLeaveForm}
          leaveFormData={leaveFormData}
          setLeaveFormData={setLeaveFormData}
          handleLeaveSubmit={handleLeaveSubmit}
          leaveCurrentPage={leaveCurrentPage}
          setLeaveCurrentPage={setLeaveCurrentPage}
          leaveRequestsPerPage={leaveRequestsPerPage}
        />;

      case '/student/materials':
        return <StudentMaterials />;

      case '/student/enrollment':
        return <CourseRegistration 
          studentId={user?._id}
          showNotification={showNotification}
        />;

      case '/student/feedback':
        return <StudentFeedbackDashboard 
          studentId={user?._id}
          showNotification={showNotification}
        />;

      case '/student/performance':
        return <PerformanceAnalytics 
          studentId={user?._id}
        />;

      default:
        return (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {STUDENT_MODULES.find(m => location.pathname.includes(m.id))?.icon && 
                React.createElement(STUDENT_MODULES.find(m => location.pathname.includes(m.id)).icon, {
                  className: "w-8 h-8 text-blue-600"
                })
              }
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {STUDENT_MODULES.find(m => location.pathname.includes(m.id))?.title}
            </h2>
            <p className="text-slate-600 mb-6">This feature is coming soon!</p>
            <button 
              onClick={() => navigate('/student/home')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <DashboardHeader title="Student Portal" userRole="student" />

      {/* Notification Toast */}
      <NotificationToast notification={notification} onClose={hideNotification} />

      <div className="flex relative">
        {/* Sidebar */}
        {/* Desktop sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} md:${sidebarOpen ? 'w-60' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 min-h-screen overflow-hidden
          ${sidebarOpen ? 'shadow-lg' : ''} hidden md:block`}>
          <nav className="p-4 space-y-1">
            {STUDENT_MODULES.map((module) => (
              <button
                key={module.id}
                onClick={() => navigate(`/student/${module.id}`)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  location.pathname === `/student/${module.id}` || (module.id === 'home' && location.pathname === '/student')
                    ? 'bg-blue-600 text-white shadow-md'
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

        {/* Mobile/half-screen overlay sidebar */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-slate-900/40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 shadow-2xl z-40 md:hidden">
              <div className="p-4 flex items-center justify-between border-b border-slate-200">
                <p className="text-sm font-medium text-slate-700">Menu</p>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {STUDENT_MODULES.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => { navigate(`/student/${module.id}`); setSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      location.pathname === `/student/${module.id}` || (module.id === 'home' && location.pathname === '/student')
                        ? 'bg-blue-600 text-white shadow-md'
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
          </>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0"> {/* min-w-0 prevents overflow when side-by-side */}
          {/* Toggle Sidebar Button */}
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors" /* Always show toggle so burger is available */
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
              {STUDENT_MODULES.find(m => location.pathname === `/student/${m.id}` || (m.id === 'home' && location.pathname === '/student'))?.title || 'Dashboard'}
            </p>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-4 md:space-y-6"> {/* Slightly tighter padding on constrained width */}
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* Course Details Modal */}
      <CourseDetailsModal 
        showCourseModal={showCourseModal}
        setShowCourseModal={setShowCourseModal}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        courseDetails={courseDetails}
        setCourseDetails={setCourseDetails}
        courseDetailsLoading={courseDetailsLoading}
        fetchCourseDetails={fetchCourseDetails}
      />

      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}
