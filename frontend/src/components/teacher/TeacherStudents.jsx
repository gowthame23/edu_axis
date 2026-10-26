import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../services/api';
import { Users, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TeacherStudents = () => {
  const location = useLocation();
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableGrades, setAvailableGrades] = useState([]);
  const [teacherCourses, setTeacherCourses] = useState([]);

  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  useEffect(() => {
    // Check if a course was passed via navigation state
    if (location.state?.selectedCourse && teacherCourses.length > 0) {
      const course = location.state.selectedCourse;
      setSelectedGrade(course.grade.toString());
      setSelectedCourse(course._id);
      // Don't fetch here, let the next useEffect handle it
    } else if (teacherCourses.length > 0 && !selectedGrade) {
      // Only auto-select grade if no course was passed
      const grades = [...new Set(teacherCourses.map(c => c.grade))].sort((a, b) => a - b);
      if (grades.length > 0) {
        setSelectedGrade(grades[0].toString());
      }
    }
  }, [location.state, teacherCourses]);

  useEffect(() => {
    if (selectedGrade && selectedCourse && selectedCourse !== 'all') {
      fetchStudentsByCourse(selectedCourse);
    } else if (selectedGrade && selectedCourse === 'all') {
      fetchStudentsByGrade(selectedGrade);
    }
  }, [selectedGrade, selectedCourse]);

  const fetchTeacherCourses = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getCourses();
      if (response.data.courses) {
        setTeacherCourses(response.data.courses);
        // Extract unique grades from teacher's courses
        const grades = [...new Set(response.data.courses.map(course => course.grade))].sort((a, b) => a - b);
        setAvailableGrades(grades);
        // Don't auto-select grade here, let the other useEffect handle it
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByGrade = async (grade) => {
    try {
      setLoading(true);
      const response = await teacherAPI.getStudents({ grade });
      if (response.data.students) {
        setAllStudents(response.data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setAllStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByCourse = async (courseId) => {
    try {
      setLoading(true);
      const response = await teacherAPI.getStudents({ courseId });
      if (response.data.students) {
        setAllStudents(response.data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setAllStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Get courses for selected grade
  const coursesForGrade = teacherCourses.filter(course => course.grade.toString() === selectedGrade);

  // Filter students based on search query
  const filteredStudents = allStudents.filter(student => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.studentId?.toLowerCase().includes(query) ||
      student.section?.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Student List</h1>
        <p className="text-slate-600">View all students by grade</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Grade Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Grade
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedCourse('all');
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={availableGrades.length === 0}
            >
              {availableGrades.length === 0 ? (
                <option value="">No grades available</option>
              ) : (
                availableGrades.map(grade => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={!selectedGrade || coursesForGrade.length === 0}
            >
              <option value="all">All Courses</option>
              {coursesForGrade.map(course => (
                <option key={course._id} value={course._id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search Students
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, ID..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-slate-600">Loading students...</p>
        </div>
      ) : !selectedGrade ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Grade</h3>
          <p className="text-slate-600">
            Please select a grade to view students.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Students Found</h3>
          <p className="text-slate-600">
            {searchQuery 
              ? 'No students match your search criteria.'
              : selectedCourse !== 'all'
                ? `No students are enrolled in this course.`
                : `No students found in Grade ${selectedGrade}.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
          {/* Stats Header */}
          <div className="bg-linear-to-r from-green-600 to-green-700 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-green-100 text-sm">
                  {selectedCourse === 'all' ? `Grade ${selectedGrade} Students` : 'Course Students'}
                </p>
                <p className="text-3xl font-bold">{filteredStudents.length}</p>
                {searchQuery && (
                  <p className="text-green-100 text-sm mt-1">
                    Filtered from {allStudents.length} total
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Student List Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Section
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.map((student, index) => (
                  <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-green-700 font-semibold text-sm">
                            {student.name?.charAt(0).toUpperCase() || 'S'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{student.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {student.studentId || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                        Section {student.section || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} 
              {selectedCourse === 'all' 
                ? ` in Grade ${selectedGrade}` 
                : ` in ${coursesForGrade.find(c => c._id === selectedCourse)?.name || 'selected course'}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStudents;
