import React, { useEffect, useState } from 'react';
import { Calendar, FileText, Eye, Download, X } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { resolveAssetUrl } from '../../config/runtime';

export default function TeacherTimetable() {
  const [loading, setLoading] = useState(false);
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await teacherAPI.getTimetable();
        setTimetables(res.data.timetables || []);
      } catch (e) {
        console.error('Failed to load teacher timetable', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleViewTimetable = (tt) => {
    setSelectedTimetable(tt);
  };

  const handleDownload = (tt) => {
    if (tt?.file?.path) {
      window.open(resolveAssetUrl(tt.file.path), '_blank');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Calendar className="w-7 h-7"/> My Timetables
      </h1>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading timetables...</p>
        </div>
      ) : timetables.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No timetables found for classes you teach</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {timetables.map((tt) => (
              <div key={tt._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">
                    Grade {tt.grade} - Section {tt.section}
                  </h3>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Academic Year:</span> {tt.academicYear}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Semester:</span> {tt.semester}
                  </p>
                  {tt.file?.filename && (
                    <p className="text-xs text-slate-500 mt-2 truncate" title={tt.file.filename}>
                      {tt.file.filename}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewTimetable(tt)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    <Eye className="w-4 h-4"/> View
                  </button>
                  <button
                    onClick={() => handleDownload(tt)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    <Download className="w-4 h-4"/> Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Fullscreen Viewer Modal */}
          {selectedTimetable && (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Timetable - Grade {selectedTimetable.grade} Section {selectedTimetable.section}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {selectedTimetable.academicYear} | Semester {selectedTimetable.semester}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTimetable(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {selectedTimetable.file?.mimetype?.includes('pdf') ? (
                    <iframe
                      src={resolveAssetUrl(selectedTimetable.file.path)}
                      className="w-full h-full border-0 rounded"
                      title="Timetable PDF"
                    />
                  ) : (
                    <img
                      src={resolveAssetUrl(selectedTimetable.file.path)}
                      alt="Timetable"
                      className="max-w-full h-auto mx-auto"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
