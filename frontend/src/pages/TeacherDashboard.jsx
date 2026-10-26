import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { teacherAPI } from '../services/api';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import TeacherInbox from '../components/TeacherInbox';
import io from 'socket.io-client';
import { getSocketBaseUrl } from '../config/runtime';

// Check
import { useNotification } from '../hooks/useNotification';

// Teacher Components  
import TeacherHome from '../components/teacher/TeacherHome';
import TeacherCourses from '../components/teacher/TeacherCourses';
import TeacherAttendance from '../components/teacher/TeacherAttendance';
import TeacherStudents from '../components/teacher/TeacherStudents';
import TeacherCourseManageModal from '../components/teacher/TeacherCourseManageModal';
import CreateAssignmentForm from '../components/teacher/TeacherCreateAssignmentForm';
import TeacherAssignmentsList from '../components/teacher/TeacherAssignmentsList';
import CreateAnnouncementForm from '../components/teacher/TeacherCreateAnnouncementForm';
import TeacherAnnouncementsList from '../components/teacher/TeacherAnnouncementsList';
import TeacherTimetable from '../components/teacher/TeacherTimetable';
import TeacherSchedule from '../components/teacher/TeacherSchedule';
import TeacherLeave from '../components/teacher/TeacherLeave';
import TeacherMaterials from '../components/teacher/TeacherMaterials';

