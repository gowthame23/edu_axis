import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, BookOpen, FileText, Upload, ClipboardList, Bell } from 'lucide-react';

export default function TeacherCourseManageModal({ show, selectedCourse, onClose, onViewStudentList }) {
  const navigate = useNavigate();
  
  if (!show || !selectedCourse) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{selectedCourse.name}</h2>
            <p className="text-sm text-slate-600">Grade {selectedCourse.grade} • {selectedCourse.code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Course Stats */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600">Students Enrolled</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedCourse.students || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-slate-600">Credits</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedCourse.credits || 3}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Course Description */}
          {selectedCourse.description && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">Course Description</h3>
              <p className="text-slate-700 text-sm">{selectedCourse.description}</p>
            </div>
          )}

          {/* Management Actions */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 mb-3">Course Management</h3>
            {/* Upload Assignment */}
            <button
              onClick={() => { onClose(); navigate('/teacher/grading'); }}
              className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-900">Upload Assignment</p>
                <p className="text-sm text-slate-600">Create and assign homework to students</p>
              </div>
            </button>
            {/* Upload Study Materials */}
            <button
              onClick={() => { onClose(); navigate('/teacher/materials'); }}
              className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-900">Upload Study Materials</p>
                <p className="text-sm text-slate-600">Share notes, PDFs, and resources</p>
              </div>
            </button>
            {/* Mark Attendance */}
            <button
              onClick={() => { onClose(); navigate('/teacher/attendance'); }}
              className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition-all group"
            >
              <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-900">Mark Attendance</p>
                <p className="text-sm text-slate-600">Record student attendance for this course</p>
              </div>
            </button>
            {/* Post Announcement */}
            <button
              onClick={() => { onClose(); navigate('/teacher/announcements'); }}
              className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50 rounded-lg transition-all group"
            >
              <div className="w-12 h-12 bg-orange-100 group-hover:bg-orange-200 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-900">Post Announcement</p>
                <p className="text-sm text-slate-600">Notify students about important updates</p>
              </div>
            </button>
            {/* View Student List */}
            <button
              onClick={() => onViewStudentList(selectedCourse)}
              className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-lg transition-all group"
            >
              <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-900">View Student List</p>
                <p className="text-sm text-slate-600">See all enrolled students for this course</p>
              </div>
            </button>
          </div>

          {/* Close Button */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
