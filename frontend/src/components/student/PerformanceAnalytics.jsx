import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, Award, Target, 
  BookOpen, Calendar, CheckCircle, AlertTriangle,
  BarChart3, Activity, Filter, RefreshCw
} from 'lucide-react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { studentAPI } from '../../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PerformanceAnalytics({ studentId }) {
  const [performance, setPerformance] = useState(null);
  const [trend, setTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [timeRange, setTimeRange] = useState('6months');
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [studentId]);

  useEffect(() => {
    fetchPerformanceData();
  }, [studentId, selectedCourse, timeRange]);

  const fetchCourses = async () => {
    try {
      const response = await studentAPI.getCourses();
      setCourses(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const isRefresh = refreshing;
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const courseId = selectedCourse !== 'all' ? selectedCourse : undefined;
      
      const [perfRes, trendRes, breakdownRes] = await Promise.all([
        studentAPI.getStudentPerformance(studentId, courseId),
        studentAPI.getPerformanceTrend(studentId, courseId),
        studentAPI.getGradeBreakdown(studentId, courseId)
      ]);

      setPerformance(perfRes.data.data);
      setTrend(trendRes.data.data);
      setBreakdown(breakdownRes.data.data);
    } catch (err) {
      console.error('Error fetching performance:', err);
      setError(err.response?.data?.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPerformanceData();
  };

  // Prepare chart data
  const getTrendChartData = () => {
    if (!trend || trend.length === 0) return null;

    return {
      labels: trend.map(t => t.month),
      datasets: [
        {
          label: 'Grade Average',
          data: trend.map(t => t.averageGrade),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'Attendance Rate',
          data: trend.map(t => t.attendanceRate),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
        }
      ]
    };
  };

  const getSubjectChartData = () => {
    if (!performance?.subjectPerformance || performance.subjectPerformance.length === 0) return null;

    return {
      labels: performance.subjectPerformance.map(s => s.subject),
      datasets: [
        {
          label: 'Average Grade',
          data: performance.subjectPerformance.map(s => s.averageGrade),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
        {
          label: 'Attendance Rate',
          data: performance.subjectPerformance.map(s => s.attendanceRate),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1,
        }
      ]
    };
  };

  const getBreakdownChartData = () => {
    if (!breakdown || breakdown.length === 0) return null;

    return {
      labels: breakdown.map(b => b.type.charAt(0).toUpperCase() + b.type.slice(1)),
      datasets: [
        {
          label: 'Average Score',
          data: breakdown.map(b => parseFloat(b.average)),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
        {
          label: 'Highest Score',
          data: breakdown.map(b => parseFloat(b.highest)),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: false,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderDash: [5, 5],
        },
        {
          label: 'Lowest Score',
          data: breakdown.map(b => parseFloat(b.lowest)),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderDash: [5, 5],
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <p className="text-red-900 font-medium">{error}</p>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="bg-slate-50 rounded-xl p-12 text-center">
        <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 text-lg">No performance data available yet</p>
        <p className="text-slate-500 text-sm mt-2">Complete some assignments and attend classes to see your analytics</p>
      </div>
    );
  }

  const riskColors = {
    low: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-600' },
    medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: 'text-yellow-600' },
    high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-600' }
  };

  const trendIcons = {
    improving: <TrendingUp className="w-5 h-5 text-green-600" />,
    declining: <TrendingDown className="w-5 h-5 text-red-600" />,
    stable: <Minus className="w-5 h-5 text-blue-600" />
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      }
    }
  };

  const breakdownLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          font: {
            size: 12
          },
          usePointStyle: true,
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y + '%';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const trendData = getTrendChartData();
  const subjectData = getSubjectChartData();
  const breakdownData = getBreakdownChartData();

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Performance Analytics</h1>
            <p className="text-blue-100">Track your academic progress and performance metrics</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Course Filter */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
              <Filter className="w-4 h-4" />
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none cursor-pointer"
              >
                <option value="all" className="text-slate-900">All Courses</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id} className="text-slate-900">
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-blue-600" />
            {trendIcons[performance.trend]}
          </div>
          <h3 className="text-slate-600 text-sm font-medium">Overall Score</h3>
          <p className={`text-3xl font-bold ${getScoreColor(performance.overallScore)}`}>
            {performance.overallScore}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Based on {performance.totalGrades} grades</p>
        </div>

        {/* Attendance */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <Calendar className="w-8 h-8 text-green-600 mb-2" />
          <h3 className="text-slate-600 text-sm font-medium">Attendance</h3>
          <p className={`text-3xl font-bold ${getScoreColor(performance.attendancePercentage)}`}>
            {performance.attendancePercentage}%
          </p>
          <p className="text-xs text-slate-500 mt-1">{performance.totalAttendance} total records</p>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <CheckCircle className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="text-slate-600 text-sm font-medium">Assignments</h3>
          <p className="text-3xl font-bold text-slate-900">
            {performance.submittedAssignments}/{performance.totalAssignments}
          </p>
          <p className={`text-xs mt-1 ${getScoreColor(performance.avgAssignmentScore)}`}>
            Avg: {performance.avgAssignmentScore}%
          </p>
        </div>

        {/* Risk Status */}
        <div className={`rounded-xl shadow-sm border p-6 ${riskColors[performance.riskLevel].bg} ${riskColors[performance.riskLevel].border}`}>
          <Target className={`w-8 h-8 mb-2 ${riskColors[performance.riskLevel].text}`} />
          <h3 className={`text-sm font-medium ${riskColors[performance.riskLevel].text}`}>Risk Level</h3>
          <p className={`text-3xl font-bold capitalize ${riskColors[performance.riskLevel].text}`}>
            {performance.riskLevel}
          </p>
          <p className={`text-xs mt-1 ${riskColors[performance.riskLevel].text}`}>
            {performance.riskLevel === 'low' && 'Keep up the great work!'}
            {performance.riskLevel === 'medium' && 'Need some improvement'}
            {performance.riskLevel === 'high' && 'Requires immediate attention'}
          </p>
        </div>
      </div>

      {/* Performance Trend Chart */}
      {trendData && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Performance Trend</h3>
              <p className="text-sm text-slate-500">Last 6 months overview</p>
            </div>
            <Activity className="w-6 h-6 text-blue-600" />
          </div>

          <div className="h-80">
            <Line data={trendData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Subject Performance Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance Bar Chart */}
        {subjectData && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Performance by Subject</h3>
                <p className="text-sm text-slate-500">Compare grades and attendance</p>
              </div>
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            
            <div className="h-80">
              <Bar data={subjectData} options={barChartOptions} />
            </div>
          </div>
        )}

        {/* Grade Type Trend Lines Chart */}
        {breakdownData && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Grade Type Performance Trends</h3>
                <p className="text-sm text-slate-500">Average, highest, and lowest scores by assessment type</p>
              </div>
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
            
            <div className="h-80">
              <Line data={breakdownData} options={breakdownLineOptions} />
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="bg-indigo-50 rounded-lg p-2">
                <p className="text-xs text-indigo-600 font-medium">Average Line</p>
                <p className="text-sm text-slate-700">Your overall performance</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-xs text-green-600 font-medium">Highest Line (Dashed)</p>
                <p className="text-sm text-slate-700">Best possible score</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2">
                <p className="text-xs text-red-600 font-medium">Lowest Line (Dashed)</p>
                <p className="text-sm text-slate-700">Minimum score achieved</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Subject Table */}
      {performance.subjectPerformance && performance.subjectPerformance.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Detailed Subject Performance</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Subject</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">Avg Grade</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">Attendance</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">Grades Count</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">Submissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {performance.subjectPerformance.map((subject, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{subject.subject}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${getScoreColor(subject.averageGrade)}`}>
                        {subject.averageGrade}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${getScoreColor(subject.attendanceRate)}`}>
                        {subject.attendanceRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-700">{subject.totalGrades}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-700">{subject.submissions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade Breakdown Details */}
      {breakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Grade Breakdown Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {breakdown.map((item, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-slate-600 capitalize">{item.type}</h4>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded">{item.count} items</span>
                </div>
                <p className={`text-2xl font-bold ${getScoreColor(parseFloat(item.average))} mb-3`}>
                  {item.average}%
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Highest</span>
                    <span className="text-green-600 font-medium">{item.highest}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Lowest</span>
                    <span className="text-red-600 font-medium">{item.lowest}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${
                        parseFloat(item.average) >= 80 ? 'bg-green-500' :
                        parseFloat(item.average) >= 60 ? 'bg-blue-500' :
                        parseFloat(item.average) >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${item.average}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
