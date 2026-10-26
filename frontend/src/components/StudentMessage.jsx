import { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import { Send, User } from 'lucide-react';
import axios from 'axios';
import { getApiBaseUrl } from '../config/runtime';

export default function StudentMessage({ user, socket, onClose }) {
  const [teachers, setTeachers] = useState([]);
  const [recipientId, setRecipientId] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch teachers list
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const res = await axios.get(`${getApiBaseUrl()}/student/teachers`, {
          withCredentials: true
        });
        if (res.data.success) {
          setTeachers(res.data.data || []);
          // Auto-select first teacher if available
          if (res.data.data && res.data.data.length > 0) {
            setRecipientId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch teachers', err);
        // If endpoint doesn't exist, show manual input
        setTeachers([]);
      } finally {
        setLoadingTeachers(false);
      }
    };
    fetchTeachers();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipientId || !text.trim()) {
      alert('Please select a teacher and enter a message');
      return;
    }

    try {
      setLoading(true);
      const res = await studentAPI.sendMessage({ recipientId, text });
      if (res.data.success) {
        // Optionally, notify via socket as well
        if (socket && socket.emit) {
          socket.emit('message:create', { recipientId, text });
        }
        setText('');
        setSuccessMessage('Message sent successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          if (onClose) onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Send message failed', err);
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Send className="w-6 h-6 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Message Teacher</h2>
        <p className="text-sm text-slate-600">Send a message to your teacher</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Teacher
          </label>
          {loadingTeachers ? (
            <div className="text-center py-4 text-slate-500">Loading teachers...</div>
          ) : teachers.length > 0 ? (
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name} - {teacher.subject || 'Teacher'}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter teacher ID"
              required
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Your Message
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="Type your message here..."
            rows={5}
            required
          />
          <p className="text-xs text-slate-500 mt-1">{text.length} characters</p>
        </div>

        <div className="flex gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !text.trim() || !recipientId}
            className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
