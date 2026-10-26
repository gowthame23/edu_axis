import { useState, useEffect } from 'react';
import { Users, Search, Filter, AlertTriangle, TrendingUp, TrendingDown, Minus, Eye, Download, ChevronDown, X, GraduationCap, IndianRupee, Calendar, Award } from 'lucide-react';
import { adminAPI } from '../services/api';
// Removed AtRiskStudentsModal in favor of simple inline list view

export default function ClassManagement() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  
  // Filters
  const [gradeFilter, setGradeFilter] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Student detail modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');

  // Show at-risk panel
  const [showAtRisk, setShowAtRisk] = useState(true);
  const [showAllAtRisk, setShowAllAtRisk] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [gradeFilter, performanceFilter, attendanceFilter, searchQuery, students]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, studentsRes, atRiskRes] = await Promise.all([
        adminAPI.getClassOverview(),
        adminAPI.getStudentAnalytics({}),
        adminAPI.getAtRiskStudents()
      ]);
      
      setOverview(overviewRes.data.data);
      setStudents(studentsRes.data.data);
      setFilteredStudents(studentsRes.data.data);
      setAtRiskStudents(atRiskRes.data.data);
    } catch (error) {
      console.error('Error fetching class management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    if (gradeFilter !== 'all') {
      filtered = filtered.filter(s => s.grade === gradeFilter);
    }

    if (performanceFilter !== 'all') {
      filtered = filtered.filter(s => s.performanceLevel === performanceFilter);
    }

    if (attendanceFilter !== 'all') {
      const [min, max] = attendanceFilter.split('-').map(Number);
      filtered = filtered.filter(s => s.attendance >= min && s.attendance <= max);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.studentId.toLowerCase().includes(query)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleViewDetails = async (student) => {
    setSelectedStudent(student);
    setDetailsLoading(true);
    try {
      const res = await adminAPI.getStudentDetails(student.id);
      setStudentDetails(res.data.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setSelectedStudent(null);
    setStudentDetails(null);
    setActiveTab('performance');
  };

  const getPerformanceColor = (level) => {
    switch (level) {
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

  const exportToCSV = () => {
    const headers = ['Student ID', 'Name', 'Grade', 'Attendance %', 'Avg Score', 'Performance', 'Email'];
    const rows = filteredStudents.map(s => [
      s.studentId,
      s.name,
      s.grade,
      s.attendance,
      s.averageScore,
      s.performanceLevel,
      s.email
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Class Management</h1>
        <p className="text-purple-100">Comprehensive view of student performance and attendance across all grades</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Total Students</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{overview?.totalStudents || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div
          className="bg-white p-6 rounded-xl shadow-md border border-slate-100 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowAllAtRisk(true)}
          role="button"
          aria-label="View all at-risk students"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">At-Risk Students</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{atRiskStudents.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* At-Risk Students Alert */}
      {atRiskStudents.length > 0 && showAtRisk && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg relative">
          <button
            onClick={() => setShowAtRisk(false)}
            className="absolute top-4 right-4 text-red-400 hover:text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">At-Risk Students Alert</h3>
              <p className="text-red-700 text-sm mb-4">
                {atRiskStudents.length} student{atRiskStudents.length > 1 ? 's need' : ' needs'} immediate attention due to low attendance ({'<75%'}) or performance.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {atRiskStudents.slice(0, 5).map((student) => (
                  <div key={student.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{student.name}</p>
                      <p className="text-sm text-slate-600">
                        Grade {student.grade} • {student.studentId}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {student.reasons.map((reason, idx) => (
                          <span key={idx} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDetails(student)}
                      className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                ))}
                {atRiskStudents.length > 5 && (
                  <button
                    onClick={() => setShowAllAtRisk(true)}
                    className="w-full text-center py-3 text-red-600 font-semibold hover:bg-red-100 rounded-lg transition-colors"
                  >
                    +{atRiskStudents.length - 5} more students need attention
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Grade Filter */}
          <div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Grades</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>Grade {i + 1}</option>
              ))}
            </select>
          </div>

          {/* Performance Filter */}
          <div>
            <select
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Performance</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Needs Improvement">Needs Improvement</option>
              <option value="No Data">No Data Yet</option>
            </select>
          </div>
        </div>

        {/* Attendance Range Filter */}
        <div className="mt-4 flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-700">Attendance:</span>
          <div className="flex space-x-2">
            {[
              { label: 'All', value: 'all' },
              { label: '≥75%', value: '75-100' },
              { label: '<75%', value: '0-74' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setAttendanceFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  attendanceFilter === option.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex-1 text-right">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium inline-flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <p className="text-sm text-slate-600">
          Showing <span className="font-semibold text-slate-900">{filteredStudents.length}</span> of{' '}
          <span className="font-semibold text-slate-900">{students.length}</span> students
        </p>
        {(gradeFilter !== 'all' || performanceFilter !== 'all' || attendanceFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setGradeFilter('all');
              setPerformanceFilter('all');
              setAttendanceFilter('all');
              setSearchQuery('');
            }}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Attendance</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Avg Score</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    No students found matching your filters
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{student.name}</p>
                        <p className="text-sm text-slate-500">{student.studentId}</p>
                        <p className="text-xs text-slate-400">{student.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">Grade {student.grade}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {student.performanceLevel === 'No Data' ? (
                          <span className="text-sm text-slate-400 italic">No data yet</span>
                        ) : (
                          <>
                            <div className="w-16 bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  student.attendance >= 75 ? 'bg-green-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${student.attendance}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-medium ${
                              student.attendance >= 75 ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {student.attendance}%
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {student.performanceLevel === 'No Data' ? (
                        <span className="text-sm text-slate-400 italic">—</span>
                      ) : (
                        <span className="text-sm font-medium text-slate-700">{student.averageScore}%</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPerformanceColor(student.performanceLevel)}`}>
                        {student.performanceLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {student.performanceLevel === 'No Data' ? (
                        <span className="text-slate-400 text-xs font-medium italic">Pending Assessment</span>
                      ) : student.isAtRisk ? (
                        <span className="flex items-center space-x-1 text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs font-medium">At Risk</span>
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs font-medium">✓ On Track</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(student)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium inline-flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-purple-100 mt-1">
                    {selectedStudent.studentId} • Grade {selectedStudent.grade}
                  </p>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mt-6">
                {[
                  { id: 'performance', label: 'Performance', icon: Award },
                  { id: 'attendance', label: 'Attendance', icon: Calendar },
                  { id: 'fees', label: 'Fees & Payments', icon: IndianRupee },
                  { id: 'info', label: 'Personal Info', icon: Users }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white text-purple-600'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : studentDetails ? (
                <>
                  {activeTab === 'performance' && (
                    <div className="space-y-6">
                      {/* Performance Overview */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700 font-medium">Overall Average</p>
                          <p className="text-3xl font-bold text-blue-900 mt-1">
                            {studentDetails.performance.averageScore}%
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-sm text-green-700 font-medium">Attendance</p>
                          <p className="text-3xl font-bold text-green-900 mt-1">
                            {studentDetails.performance.attendance}%
                          </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-700 font-medium">Ranking</p>
                          <p className="text-3xl font-bold text-purple-900 mt-1">Top 20%</p>
                        </div>
                      </div>

                      {/* Subject-wise Performance */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Subject Performance</h3>
                        <div className="space-y-3">
                          {studentDetails.performance.subjects.map((subject, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">{subject.name}</p>
                                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                                  <div
                                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full"
                                    style={{ width: `${subject.score}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div className="ml-4 text-right">
                                <p className="text-2xl font-bold text-slate-900">{subject.score}%</p>
                                {subject.trend === 'up' && (
                                  <span className="text-green-600 flex items-center justify-end text-xs">
                                    <TrendingUp className="w-3 h-3 mr-1" /> Improving
                                  </span>
                                )}
                                {subject.trend === 'down' && (
                                  <span className="text-red-600 flex items-center justify-end text-xs">
                                    <TrendingDown className="w-3 h-3 mr-1" /> Declining
                                  </span>
                                )}
                                {subject.trend === 'stable' && (
                                  <span className="text-slate-600 flex items-center justify-end text-xs">
                                    <Minus className="w-3 h-3 mr-1" /> Stable
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Tests */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Tests</h3>
                        <div className="space-y-2">
                          {studentDetails.performance.recentTests.map((test, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                              <div>
                                <p className="font-medium text-slate-900">{test.name}</p>
                                <p className="text-sm text-slate-500">
                                  {new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-900">{test.score}/{test.total}</p>
                                <p className="text-sm text-slate-500">{Math.round((test.score/test.total)*100)}%</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'attendance' && (
                    <div className="space-y-6">
                      {/* Attendance Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-sm text-green-700 font-medium">Overall</p>
                          <p className="text-3xl font-bold text-green-900 mt-1">
                            {studentDetails.attendance.overall}%
                          </p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700 font-medium">This Month</p>
                          <p className="text-3xl font-bold text-blue-900 mt-1">
                            {studentDetails.attendance.thisMonth}%
                          </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-700 font-medium">Last Month</p>
                          <p className="text-3xl font-bold text-purple-900 mt-1">
                            {studentDetails.attendance.lastMonth}%
                          </p>
                        </div>
                      </div>

                      {/* Monthly Attendance Trend */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Attendance Trend (Last 6 Months)</h3>
                        <div className="space-y-3">
                          {studentDetails.attendance.monthlyData.map((month, idx) => (
                            <div key={idx} className="flex items-center space-x-4">
                              <span className="w-16 text-sm font-medium text-slate-700">{month.month}</span>
                              <div className="flex-1 bg-slate-200 rounded-full h-6">
                                <div
                                  className={`h-6 rounded-full flex items-center justify-end pr-2 ${
                                    month.percentage >= 90 ? 'bg-green-500' :
                                    month.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${month.percentage}%` }}
                                >
                                  <span className="text-xs font-medium text-white">{month.percentage}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'fees' && (
                    <div className="space-y-6">
                      {/* Payment Summary */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-sm text-green-700 font-medium">Total Paid</p>
                          <p className="text-2xl font-bold text-green-900 mt-1">
                            ₹{studentDetails.payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <p className="text-sm text-red-700 font-medium">Pending Payments</p>
                          <p className="text-2xl font-bold text-red-900 mt-1">
                            {studentDetails.fees.filter(f => f.status === 'pending').length} fees
                          </p>
                        </div>
                      </div>

                      {/* Fee Details */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Fee Structure</h3>
                        <div className="space-y-2">
                          {studentDetails.fees.map((fee, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">{fee.title}</p>
                                <p className="text-sm text-slate-500">
                                  {fee.semester} • Due: {new Date(fee.dueDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-900">₹{fee.amount.toLocaleString()}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  fee.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  fee.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {fee.status === 'completed' ? 'Paid' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment History */}
                      {studentDetails.payments.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment History</h3>
                          <div className="space-y-2">
                            {studentDetails.payments.map((payment, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                  <p className="font-medium text-slate-900">{payment.feeTitle}</p>
                                  <p className="text-sm text-slate-500">
                                    {payment.method} • {payment.transactionId}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {new Date(payment.date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-700">₹{payment.amount.toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'info' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Email</p>
                          <p className="text-slate-900 mt-1">{studentDetails.student.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Phone</p>
                          <p className="text-slate-900 mt-1">{studentDetails.student.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Date of Birth</p>
                          <p className="text-slate-900 mt-1">
                            {studentDetails.student.dateOfBirth ? 
                              new Date(studentDetails.student.dateOfBirth).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Enrollment Date</p>
                          <p className="text-slate-900 mt-1">
                            {new Date(studentDetails.student.enrolledDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Student ID</p>
                          <p className="text-slate-900 mt-1 font-mono">{studentDetails.student.studentId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Status</p>
                          <p className="text-slate-900 mt-1 capitalize">{studentDetails.student.status}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-slate-500 py-12">
                  Failed to load student details
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All At-Risk Students - Simple Inline List */}
      {showAllAtRisk && (
        <div id="at-risk-all" className="bg-white rounded-xl shadow-md border border-slate-100 mt-6">
          <div className="p-6 flex items-center justify-between border-b border-slate-200">
            <div>
              <h3 className="text-xl font-bold text-slate-900">All At-Risk Students</h3>
              <p className="text-sm text-slate-600">{atRiskStudents.length} student{atRiskStudents.length !== 1 ? 's' : ''} need attention</p>
            </div>
            <button
              onClick={() => setShowAllAtRisk(false)}
              className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Hide List
            </button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
            {atRiskStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{student.name}</p>
                  <p className="text-sm text-slate-600">Grade {student.grade} • {student.studentId || student.id}</p>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    {student.reasons?.map((reason, idx) => (
                      <span key={idx} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">{reason}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${student.attendance >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {student.attendance}% Attendance
                  </span>
                  <button
                    onClick={() => handleViewDetails(student)}
                    className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
            {atRiskStudents.length === 0 && (
              <div className="text-center text-slate-500 py-8">No at-risk students found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
