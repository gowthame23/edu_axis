import { BookOpen, Trash2 } from 'lucide-react';

export default function StudentCourses({ 
  courses, 
  coursesLoading, 
  openCourseDetails,
  handleDropCourse,
  showNotification
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">My Courses</h1>
      {coursesLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No courses enrolled yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div key={course._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{course.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">Code: {course.code}</p>
                  <p className="text-sm text-slate-600">
                    {course.teacherId?.name || 'Instructor TBA'}
                  </p>
                  <p className="text-sm text-slate-600">Semester: {course.semester || '—'}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  course.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {course.status || 'Active'}
                </span>
              </div>
              
              {course.description && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>
              )}
              
              <div className="flex gap-3">
                <button 
                  onClick={() => openCourseDetails(course)}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  View Details
                </button>
                <button 
                  onClick={() => handleDropCourse(course.enrollmentId, course.name)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center space-x-2"
                  title="Drop this course"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Drop</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
