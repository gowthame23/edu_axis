import React, { useEffect, useState } from 'react';
import { Calendar, FileText, Download, Eye, X } from 'lucide-react';
import { studentAPI } from '../../services/api';
import { resolveAssetUrl } from '../../config/runtime';

export default function StudentTimetable() {
  const [loading, setLoading] = useState(false);
  const [timetable, setTimetable] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await studentAPI.getTimetable();
        setTimetable(res.data.timetable);
      } catch (e) {
        console.error('Failed to load timetable', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleViewTimetable = () => {
    setShowViewer(true);
  };

  const handleDownload = () => {
    if (timetable?.file?.path) {
      window.open(resolveAssetUrl(timetable.file.path), '_blank');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Calendar className="w-7 h-7"/> My Timetable
      </h1>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-4">Loading timetable...</p>
        </div>
      ) : !timetable ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-100">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No timetable uploaded yet for your class</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-100">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-3">Class Timetable</h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="font-medium">Grade:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {timetable.grade}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="font-medium">Section:</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {timetable.section}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="font-medium">Academic Year:</span>
                    <span className="text-slate-600">{timetable.academicYear}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="font-medium">Semester:</span>
                    <span className="text-slate-600">{timetable.semester}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            {timetable.file?.filename && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">File:</p>
                <p className="text-slate-900 font-medium">{timetable.file.filename}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Size: {(timetable.file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleViewTimetable}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Eye className="w-5 h-5"/> View Timetable
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-5 h-5"/> Download
              </button>
            </div>
          </div>

          {/* Fullscreen Viewer Modal */}
          {showViewer && (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Class Timetable</h3>
                  <button
                    onClick={() => setShowViewer(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {timetable.file?.mimetype?.includes('pdf') ? (
                    <iframe
                      src={resolveAssetUrl(timetable.file.path)}
                      className="w-full h-full border-0 rounded"
                      title="Timetable PDF"
                    />
                  ) : (
                    <img
                      src={resolveAssetUrl(timetable.file.path)}
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
