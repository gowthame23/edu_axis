import React, { useState, useMemo, useEffect } from 'react';
import { Bell, Filter, ChevronLeft, ChevronRight, X, Check, Trash2, Loader } from 'lucide-react';
import { studentAPI } from '../../services/api';

const StudentAnnouncements = ({ announcements, announcementsLoading, onAnnouncementsUpdate, showNotification }) => {
  // Filters
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [searchText, setSearchText] = useState('');
  const [readStatuses, setReadStatuses] = useState({});
  const [processingIds, setProcessingIds] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Extract unique months
  const months = useMemo(() => {
    const uniqueMonths = new Set();
    announcements.forEach(a => {
      const date = new Date(a.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      uniqueMonths.add(monthYear);
    });
    return Array.from(uniqueMonths).sort().reverse();
  }, [announcements]);

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(announcement => {
      if (filterPriority !== 'all' && announcement.priority !== filterPriority) return false;
      if (filterMonth) {
        const date = new Date(announcement.createdAt);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthYear !== filterMonth) return false;
      }
      if (searchText) {
        const search = searchText.toLowerCase();
        const title = announcement.title?.toLowerCase() || '';
        const content = announcement.content?.toLowerCase() || '';
        if (!title.includes(search) && !content.includes(search)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [announcements, filterPriority, filterMonth, searchText]);

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAnnouncements.slice(start, start + itemsPerPage);
  }, [filteredAnnouncements, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPriority, filterMonth, searchText]);

  // Initialize read statuses from announcements
  useEffect(() => {
    const statuses = {};
    announcements.forEach(a => {
      statuses[a._id] = a.readBy && a.readBy.length > 0;
    });
    setReadStatuses(statuses);
  }, [announcements]);

  const markAsRead = async (id) => {
    try {
      setProcessingIds(prev => ({ ...prev, [id]: true }));
      await studentAPI.markAnnouncementAsRead(id);
      setReadStatuses(prev => ({ ...prev, [id]: true }));
      if (showNotification) showNotification('Announcement marked as read', 'success');
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      if (showNotification) showNotification('Failed to mark as read', 'error');
    } finally {
      setProcessingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const confirmDeleteAnnouncement = (id) => {
    setAnnouncementToDelete(id);
    setShowDeleteModal(true);
  };

  const deleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    
    try {
      setProcessingIds(prev => ({ ...prev, [announcementToDelete]: true }));
      setShowDeleteModal(false);
      await studentAPI.hideAnnouncement(announcementToDelete);
      if (showNotification) showNotification('Announcement deleted successfully', 'success');
      // Trigger refresh from parent
      if (onAnnouncementsUpdate) {
        await onAnnouncementsUpdate();
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      if (showNotification) showNotification('Failed to delete announcement', 'error');
    } finally {
      setProcessingIds(prev => ({ ...prev, [announcementToDelete]: false }));
      setAnnouncementToDelete(null);
    }
  };

  const confirmClearAll = () => {
    setShowClearAllModal(true);
  };

  const clearAllAnnouncements = async () => {
    try {
      setProcessingIds(prev => ({ ...prev, clearAll: true }));
      setShowClearAllModal(false);
      await studentAPI.clearAllAnnouncements();
      if (showNotification) showNotification('All announcements cleared successfully', 'success');
      // Trigger refresh from parent
      if (onAnnouncementsUpdate) {
        await onAnnouncementsUpdate();
      }
    } catch (error) {
      console.error('Error clearing announcements:', error);
      if (showNotification) showNotification('Failed to clear announcements', 'error');
    } finally {
      setProcessingIds(prev => ({ ...prev, clearAll: false }));
    }
  };

  const clearFilters = () => {
    setFilterPriority('all');
    setFilterMonth('');
    setSearchText('');
  };

  const hasActiveFilters = filterPriority !== 'all' || filterMonth !== '' || searchText !== '';
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{filteredAnnouncements.length} announcements</span>
          {filteredAnnouncements.length > 0 && (
            <button
              onClick={confirmClearAll}
              disabled={processingIds.clearAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors"
            >
              {processingIds.clearAll ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Clear All
            </button>
          )}
        </div>
      </div>

      {announcementsLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <Bell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No announcements at the moment</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-4 p-4 bg-white rounded-xl shadow-md border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">Filters & Search</h3>
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
                <label className="block text-xs font-medium text-slate-600 mb-1">Search</label>
                <input
                  type="text"
                  value={searchText}
                  onChange={e=>setSearchText(e.target.value)}
                  placeholder="Search title or content..."
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
                <select value={filterPriority} onChange={e=>setFilterPriority(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="all">All Priority</option>
                  <option value="high">High Priority</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
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

          {filteredAnnouncements.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
              <Bell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">No announcements match the filters</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedAnnouncements.map((announcement) => (
            <div key={announcement._id} className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
              readStatuses[announcement._id] ? 'border-slate-300 opacity-75' : 'border-blue-600'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{announcement.title}</h3>
                      {readStatuses[announcement._id] && (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3" />
                          Read
                        </span>
                      )}
                    </div>
                    {announcement.createdBy && (
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                         {announcement.createdBy.name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(announcement.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-slate-700 mt-3">{announcement.content}</p>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    {!readStatuses[announcement._id] && (
                      <button
                        onClick={() => markAsRead(announcement._id)}
                        disabled={processingIds[announcement._id]}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:bg-green-50 disabled:opacity-50 rounded-lg transition-colors"
                      >
                        {processingIds[announcement._id] ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => confirmDeleteAnnouncement(announcement._id)}
                      disabled={processingIds[announcement._id]}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:bg-red-50 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {processingIds[announcement._id] ? (
                        <Loader className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
                {announcement.priority === 'high' && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 ml-4">
                    Important
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-xl shadow-md border border-slate-100">
            <p className="text-sm text-slate-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAnnouncements.length)} of {filteredAnnouncements.length} results
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Announcement?</h3>
            <p className="text-sm text-slate-600 text-center mb-6">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAnnouncementToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={deleteAnnouncement}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Clear All Announcements?</h3>
            <p className="text-sm text-slate-600 text-center mb-6">
              Are you sure you want to clear all {filteredAnnouncements.length} announcements? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={clearAllAnnouncements}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncements;
