import React, { useState, useEffect } from 'react';
import { teacherAPI } from '../../services/api';

export default function CreateAnnouncementForm({ courses }) {
  const [form, setForm] = useState({ courseId: '', title: '', content: '', targetAudience: 'students', priority: 'normal' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!form.courseId && courses && courses.length > 0) {
      setForm(f => ({ ...f, courseId: courses[0]._id }));
    }
  }, [courses, form.courseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content || !form.courseId) {
      setMessage({ type: 'error', text: 'Course, title and content are required.' });
      return;
    }
    if (form.content.length < 10) {
      setMessage({ type: 'error', text: 'Content must be at least 10 characters long.' });
      return;
    }
    try {
      setSubmitting(true);
      await teacherAPI.postAnnouncement({
        courseId: form.courseId,
        title: form.title,
        content: form.content,
        targetAudience: form.targetAudience,
        priority: form.priority
      });
      setMessage({ type: 'success', text: 'Announcement posted successfully!' });
      setForm({ courseId: courses?.[0]?._id || '', title: '', content: '', targetAudience: 'students', priority: 'normal' });
      window.dispatchEvent(new CustomEvent('announcement-created'));
    } catch (err) {
      console.error('Post announcement failed', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to post announcement' });
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
        <select name="courseId" value={form.courseId} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" required>
          {courses?.length ? courses.map(c => <option key={c._id} value={c._id}>{c.name} • Grade {c.grade}</option>) : <option value="">No courses</option>}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input name="title" value={form.title} onChange={handleChange} maxLength={15} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g., Important Notice" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Content <span className="text-slate-500 text-xs">(minimum 10 characters)</span></label>
        <textarea name="content" value={form.content} onChange={handleChange} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Write your announcement here..." minLength={10} required />
        {form.content.length > 0 && form.content.length < 10 && (
          <p className="text-xs text-red-600 mt-1">{10 - form.content.length} more character{10 - form.content.length !== 1 ? 's' : ''} required</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
          <select name="targetAudience" value={form.targetAudience} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none">
            <option value="students">Students</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <select name="priority" value={form.priority} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
      <button disabled={submitting} className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-lg font-medium">
        {submitting ? 'Posting…' : 'Post Announcement'}
      </button>
    </form>
  );
}
