import { useState, useEffect } from 'react';
import { teacherAPI } from '../../services/api';
import { Upload, FileText, Trash2, Download, Search } from 'lucide-react';

export default function TeacherMaterials() {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    grade: '',
    courseId: '',
    file: null
  });
  const [filters, setFilters] = useState({
    grade: '',
    courseId: '',
    search: ''
  });

  useEffect(() => {
    fetchCourses();
    fetchMaterials();
  }, []);

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

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getStudyMaterials();
      if (response.data.success) {
        setMaterials(response.data.materials);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get courses filtered by selected grade (for upload form)
  const coursesForGrade = formData.grade 
    ? courses.filter(c => c.grade.toString() === formData.grade)
    : [];

  // Get courses filtered by selected grade (for filter)
  const coursesForFilter = filters.grade 
    ? courses.filter(c => c.grade.toString() === filters.grade)
    : [];

  // Filter materials based on selected filters
  const filteredMaterials = materials.filter(material => {
    if (filters.grade && material.grade.toString() !== filters.grade) {
      return false;
    }
    if (filters.courseId && material.courseId?._id !== filters.courseId) {
      return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        material.title.toLowerCase().includes(searchLower) ||
        material.description?.toLowerCase().includes(searchLower) ||
        material.courseId?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.file) {
      showNotification('Please select a file', 'error');
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('grade', formData.grade);
      data.append('courseId', formData.courseId);
      data.append('file', formData.file);

      const response = await teacherAPI.uploadStudyMaterial(data);
      
      if (response.data.success) {
        showNotification('Study material uploaded successfully', 'success');
        setFormData({ title: '', description: '', grade: '', courseId: '', file: null });
        document.getElementById('file-input').value = '';
        fetchMaterials();
      }
    } catch (error) {
      console.error('Error uploading material:', error);
      showNotification(error.response?.data?.message || 'Failed to upload material', 'error');
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = (id) => {
    setMaterialToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!materialToDelete) return;

    try {
      setShowDeleteModal(false);
      const response = await teacherAPI.deleteStudyMaterial(materialToDelete);
      if (response.data.success) {
        showNotification('Material deleted successfully', 'success');
        fetchMaterials();
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      showNotification('Failed to delete material', 'error');
    } finally {
      setMaterialToDelete(null);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Study Materials</h1>

      {notification && (
        <div className={`mb-4 p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6 text-green-600" />
            Upload Study Material
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Chapter 5 Notes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Brief description of the material"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Grade <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value, courseId: '' })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Grade</option>
                  {[...new Set(courses.map(c => c.grade))].sort((a, b) => a - b).map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  required
                  disabled={!formData.grade}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-slate-100"
                >
                  <option value="">Select Course</option>
                  {coursesForGrade.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                File <span className="text-red-500">*</span>
              </label>
              <input
                id="file-input"
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                required
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">
                Supported: PDF, Word, PowerPoint, Text, ZIP (Max 50MB)
              </p>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
                uploading
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {uploading ? 'Uploading...' : 'Upload Material'}
            </button>
          </form>
        </div>

        {/* Materials List */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            My Uploaded Materials
          </h2>

          {/* Filters */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search materials..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <select
                value={filters.grade}
                onChange={(e) => setFilters({ ...filters, grade: e.target.value, courseId: '' })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Grades</option>
                {[...new Set(courses.map(c => c.grade))].sort((a, b) => a - b).map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>

              <select
                value={filters.courseId}
                onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
                disabled={!filters.grade}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-slate-100"
              >
                <option value="">All Courses</option>
                {coursesForFilter.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="text-slate-600 mt-2">Loading materials...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No materials uploaded yet</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No materials match your filters</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredMaterials.map((material) => (
                <div
                  key={material._id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{material.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Grade {material.grade} • {material.courseId?.name || material.subject}
                      </p>
                      {material.description && (
                        <p className="text-sm text-slate-500 mt-1">{material.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => confirmDelete(material._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{material.fileName}</span>
                      <span>({formatFileSize(material.fileSize)})</span>
                    </div>
                    <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Study Material?</h3>
            <p className="text-sm text-slate-600 text-center mb-6">
              Are you sure you want to delete this study material? This action cannot be undone and students will no longer have access to it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMaterialToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
