import React from 'react';

const TeacherCourses = ({ teacherCourses, coursesLoading, handleManageCourse }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">My Courses</h1>
      {coursesLoading ? (
        <div className="p-6 bg-white rounded-xl shadow-md border border-slate-100 text-slate-600">Loading courses...</div>
      ) : teacherCourses.length === 0 ? (
        <div className="p-6 bg-white rounded-xl shadow-md border border-slate-100 text-slate-600">No courses assigned yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teacherCourses.map((course) => (
            <div key={course._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{course.name} <span className="text-slate-500 text-sm">({course.code})</span></h3>
                  <p className="text-sm text-slate-600">Grade {course.grade} • {course.students || 0} Students</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${course.status === 'active' ? 'bg-green-100 text-green-700' : course.status === 'inactive' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                  {course.status?.toUpperCase()}
                </span>
              </div>
              {course.description && (
                <p className="text-sm text-slate-700 mb-4 line-clamp-2">{course.description}</p>
              )}
              <button 
                onClick={() => handleManageCourse(course)}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Manage
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherCourses;
