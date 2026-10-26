import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { adminAPI } from '../../services/api';
import io from 'socket.io-client';
import { getSocketBaseUrl } from '../../config/runtime';

export default function FinancialAnalytics({ showNotification }) {
  const [paymentData, setPaymentData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch payment stats and trends in parallel
      const [statsRes, trendsRes] = await Promise.all([
        adminAPI.getPaymentStats(),
        adminAPI.getPaymentTrends(6)
      ]);
      
      setPaymentData(statsRes.data.data);
      setTrendData(trendsRes.data.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching financial data:', err);
      showNotification('Failed to load financial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();

    // Connect to socket for real-time updates
    const socket = io(getSocketBaseUrl(), { withCredentials: true });

    socket.on('connect', () => {
      console.log('Financial analytics connected to socket');
    });

    // Listen for payment events
    socket.on('payment:created', (data) => {
      console.log('Payment received via socket:', data);
      // Refresh financial data when a new payment is made
      fetchFinancialData();
      if (data.payment) {
        showNotification(`New payment received: ₹${data.payment.amount.toLocaleString()} from ${data.payment.studentName}`, 'success');
      }
    });

    socket.on('disconnect', () => {
      console.log('Financial analytics socket disconnected');
    });

    // Cleanup on unmount
    return () => {
      socket.off('payment:created');
      socket.off('connect');
      socket.off('disconnect');
      socket.close();
    };
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading financial data...</div>;
  }

  const collectionRate = paymentData && paymentData.expectedAmount > 0
    ? ((paymentData.totalAmount / paymentData.expectedAmount) * 100).toFixed(1)
    : 0;

  const outstandingFees = paymentData?.outstandingAmount || 0;

  const outstandingPercentage = paymentData && paymentData.expectedAmount > 0
    ? ((outstandingFees / paymentData.expectedAmount) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with last updated time and refresh button */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-md">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Analytics</h2>
          {lastUpdated && (
            <p className="text-sm text-slate-600 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchFinancialData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-linear-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <p className="text-green-700 text-sm font-medium">Total Collected</p>
          <p className="text-3xl font-bold text-green-900 mt-1">
            ₹{(paymentData?.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-green-700 mt-2">{collectionRate}% collection rate</p>
        </div>

        <div className="bg-linear-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <p className="text-orange-700 text-sm font-medium">Outstanding</p>
          <p className="text-3xl font-bold text-orange-900 mt-1">
            ₹{(outstandingFees).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-orange-700 mt-2">{outstandingPercentage}% pending</p>
        </div>

        <div className="bg-linear-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <p className="text-blue-700 text-sm font-medium">Completed Payments</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{paymentData?.completed || 0}</p>
          <p className="text-sm text-blue-700 mt-2">of {paymentData?.total || 0} expected</p>
        </div>

        <div className="bg-linear-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <p className="text-purple-700 text-sm font-medium">Avg Collection</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">
            ₹{((paymentData?.totalAmount || 0) / Math.max(1, paymentData?.completed || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-purple-700 mt-2">per payment</p>
        </div>
      </div>

      {/* Collection Trend */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Collection Trend</span>
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
            <Legend />
            <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} name="Collected" />
            <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Methods */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-semibold text-slate-900 mb-4">Payment Methods Distribution</h3>
        <div className="space-y-3">
          {paymentData?.byMethod && paymentData.byMethod.length > 0 ? (
            paymentData.byMethod.map(pm => {
              const percentage = paymentData.completed > 0 
                ? ((pm.count / paymentData.completed) * 100).toFixed(1)
                : 0;
              return (
                <div key={pm._id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {pm._id} ({pm.count} payments)
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {percentage}% • ₹{pm.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-slate-500 text-center py-4">No payment data available</p>
          )}
        </div>
      </div>

    </div>
  );
}
