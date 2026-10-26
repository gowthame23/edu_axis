import React, { useState, useEffect, useRef } from 'react';
import { teacherAPI } from '../../services/api';

export default function CreateAssignmentForm({ courses, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', courseId: '', dueDate: '', totalMarks: 100 });
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!form.courseId && courses && courses.length > 0) {
      setForm((f) => ({ ...f, courseId: courses[0]._id }));
    }
  }, [courses, form.courseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'totalMarks' ? Number(value) : value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAttachmentFiles(prev => [...prev, ...files]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.courseId || !form.dueDate) {
      setMessage({ type: 'error', text: 'Title, Course and Due Date are required.' });
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('courseId', form.courseId);
      formData.append('dueDate', form.dueDate);
      formData.append('totalMarks', form.totalMarks);
      attachmentFiles.forEach((file) => formData.append('attachments', file));
      await teacherAPI.createAssignment(formData);
      setMessage({ type: 'success', text: 'Assignment created successfully.' });
      setForm({ title: '', description: '', courseId: courses?.[0]?._id || '', dueDate: '', totalMarks: 100 });
      setAttachmentFiles([]);
      window.dispatchEvent(new CustomEvent('assignment-created'));
      onCreated && onCreated();
    } catch (err) {
      console.error('Create assignment failed', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create assignment' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`px-3 py-2 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
        <select name="courseId" value={form.courseId} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
          {courses?.length ? courses.map(c => <option key={c._id} value={c._id}>{c.name} • Grade {c.grade}</option>) : <option value="">No courses</option>}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input name="title" value={form.title} onChange={handleChange} maxLength={15} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g., Unit 1 Worksheet" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Brief instructions" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
          <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Total Marks</label>
          <input type="number" min={1} max={1000} name="totalMarks" value={form.totalMarks} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Attachments (optional)</label>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.zip" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          {attachmentFiles.length > 0 && <span className="text-sm text-slate-600 whitespace-nowrap">{attachmentFiles.length} file(s)</span>}
        </div>
        {attachmentFiles.length > 0 && (
          <ul className="text-sm text-slate-700 space-y-1">
            {attachmentFiles.map((file, idx) => (
              <li key={idx} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded">
                <span className="truncate mr-2">{file.name} <span className="text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span></span>
                <button type="button" className="text-red-600 hover:text-red-800 text-xs font-medium" onClick={() => removeFile(idx)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-slate-500">Accepted: PDF, Word, PowerPoint, Excel, Images, Text, ZIP (Max 10MB per file)</p>
      </div>
      <button disabled={submitting} className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg font-medium">
        {submitting ? 'Creating…' : 'Create Assignment'}
      </button>
    </form>
  );
}
