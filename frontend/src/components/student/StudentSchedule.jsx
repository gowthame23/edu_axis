import { useEffect, useMemo, useState } from 'react';
import { studentAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function StudentSchedule() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    setLoading(true);
    studentAPI.getSchedule()
      .then(res => setEntries(res.data.entries || []))
      .catch(e => { console.error('Failed to load schedule', e); setEntries([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      // Refresh only if schedule targets this student's grade/course; we simply refetch
      studentAPI.getSchedule()
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Weekly Schedule</h2>
        {loading ? (
          <div className="text-slate-600">Loading schedule...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-slate-700">Day</th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-700">Time</th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-700">Course</th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-700">Room</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => (
                  byDay[day].length === 0 ? (
                    <tr key={day} className="border-t border-slate-200">
                      <td className="p-3 text-sm font-medium text-slate-900 w-32">{day}</td>
                      <td className="p-3 text-slate-500" colSpan={3}>—</td>
                    </tr>
                  ) : (
                    byDay[day].map((e, idx) => (
                      <tr key={e._id} className="border-t border-slate-200">
                        {idx === 0 ? (
                          <td className="p-3 text-sm font-medium text-slate-900 w-32" rowSpan={byDay[day].length}>{day}</td>
                        ) : null}
                        <td className="p-3 text-sm text-slate-900 whitespace-nowrap">{e.startTime} – {e.endTime}</td>
                        <td className="p-3 text-sm text-slate-700">{e.courseId?.name || e.subject}</td>
                        <td className="p-3 text-sm text-slate-700">{e.room ? `Room ${e.room}` : '—'}</td>
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
