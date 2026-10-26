import { useState, useEffect } from 'react';
import { BookOpen, Plus, AlertCircle } from 'lucide-react';
import { studentAPI } from '../../services/api';

export default function CourseRegistration({ studentId, showNotification }) {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEnrollments();
    fetchAvailableCourses();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const res = await studentAPI.getEnrollments(studentId);
      setEnrolledCourses(res.data.data || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      setLoading(true);
      const res = await studentAPI.getAvailableCourses(studentId);
      setAvailableCourses(res.data.data || []);
    } catch (err) {
      console.error('Error fetching available courses:', err);
      showNotification('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      const response = await studentAPI.enrollCourse({
        studentId,
        courseId
      });
      
      if (response.data.success) {
        showNotification('Successfully enrolled in course!', 'success');
        // Refresh both lists to reflect the change
        await fetchEnrollments();
        await fetchAvailableCourses();
      } else {
        showNotification(response.data.message || 'Failed to enroll', 'error');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to enroll in course';
      showNotification(errorMessage, 'error');
      // Don't refresh on error - keep the UI stable
    }
  };

  const handleDropCourse = async (enrollmentId) => {
    if (window.confirm('Are you sure you want to drop this course?')) {
      try {
        await studentAPI.dropCourse(enrollmentId);
        showNotification('Course dropped successfully', 'success');
        fetchEnrollments();
        fetchAvailableCourses();
      } catch (err) {
        console.error('Drop error:', err);
        showNotification('Failed to drop course', 'error');
      }
    }
  };

  const filteredCourses = availableCourses.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
        <BookOpen className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Currently enrolled in {enrolledCourses.length} course(s)</p>
          <p className="text-blue-700">Visit "My Courses" tab to view your enrolled courses or manage them</p>
        </div>
      </div>

      {/* Browse Available Courses Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Browse Courses</h2>
            <p className="text-slate-600 mt-1">Enroll in new courses to expand your learning</p>
          </div>
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search courses by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        {/* Available Courses Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-slate-600 mt-3">Loading courses...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map(course => (
              <div
                key={course._id}
                className="border border-slate-200 rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg">{course.name}</h3>
                    <p className="text-sm text-purple-600 font-medium">{course.code}</p>
                  </div>
                  <BookOpen className="w-5 h-5 text-slate-400" />
                </div>
                {course.description && (
                  <p className="text-sm text-slate-600 mb-3">{course.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span>Credits: {course.credits}</span>
                  <span>Semester: {course.semester}</span>
                </div>
                <button
                  onClick={() => handleEnroll(course._id)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enroll Now</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No courses available matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
