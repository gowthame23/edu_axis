import { useState, useEffect } from 'react';
import { BookOpen, Users, GraduationCap, Calendar, Search, X, Award, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function TeacherSubjects() {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherSubjects, setTeacherSubjects] = useState(null);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [subjectsPage, setSubjectsPage] = useState(1);
  const teachersPerPage = 9;
  const subjectsPerPage = 10;

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = teachers.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.teacherId && t.teacherId.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredTeachers(filtered);
      setCurrentPage(1); // Reset to first page on search
    } else {
      setFilteredTeachers(teachers);
    }
  }, [searchQuery, teachers]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers();
      const teachersList = res.data.users.filter(u => u.role === 'teacher' && u.status === 'active');
      setTeachers(teachersList);
      setFilteredTeachers(teachersList);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubjects = async (teacher) => {
    setSelectedTeacher(teacher);
    setSubjectsLoading(true);
    setSubjectsPage(1); // Reset subjects pagination
    try {
      const res = await adminAPI.getTeacherSubjects(teacher.id);
      setTeacherSubjects(res.data);
    } catch (error) {
      console.error('Failed to fetch teacher subjects:', error);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const closeSubjectsView = () => {
    setSelectedTeacher(null);
    setTeacherSubjects(null);
    setSubjectsPage(1);
  };

  // Group subjects by name for counting
  const getGroupedSubjects = (subjects) => {
    if (!subjects || subjects.length === 0) return [];
    
    const groups = {};
    subjects.forEach(subject => {
      const key = subject.name.toLowerCase().trim();
      if (!groups[key]) {
        groups[key] = {
          name: subject.name,
          count: 0,
          courses: []
        };
      }
      groups[key].count++;
      groups[key].courses.push(subject);
    });
    
    return Object.values(groups);
  };

  // Pagination calculations for teachers
  const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);
  const indexOfLastTeacher = currentPage * teachersPerPage;
  const indexOfFirstTeacher = indexOfLastTeacher - teachersPerPage;
  const currentTeachers = filteredTeachers.slice(indexOfFirstTeacher, indexOfLastTeacher);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pagination calculations for subjects
  const getPaginatedSubjects = (subjects) => {
    if (!subjects) return [];
    const totalSubjectsPages = Math.ceil(subjects.length / subjectsPerPage);
    const indexOfLastSubject = subjectsPage * subjectsPerPage;
    const indexOfFirstSubject = indexOfLastSubject - subjectsPerPage;
    return {
      items: subjects.slice(indexOfFirstSubject, indexOfLastSubject),
      totalPages: totalSubjectsPages
    };
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
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Teacher Subjects</h2>
            <p className="text-slate-600 mt-1">View subjects taught by each teacher</p>
          </div>
          <div className="bg-purple-50 px-4 py-2 rounded-lg">
            <p className="text-xs text-purple-600 uppercase font-medium">Total Teachers</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{teachers.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or teacher ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Results Info */}
        <div className="mt-4 text-sm text-slate-600">
          Showing {filteredTeachers.length > 0 ? indexOfFirstTeacher + 1 : 0} to {Math.min(indexOfLastTeacher, filteredTeachers.length)} of {filteredTeachers.length} teachers
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Teacher ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentTeachers.length > 0 ? (
                currentTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {teacher.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-900">{teacher.name}</p>
                          {teacher.phone && (
                            <p className="text-xs text-slate-500">{teacher.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-slate-900">{teacher.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-slate-700">{teacher.teacherId || '—'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewSubjects(teacher)}
                        className="text-purple-600 hover:text-purple-900 font-medium flex items-center space-x-1"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>View Subjects</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    No teachers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="px-2 text-slate-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Subjects Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeSubjectsView}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-linear-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-3xl">{selectedTeacher.name.charAt(0)}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedTeacher.name}</h2>
                <p className="text-slate-600 mt-1">{selectedTeacher.email}</p>
                {selectedTeacher.teacherId && (
                  <p className="text-sm text-slate-500 mt-1">ID: {selectedTeacher.teacherId}</p>
                )}
              </div>

              {subjectsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-slate-500 mt-4">Loading subjects...</p>
                </div>
              ) : teacherSubjects ? (
                <>
                  {/* Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-indigo-600 uppercase font-medium">Total Courses</p>
                          <p className="text-2xl font-bold text-indigo-700 mt-1">{teacherSubjects.totalSubjects}</p>
                        </div>
                        <BookOpen className="w-8 h-8 text-indigo-600 opacity-50" />
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-green-600 uppercase font-medium">Active Courses</p>
                          <p className="text-2xl font-bold text-green-700 mt-1">{teacherSubjects.activeSubjects}</p>
                        </div>
                        <Award className="w-8 h-8 text-green-600 opacity-50" />
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-purple-600 uppercase font-medium">Unique Subjects</p>
                          <p className="text-2xl font-bold text-purple-700 mt-1">
                            {getGroupedSubjects(teacherSubjects.subjects).length}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-600 opacity-50" />
                      </div>
                    </div>
                  </div>

                  {/* Subject Summary */}
                  {teacherSubjects.subjects.length > 0 && (
                    <div className="mb-8">
                      <h3 className="font-semibold text-lg text-slate-900 mb-4 flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                        Subject Summary
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {getGroupedSubjects(teacherSubjects.subjects).map((group, index) => (
                          <div
                            key={index}
                            className="bg-linear-to-r from-purple-50 to-indigo-50 border border-purple-200 px-4 py-2 rounded-lg flex items-center space-x-2"
                          >
                            <span className="text-sm font-medium text-slate-900">{group.name}</span>
                            {group.count > 1 && (
                              <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {group.count}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detailed Course List */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-slate-900 border-b pb-2">Course Details</h3>
                    {teacherSubjects.subjects.length > 0 ? (
                      <>
                        <div className="text-sm text-slate-600 mb-2">
                          Showing {getPaginatedSubjects(teacherSubjects.subjects).items.length} of {teacherSubjects.subjects.length} courses
                        </div>
                        <div className="space-y-3">
                          {getPaginatedSubjects(teacherSubjects.subjects).items.map((subject) => {
                            const group = getGroupedSubjects(teacherSubjects.subjects).find(
                              g => g.name.toLowerCase() === subject.name.toLowerCase()
                            );
                            
                            return (
                            <div
                              key={subject._id}
                              className="bg-slate-50 p-4 rounded-lg border border-slate-200 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-semibold text-slate-900 text-lg">{subject.name}</h4>
                                    {group && group.count > 1 && (
                                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                                        {group.count} courses
                                      </span>
                                    )}
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      subject.status === 'active' 
                                        ? 'bg-green-100 text-green-700' 
                                        : subject.status === 'inactive'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {subject.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-purple-600 font-medium mb-2">{subject.code}</p>
                                  {subject.description && (
                                    <p className="text-sm text-slate-600 mb-3">{subject.description}</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex items-center space-x-2 text-sm">
                                  <GraduationCap className="w-4 h-4 text-slate-500" />
                                  <div>
                                    <p className="text-xs text-slate-500">Grade</p>
                                    <p className="font-medium text-slate-700">{subject.grade}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <BookOpen className="w-4 h-4 text-slate-500" />
                                  <div>
                                    <p className="text-xs text-slate-500">Credits</p>
                                    <p className="font-medium text-slate-700">{subject.credits}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <Users className="w-4 h-4 text-slate-500" />
                                  <div>
                                    <p className="text-xs text-slate-500">Students</p>
                                    <p className="font-medium text-slate-700">{subject.students}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <Calendar className="w-4 h-4 text-slate-500" />
                                  <div>
                                    <p className="text-xs text-slate-500">Semester</p>
                                    <p className="font-medium text-slate-700">{subject.semester}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Subjects Pagination */}
                      {getPaginatedSubjects(teacherSubjects.subjects).totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                          <div className="text-sm text-slate-600">
                            Page {subjectsPage} of {getPaginatedSubjects(teacherSubjects.subjects).totalPages}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSubjectsPage(prev => Math.max(1, prev - 1))}
                              disabled={subjectsPage === 1}
                              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                                subjectsPage === 1
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            {Array.from({ length: getPaginatedSubjects(teacherSubjects.subjects).totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <button
                                key={pageNum}
                                onClick={() => setSubjectsPage(pageNum)}
                                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                                  subjectsPage === pageNum
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {pageNum}
                              </button>
                            ))}

                            <button
                              onClick={() => setSubjectsPage(prev => Math.min(getPaginatedSubjects(teacherSubjects.subjects).totalPages, prev + 1))}
                              disabled={subjectsPage === getPaginatedSubjects(teacherSubjects.subjects).totalPages}
                              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                                subjectsPage === getPaginatedSubjects(teacherSubjects.subjects).totalPages
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      </>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-lg">
                        <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No subjects assigned to this teacher yet</p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
