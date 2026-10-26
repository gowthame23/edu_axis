import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const StudentLeave = ({ 
  leaveRequests, 
  leaveRequestsLoading, 
  showLeaveForm, 
  setShowLeaveForm,
  leaveFormData,
  setLeaveFormData,
  handleLeaveSubmit
}) => {
  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Extract unique types and months
  const types = useMemo(() => {
    const uniqueTypes = new Set();
    leaveRequests.forEach(r => {
      if (r.type) uniqueTypes.add(r.type);
    });
    return Array.from(uniqueTypes).sort();
  }, [leaveRequests]);

  const months = useMemo(() => {
    const uniqueMonths = new Set();
    leaveRequests.forEach(r => {
      const date = new Date(r.startDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      uniqueMonths.add(monthYear);
    });
    return Array.from(uniqueMonths).sort().reverse();
  }, [leaveRequests]);

  // Filtered leave requests
  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter(req => {
      if (filterStatus !== 'all' && req.status !== filterStatus) return false;
      if (filterType && req.type !== filterType) return false;
      if (filterMonth) {
        const date = new Date(req.startDate);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthYear !== filterMonth) return false;
      }
      return true;
    });
  }, [leaveRequests, filterStatus, filterType, filterMonth]);

  const totalPages = Math.ceil(filteredLeaveRequests.length / itemsPerPage);
  const paginatedLeaveRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeaveRequests.slice(start, start + itemsPerPage);
  }, [filteredLeaveRequests, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterType, filterMonth]);

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterType('');
    setFilterMonth('');
  };

  const hasActiveFilters = filterStatus !== 'all' || filterType !== '' || filterMonth !== '';
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Leave Requests</h1>
        <button
          onClick={() => setShowLeaveForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          Apply for Leave
        </button>
      </div>

      {leaveRequestsLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading leave requests...</p>
        </div>
      ) : leaveRequests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No leave requests yet</p>
          <p className="text-slate-500 text-sm mt-2">Click "Apply for Leave" to submit your first request</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-4 p-4 bg-white rounded-xl shadow-md border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">Filters</h3>
                <span className="text-xs text-slate-500">({filteredLeaveRequests.length} requests)</span>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">All Types</option>
                  {types.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Month</label>
                <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">All Months</option>
                  {months.map(m => {
                    const [year, month] = m.split('-');
                    const date = new Date(year, month - 1);
                    return <option key={m} value={m}>{date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>;
                  })}
                </select>
              </div>
            </div>
          </div>

          {filteredLeaveRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
              <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">No leave requests match the filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {paginatedLeaveRequests.map((req) => (
              <div key={req._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 capitalize">{req.type} Leave</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()} ({req.days} day{req.days > 1 ? 's' : ''})
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    req.status === 'approved' ? 'bg-green-100 text-green-700' :
                    req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {req.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mb-2"><span className="font-medium">Reason:</span> {req.reason}</p>
                {req.reviewRemarks && (
                  <p className={`text-sm mt-2 p-3 rounded border-l-4 ${
                    req.status === 'rejected'
                      ? 'bg-red-50 border-red-500 text-red-700'
                      : 'bg-blue-50 border-blue-500 text-blue-700'
                  }`}>
                    <span className="font-medium">{req.status === 'rejected' ? 'Rejection Reason:' : 'Administrator Remarks:'}</span> {req.reviewRemarks}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-3">Submitted: {new Date(req.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-md p-4 border border-slate-100">
              <div className="text-sm text-slate-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLeaveRequests.length)} of {filteredLeaveRequests.length} requests
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded border ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

      {/* Leave Form Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Apply for Leave</h2>
              <button onClick={() => setShowLeaveForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleLeaveSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
                  <select
                    value={leaveFormData.type}
                    onChange={(e) => setLeaveFormData({...leaveFormData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="casual">Casual</option>
                    <option value="sick">Sick</option>
                    <option value="personal">Personal</option>
                    <option value="emergency">Emergency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={leaveFormData.startDate}
                    onChange={(e) => setLeaveFormData({...leaveFormData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={leaveFormData.endDate}
                    onChange={(e) => setLeaveFormData({...leaveFormData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={leaveFormData.startDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                  <textarea
                    value={leaveFormData.reason}
                    onChange={(e) => setLeaveFormData({...leaveFormData, reason: e.target.value})}
                    rows="4"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why you need leave..."
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowLeaveForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLeave;
