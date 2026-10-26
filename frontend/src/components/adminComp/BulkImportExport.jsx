import { useState } from 'react';
import { Upload, Download, FileText } from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function BulkImportExport({ showNotification }) {
  const [importFile, setImportFile] = useState(null);
  const [importType, setImportType] = useState('students');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setImportFile(file);
    } else {
      showNotification('Please select a CSV file', 'error');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      showNotification('Please select a file', 'error');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('type', importType);

      const response = await adminAPI.bulkImportCSV(formData);
      const summary = response?.data?.summary;
      const created = summary?.created ?? 0;
      const skipped = summary?.skipped ?? 0;
      showNotification(`Import completed: ${created} created, ${skipped} skipped`, 'success');
      setImportFile(null);
    } catch (err) {
      console.error('Import error:', err);
      showNotification(err?.response?.data?.message || 'Failed to import data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (dataType) => {
    try {
      setLoading(true);
      
      // Export based on type
      const response = await adminAPI.exportPayments({ format: 'csv', type: dataType });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification('Data exported successfully!', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showNotification('Failed to export data', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Import */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
          <Upload className="w-5 h-5 text-blue-600" />
          <span>Bulk Import</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Import Type</label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="students">Students</option>
              <option value="teachers">Teachers</option>
              <option value="courses">Courses</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">
                {importFile ? importFile.name : 'Click to select CSV file or drag and drop'}
              </p>
            </label>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>CSV Format:</strong>{' '}
              {importType === 'courses'
                ? 'name, code, grade are required. Optional: description, teacher, teacherEmail, credits, semester'
                : importType === 'students'
                  ? 'name, email, grade are required. Optional: phone, password, dateOfBirth'
                  : 'name, email are required. Optional: phone, password, subject, gradesTeaching (use | separator)'}
            </p>
          </div>

          <button
            onClick={handleImport}
            disabled={!importFile || loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
          <Download className="w-5 h-5 text-green-600" />
          <span>Export Data</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Students', value: 'students' },
            { label: 'Teachers', value: 'teachers' },
            { label: 'Payments', value: 'payments' },
            { label: 'Courses', value: 'courses' }
          ].map(item => (
            <button
              key={item.value}
              onClick={() => handleExport(item.value)}
              disabled={loading}
              className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              <FileText className="w-4 h-4 inline mr-1" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
