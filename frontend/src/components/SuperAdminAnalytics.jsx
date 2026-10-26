import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { superAdminAPI } from '../services/api';
import {
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';

const SuperAdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [revenueTrends, setRevenueTrends] = useState(null);
  const [subscriptionsList, setSubscriptionsList] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  // Colors for charts
  const chartColors = {
    trial: '#8B5CF6',
    basic: '#3B82F6',
    premium: '#10B981',
    enterprise: '#F59E0B'
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchRevenueTrends();
  }, [selectedMonths]);

  useEffect(() => {
    fetchSubscriptionsList();
  }, [currentPage, filterStatus, filterPlan]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getSubscriptionAnalytics();
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchRevenueTrends = async () => {
    try {
      const response = await superAdminAPI.getRevenueTrends(selectedMonths);
      setRevenueTrends(response.data.data.trends);
    } catch (error) {
      console.error('Error fetching revenue trends:', error);
    }
  };

  const fetchSubscriptionsList = async () => {
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        paymentStatus: filterStatus,
        plan: filterPlan
      };
      const response = await superAdminAPI.getSubscriptionsList(params);
      setSubscriptionsList(response.data.data);
    } catch (error) {
      console.error('Error fetching subscriptions list:', error);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchAnalytics();
  };

  if (loading && !analytics) {
    return <div className="flex justify-center items-center h-screen">Loading Analytics...</div>;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscription Analytics</h1>
          <p className="text-slate-600 mt-1">Monitor your SaaS subscription metrics and revenue</p>
        </div>
        <button
          onClick={handleRefresh}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* MRR Card */}
        <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Monthly Recurring Revenue</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                ₹{analytics?.metrics?.totalMRR?.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-blue-500 rounded-lg p-3">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* ARR Card */}
        <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Annual Recurring Revenue</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                ₹{analytics?.metrics?.totalARR?.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-green-500 rounded-lg p-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Active Subscriptions</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {analytics?.metrics?.activeSubscriptions || 0}
              </p>
              <p className="text-sm text-purple-700 mt-1">
                of {analytics?.metrics?.totalSchools || 0} schools
              </p>
            </div>
            <div className="bg-purple-500 rounded-lg p-3">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Overdue Payments */}
        <div className="bg-linear-to-br from-red-50 to-red-100 rounded-xl shadow-md p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Overdue Payments</p>
              <p className="text-3xl font-bold text-red-900 mt-2">
                {analytics?.metrics?.overduPayments || 0}
              </p>
              <p className="text-sm text-red-700 mt-1">Schools</p>
            </div>
            <div className="bg-red-500 rounded-lg p-3">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Plan Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(analytics?.planBreakdown || {}).map(([plan, data]) => ({
                  name: plan.charAt(0).toUpperCase() + plan.slice(1),
                  value: data.count
                }))}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {Object.keys(analytics?.planBreakdown || {}).map((plan) => (
                  <Cell key={`cell-${plan}`} fill={chartColors[plan]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          {/* Plan Stats */}
          <div className="mt-6 space-y-3">
            {Object.entries(analytics?.planBreakdown || {}).map(([plan, data]) => (
              <div key={plan} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: chartColors[plan] }}
                  ></div>
                  <span className="text-sm font-medium text-slate-700 capitalize">{plan}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{data.count}</p>
                  <p className="text-xs text-slate-600">
                    ₹{data.revenue.toLocaleString('en-IN')}/mo
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Trends */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Revenue Trends</h2>
            <div className="flex space-x-2">
              {[3, 6, 12].map((months) => (
                <button
                  key={months}
                  onClick={() => setSelectedMonths(months)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    selectedMonths === months
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {months}M
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: '#ef4444', r: 5 }}
                activeDot={{ r: 7 }}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="subscriptions"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ fill: '#06b6d4', r: 5 }}
                activeDot={{ r: 7 }}
                yAxisId="right"
                name="Subscriptions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Subscription Details</h2>
          <button className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Payment Status</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filterPlan}
            onChange={(e) => {
              setFilterPlan(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Plans</option>
            <option value="trial">Trial</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">School Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Plan</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Student Count</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Monthly Revenue</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Next Payment</th>
              </tr>
            </thead>
            <tbody>
              {subscriptionsList?.subscriptions?.map((subscription) => (
                <tr key={subscription._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{subscription.name}</p>
                      <p className="text-sm text-slate-600">{subscription.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: chartColors[subscription.plan] + '20',
                        color: chartColors[subscription.plan]
                      }}
                    >
                      {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900">
                      {subscription.currentStudents}/{subscription.maxStudents}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">
                      ₹{subscription.monthlyRevenue.toLocaleString('en-IN')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        subscription.paymentStatus === 'active'
                          ? 'bg-green-100 text-green-800'
                          : subscription.paymentStatus === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : subscription.paymentStatus === 'failed'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {subscription.paymentStatus.charAt(0).toUpperCase() +
                        subscription.paymentStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {subscription.nextPaymentDate
                      ? new Date(subscription.nextPaymentDate).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {subscriptionsList?.pagination && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, subscriptionsList.pagination.total)} of{' '}
              {subscriptionsList.pagination.total} subscriptions
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              {[...Array(subscriptionsList.pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    currentPage === i + 1
                      ? 'bg-red-600 text-white'
                      : 'border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage(Math.min(subscriptionsList.pagination.pages, currentPage + 1))
                }
                disabled={currentPage === subscriptionsList.pagination.pages}
                className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;