// Config
import { TEACHER_MODULES } from '../config/teacherModules';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teacherStats, setTeacherStats] = useState({ totalCourses: 0, totalStudents: 0, pendingGrading: 0, classesToday: 0 });
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const socketRef = useRef(null);
  const joinedRef = useRef(null);
  
  // Custom hooks
  const { notification, showNotification, hideNotification } = useNotification();
  
  // Course Management Modal
  const [showCourseManageModal, setShowCourseManageModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Students List
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [courseForStudentView, setCourseForStudentView] = useState(null);

  // Attendance state
  const [attendanceCourseId, setAttendanceCourseId] = useState('');
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMarking, setAttendanceMarking] = useState({});
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: { status, date, remarks } }

  // Mark attendance helper
  const markAttendanceStatus = useCallback(async (studentId, status) => {
    if (!attendanceCourseId) return;
    try {
      setAttendanceMarking(prev => ({ ...prev, [studentId]: true }));
      await teacherAPI.markAttendance({ studentId, courseId: attendanceCourseId, status });
      // Optimistically update local map
      setAttendanceMap(prev => ({
        ...prev,
        [String(studentId)]: {
          ...(prev[String(studentId)] || {}),
          status,
          date: new Date().toISOString()
        }
      }));
      showNotification('Attendance marked successfully', 'success');
    } catch (e) {
      console.error('Failed to mark attendance', e);
      showNotification('Failed to mark attendance', 'error');
    } finally {
      setAttendanceMarking(prev => ({ ...prev, [studentId]: false }));
    }
  }, [attendanceCourseId, showNotification]);

  // Socket.io setup
  useEffect(() => {
    if (!user?.id) return;

    const socket = io(getSocketBaseUrl(), {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Teacher socket connected');
      socket.emit('join', { userId: user.id });
    });

    socket.on('message:received', (payload) => {
      console.log('New message received', payload);
      // Show notification
      if (Notification.permission === 'granted') {
        new Notification('New Message', {
          body: `${payload.sender.name}: ${payload.text.substring(0, 50)}...`
        });
      }
    });

    socket.on('attendanceUpdated', (payload) => {
      // payload: { studentId, courseId, record }
      if (!payload) return;
      if (attendanceCourseId && String(payload.courseId) !== String(attendanceCourseId)) return;
      const sid = String(payload.studentId);
      const rec = payload.record || {};
      setAttendanceMap(prev => ({
        ...prev,
        [sid]: {
          status: rec.status,
          date: rec.date || rec.updatedAt || new Date().toISOString(),
          remarks: rec.remarks || ''
        }
      }));
    });

    socketRef.current = socket;
    // Initialize once
    if (!socketRef.current) {
      const socket = io(getSocketBaseUrl(), {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('Teacher socket connected');
        const joinId = user?._id || user?.id;
        if (joinId) {
          socket.emit('join', { userId: joinId });
          joinedRef.current = joinId;
        }
      });

      socket.on('message:received', (payload) => {
        console.log('New message received', payload);
        if (Notification.permission === 'granted') {
          new Notification('New Message', {
            body: `${payload.sender.name}: ${payload.text.substring(0, 50)}...`
          });
        }
      });

      socketRef.current = socket;

      return () => {
        socket.disconnect();
        joinedRef.current = null;
      };
    }
  }, []);

  // Ensure join when user becomes available after connect
  useEffect(() => {
    const socket = socketRef.current;
    const joinId = user?._id || user?.id;
    if (socket && socket.connected && joinId && joinedRef.current !== joinId) {
      socket.emit('join', { userId: joinId });
      joinedRef.current = joinId;
    }
  }, [user]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load teacher dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const res = await teacherAPI.getDashboard(user?.id);
        setTeacherStats(res.data.stats || { totalCourses: 0, totalStudents: 0, pendingGrading: 0, classesToday: 0 });
      } catch (err) {
        console.error('Failed to load teacher stats', err);
        showNotification('Failed to load dashboard data', 'error');
      } finally {
        setStatsLoading(false);
      }
    };
    if (user && user.role === 'teacher') {
      loadStats();
    }
  }, [user]);

  // Load teacher courses when viewing Home, Courses, Attendance, Grading, Announcements, or Schedule
  useEffect(() => {
    if (!user || user.role !== 'teacher') return;
    const shouldFetch = ['/teacher/home','/teacher/courses','/teacher/attendance','/teacher/grading','/teacher/announcements','/teacher/schedule'].includes(location.pathname) || location.pathname === '/teacher';
    if (!shouldFetch) return;

    const loadCourses = async () => {
      setCoursesLoading(true);
      try {
        const res = await teacherAPI.getCourses(user?.id);
        setTeacherCourses(res.data.courses || []);
      } catch (err) {
        console.error('Failed to load teacher courses', err);
        setTeacherCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, [user, location.pathname]);

  // When switching to Attendance, default select first course
  useEffect(() => {
    if (location.pathname !== '/teacher/attendance') return;
    if (!attendanceCourseId && teacherCourses.length > 0) {
      setAttendanceCourseId(teacherCourses[0]._id);
    }
  }, [location.pathname, teacherCourses, attendanceCourseId]);

  // Load students for selected course in Attendance
  useEffect(() => {
    if (location.pathname !== '/teacher/attendance' || !attendanceCourseId) return;
    const load = async () => {
      setAttendanceLoading(true);
      try {
        const res = await teacherAPI.getStudents({ courseId: attendanceCourseId });
        setAttendanceStudents(res.data.students || []);
        // After students load, fetch today's attendance
        try {
          const att = await teacherAPI.getAttendance({ courseId: attendanceCourseId });
          const map = {};
          (att.data.records || []).forEach(r => {
            const sid = String(r.studentId?._id || r.studentId);
            map[sid] = { status: r.status, date: r.date, remarks: r.remarks };
          });
          setAttendanceMap(map);
        } catch (e) {
          console.warn('Failed to load attendance records', e);
          setAttendanceMap({});
        }
      } catch (e) {
        console.error('Failed to load students for attendance', e);
        setAttendanceStudents([]);
        setAttendanceMap({});
      } finally {
        setAttendanceLoading(false);
      }
    };
    load();
  }, [location.pathname, attendanceCourseId]);

  // Fetch students for a course
  const fetchStudentsForCourse = useCallback(async (course) => {
    try {
      setStudentsLoading(true);
      const response = await teacherAPI.getStudents({ courseId: course._id });
      if (response.data.success) {
        setStudents(response.data.students || []);
        setCourseForStudentView(course);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      showNotification('Failed to load students', 'error');
    } finally {
      setStudentsLoading(false);
    }
  }, [showNotification]);

  // Handle course management
  const handleManageCourse = useCallback((course) => {
    setSelectedCourse(course);
    setShowCourseManageModal(true);
  }, []);

  // Handle view student list
  const handleViewStudentList = useCallback((course) => {
    setShowCourseManageModal(false);
    navigate('/teacher/students', { state: { selectedCourse: course } });
  }, [navigate]);

  // Render main content
  const renderMainContent = () => {
    switch (location.pathname) {
      case '/teacher':
      case '/teacher/home':
        return <TeacherHome 
          user={user}
          teacherStats={teacherStats}
          statsLoading={statsLoading}
        />;

      case '/teacher/courses':
        return <TeacherCourses 
          teacherCourses={teacherCourses}
          coursesLoading={coursesLoading}
          handleManageCourse={handleManageCourse}
        />;

      case '/teacher/attendance':
        return <TeacherAttendance 
          teacherCourses={teacherCourses}
          coursesLoading={coursesLoading}
          attendanceCourseId={attendanceCourseId}
          setAttendanceCourseId={setAttendanceCourseId}
          attendanceLoading={attendanceLoading}
          attendanceStudents={attendanceStudents}
          attendanceMarking={attendanceMarking}
          attendanceMap={attendanceMap}
          markAttendanceStatus={markAttendanceStatus}
        />;

      case '/teacher/grading':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Assignments</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create Assignment Form */}
              <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6 border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Create Assignment</h2>
                <CreateAssignmentForm 
                  courses={teacherCourses}
                  onCreated={() => {/* no-op; list component will refresh */}}
                />
              </div>

              {/* Assignment List */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-slate-100">
                <TeacherAssignmentsList />
              </div>
            </div>
          </div>
        );

      case '/teacher/students':
        return <TeacherStudents />;

      case '/teacher/timetable':
        return <TeacherTimetable />;

      case '/teacher/schedule':
        return <TeacherSchedule teacherCourses={teacherCourses} />;

      case '/teacher/leave':
        return <TeacherLeave />;

      case '/teacher/materials':
        return <TeacherMaterials />;

      case '/teacher/announcements':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Post Announcement</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Announcement Form */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Create New Announcement</h2>
                <CreateAnnouncementForm courses={teacherCourses} />
              </div>

              {/* Recent Announcements */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">My Recent Announcements</h2>
                <TeacherAnnouncementsList />
              </div>
            </div>
          </div>
        );

      case '/teacher/messages':
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Messages</h1>
              <p className="text-slate-600">View and respond to student messages</p>
            </div>
            <TeacherInbox user={user} socket={socketRef.current} />
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {TEACHER_MODULES.find(m => location.pathname.includes(m.id))?.icon && 
                React.createElement(TEACHER_MODULES.find(m => location.pathname.includes(m.id)).icon, {
                  className: "w-8 h-8 text-green-600"
                })
              }
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {TEACHER_MODULES.find(m => location.pathname.includes(m.id))?.title}
            </h2>
            <p className="text-slate-600 mb-6">This feature is coming soon!</p>
            <button 
              onClick={() => navigate('/teacher/home')}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    user && user.role !== 'teacher' ? (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
        <DashboardHeader user={user} onToggleSidebar={() => {}} sidebarOpen={false} />
        <main className="max-w-3xl mx-auto p-8">
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-100 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Teachers Area</h1>
            <p className="text-slate-600 mb-6">This section is only available for teacher accounts.</p>
            <a href="/" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">Go to Home</a>
          </div>
        </main>
        <DashboardFooter />
      </div>
    ) : (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <DashboardHeader title="Teacher Portal" userRole="teacher" />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg shadow-lg p-4 max-w-md ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={hideNotification}
                className="ml-4 text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex relative">
        {/* Sidebar */}
        {/* Desktop sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 min-h-screen overflow-hidden hidden md:block`}>
          <nav className="p-4 space-y-1">
            {TEACHER_MODULES.map((module) => (
              <button
                key={module.id}
                onClick={() => navigate(`/teacher/${module.id}`)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  location.pathname === `/teacher/${module.id}` || (module.id === 'home' && location.pathname === '/teacher')
                    ? 'bg-green-600 text-white shadow-md'
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
                {TEACHER_MODULES.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => { navigate(`/teacher/${module.id}`); setSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      location.pathname === `/teacher/${module.id}` || (module.id === 'home' && location.pathname === '/teacher')
                        ? 'bg-green-600 text-white shadow-md'
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
              {TEACHER_MODULES.find(m => location.pathname === `/teacher/${m.id}` || (m.id === 'home' && location.pathname === '/teacher'))?.title || 'Dashboard'}
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

      {/* Course Management Modal */}
      <TeacherCourseManageModal 
        show={showCourseManageModal}
        selectedCourse={selectedCourse}
        onClose={() => setShowCourseManageModal(false)}
        onViewStudentList={handleViewStudentList}
      />
    </div>
    )
  );
}

