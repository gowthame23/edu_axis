// CourseManagement.jsx
// Extracted from AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { BookOpen, Users, GraduationCap, Filter, Search, Trash2, X } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';

// ...existing courseSchema from AdminDashboard.jsx
const courseSchema = yup.object({
  name: yup
    .string()
    .required('Course name is required')
    .min(2, 'Course name must be at least 2 characters')
    .max(100, 'Course name must not exceed 100 characters')
    .trim(),
  code: yup
    .string()
    .required('Course code is required')
    .min(3, 'Course code must be at least 3 characters')
    .max(10, 'Course code must not exceed 10 characters')
    .matches(/^[A-Z0-9-]+$/, 'Course code must be uppercase letters, numbers, or hyphens')
    .trim(),
  description: yup
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .notRequired(),
  teacher: yup
    .string()
    .max(100, 'Teacher name must not exceed 100 characters')
    .notRequired(),
  credits: yup
    .number()
    .required('Credits are required')
    .min(1, 'Credits must be at least 1')
    .max(6, 'Credits cannot exceed 6')
    .integer('Credits must be a whole number'),
  grade: yup
    .number()
    .required('Grade is required')
    .min(1, 'Grade must be at least 1')
    .max(12, 'Grade cannot exceed 12')
    .integer('Grade must be a whole number'),
  status: yup
    .string()
    .oneOf(['active', 'inactive', 'archived'], 'Invalid status')
    .required('Status is required')
}).required();

