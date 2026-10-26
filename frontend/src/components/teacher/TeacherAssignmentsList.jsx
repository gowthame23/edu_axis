import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { FileText, ListChecks, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { resolveAssetUrl } from '../../config/runtime';

export default function TeacherAssignmentsList() {
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  // Submissions modal filters & pagination
  const [subSearch, setSubSearch] = useState('');
  const [subStatus, setSubStatus] = useState('all'); // all | submitted | graded | late
  const [subPage, setSubPage] = useState(1);
  const [subPerPage, setSubPerPage] = useState(5);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ grade: '', courseId: '' });
  const itemsPerPage = 5;
  const socket = useSocket();
  const { user } = useAuth();

  const clearFilters = () => {
    setFilters({ grade: '', courseId: '' });
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.grade !== '' || filters.courseId !== '';

  const load = async () => {
    try {
      setLoading(true);
      const res = await teacherAPI.getAssignments();
      setItems(res.data.assignments || []);
    } catch (e) {
      console.error('Failed to load assignments', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await teacherAPI.getCourses();
      if (response.data.courses) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    load();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onCreated = (payload) => {
      // If the event is relevant, prepend; otherwise just reload
      if (!user || !payload || !payload.assignment) return load();
      const assignment = payload.assignment;
      
      // Enrich assignment with full course object if we have it
      if (assignment.courseId && typeof assignment.courseId === 'string') {
        const course = courses.find(c => c._id === assignment.courseId);
        if (course) {
          assignment.courseId = course;
        }
      }
      
      setItems((prev) => [assignment, ...prev]);
    };
    socket.on('assignmentCreated', onCreated);
    return () => socket.off('assignmentCreated', onCreated);
  }, [socket, user, courses]);

  // Derived: filtered + paginated assignments
  const filteredItems = items.filter((a) => {
    const byGrade = !filters.grade || String(a.grade || '') === String(filters.grade);
    const byCourse = !filters.courseId || String(a.courseId?._id || a.courseId) === String(filters.courseId);
    return byGrade && byCourse;
  });
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const page = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);
  const goToPage = (p) => setCurrentPage(Math.min(Math.max(1, p), totalPages));

  // Open submissions modal for an assignment
  const openSubmissions = async (assignment) => {
    try {
      setSelectedAssignment(assignment);
      setSubSearch('');
      setSubStatus('all');
      setSubPage(1);
      setSubPerPage(5);
      setShowModal(true);
      const res = await teacherAPI.getSubmissions(assignment._id);
      setSubmissions(res.data.submissions || []);
    } catch (e) {
      console.error('Failed to load submissions', e);
      setSubmissions([]);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Assignments</h2>
      </div>

      {/* Filters */}
      <div className="mb-4 p-4 bg-white border border-slate-200 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Grade</label>
            <select
              value={filters.grade}
              onChange={(e) => { setFilters((f) => ({ ...f, grade: e.target.value })); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All</option>
              {[...new Set(items.map((i) => i.grade).filter(Boolean))].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Course</label>
            <select
              value={filters.courseId}
              onChange={(e) => { setFilters((f) => ({ ...f, courseId: e.target.value })); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-700 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-slate-600">Loading...</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-slate-600">No assignments found.</p>
      ) : (
        <>
          <div className="space-y-3">
            {currentItems.map((a) => (
              <div key={a._id} className="p-4 border border-slate-200 rounded-lg bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500">Course: {a.courseId?.name || '—'} • Grade {a.grade || '—'} • Due: {a.dueDate ? new Date(a.dueDate).toLocaleString() : '—'}</p>
                  </div>
                  <button
                    onClick={() => openSubmissions(a)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
                  >
                    <ListChecks className="w-4 h-4" />
                    View Submissions
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
              <div className="text-sm text-slate-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length} assignments
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const p = i + 1;
                    if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                      return (
                        <button
                          key={p}
                          onClick={() => goToPage(p)}
                          className={`min-w-8 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            page === p ? 'bg-indigo-600 text-white' : 'border border-slate-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === page - 2 || p === page + 2) {
                      return <span key={p} className="px-2 text-slate-400">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Submissions Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Submissions • {selectedAssignment?.title}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-auto">
              {/* Submissions Filters */}
              {submissions.length > 0 && (
                <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Search</label>
                      <input
                        type="text"
                        value={subSearch}
                        onChange={(e) => { setSubSearch(e.target.value); setSubPage(1); }}
                        placeholder="Search by name, ID, comments or text..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                      <select
                        value={subStatus}
                        onChange={(e) => { setSubStatus(e.target.value); setSubPage(1); }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="all">All</option>
                        <option value="submitted">Submitted</option>
                        <option value="graded">Graded</option>
                        <option value="late">Late</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Rows per page</label>
                      <select
                        value={subPerPage}
                        onChange={(e) => { setSubPerPage(parseInt(e.target.value) || 5); setSubPage(1); }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter + paginate submissions */}
              {(() => {
                const q = (subSearch || '').toLowerCase().trim();
                const filtered = submissions.filter(s => {
                  if (subStatus !== 'all' && String(s.status).toLowerCase() !== subStatus) return false;
                  if (!q) return true;
                  const name = (s.studentId?.name || '').toLowerCase();
                  const sid = (s.studentId?.studentId || '').toLowerCase();
                  const comments = (s.comments || '').toLowerCase();
                  const content = (s.content || '').toLowerCase();
                  const fileNames = ((s.files || s.attachments || []).map(f => (f.name || f.filename || '')).join(' ')).toLowerCase();
                  return name.includes(q) || sid.includes(q) || comments.includes(q) || content.includes(q) || fileNames.includes(q);
                });
                const total = filtered.length;
                const pages = Math.max(1, Math.ceil(total / subPerPage));
                const page = Math.min(Math.max(1, subPage), pages);
                const start = (page - 1) * subPerPage;
                const end = start + subPerPage;
                const pageItems = filtered.slice(start, end);

                if (total === 0) {
                  return <p className="text-slate-600">No submissions match your filters.</p>;
                }

                return (
                  <>
                    <div className="text-xs text-slate-600 mb-2">Showing {start + 1}-{Math.min(end, total)} of {total} submissions</div>
                    <div className="space-y-3">
                      {pageItems.map((s) => (
                        <div key={s._id} className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                          {/* Student Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold text-slate-900 text-base">{s.studentId?.name || 'Student'}</p>
                              <p className="text-xs text-slate-500">
                                Student ID: {s.studentId?.studentId || '—'} • Grade {s.studentId?.grade || '—'} • 
                                Submitted: {new Date(s.submittedAt).toLocaleString()}
                              </p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${s.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {s.status.toUpperCase()}
                            </span>
                          </div>

                          {/* Submission Content */}
                          <div className="space-y-3 mb-4">
                            <div className="bg-slate-100 p-3 rounded-lg">
                              <p className="text-xs font-bold text-slate-900 mb-2">📝 SUBMISSION DETAILS:</p>
                              {s.content && s.content.trim() !== '' ? (
                                <div className="mb-3">
                                  <p className="text-xs font-semibold text-slate-700 mb-1">Submission Text:</p>
                                  <div className="bg-white border border-slate-300 rounded p-3 text-sm text-slate-800 whitespace-pre-wrap">
                                    {s.content}
                                  </div>
                                </div>
                              ) : null}
                              {s.comments && s.comments.trim() !== '' ? (
                                <div className="mb-3">
                                  <p className="text-xs font-semibold text-slate-700 mb-1">Student Comments:</p>
                                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-slate-700">
                                    {s.comments}
                                  </div>
                                </div>
                              ) : null}
                              {((Array.isArray(s.files) && s.files.length > 0) || (Array.isArray(s.attachments) && s.attachments.length > 0)) ? (
                                <div>
                                  <p className="text-xs font-semibold text-slate-700 mb-2">📎 Attached Files:</p>
                                  <ul className="space-y-2 bg-white p-2 rounded border border-slate-300">
                                    {(s.files || s.attachments || []).map((att, i) => {
                                      const fileUrl = att.path ? resolveAssetUrl(att.path) : att.url;
                                      const fileName = att.name || att.filename || `Attachment ${i + 1}`;
                                      const fileSize = att.size ? ` (${(att.size / 1024).toFixed(1)} KB)` : '';
                                      return (
                                        <li key={i} className="flex items-center gap-2">
                                          {fileUrl ? (
                                            <a href={fileUrl} target="_blank" rel="noreferrer" download className="text-blue-600 hover:underline inline-flex items-center gap-2 p-2 hover:bg-blue-50 rounded grow">
                                              <FileText className="w-4 h-4" />
                                              <span className="font-medium">{fileName}</span>
                                              <span className="text-xs text-slate-500">{fileSize}</span>
                                            </a>
                                          ) : (
                                            <span className="flex items-center gap-2 p-2">
                                              <FileText className="w-4 h-4" />
                                              {fileName}{fileSize}
                                            </span>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              ) : null}
                              {!s.content && !s.comments && (!s.files || s.files.length === 0) && (!s.attachments || s.attachments.length === 0) && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                                  ⚠️ No submission content found. The student may have submitted without adding any text or files.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Grading Section */}
                          {s.status === 'graded' ? (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-green-900">Grade: {s.marks} / {selectedAssignment?.totalMarks || 100}</p>
                                  {s.feedback && <p className="text-xs text-green-700 mt-1">{s.feedback}</p>}
                                </div>
                                <span className="text-xs text-green-600">Graded on {new Date(s.gradedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded">
                              <p className="text-sm font-medium text-slate-700 mb-2">Grade this submission:</p>
                              <div className="flex gap-2 items-start">
                                <div className="shrink-0">
                                  <label className="block text-xs text-slate-600 mb-1">Marks</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={selectedAssignment?.totalMarks || 100}
                                    placeholder="0"
                                    id={`marks-${s._id}`}
                                    className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="grow">
                                  <label className="block text-xs text-slate-600 mb-1">Feedback (optional)</label>
                                  <textarea
                                    id={`feedback-${s._id}`}
                                    rows={2}
                                    placeholder="Add feedback for the student..."
                                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>
                                <button
                                  onClick={async () => {
                                    try {
                                      const marks = document.getElementById(`marks-${s._id}`).value;
                                      const feedback = document.getElementById(`feedback-${s._id}`).value;
                                      if (!marks || marks === '') { alert('Please enter marks'); return; }
                                      await teacherAPI.submitGrades({
                                        assignmentId: s.assignmentId,
                                        studentId: s.studentId._id,
                                        marks: parseFloat(marks),
                                        feedback: feedback || ''
                                      });
                                      const res = await teacherAPI.getSubmissions(selectedAssignment._id);
                                      setSubmissions(res.data.submissions || []);
                                    } catch (e) {
                                      console.error('Failed to submit grade', e);
                                      alert('Failed to submit grade: ' + (e.response?.data?.message || e.message));
                                    }
                                  }}
                                  className="mt-5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded"
                                >
                                  Submit Grade
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls inside modal */}
                    {pages > 1 && (
                      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                        <div className="text-xs text-slate-600">Page {page} of {pages}</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSubPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Previous page"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-1">
                            {[...Array(pages)].map((_, i) => {
                              const p = i + 1;
                              if (p === 1 || p === pages || (p >= page - 1 && p <= page + 1)) {
                                return (
                                  <button
                                    key={p}
                                    onClick={() => setSubPage(p)}
                                    className={`min-w-8 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                      page === p ? 'bg-indigo-600 text-white' : 'border border-slate-300 hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                );
                              }
                              if (p === page - 2 || p === page + 2) {
                                return <span key={p} className="px-2 text-slate-400">...</span>;
                              }
                              return null;
                            })}
                          </div>
                          <button
                            onClick={() => setSubPage(Math.min(pages, page + 1))}
                            disabled={page === pages}
                            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Next page"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
