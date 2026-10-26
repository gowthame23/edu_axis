import React, { useState, useMemo, useEffect } from 'react';
import { BarChart3, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';

const StudentGrades = ({ grades, gradesLoading }) => {
  // Filters
  const [filterCourse, setFilterCourse] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Extract unique courses and months
  const courses = useMemo(() => {
    const uniqueCourses = new Set();
    grades.forEach(g => {
      const courseName = g.courseId?.name || g.course;
      if (courseName) uniqueCourses.add(courseName);
    });
    return Array.from(uniqueCourses).sort();
  }, [grades]);

  const months = useMemo(() => {
    const uniqueMonths = new Set();
    grades.forEach(g => {
      const date = new Date(g.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      uniqueMonths.add(monthYear);
    });
    return Array.from(uniqueMonths).sort().reverse();
  }, [grades]);

  // Filtered grades
  const filteredGrades = useMemo(() => {
    return grades.filter(grade => {
      const percentage = (grade.marks / grade.totalMarks) * 100;
      
      if (filterCourse) {
        const courseName = grade.courseId?.name || grade.course;
        if (courseName !== filterCourse) return false;
      }
      if (filterGrade !== 'all') {
        if (filterGrade === 'excellent' && percentage < 90) return false;
        if (filterGrade === 'good' && (percentage < 75 || percentage >= 90)) return false;
        if (filterGrade === 'average' && (percentage < 60 || percentage >= 75)) return false;
        if (filterGrade === 'poor' && percentage >= 60) return false;
      }
      if (filterMonth) {
        const date = new Date(grade.createdAt);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthYear !== filterMonth) return false;
      }
      return true;
    });
  }, [grades, filterCourse, filterGrade, filterMonth]);

  const totalPages = Math.ceil(filteredGrades.length / itemsPerPage);
  const paginatedGrades = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGrades.slice(start, start + itemsPerPage);
  }, [filteredGrades, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCourse, filterGrade, filterMonth]);

  const clearFilters = () => {
    setFilterCourse('');
    setFilterGrade('all');
    setFilterMonth('');
  };

  const hasActiveFilters = filterCourse !== '' || filterGrade !== 'all' || filterMonth !== '';
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Grades</h1>
        <span className="text-sm text-slate-600">{filteredGrades.length} grades</span>
      </div>

      {gradesLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading grades...</p>
        </div>
      ) : grades.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No grades available yet</p>
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
                <label className="block text-xs font-medium text-slate-600 mb-1">Course</label>
                <select value={filterCourse} onChange={e=>setFilterCourse(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="">All Courses</option>
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Performance</label>
                <select value={filterGrade} onChange={e=>setFilterGrade(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  <option value="all">All Grades</option>
                  <option value="excellent">Excellent (90%+)</option>
                  <option value="good">Good (75-89%)</option>
                  <option value="average">Average (60-74%)</option>
                  <option value="poor">Below Average (&lt;60%)</option>
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

          {filteredGrades.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
              <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">No grades match the filters</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Course</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Assignment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Marks</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Grade</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedGrades.map((grade) => {
                  const percentage = (grade.marks / grade.totalMarks) * 100;
                  const gradeColor = 
                    percentage >= 90 ? 'text-green-700 bg-green-100' :
                    percentage >= 75 ? 'text-blue-700 bg-blue-100' :
                    percentage >= 60 ? 'text-orange-700 bg-orange-100' :
                    'text-red-700 bg-red-100';
                  
                  return (
                    <tr key={grade._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {grade.courseId?.name || grade.course || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {grade.assignmentId?.title || grade.assignment || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {grade.marks}/{grade.totalMarks}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${gradeColor}`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(grade.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 p-4 bg-white rounded-xl shadow-md border border-slate-100">
            <p className="text-sm text-slate-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredGrades.length)} of {filteredGrades.length} results
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

export default StudentGrades;
