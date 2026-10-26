import { useState, useEffect } from 'react';
import { teacherAPI } from '../../services/api';
import { CalendarClock, CheckCircle, XCircle, Clock, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TeacherLeave() {
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getLeaveRequests();
      if (response.data.success) {
        setLeaveRequests(response.data.leaveRequests || []);
      } else {
        console.error('API returned success=false:', response.data);
        setNotification({ type: 'error', message: response.data.message || 'Failed to load leave requests' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load leave requests';
      setNotification({ type: 'error', message: errorMessage });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setNotification({ type: 'error', message: 'End date must be after start date' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      setSubmitting(true);
      const response = await teacherAPI.applyLeave(formData);
      
      if (response.data.success) {
        setNotification({ type: 'success', message: 'Leave request submitted successfully' });
        setFormData({ leaveType: '', startDate: '', endDate: '', reason: '' });
        fetchLeaveRequests();
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error submitting leave:', error);
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to submit leave request' 
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-700 bg-green-100';
      case 'rejected': return 'text-red-700 bg-red-100';
      default: return 'text-amber-700 bg-amber-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5" />;
      case 'rejected': return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDays = (start, end) => {
    const diffTime = Math.abs(new Date(end) - new Date(start));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Filter leave requests
  const filteredRequests = filterType
    ? leaveRequests.filter(request => request.type === filterType)
    : leaveRequests;

  // Pagination calculations
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredRequests.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Leave Management</h1>
      
      {notification && (
        <div className={`mb-4 p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apply Leave Form */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-green-600" />
            Apply for Leave
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select Leave Type</option>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="earned">Earned Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
                <option value="emergency">Emergency Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                rows="4"
                placeholder="Please provide a detailed reason for your leave..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                submitting
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </form>
        </div>

        {/* Leave History */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">My Leave Requests</h2>
          
          {/* Filter */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">Filter by Type</label>
            </div>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Leave Types</option>
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="earned">Earned Leave</option>
              <option value="maternity">Maternity Leave</option>
              <option value="paternity">Paternity Leave</option>
              <option value="emergency">Emergency Leave</option>
            </select>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-slate-600">Loading...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CalendarClock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>{filterType ? 'No leave requests found for this type' : 'No leave requests found'}</p>
            </div>
          ) : (
            <>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {currentItems.map((request) => (
                <div key={request._id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 capitalize">
                        {request.type} Leave
                      </p>
                      <p className="text-sm text-slate-600">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        <span className="ml-2 text-slate-500">
                          ({calculateDays(request.startDate, request.endDate)} day{calculateDays(request.startDate, request.endDate) > 1 ? 's' : ''})
                        </span>
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="capitalize">{request.status}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-700 mb-2">{request.reason}</p>
                  
                  {request.reviewRemarks && (
                    <div className={`mt-2 p-3 rounded border-l-4 ${
                      request.status === 'rejected' 
                        ? 'bg-red-50 border-red-500' 
                        : 'bg-blue-50 border-blue-500'
                    }`}>
                      <p className={`text-xs font-semibold ${
                        request.status === 'rejected' ? 'text-red-700' : 'text-blue-700'
                      }`}>
                        {request.status === 'rejected' ? 'Rejection Reason:' : 'Administrator Remarks:'}
                      </p>
                      <p className={`text-sm ${
                        request.status === 'rejected' ? 'text-red-600' : 'text-blue-600'
                      }`}>{request.reviewRemarks}</p>
                    </div>
                  )}
                  
                  {request.adminRemarks && !request.reviewRemarks && (
                    <div className="mt-2 p-2 bg-slate-50 rounded border-l-4 border-blue-500">
                      <p className="text-xs font-semibold text-slate-700">Administrator Remarks:</p>
                      <p className="text-sm text-slate-600">{request.adminRemarks}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                      Applied: {formatDate(request.createdAt)}
                    </p>
                    {request.decidedBy && (
                      <p className="text-xs text-slate-500">
                        By: {request.decidedBy.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <div className="text-sm text-slate-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} requests
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`min-w-8 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-green-600 text-white'
                                : 'border border-slate-300 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 text-slate-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
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
        </div>
      </div>
    </div>
  );
}
