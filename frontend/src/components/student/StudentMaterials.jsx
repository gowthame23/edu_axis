import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import { Download, FileText, Search, Filter } from 'lucide-react';
import { resolveAssetUrl } from '../../config/runtime';

export default function StudentMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getStudyMaterials();
      if (response.data.success) {
        setMaterials(response.data.materials);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique subjects
  const subjects = ['all', ...new Set(materials.map(m => m.subject))];

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesSubject = selectedSubject === 'all' || material.subject === selectedSubject;
    const matchesSearch = !searchQuery || 
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const paginatedMaterials = filteredMaterials.slice((currentPage - 1) * itemsPerPage, (currentPage) * itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubject, searchQuery]);

  const clearFilters = () => {
    setSelectedSubject('all');
    setSearchQuery('');
    setCurrentPage(1);
  };
  const hasActiveFilters = selectedSubject !== 'all' || searchQuery.trim() !== '';

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = (material) => {
    const link = document.createElement('a');
    link.href = resolveAssetUrl(material.fileUrl);
    link.download = material.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Study Materials</h1>
        <p className="text-slate-600">Download resources uploaded by your teachers</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-600" />
            <h3 className="text-sm font-medium text-slate-700">Filters</h3>
            <span className="text-xs text-slate-500">({filteredMaterials.length} materials)</span>
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <span className="inline-block w-3 h-3">✕</span>
              Clear Filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Subjects</option>
              {subjects.filter(s => s !== 'all').map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search Materials
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, subject..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>  
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Loading materials...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Materials Found</h3>
          <p className="text-slate-600">
            {searchQuery 
              ? 'No materials match your search criteria.'
              : 'No study materials have been uploaded for your grade yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedMaterials.map((material) => (
            <div
              key={material._id}
              className="bg-white rounded-xl shadow-md p-5 border border-slate-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{material.title}</h3>
                  <p className="text-sm text-slate-600">{material.subject}</p>
                </div>
              </div>

              {material.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{material.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 mb-3 pb-3 border-b border-slate-200">
                <span>{material.fileName}</span>
                <span>{formatFileSize(material.fileSize)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <p>Uploaded by {material.uploadedBy?.name}</p>
                  <p>{new Date(material.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleDownload(material)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!loading && filteredMaterials.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-md p-4 border border-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredMaterials.length)} of {filteredMaterials.length} materials
              {selectedSubject !== 'all' && ` in ${selectedSubject}`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  ‹
                </button>
                <span className="text-sm text-slate-700">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
