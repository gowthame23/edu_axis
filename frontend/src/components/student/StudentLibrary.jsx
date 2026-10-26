import React, { useMemo, useState, useEffect } from 'react';
import { Library, BookOpen, Download, Search, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const StudentLibrary = ({ library, libraryLoading, onSearch }) => {
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const categories = useMemo(() => {
    const set = new Set();
    (library?.availableResources || []).forEach(r => { if (r.category) set.add(r.category); });
    return ['All', ...Array.from(set).sort()];
  }, [library]);
  const [category, setCategory] = useState('All');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.({
      search: query || undefined,
      category: category && category !== 'All' ? category : undefined,
    });
  };

  const handleClear = () => {
    setQuery('');
    setCategory('All');
    setCurrentPage(1);
    onSearch?.({});
  };

  const hasActiveFilters = query !== '' || category !== 'All';

  // Filter and paginate resources
  const filteredResources = useMemo(() => {
    return library?.availableResources || [];
  }, [library]);

  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredResources.slice(start, start + itemsPerPage);
  }, [filteredResources, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, category]);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Library Resources</h1>
      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-md border border-slate-100 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-medium text-slate-700">Search & Filter</h3>
            <span className="text-xs text-slate-500">({filteredResources.length} resources)</span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
              Clear Filters
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, description, tags"
              className="w-full outline-none border border-slate-300 rounded-lg px-3 py-2 bg-white"
            />
          </div>
          <div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg bg-white">
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">Apply</button>
          </div>
        </form>
      </div>
      {libraryLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading library...</p>
        </div>
      ) : !library ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <Library className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Library resources not available</p>
        </div>
      ) : (
        <div>
          {/* Library Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
              <p className="text-sm text-slate-600 mb-1">Available Resources</p>
              <p className="text-2xl font-bold text-blue-600">{library.availableResources?.length || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
              <p className="text-sm text-slate-600 mb-1">Categories</p>
              <p className="text-2xl font-bold text-green-600">{categories.length - 1}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
              <p className="text-sm text-slate-600 mb-1">Free Access</p>
              <p className="text-2xl font-bold text-purple-600">24/7</p>
            </div>
          </div>

          {/* Available Resources */}
          {filteredResources.length > 0 ? (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Available Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedResources.map((resource) => (
                  <div key={resource._id} className="bg-white rounded-lg shadow-md p-4 border border-slate-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-10 h-10 text-blue-600 shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{resource.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{resource.author}</p>
                        {resource.category && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {resource.category}
                          </span>
                        )}
                        {resource.available !== undefined && (
                          <p className="text-xs text-slate-500 mt-2">
                            {resource.available} available
                          </p>
                        )}
                      </div>
                    </div>
                    {resource.downloadUrl && (
                      <a
                        href={resource.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                  <div className="text-sm text-slate-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredResources.length)} of {filteredResources.length} resources
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
                                  ? 'bg-blue-600 text-white'
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
          ) : (
            <div className="text-center py-12 text-slate-600">
              No resources match your search criteria
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentLibrary;