export default function CourseManagement({ users = [] }) {
  // State
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState('all');
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(courseSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      teacher: '',
      credits: 3,
      grade: 1,
      status: 'active'
    }
  });

  // Fetch courses
  const fetchCourses = async () => {
    setCoursesLoading(true);
    setCoursesError('');
    try {
      const res = await adminAPI.getCourses();
      const coursesData = res.data?.courses || [];
      setCourses(coursesData);
      setFilteredCourses(coursesData);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setCoursesError(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses
  useEffect(() => {
    let result = courses;
    if (courseStatusFilter !== 'all') {
      result = result.filter(c => c.status === courseStatusFilter);
    }
    if (courseSearchQuery.trim()) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        (c.teacher && c.teacher.toLowerCase().includes(courseSearchQuery.toLowerCase()))
      );
    }
    setFilteredCourses(result);
  }, [courseSearchQuery, courseStatusFilter, courses]);

  // CRUD Handlers
  const handleCreateCourse = async (data) => {
    try {
      setCoursesLoading(true);
      const response = await adminAPI.createCourse(data);
      if (response.data.success) {
        setShowCourseForm(false);
        setIsEditMode(false);
        reset();
        fetchCourses();
        alert('Course created successfully!');
      }
    } catch (err) {
      console.error('Failed to create course:', err);
      alert(err.response?.data?.message || 'Failed to create course');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleUpdateCourse = async (data) => {
    try {
      setCoursesLoading(true);
      const response = await adminAPI.updateCourse(selectedCourse._id, data);
      if (response.data.success) {
        setShowCourseForm(false);
        setIsEditMode(false);
        setSelectedCourse(null);
        reset();
        fetchCourses();
        alert('Course updated successfully!');
      }
    } catch (err) {
      console.error('Failed to update course:', err);
      alert(err.response?.data?.message || 'Failed to update course');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    try {
      setCoursesLoading(true);
      const response = await adminAPI.deleteCourse(courseId);
      if (response.data.success) {
        setShowCourseDetails(false);
        setSelectedCourse(null);
        fetchCourses();
        alert('Course deleted successfully!');
      }
    } catch (err) {
      console.error('Failed to delete course:', err);
      alert(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setIsEditMode(true);
    setValue('name', course.name);
    setValue('code', course.code);
    setValue('description', course.description || '');
    setValue('teacher', course.teacher || '');
    setValue('credits', course.credits);
    setValue('grade', course.grade);
    setValue('status', course.status);
    setShowCourseForm(true);
  };

  const handleViewCourseDetails = (course) => {
    setSelectedCourse(course);
    setShowCourseDetails(true);
  };

  // Render
  return (
    <div>
      {/* Header with Stats */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Course Management</h2>
            <p className="text-slate-600 mt-1">Create and manage all courses in the system</p>
          </div>
          <button
            onClick={() => {
              setIsEditMode(false);
              setSelectedCourse(null);
              reset();
              setShowCourseForm(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Add New Course</span>
          </button>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-blue-600 text-sm font-medium">Total Courses</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{courses.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <p className="text-green-600 text-sm font-medium">Active Courses</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{courses.filter(c => c.status === 'active').length}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <p className="text-orange-600 text-sm font-medium">Inactive Courses</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">{courses.filter(c => c.status === 'inactive').length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-purple-600 text-sm font-medium">Archived Courses</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{courses.filter(c => c.status === 'archived').length}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by course name, code, or teacher..."
              value={courseSearchQuery}
              onChange={(e) => setCourseSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          {/* Status Filter */}
          <div className="relative">
            <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select
              value={courseStatusFilter}
              onChange={(e) => setCourseStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        {/* Results Count */}
        <div className="mt-4 text-sm text-slate-600">
          Showing {filteredCourses.length} of {courses.length} courses
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesLoading ? (
          <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-slate-500">Loading courses...</p>
          </div>
        ) : coursesError ? (
          <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-red-600">{coursesError}</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-100"
            >
              <div className="p-6">
                {/* Course Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{course.name}</h3>
                    <p className="text-sm font-medium text-purple-600">{course.code}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    course.status === 'active' ? 'bg-green-100 text-green-700' :
                    course.status === 'inactive' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {course.status}
                  </span>
                </div>
                {/* Course Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-slate-600">
                    <Users className="w-4 h-4 mr-2 text-slate-400" />
                    <span>Teacher: {course.teacher || 'TBD'}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                    <span>Credits: {course.credits}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <GraduationCap className="w-4 h-4 mr-2 text-slate-400" />
                    <span>Grade: {course.grade}</span>
                  </div>
                </div>
                {course.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>
                )}
                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleViewCourseDetails(course)}
                    className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No courses found</p>
            <button
              onClick={() => {
                setIsEditMode(false);
                setSelectedCourse(null);
                reset();
                setShowCourseForm(true);
              }}
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Add Your First Course</span>
            </button>
          </div>
        )}
      </div>

      {/* Course Form Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowCourseForm(false);
                setIsEditMode(false);
                setSelectedCourse(null);
                reset();
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">
                  {isEditMode ? 'Edit Course' : 'Add New Course'}
                </h2>
                <p className="text-slate-600 mt-2">
                  {isEditMode ? 'Update course information' : 'Create a new course'}
                </p>
              </div>
              <form
                onSubmit={handleSubmit(isEditMode ? handleUpdateCourse : handleCreateCourse)}
                className="space-y-5"
              >
                {/* Course Name and Code */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Course Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                        errors.name ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="e.g., Introduction to Computer Science"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Course Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('code')}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all uppercase ${
                        errors.code ? 'border-red-500' : 'border-slate-300'
                      }`}
                      placeholder="e.g., CS-101"
                      maxLength={10}
                      disabled={isEditMode}
                    />
                    {errors.code && (
                      <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                    )}
                    {isEditMode && (
                      <p className="mt-1 text-xs text-slate-500">Course code cannot be changed</p>
                    )}
                  </div>
                </div>
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                      errors.description ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Brief description of the course..."
                    maxLength={500}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
                {/* Teacher Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assign Teacher
                  </label>
                  <select
                    {...register('teacher')}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white ${
                      errors.teacher ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select a teacher (optional)</option>
                    {users
                      .filter(u => u.role === 'teacher')
                      .map(teacher => (
                        <option key={teacher.id} value={teacher.name}>
                          {teacher.name} - {teacher.email}
                        </option>
                      ))}
                  </select>
                  {errors.teacher && (
                    <p className="mt-1 text-sm text-red-600">{errors.teacher.message}</p>
                  )}
                  {users.filter(u => u.role === 'teacher').length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">No teachers available. Add teachers first.</p>
                  )}
                </div>
                {/* Credits, Grade, Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Credits <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register('credits')}
                      min={1}
                      max={6}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                        errors.credits ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {errors.credits && (
                      <p className="mt-1 text-sm text-red-600">{errors.credits.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Grade <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('grade')}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white ${
                        errors.grade ? 'border-red-500' : 'border-slate-300'
                      }`}
                    >
                      <option value="">Select grade</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1}</option>
                      ))}
                    </select>
                    {errors.grade && (
                      <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('status')}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white ${
                        errors.status ? 'border-red-500' : 'border-slate-300'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                    )}
                  </div>
                </div>
                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCourseForm(false);
                      setIsEditMode(false);
                      setSelectedCourse(null);
                      reset();
                    }}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={coursesLoading}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {coursesLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Course' : 'Create Course')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      {showCourseDetails && selectedCourse && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowCourseDetails(false);
                setSelectedCourse(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedCourse.name}</h2>
                <p className="text-purple-600 font-semibold mt-2">{selectedCourse.code}</p>
                <div className="flex items-center justify-center mt-3">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    selectedCourse.status === 'active' ? 'bg-green-100 text-green-700' :
                    selectedCourse.status === 'inactive' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedCourse.status.toUpperCase()}
                  </span>
                </div>
              </div>
              {/* Details Grid */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Teacher</p>
                      <p className="text-sm text-slate-900 mt-1">{selectedCourse.teacher || 'TBD'}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <BookOpen className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Credits</p>
                      <p className="text-sm text-slate-900 mt-1">{selectedCourse.credits}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <GraduationCap className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Grade</p>
                      <p className="text-sm text-slate-900 mt-1">{selectedCourse.grade}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Students Enrolled</p>
                      <p className="text-sm text-slate-900 mt-1">{selectedCourse.students || 0}</p>
                    </div>
                  </div>
                </div>
                {selectedCourse.description && (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-medium mb-2">Description</p>
                    <p className="text-sm text-slate-700">{selectedCourse.description}</p>
                  </div>
                )}
                {/* Action Buttons */}
                <div className="flex space-x-3 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowCourseDetails(false);
                      handleEditCourse(selectedCourse);
                    }}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Edit Course
                  </button>
                  <button
                    onClick={() => {
                      setShowCourseDetails(false);
                      handleDeleteCourse(selectedCourse._id);
                    }}
                    className="px-4 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
