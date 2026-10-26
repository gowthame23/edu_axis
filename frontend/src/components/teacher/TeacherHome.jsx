import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, FileText, Calendar, ClipboardList, BarChart3, Bell, Upload } from 'lucide-react';

const TeacherHome = ({ user, teacherStats, statsLoading }) => {
  const navigate = useNavigate();
  
  return (
    <div>
      {/* Welcome Section */}
      <div className="bg-linear-to-r from-green-600 to-green-700 rounded-2xl p-8 mb-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {user?.name || 'Teacher'}!
        </h1>
        <p className="text-green-100">Manage your classes and students effectively</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">My Courses</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{statsLoading ? '—' : teacherStats.totalCourses}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{statsLoading ? '—' : teacherStats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Pending Grading</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{statsLoading ? '—' : teacherStats.pendingGrading}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Classes Today</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{statsLoading ? '—' : teacherStats.classesToday}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center"
          >
            <ClipboardList className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900">Mark Attendance</p>
          </button>
          <button
            onClick={() => navigate('/teacher/grading')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center"
          >
            <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900">Grade Work</p>
          </button>
          <button
            onClick={() => navigate('/teacher/announcements')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center"
          >
            <Bell className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900">Post Announcement</p>
          </button>
          <button
            onClick={() => navigate('/teacher/materials')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center"
          >
            <Upload className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900">Upload Material</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherHome;
