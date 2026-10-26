import React from 'react';

const TeacherAttendance = ({ 
  teacherCourses, 
  coursesLoading, 
  attendanceCourseId, 
  setAttendanceCourseId, 
  attendanceLoading, 
  attendanceStudents, 
  attendanceMarking, 
  attendanceMap = {},
  markAttendanceStatus 
}) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Mark Attendance</h1>
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Course</label>
          <select
            value={attendanceCourseId}
            onChange={(e) => setAttendanceCourseId(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          >
            {coursesLoading ? (
              <option>Loading courses...</option>
            ) : teacherCourses.length > 0 ? (
              teacherCourses.map(c => (
                <option key={c._id} value={c._id}>{c.name} • Grade {c.grade}</option>
              ))
            ) : (
              <option>No courses assigned</option>
            )}
          </select>
        </div>
        {attendanceLoading ? (
          <div className="p-4 bg-slate-50 rounded-lg text-slate-600">Loading students...</div>
        ) : attendanceStudents.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-lg text-slate-600">No students found for this course.</div>
        ) : (
          <div className="space-y-3">
            {attendanceStudents.map((s, idx) => {
              const sid = String(s._id || s.id);
              const status = attendanceMap[sid]?.status;
              const isPresent = status === 'present';
              const isAbsent = status === 'absent';
              return (
                <div key={sid || idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{s.name}</p>
                    <p className="text-sm text-slate-600">ID: {s.studentId || 'N/A'}</p>
                    {status && (
                      <span className={`inline-block mt-1 text-xs font-semibold px-2 py-1 rounded-full ${
                        isPresent ? 'bg-green-100 text-green-700' : isAbsent ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isPresent ? 'Present today' : isAbsent ? 'Absent today' : status}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAttendanceStatus(sid, 'present')}
                      disabled={!!attendanceMarking[sid] || isPresent}
                      className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                        isPresent ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                      }`}
                      title={isPresent ? 'Already marked present' : 'Mark as present'}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => markAttendanceStatus(sid, 'absent')}
                      disabled={!!attendanceMarking[sid] || isAbsent}
                      className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                        isAbsent ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                      }`}
                      title={isAbsent ? 'Already marked absent' : 'Mark as absent'}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendance;
