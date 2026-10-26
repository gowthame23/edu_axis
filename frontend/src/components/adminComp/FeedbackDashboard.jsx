import { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function FeedbackDashboard({ showNotification }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'submitted', 'reviewed', 'acted-upon'
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    fetchFeedbackData();
  }, []);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getFeedbackDashboard();
      setFeedbacks(res.data.data.feedbacks);
      setStats(res.data.data.statistics);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      showNotification('Failed to load feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewFeedback = async () => {
    if (!adminResponse.trim()) {
      showNotification('Please write a response', 'error');
      return;
    }
    try {
      await adminAPI.reviewFeedback(selectedFeedback._id, {
        adminResponse,
        status: 'reviewed'
      });
      showNotification('Feedback reviewed successfully', 'success');
      setSelectedFeedback(null);
      setAdminResponse('');
      fetchFeedbackData();
    } catch (err) {
      console.error('Error reviewing feedback:', err);
      showNotification('Failed to review feedback', 'error');
    }
  };

  const handleMarkAsActedUpon = async () => {
    try {
      await adminAPI.reviewFeedback(selectedFeedback._id, {
        status: 'acted-upon'
      });
      showNotification('Marked as acted upon', 'success');
      setSelectedFeedback(null);
      setAdminResponse('');
      fetchFeedbackData();
    } catch (err) {
      console.error('Error updating feedback:', err);
      showNotification('Failed to update feedback', 'error');
    }
  };

  const getFilteredFeedbacks = () => {
    if (filter === 'all') return feedbacks;
    return feedbacks.filter(f => f.status === filter);
  };

  const filteredFeedbacks = getFilteredFeedbacks();
  
  // Pagination
  const totalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFeedbacks = filteredFeedbacks.slice(startIndex, startIndex + itemsPerPage);
  
  // Reset to page 1 and close modal when filter changes
  const handleFilterChange = (status) => {
    setFilter(status);
    setCurrentPage(1);
    setSelectedFeedback(null);
    setAdminResponse('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return { icon: AlertCircle, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-800' };
      case 'reviewed': return { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', badge: 'bg-green-100 text-green-800' };
      case 'acted-upon': return { icon: Clock, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-800' };
      default: return { icon: MessageSquare, bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900', badge: 'bg-slate-100 text-slate-800' };
    }
  };

  if (loading) {
    return <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      <p className="text-slate-600 mt-3">Loading feedback dashboard...</p>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-600">
          <p className="text-slate-600 text-sm font-medium">Total Feedback</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.total || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-600">
          <p className="text-slate-600 text-sm font-medium">Pending Review</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.byStatus?.submitted || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-600">
          <p className="text-slate-600 text-sm font-medium">Reviewed</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats?.byStatus?.reviewed || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-600">
          <p className="text-slate-600 text-sm font-medium">Avg Rating</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats?.averageRating?.toFixed(1) || 0}/5</p>
        </div>
      </div>



      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white p-4 rounded-xl shadow-md border border-slate-200 flex-wrap">
        {['all', 'submitted', 'reviewed', 'acted-upon'].map(status => (
          <button
            key={status}
            onClick={() => handleFilterChange(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status === 'all' ? 'All' : status === 'acted-upon' ? 'Acted Upon' : status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 text-sm opacity-75">
              {status === 'all' ? stats?.total : stats?.byStatus?.[status] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Feedback List</h2>
          <p className="text-sm text-slate-600">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredFeedbacks.length)} of {filteredFeedbacks.length}
          </p>
        </div>
        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border-2 border-dashed border-slate-200">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 text-lg">No feedback in this category</p>
          </div>
        ) : (
          <>
            {paginatedFeedbacks.map((feedback) => {
              const statusInfo = getStatusColor(feedback.status);
              const StatusIcon = statusInfo.icon;
              return (
                <div
                  key={feedback._id}
                  className={`border-2 rounded-lg p-4 ${statusInfo.bg} ${statusInfo.border} hover:shadow-lg transition-all cursor-pointer`}
                  onClick={() => setSelectedFeedback(feedback)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <StatusIcon className={`w-5 h-5 ${statusInfo.text}`} />
                        <h3 className="font-semibold text-slate-900">{feedback.courseId?.name || 'Course Feedback'}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.badge}`}>
                          {feedback.status === 'acted-upon' ? 'Acted Upon' : feedback.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                        <div className="text-slate-600">
                          Type: <span className="font-medium capitalize text-slate-900">{feedback.type}</span>
                        </div>
                        <div className="text-slate-600">
                          Rating: <span className="font-medium text-orange-600">{feedback.rating.overall}/5 ⭐</span>
                        </div>
                      </div>

                      {!feedback.isAnonymous && feedback.studentId && (
                        <div className="mt-2 flex items-center space-x-2 text-sm bg-white bg-opacity-60 px-2 py-1 rounded">
                          <User className="w-4 h-4 text-slate-600" />
                          <span className="text-slate-700">
                            <strong>{feedback.studentId.name}</strong> ({feedback.studentId.email})
                          </span>
                        </div>
                      )}

                      {feedback.comments && (
                        <p className="text-sm text-slate-700 mt-2 line-clamp-2">{feedback.comments}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-slate-500">
                        {new Date(feedback.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 p-4 bg-white rounded-lg border border-slate-200">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  ← Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-purple-600 text-white'
                          : 'border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-linear-to-r from-purple-600 to-purple-700 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Feedback Review</h2>
                <p className="text-purple-100 text-sm mt-1">
                  {new Date(selectedFeedback.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                selectedFeedback.status === 'submitted' ? 'bg-blue-200 text-blue-800' :
                selectedFeedback.status === 'reviewed' ? 'bg-green-200 text-green-800' :
                'bg-purple-200 text-purple-800'
              }`}>
                {selectedFeedback.status.charAt(0).toUpperCase() + selectedFeedback.status.slice(1)}
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info (if not anonymous) */}
              {!selectedFeedback.isAnonymous && selectedFeedback.studentId && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Student Information</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-600 font-medium">Name</p>
                      <p className="text-blue-900">{selectedFeedback.studentId.name}</p>
                    </div>
                    <div>
                      <p className="text-blue-600 font-medium">Email</p>
                      <p className="text-blue-900">{selectedFeedback.studentId.email}</p>
                    </div>
                    <div>
                      <p className="text-blue-600 font-medium">Grade</p>
                      <p className="text-blue-900">{selectedFeedback.studentId.grade || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Course/Module Info */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">About This Feedback</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 font-medium">Type</p>
                    <p className="text-slate-900 capitalize">{selectedFeedback.type}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">Course</p>
                    <p className="text-slate-900 font-semibold">{selectedFeedback.courseId?.name || '—'}</p>
                  </div>
                  {selectedFeedback.courseId?.code && (
                    <div>
                      <p className="text-slate-600 font-medium">Course Code</p>
                      <p className="text-slate-900">{selectedFeedback.courseId.code}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-600 font-medium">Privacy</p>
                    <p className="text-slate-900">{selectedFeedback.isAnonymous ? 'Anonymous' : 'Identified'}</p>
                  </div>
                </div>
              </div>

              {/* Overall Rating - Prominent Display */}
              <div className="bg-linear-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 font-medium mb-1">Overall Rating</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-4xl font-bold text-orange-600">{selectedFeedback.rating.overall}</span>
                      <span className="text-slate-600">/5</span>
                      <div className="flex space-x-1 ml-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={`text-2xl ${
                            star <= selectedFeedback.rating.overall ? '⭐' : '☆'
                          }`}></span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Ratings */}
              {(selectedFeedback.rating?.contentQuality > 0 || selectedFeedback.rating?.teacherPerformance > 0 || 
                selectedFeedback.rating?.materialRelevance > 0 || selectedFeedback.rating?.difficulty > 0) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Detailed Ratings</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedFeedback.rating?.contentQuality > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-sm text-slate-600">Content Quality</p>
                        <p className="text-lg font-semibold text-blue-600">{selectedFeedback.rating.contentQuality}/5</p>
                      </div>
                    )}
                    {selectedFeedback.rating?.teacherPerformance > 0 && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-sm text-slate-600">Teacher Performance</p>
                        <p className="text-lg font-semibold text-green-600">{selectedFeedback.rating.teacherPerformance}/5</p>
                      </div>
                    )}
                    {selectedFeedback.rating?.materialRelevance > 0 && (
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <p className="text-sm text-slate-600">Material Relevance</p>
                        <p className="text-lg font-semibold text-purple-600">{selectedFeedback.rating.materialRelevance}/5</p>
                      </div>
                    )}
                    {selectedFeedback.rating?.difficulty > 0 && (
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <p className="text-sm text-slate-600">Difficulty Level</p>
                        <p className="text-lg font-semibold text-orange-600">{selectedFeedback.rating.difficulty}/5</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              {selectedFeedback.comments && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">Comments</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedFeedback.comments}</p>
                </div>
              )}

              {/* Strengths */}
              {selectedFeedback.strengths && selectedFeedback.strengths.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">What Went Well ✓</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeedback.strengths.map((strength, idx) => (
                      <span key={idx} className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas for Improvement */}
              {selectedFeedback.areasForImprovement && selectedFeedback.areasForImprovement.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="font-semibold text-orange-900 mb-2">Areas for Improvement ⚠</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeedback.areasForImprovement.map((area, idx) => (
                      <span key={idx} className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {selectedFeedback.suggestions && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Suggestions for Future</h3>
                  <p className="text-blue-800 whitespace-pre-wrap">{selectedFeedback.suggestions}</p>
                </div>
              )}

              {/* Admin Response Section */}
              {selectedFeedback.adminResponse && (
                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                  <h3 className="font-semibold text-purple-900 mb-2">Your Response</h3>
                  <p className="text-purple-800 whitespace-pre-wrap">{selectedFeedback.adminResponse}</p>
                </div>
              )}

              {/* Admin Response Input (if not yet reviewed) */}
              {selectedFeedback.status === 'submitted' && (
                <>
                  <div className="border-t-2 border-slate-200 pt-4">
                    <h3 className="font-semibold text-slate-900 mb-3">Your Response</h3>
                    <textarea
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder="Write your response to this feedback..."
                      rows="4"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3 border-t-2 border-slate-200 pt-4">
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Close
                </button>
                {selectedFeedback.status === 'submitted' && (
                  <>
                    <button
                      onClick={handleMarkAsActedUpon}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Mark as Acted Upon
                    </button>
                    <button
                      onClick={handleReviewFeedback}
                      disabled={!adminResponse.trim()}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Submit Review
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
