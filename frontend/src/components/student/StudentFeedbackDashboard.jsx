import { useState, useEffect } from 'react';
import { MessageSquare, Star, Clock, CheckCircle, Plus } from 'lucide-react';
import { studentAPI } from '../../services/api';
import FeedbackForm from './FeedbackForm';

export default function StudentFeedbackDashboard({ studentId, showNotification }) {
  const [showForm, setShowForm] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    avgRating: 0
  });

  useEffect(() => {
    fetchFeedbackHistory();
  }, []);

  const fetchFeedbackHistory = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getMyFeedback(studentId);
      if (response.data.success) {
        const feedbacks = response.data.data || [];
        setFeedbackHistory(feedbacks);
        
        // Calculate stats
        const thisMonth = feedbacks.filter(f => {
          const createdDate = new Date(f.createdAt);
          const now = new Date();
          return createdDate.getMonth() === now.getMonth() && 
                 createdDate.getFullYear() === now.getFullYear();
        }).length;
        
        const avgRating = feedbacks.length > 0
          ? feedbacks.reduce((sum, f) => sum + f.rating.overall, 0) / feedbacks.length
          : 0;
        
        setStats({
          total: feedbacks.length,
          thisMonth,
          avgRating: avgRating.toFixed(1)
        });
      }
    } catch (err) {
      console.error('Error fetching feedback history:', err);
      // Don't show error if endpoint doesn't exist yet
      setFeedbackHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    // Small delay to ensure form state is updated
    setTimeout(() => {
      fetchFeedbackHistory();
    }, 100);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'reviewed': return 'bg-green-100 text-green-700';
      case 'acted-upon': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getFilteredFeedbacks = () => {
    if (filter === 'all') return feedbackHistory;
    return feedbackHistory.filter(f => f.status === filter);
  };

  const filteredFeedbacks = getFilteredFeedbacks();
  const totalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFeedbacks = filteredFeedbacks.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Feedback Dashboard</h1>
          <p className="text-slate-600 mt-2">Share your experience and help us improve</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2 shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span>Submit Feedback</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Feedback</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <MessageSquare className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">This Month</p>
              <p className="text-3xl font-bold mt-2">{stats.thisMonth}</p>
            </div>
            <Clock className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Avg Rating</p>
              <p className="text-3xl font-bold mt-2">{stats.avgRating || '—'}</p>
            </div>
            <Star className="w-12 h-12 text-yellow-200 fill-yellow-200" />
          </div>
        </div>
      </div>

      {/* Feedback History */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Your Feedback History</h2>
          {feedbackHistory.length > 0 && (
            <p className="text-sm text-slate-600">
              {filteredFeedbacks.length} feedback{filteredFeedbacks.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Filter Tabs */}
        {feedbackHistory.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {['all', 'submitted', 'reviewed', 'acted-upon'].map(status => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'All' : status === 'acted-upon' ? 'Acted Upon' : status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-2 text-xs opacity-75">
                  ({status === 'all' ? feedbackHistory.length : feedbackHistory.filter(f => f.status === status).length})
                </span>
              </button>
            ))}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-slate-600 mt-3">Loading feedback...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg mb-2">
              {feedbackHistory.length === 0 ? 'No feedback submitted yet' : 'No feedback in this category'}
            </p>
            <p className="text-slate-500 text-sm">
              {feedbackHistory.length === 0 ? 'Click the button above to submit your first feedback' : 'Try selecting a different filter'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedFeedbacks.map((feedback) => (
                <div
                  key={feedback._id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-slate-900">
                          {feedback.courseId?.name || 'Course Feedback'}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(feedback.status)}`}>
                          {feedback.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(feedback.createdAt)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{feedback.rating.overall}/5</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {feedback.comments && (
                    <p className="text-sm text-slate-700 mb-3 line-clamp-2">{feedback.comments}</p>
                  )}
                  
                  {feedback.adminResponse && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-3">
                      <p className="text-xs font-medium text-blue-900 mb-1">Administrator Response:</p>
                      <p className="text-sm text-blue-800">{feedback.adminResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-slate-200">
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

      {/* Feedback Form Modal */}
      {showForm && (
        <FeedbackForm
          studentId={studentId}
          showNotification={showNotification}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
