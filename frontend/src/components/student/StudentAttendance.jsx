import React, { useState, useMemo, useEffect } from 'react';
import { ClipboardList, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';

const StudentAttendance = ({ attendance, attendanceLoading }) => {
  // Handle null, undefined, or object attendance data
  const attendanceRecords = Array.isArray(attendance) ? attendance : 
                            attendance?.records ? attendance.records : [];

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Extract unique courses and months
  const courses = useMemo(() => {
    const uniqueCourses = new Set();
    attendanceRecords.forEach(r => {
      const courseName = r.courseId?.name || r.course;
      if (courseName) uniqueCourses.add(courseName);
    });
    return Array.from(uniqueCourses).sort();
  }, [attendanceRecords]);

  const months = useMemo(() => {
    const uniqueMonths = new Set();
    attendanceRecords.forEach(r => {
      const date = new Date(r.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      uniqueMonths.add(monthYear);
    });
    return Array.from(uniqueMonths).sort().reverse();
  }, [attendanceRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      if (filterStatus !== 'all' && record.status !== filterStatus) return false;
      if (filterCourse) {
        const courseName = record.courseId?.name || record.course;
        if (courseName !== filterCourse) return false;
      }
      if (filterMonth) {
        const date = new Date(record.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthYear !== filterMonth) return false;
      }
      return true;
    });
  }, [attendanceRecords, filterStatus, filterCourse, filterMonth]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterCourse, filterMonth]);

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterCourse('');
    setFilterMonth('');
  };

  const hasActiveFilters = filterStatus !== 'all' || filterCourse !== '' || filterMonth !== '';
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>
        <span className="text-sm text-slate-600">{filteredRecords.length} records</span>
      </div>

      {attendanceLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading attendance...</p>
        </div>
      ) : attendanceRecords.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <ClipboardList className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No attendance records yet</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-4 p-4 bg-white rounded-xl shadow-md border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">Filters</h3>
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
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Course</label>
                <select value={filterCourse} onChange={e=>setFilterCourse(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">All Courses</option>
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
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

          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
              <ClipboardList className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">No records match the filters</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Course</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {new Date(record.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {record.courseId?.name || record.course || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        record.status === 'present' 
                          ? 'bg-green-100 text-green-700' 
                          : record.status === 'absent'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {record.status?.charAt(0).toUpperCase() + record.status?.slice(1) || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 p-4 bg-white rounded-xl shadow-md border border-slate-100">
            <p className="text-sm text-slate-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} results
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
    </div>
  );
};

export default StudentAttendance;
