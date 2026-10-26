import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Upload, Trash2, Eye, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { resolveAssetUrl } from '../../config/runtime';

const sections = ['All','A','B','C','D','E'];
const semesters = ['Fall','Spring','Summer'];

export default function AdminTimetableManagement({ showNotification }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Filters
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterActive, setFilterActive] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [form, setForm] = useState({
    grade: '1',
    section: 'All',
    academicYear: '2025-2026',
    semester: 'Fall',
    effectiveFrom: new Date().toISOString().slice(0,10),
    effectiveTo: '',
    isActive: true
  });
  const [file, setFile] = useState(null);
  const today = new Date().toISOString().slice(0,10);

  // Filtered and paginated items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filterGrade && item.grade !== filterGrade) return false;
      if (filterSection && item.section !== filterSection) return false;
      if (filterActive === 'active' && !item.isActive) return false;
      if (filterActive === 'inactive' && item.isActive) return false;
      return true;
    });
  }, [items, filterGrade, filterSection, filterActive]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterGrade, filterSection, filterActive]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getTimetables();
      setItems(res.data.timetables || []);
    } catch (e) {
      console.error('Failed to load timetables', e);
      showNotification?.('Failed to load timetables', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const upload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('grade', form.grade);
      fd.append('section', form.section);
      fd.append('academicYear', form.academicYear);
      fd.append('semester', form.semester);
      fd.append('effectiveFrom', form.effectiveFrom);
      if (form.effectiveTo) fd.append('effectiveTo', form.effectiveTo);
      fd.append('isActive', String(form.isActive));
      await adminAPI.saveTimetable(fd);
      showNotification?.('Timetable uploaded', 'success');
      setFile(null);
      await load();
    } catch (e) {
      console.error('Upload failed', e);
      showNotification?.(e.response?.data?.message || 'Upload failed', 'error');
    } finally { setUploading(false); }
  };

  const deleteTimetable = async (id) => {
    if (!confirm('Delete this timetable?')) return;
    try {
      await adminAPI.deleteTimetable(id);
      showNotification?.('Deleted', 'success');
      await load();
    } catch (e) {
      console.error('Delete failed', e);
      showNotification?.('Delete failed', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2"><Calendar className="w-7 h-7"/> Timetable Management</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Upload Timetable</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
            <select value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2">
              {Array.from({length:12},(_,i)=>String(i+1)).map(g=> <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
            <select value={form.section} onChange={e=>setForm({...form, section:e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2">
              {sections.map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
            <input value={form.academicYear} onChange={e=>setForm({...form, academicYear:e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
            <select value={form.semester} onChange={e=>setForm({...form, semester:e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2">
              {semesters.map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Effective From</label>
            <input type="date" min={today} value={form.effectiveFrom} onChange={e=>setForm({...form, effectiveFrom:e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Effective To (optional)</label>
            <input type="date" min={form.effectiveFrom || today} value={form.effectiveTo} onChange={e=>setForm({...form, effectiveTo:e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2"/>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="active" type="checkbox" checked={form.isActive} onChange={e=>setForm({...form, isActive:e.target.checked})}/>
            <label htmlFor="active" className="text-sm text-slate-700">Active</label>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"><Upload className="w-4 h-4"/> Timetable File (PDF/Image)</label>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e)=>setFile(e.target.files?.[0]||null)} className="w-full border border-slate-300 rounded px-3 py-2"/>
          {file && <p className="text-xs text-slate-600 mt-1">Selected: {file.name}</p>}
        </div>

        <button disabled={!file || uploading} onClick={upload} className={`px-4 py-2 rounded text-white font-medium ${(!file||uploading)?'bg-slate-400':'bg-blue-600 hover:bg-blue-700'}`}>{uploading? 'Uploading...':'Upload Timetable'}</button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Existing Timetables</h2>
          <span className="text-sm text-slate-600">{filteredItems.length} total</span>
        </div>

        {/* Filters */}
        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-medium text-slate-700">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Grade</label>
              <select value={filterGrade} onChange={e=>setFilterGrade(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                <option value="">All Grades</option>
                {Array.from({length:12},(_,i)=>String(i+1)).map(g=> <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Section</label>
              <select value={filterSection} onChange={e=>setFilterSection(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                <option value="">All Sections</option>
                {sections.map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select value={filterActive} onChange={e=>setFilterActive(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-600">Loading...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-slate-500">No timetables found matching filters.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 text-left">Grade</th>
                    <th className="p-2 text-left">Section</th>
                    <th className="p-2 text-left">Year</th>
                    <th className="p-2 text-left">Semester</th>
                    <th className="p-2 text-left">Active</th>
                    <th className="p-2 text-left">File</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((tt) => (
                    <tr key={tt._id} className="border-t hover:bg-slate-50">
                      <td className="p-2">{tt.grade}</td>
                      <td className="p-2">{tt.section}</td>
                      <td className="p-2">{tt.academicYear}</td>
                      <td className="p-2">{tt.semester}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tt.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {tt.isActive? 'Yes':'No'}
                        </span>
                      </td>
                      <td className="p-2">{tt.file?.filename? <a className="text-blue-600 underline flex items-center gap-1" href={resolveAssetUrl(tt.file.path)} target="_blank" rel="noreferrer"><Eye className="w-3 h-3"/>{tt.file.filename}</a> : '—'}</td>
                      <td className="p-2 text-right">
                        <button onClick={()=>deleteTimetable(tt._id)} className="px-3 py-1 text-white bg-red-600 hover:bg-red-700 rounded flex items-center gap-1 text-xs"><Trash2 className="w-3 h-3"/>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} results
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
      </div>
    </div>
  );
}
