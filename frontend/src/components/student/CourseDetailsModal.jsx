import React from 'react';
import { X, RefreshCw, BookOpen } from 'lucide-react';

const CourseDetailsModal = ({ 
  showCourseModal, 
  setShowCourseModal,
  selectedCourse,
  setSelectedCourse,
  courseDetails,
  setCourseDetails,
  courseDetailsLoading,
  fetchCourseDetails
}) => {
  if (!showCourseModal) return null;

  const handleClose = () => {
    setShowCourseModal(false);
    setSelectedCourse(null);
    setCourseDetails(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Course Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => selectedCourse && fetchCourseDetails(selectedCourse._id)}
              disabled={courseDetailsLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${courseDetailsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {courseDetailsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 mt-4">Loading course details...</p>
            </div>
          ) : !courseDetails ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No details available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{courseDetails.name}</h3>
                  <p className="text-slate-600 mt-1">Code: {courseDetails.code}</p>
                  {courseDetails.teacherId?.name && (
                    <p className="text-slate-600 mt-1">
                      Instructor: {courseDetails.teacherId.name}
                      {courseDetails.teacherId.email ? ` • ${courseDetails.teacherId.email}` : ''}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 min-w-[220px]">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500">Credits</p>
                    <p className="text-lg font-bold text-slate-900">{courseDetails.credits ?? '-'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500">Semester</p>
                    <p className="text-lg font-bold text-slate-900">{courseDetails.semester ?? '-'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center col-span-2">
                    <p className="text-xs text-slate-500">Status</p>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      courseDetails.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {courseDetails.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {courseDetails.description && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{courseDetails.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Assignments */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Most Recent Assignment</h4>
                  {courseDetails.recentAssignments && courseDetails.recentAssignments.length > 0 ? (
                    <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                      <p className="font-medium text-slate-900">{courseDetails.recentAssignments[0].title}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        Due: {new Date(courseDetails.recentAssignments[0].dueDate).toLocaleDateString()} • {courseDetails.recentAssignments[0].totalMarks || 100} marks
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">No recent assignments</p>
                  )}
                </div>

                {/* Recent Announcements */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Most Recent Announcement</h4>
                  {courseDetails.recentAnnouncements && courseDetails.recentAnnouncements.length > 0 ? (
                    (() => {
                      // Sort announcements by createdAt descending to ensure latest is first
                      const sortedAnnouncements = [...courseDetails.recentAnnouncements].sort((a, b) => 
                        new Date(b.createdAt) - new Date(a.createdAt)
                      );
                      const latestAnnouncement = sortedAnnouncements[0];
                      return (
                        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                          <p className="font-medium text-slate-900">{latestAnnouncement.title}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            {new Date(latestAnnouncement.createdAt).toLocaleDateString()}
                          </p>
                          {latestAnnouncement.content && (
                            <p className="text-sm text-slate-700 mt-1 line-clamp-3">
                              {latestAnnouncement.content}
                            </p>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-sm text-slate-600">No recent announcements</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsModal;
