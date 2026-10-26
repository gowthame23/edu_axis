import { FileText, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import { resolveAssetUrl } from '../../config/runtime';

export default function StudentAssignments({ 
  assignments, 
  assignmentsLoading, 
  showNotification 
}) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitContent, setSubmitContent] = useState('');
  const [submitLink, setSubmitLink] = useState('');
  const [recentlySubmitted, setRecentlySubmitted] = useState({});
  const [files, setFiles] = useState([]);
  const [submissionDetails, setSubmissionDetails] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('');

  // Clear filters
  const clearFilters = () => {
    setFilterStatus('all');
    setFilterCourse('');
    setCurrentPage(1);
  };

  const hasActiveFilters = filterStatus !== 'all' || filterCourse !== '';

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Extract unique courses
  const courses = useMemo(() => {
    const uniqueCourses = new Set();
    assignments.forEach(a => {
      const courseName = a.courseId?.name || a.subject;
      if (courseName) uniqueCourses.add(courseName);
    });
    return Array.from(uniqueCourses).sort();
  }, [assignments]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate);
      const isOverdue = dueDate < new Date();
      const submissionStatus = assignment.submissionStatus || 'pending';
      const isSubmitted = submissionStatus === 'submitted' || submissionStatus === 'graded' || recentlySubmitted[assignment._id];
      const isPending = !isSubmitted;
      
      // Pending: not submitted AND not overdue
      if (filterStatus === 'pending' && (!isPending || isOverdue)) return false;
      if (filterStatus === 'submitted' && (!isSubmitted || submissionStatus === 'graded')) return false;
      // Overdue: not submitted AND past due date
      if (filterStatus === 'overdue' && !(isOverdue && isPending)) return false;
      if (filterStatus === 'graded' && submissionStatus !== 'graded') return false;
      
      if (filterCourse) {
        const courseName = assignment.courseId?.name || assignment.subject;
        if (courseName !== filterCourse) return false;
      }
      
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [assignments, filterStatus, filterCourse, recentlySubmitted]);

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAssignments.slice(start, start + itemsPerPage);
  }, [filteredAssignments, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterCourse]);

  const openSubmit = (assignment) => {
    setActiveAssignment(assignment);
    setSubmitContent('');
    setSubmitLink('');
    setShowSubmitModal(true);
  };

  const handleSubmitAssignment = async (e) => {
    e?.preventDefault();
    if (!activeAssignment?._id) return;
    setSubmitting(true);
    try {
      let res;
      if (files && files.length > 0) {
        const fd = new FormData();
        fd.append('assignmentId', activeAssignment._id);
        if (submitContent?.trim()) fd.append('content', submitContent.trim());
        if (submitLink?.trim()) fd.append('link', submitLink.trim());
        Array.from(files).forEach((f) => fd.append('files', f));
        res = await studentAPI.submitAssignment(fd);
      } else {
        const payload = {
          assignmentId: activeAssignment._id,
          content: submitContent?.trim() || undefined,
          link: submitLink?.trim() || undefined,
        };
        res = await studentAPI.submitAssignment(payload);
      }
      if (res.data?.success) {
        showNotification(res.data.message || 'Submitted successfully', 'success');
        setRecentlySubmitted((prev) => ({ ...prev, [activeAssignment._id]: true }));
        setShowSubmitModal(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Submission failed';
      showNotification(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openViewSubmission = async (assignment) => {
    try {
      setActiveAssignment(assignment);
      const res = await studentAPI.getSubmissionDetails(assignment._id);
      if (res.data?.success) {
        setSubmissionDetails(res.data.submission);
        setShowViewModal(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'No submission found yet';
      showNotification(msg, 'info');
    }
  };

  const openViewDetails = (assignment) => {
    setActiveAssignment(assignment);
    setShowDetailsModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Assignments</h1>
        <span className="text-sm text-slate-600">{filteredAssignments.length} total</span>
      </div>

      {assignmentsLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading assignments...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No assignments at the moment</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-4 p-4 bg-white rounded-xl shadow-md border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">Filters</h3>
                <span className="text-xs text-slate-500">({filteredAssignments.length} assignments)</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear Filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="all">All Assignments</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="overdue">Overdue</option>
                  <option value="graded">Graded</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Course</label>
                <select value={filterCourse} onChange={e=>setFilterCourse(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">All Courses</option>
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">No assignments match the filters</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedAssignments.map((assignment) => {
            const dueDate = new Date(assignment.dueDate);
            const isOverdue = dueDate < new Date();
            const submissionStatus = assignment.submissionStatus || 'pending';
            const isSubmitted = submissionStatus === 'submitted' || submissionStatus === 'graded' || recentlySubmitted[assignment._id];
            const isPending = !isSubmitted;
            
            return (
              <div key={assignment._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{assignment.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {assignment.courseId?.name || assignment.subject} • 
                      Due: {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {assignment.totalMarks && ` • ${assignment.totalMarks} marks`}
                    </p>
                    {assignment.description && (
                      <p className="text-sm text-slate-700 mt-2">{assignment.description}</p>
                    )}
                    {assignment.teacherId?.name && (
                      <p className="text-xs text-slate-500 mt-2">By: {assignment.teacherId.name}</p>
                    )}
                    {assignment.attachments?.length > 0 && (
                      <div className="mt-3 bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs font-semibold text-slate-700 mb-2">📎 Attachments:</p>
                        <ul className="space-y-1">
                          {assignment.attachments.map((att, idx) => {
                            const fileUrl = att.path 
                              ? resolveAssetUrl(att.path) 
                              : att.url;
                            const fileName = att.name || `Attachment ${idx + 1}`;
                            const fileSize = att.size ? ` (${(att.size / 1024).toFixed(1)} KB)` : '';
                            
                            return (
                              <li key={idx}>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm hover:underline"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>{fileName}{fileSize}</span>
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-4 ${
                    isOverdue && isPending
                      ? 'bg-red-100 text-red-700'
                      : isPending
                      ? 'bg-orange-100 text-orange-700'
                      : submissionStatus === 'graded'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isOverdue && isPending 
                      ? 'Overdue' 
                      : submissionStatus === 'graded' 
                      ? 'Graded' 
                      : submissionStatus === 'submitted'
                      ? 'Submitted'
                      : 'Pending'}
                  </span>
                </div>
                <div className="flex gap-3 mt-4">
                  {isPending && !recentlySubmitted[assignment._id] ? (
                    <button
                      onClick={() => openSubmit(assignment)}
                      disabled={isOverdue}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white ${
                        isOverdue ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isOverdue ? 'Closed' : 'Submit'}
                    </button>
                  ) : (
                    <button
                      onClick={() => openViewSubmission(assignment)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      View Submission
                    </button>
                  )}
                  <button
                    onClick={() => openViewDetails(assignment)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-xl shadow-md border border-slate-100">
            <p className="text-sm text-slate-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAssignments.length)} of {filteredAssignments.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded border ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </>
      )}
      </>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSubmitModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Submit Assignment</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitAssignment} className="p-5 space-y-4">
              <div>
                <p className="text-sm text-slate-600">{activeAssignment?.title}</p>
                <p className="text-xs text-slate-500">{activeAssignment?.courseId?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Submission Text</label>
                <textarea value={submitContent} onChange={(e) => setSubmitContent(e.target.value)} rows={5} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Write your answer or notes..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Optional Link (Google Doc, GitHub, etc.)</label>
                <input type="url" value={submitLink} onChange={(e) => setSubmitLink(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Attachments (max 5, up to 10MB each)</label>
                <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="block w-full text-sm text-slate-700" />
                <p className="text-xs text-slate-500 mt-1">Allowed: PDF, Word, PPT, Excel, images, text, zip</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Submission Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">My Submission</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {!submissionDetails ? (
                <p className="text-slate-600">No submission found.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Assignment:</span> {submissionDetails.assignmentId?.title}</p>
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Status:</span> {submissionDetails.status}</p>
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Submitted At:</span> {new Date(submissionDetails.submittedAt).toLocaleString()}</p>
                  {submissionDetails.marks != null && (
                    <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Marks:</span> {submissionDetails.marks}/{submissionDetails.assignmentId?.totalMarks ?? '-'}</p>
                  )}
                  {submissionDetails.feedback && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                      <span className="font-semibold">Feedback:</span> {submissionDetails.feedback}
                    </div>
                  )}
                  {submissionDetails.content && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 whitespace-pre-wrap">
                      <p className="font-semibold text-slate-800 mb-2">My Answer:</p>
                      {submissionDetails.content}
                    </div>
                  )}
                  {submissionDetails.link && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-slate-800">Link:</p>
                      <a href={submissionDetails.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                        {submissionDetails.link}
                      </a>
                    </div>
                  )}
                  {submissionDetails.attachments?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-slate-800">My Attachments:</p>
                      <ul className="list-disc ml-6 text-sm space-y-1">
                        {submissionDetails.attachments.map((att, idx) => (
                          <li key={idx}>
                            {att.url ? (
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{att.name || att.url}</a>
                            ) : (
                              <span>{att.name || 'Attachment'}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end pt-2">
                <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Assignment Details Modal */}
      {showDetailsModal && activeAssignment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-900">Assignment Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{activeAssignment.title}</h2>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="font-medium">{activeAssignment.courseId?.name || activeAssignment.subject}</span>
                  <span>•</span>
                  <span>Due: {new Date(activeAssignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  {activeAssignment.totalMarks && (
                    <>
                      <span>•</span>
                      <span>{activeAssignment.totalMarks} marks</span>
                    </>
                  )}
                </div>
              </div>

              {activeAssignment.teacherId?.name && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">Instructor:</span> {activeAssignment.teacherId.name}
                  </p>
                </div>
              )}

              {activeAssignment.description && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-slate-700 whitespace-pre-wrap">{activeAssignment.description}</p>
                  </div>
                </div>
              )}

              {activeAssignment.instructions && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Instructions</h4>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-slate-700 whitespace-pre-wrap">{activeAssignment.instructions}</p>
                  </div>
                </div>
              )}

              {activeAssignment.attachments?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">📎 Assignment Materials</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <ul className="space-y-2">
                      {activeAssignment.attachments.map((att, idx) => {
                        const fileUrl = att.path 
                          ? resolveAssetUrl(att.path) 
                          : att.url;
                        const fileName = att.name || `Attachment ${idx + 1}`;
                        const fileSize = att.size ? ` (${(att.size / 1024).toFixed(1)} KB)` : '';
                        
                        return (
                          <li key={idx} className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="text-blue-600 hover:text-blue-800 hover:underline flex-1"
                            >
                              {fileName}{fileSize}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Created</p>
                    <p className="font-medium text-slate-900">
                      {new Date(activeAssignment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Status</p>
                    <p className={`font-medium ${
                      (activeAssignment.submissionStatus === 'graded' || recentlySubmitted[activeAssignment._id])
                        ? 'text-green-600'
                        : new Date(activeAssignment.dueDate) < new Date() && activeAssignment.submissionStatus !== 'submitted'
                        ? 'text-red-600'
                        : 'text-orange-600'
                    }`}>
                      {activeAssignment.submissionStatus === 'graded' 
                        ? 'Graded' 
                        : activeAssignment.submissionStatus === 'submitted' || recentlySubmitted[activeAssignment._id]
                        ? 'Submitted'
                        : new Date(activeAssignment.dueDate) < new Date()
                        ? 'Overdue'
                        : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setShowDetailsModal(false)} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Close
                </button>
                {!(activeAssignment.submissionStatus === 'submitted' || activeAssignment.submissionStatus === 'graded' || recentlySubmitted[activeAssignment._id]) && (
                  <button 
                    onClick={() => {
                      setShowDetailsModal(false);
                      openSubmit(activeAssignment);
                    }}
                    disabled={new Date(activeAssignment.dueDate) < new Date()}
                    className={`px-4 py-2 rounded-lg transition-colors text-white ${
                      new Date(activeAssignment.dueDate) < new Date()
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {new Date(activeAssignment.dueDate) < new Date() ? 'Closed' : 'Submit Assignment'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
