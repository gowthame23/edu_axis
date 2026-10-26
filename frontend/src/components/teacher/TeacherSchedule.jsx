import { useEffect, useMemo, useState } from 'react';
import { teacherAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function TeacherSchedule({ teacherCourses = [] }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ courseId: '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', room: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const socket = useSocket();

  useEffect(() => {
    setLoading(true);
    teacherAPI.getSchedule()
      .then(res => setEntries(res.data.entries || []))
      .catch(e => { console.error('Failed to load schedule', e); setEntries([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      teacherAPI.getSchedule()
        .then(res => setEntries(res.data.entries || []))
        .catch(e => console.error('Failed to refresh schedule', e));
    };
    socket.on('scheduleUpdated', handler);
    return () => socket.off('scheduleUpdated', handler);
  }, [socket]);

  const byDay = useMemo(() => {
    const map = Object.fromEntries(DAYS.map(d => [d, []]));
    entries.forEach(e => { if (map[e.dayOfWeek]) map[e.dayOfWeek].push(e); });
    Object.values(map).forEach(list => list.sort((a,b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [entries]);

  // Compute dates for current week (Mon-Sat)
  const weekDates = useMemo(() => {
    const today = new Date();
    // get Monday of current week
    const day = today.getDay(); // 0=Sun,1=Mon
    const diffToMonday = (day === 0 ? -6 : 1 - day); // if Sunday, go back 6
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const options = { month: 'short', day: 'numeric' };
    const out = {};
    DAYS.forEach((d, idx) => {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + idx);
      out[d] = dt.toLocaleDateString(undefined, options);
    });
    return out;
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      if (!form.courseId) { setError('Please select a course'); return; }
      const course = teacherCourses.find(c => c._id === form.courseId);
      const payload = {
        courseId: form.courseId,
        grade: String(course?.grade || ''),
        subject: course?.name || 'Subject',
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room
      };
      const res = await teacherAPI.createSchedule(payload);
      setEntries(prev => [...prev, res.data.entry]);
      setSuccess('Class scheduled');
    } catch (e) {
      console.error('Schedule create failed', e);
      setError(e.response?.data?.message || e.message);
    }
  };

  const onDelete = async (id) => {
    if (!id) return;
    const ok = window.confirm('Remove this scheduled class?');
    if (!ok) return;
    try {
      await teacherAPI.deleteSchedule(id);
      setEntries(prev => prev.filter(x => x._id !== id));
      setSuccess('Class removed');
    } catch (e) {
      console.error('Delete schedule failed', e);
      setError(e.response?.data?.message || e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Schedule a Class</h2>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        {success && <div className="mb-3 text-sm text-green-600">{success}</div>}
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select value={form.courseId} onChange={(e)=>setForm(f=>({...f, courseId: e.target.value}))} className="px-3 py-2 border border-slate-300 rounded-lg">
            <option value="">Select course</option>
            {teacherCourses && teacherCourses.length > 0 ? (
              teacherCourses.map(c => (
                <option key={c._id} value={c._id}>{c.name} • Grade {c.grade}</option>
              ))
            ) : (
              <option value="" disabled>No courses found</option>
            )}
          </select>
          <select value={form.dayOfWeek} onChange={(e)=>setForm(f=>({...f, dayOfWeek: e.target.value}))} className="px-3 py-2 border border-slate-300 rounded-lg">
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="time" value={form.startTime} onChange={(e)=>setForm(f=>({...f, startTime: e.target.value}))} className="px-3 py-2 border border-slate-300 rounded-lg" />
          <input type="time" value={form.endTime} onChange={(e)=>setForm(f=>({...f, endTime: e.target.value}))} className="px-3 py-2 border border-slate-300 rounded-lg" />
          <input type="text" placeholder="Room (optional)" value={form.room} onChange={(e)=>setForm(f=>({...f, room: e.target.value}))} className="px-3 py-2 border border-slate-300 rounded-lg" />
          <div className="md:col-span-5">
            <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">Add</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Weekly Schedule</h2>
        {loading ? (
          <div className="text-slate-600">Loading schedule...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-slate-700">Day (Date)</th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-700">Time</th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-700">Course</th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-700">Teacher</th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-700">Grade</th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-700">Room</th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => (
                  byDay[day].length === 0 ? (
                    <tr key={day} className="border-t border-slate-200">
                      <td className="p-3 text-sm font-medium text-slate-900 w-40">{day} <span className="text-slate-500">({weekDates[day]})</span></td>
                      <td className="p-3 text-slate-500" colSpan={6}>—</td>
                    </tr>
                  ) : (
                    byDay[day].map((e, idx) => (
                      <tr key={e._id} className="border-t border-slate-200">
                        {idx === 0 ? (
                          <td className="p-3 text-sm font-medium text-slate-900 w-40" rowSpan={byDay[day].length}>{day} <span className="text-slate-500">({weekDates[day]})</span></td>
                        ) : null}
                        <td className="p-3 text-sm text-slate-900 whitespace-nowrap">{e.startTime} – {e.endTime}</td>
                        <td className="p-3 text-sm text-slate-700">{e.courseId?.name || e.subject}</td>
                        <td className="p-3 text-sm text-slate-700">{e.teacherId?.name || e.courseId?.teacherId?.name || '—'}</td>
                        <td className="p-3 text-sm text-slate-700">{e.grade}</td>
                        <td className="p-3 text-sm text-slate-700">{e.room ? `Room ${e.room}` : '—'}</td>
                        <td className="p-3 text-sm text-slate-700">
                          {String(e.teacherId?._id || e.teacherId) === String(user?.id || user?._id) ? (
                            <button onClick={() => onDelete(e._id)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded">Delete</button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
