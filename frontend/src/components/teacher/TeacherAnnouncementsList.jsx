import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../services/api';
import { Trash2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TeacherAnnouncementsList() {
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [filters, setFilters] = useState({ search: '', courseId: '', grade: '', priority: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const load = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getAnnouncements();
      setItems(response.data.announcements || []);
    } catch (e) {
      console.error('Failed to load announcements', e);
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
    const handler = () => load();
    window.addEventListener('announcement-created', handler);
    return () => window.removeEventListener('announcement-created', handler);
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      setDeleting(id);
      await teacherAPI.deleteAnnouncement(id);
      setItems(prev => prev.filter(item => item._id !== id));
    } catch (e) {
      console.error('Failed to delete announcement', e);
      alert('Failed to delete announcement');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="text-slate-600">Loading announcements…</div>;
  if (!items.length) return <div className="text-slate-600 text-sm">Your posted announcements will appear here.</div>;

  // Get courses filtered by selected grade
  const coursesForGrade = filters.grade
    ? courses.filter(c => c.grade.toString() === filters.grade)
    : courses;

  // Filter announcements
  const filteredItems = items.filter(announcement => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        announcement.title.toLowerCase().includes(searchLower) ||
        announcement.content.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    if (filters.grade && announcement.courseId?.grade?.toString() !== filters.grade) {
      return false;
    }
    if (filters.courseId && announcement.courseId?._id !== filters.courseId) {
      return false;
    }
    if (filters.priority && announcement.priority !== filters.priority) {
      return false;
    }
    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filter Announcements</h3>
        </div>
        
        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
            <select
              value={filters.grade}
              onChange={(e) => {
                setFilters({ ...filters, grade: e.target.value, courseId: '' });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Grades</option>
              {[...new Set(courses.map(c => c.grade))].sort((a, b) => a - b).map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
            <select
              value={filters.courseId}
              onChange={(e) => {
                setFilters({ ...filters, courseId: e.target.value });
                setCurrentPage(1);
              }}
              disabled={!filters.grade}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-100"
            >
              <option value="">All Courses</option>
              {coursesForGrade.map(course => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => {
                setFilters({ ...filters, priority: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-slate-600">
          No announcements match your filters
        </div>
      ) : (
    <div className="space-y-3">
      {currentItems.map((a) => (
        <div key={a._id} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-semibold text-slate-900 truncate">{a.title}</p>
                {a.courseId && (
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded shrink-0">
                    {a.courseId.name} • Grade {a.courseId.grade}
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs rounded shrink-0 ${
                  a.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  a.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  a.priority === 'low' ? 'bg-slate-100 text-slate-600' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {a.priority?.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{a.content}</p>
              <p className="text-xs text-slate-400 mt-2">
                {new Date(a.createdAt).toLocaleDateString()} at {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={() => handleDelete(a._id)}
              disabled={deleting === a._id}
              className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete announcement"
            >
              {deleting === a._id ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length} announcements
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
                          ? 'bg-orange-600 text-white'
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
    </div>
  );
}
