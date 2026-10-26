import { useState, useMemo } from 'react';
import { X, AlertTriangle, TrendingDown, Users } from 'lucide-react';

export default function AtRiskStudentsModal({ isOpen, onClose, students = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('risk-level'); // 'risk-level' or 'name'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'low-attendance', 'low-performance'
  
  const itemsPerPage = 10;

  // Filter students based on filter
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (filterBy === 'low-attendance') {
        return student.attendance < 75;
      } else if (filterBy === 'low-performance') {
        return student.performance !== 'Excellent' && student.performance !== 'Good';
      }
      return true;
    });
  }, [students, filterBy]);

  // Sort students
  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents];
    if (sortBy === 'risk-level') {
      // Sort by highest risk (lowest attendance, worst performance)
      sorted.sort((a, b) => {
        const riskA = (100 - a.attendance) + (a.performance === 'Needs Improvement' ? 50 : a.performance === 'Average' ? 25 : 0);
        const riskB = (100 - b.attendance) + (b.performance === 'Needs Improvement' ? 50 : b.performance === 'Average' ? 25 : 0);
        return riskB - riskA;
      });
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [filteredStudents, sortBy]);

  // Paginate
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedStudents.slice(start, start + itemsPerPage);
  }, [sortedStudents, currentPage]);

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Excellent': return 'text-green-700 bg-green-100';
      case 'Good': return 'text-blue-700 bg-blue-100';
      case 'Average': return 'text-yellow-700 bg-yellow-100';
      case 'Needs Improvement': return 'text-red-700 bg-red-100';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return 'text-green-700 bg-green-100';
    return 'text-red-700 bg-red-100';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">At-Risk Students</h2>
                <p className="text-red-100 mt-1">{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} need attention</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Filter By</label>
              <select
                value={filterBy}
                onChange={(e) => {
                  setFilterBy(e.target.value);
                  setCurrentPage(1); // Reset to first page
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              >
                <option value="all">All Students ({students.length})</option>
                <option value="low-attendance">Low Attendance (&lt;75%)</option>
                <option value="low-performance">Low Performance</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              >
                <option value="risk-level">Risk Level (High to Low)</option>
                <option value="name">Name (A to Z)</option>
              </select>
            </div>

            {/* Results */}
            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                Showing <span className="font-semibold">{paginatedStudents.length}</span> of{' '}
                <span className="font-semibold">{filteredStudents.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {paginatedStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Users className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg">No students match the selected filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedStudents.map((student) => (
                <div
                  key={student._id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{student.name}</h3>
                      <p className="text-sm text-slate-600">ID: {student.id || student._id}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">At Risk</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Attendance */}
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-600 font-medium">Attendance</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className={`text-lg font-bold ${getAttendanceColor(student.attendance).split(' ')[0]}`}>
                          {student.attendance}%
                        </p>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full ${student.attendance >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${student.attendance}%` }}
                        />
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-slate-600 font-medium">Performance</p>
                      <p className={`text-sm font-semibold mt-2 px-2 py-1 rounded w-fit ${getPerformanceColor(student.performance)}`}>
                        {student.performance}
                      </p>
                    </div>

                    {/* Reason */}
                    <div className="bg-slate-50 p-3 rounded-lg col-span-2 md:col-span-1">
                      <p className="text-xs text-slate-600 font-medium">Reason</p>
                      <p className="text-sm text-slate-700 mt-2">
                        {student.attendance < 75 && student.performance !== 'Excellent' ? 'Low Attendance & Performance' : student.attendance < 75 ? 'Low Attendance' : 'Low Performance'}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                      View Details
                    </button>
                    <button className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium">
                      Send Alert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Page <span className="font-semibold">{currentPage}</span> of{' '}
              <span className="font-semibold">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                Previous
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
