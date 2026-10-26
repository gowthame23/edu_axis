import React, { useMemo, useState } from 'react';
import { IndianRupee, X } from 'lucide-react';

const StudentFees = ({ 
  fees, 
  feesLoading, 
  payments,
  feeSummary,
  showPaymentForm,
  setShowPaymentForm,
  selectedFee,
  setSelectedFee,
  paymentFormData,
  setPaymentFormData,
  handlePaymentSubmit,
  handleDownloadReceipt
}) => {
  const [feeSearch, setFeeSearch] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState('all');
  const [feePage, setFeePage] = useState(1);
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);

  const FEES_PER_PAGE = 6;
  const HISTORY_PER_PAGE = 8;

  const getFeePaymentStatus = (fee) => {
    const isPaid = payments.some((p) => String(p.feeId) === String(fee._id) && p.status === 'completed');
    const isOverdue = new Date(fee.dueDate) < new Date() && !isPaid;
    if (isPaid) return 'paid';
    if (isOverdue) return 'overdue';
    return 'pending';
  };

  const filteredFees = useMemo(() => {
    return fees.filter((fee) => {
      const status = getFeePaymentStatus(fee);
      const search = feeSearch.trim().toLowerCase();
      const matchesSearch = !search
        || String(fee.title || '').toLowerCase().includes(search)
        || String(fee.description || '').toLowerCase().includes(search);
      const matchesStatus = feeStatusFilter === 'all' || status === feeStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [fees, payments, feeSearch, feeStatusFilter]);

  const totalFeePages = Math.max(1, Math.ceil(filteredFees.length / FEES_PER_PAGE));
  const currentFeePage = Math.min(feePage, totalFeePages);
  const paginatedFees = filteredFees.slice((currentFeePage - 1) * FEES_PER_PAGE, currentFeePage * FEES_PER_PAGE);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      return historyStatusFilter === 'all' || payment.status === historyStatusFilter;
    });
  }, [payments, historyStatusFilter]);

  const totalHistoryPages = Math.max(1, Math.ceil(filteredPayments.length / HISTORY_PER_PAGE));
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);
  const paginatedPayments = filteredPayments.slice(
    (currentHistoryPage - 1) * HISTORY_PER_PAGE,
    currentHistoryPage * HISTORY_PER_PAGE
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Fee Management</h1>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
          <p className="text-sm text-slate-600 mb-1">Total Fees</p>
          <p className="text-2xl font-bold text-slate-900">₹{feeSummary.totalFees?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
          <p className="text-sm text-slate-600 mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-600">₹{feeSummary.totalPaid?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
          <p className="text-sm text-slate-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-orange-600">₹{feeSummary.pending?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
          <p className="text-sm text-slate-600 mb-1">Late Fee</p>
          <p className="text-2xl font-bold text-orange-600">₹{feeSummary.lateFee?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
          <p className="text-sm text-slate-600 mb-1">Total Due</p>
          <p className="text-2xl font-bold text-blue-600">₹{feeSummary.totalDue?.toLocaleString() || 0}</p>
        </div>
      </div>
      
      {/* Active Fees */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-slate-900">Active Fees</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={feeSearch}
              onChange={(e) => {
                setFeeSearch(e.target.value);
                setFeePage(1);
              }}
              placeholder="Search fee title..."
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <select
              value={feeStatusFilter}
              onChange={(e) => {
                setFeeStatusFilter(e.target.value);
                setFeePage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
        {feesLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-slate-600 mt-2">Loading fees...</p>
          </div>
        ) : filteredFees.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center border border-slate-100">
            <IndianRupee className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No fees match current filters</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedFees.map((fee) => {
              const isPaid = payments.some(p => String(p.feeId) === String(fee._id) && p.status === 'completed');
              const isOverdue = new Date(fee.dueDate) < new Date() && !isPaid;
              
              return (
                <div key={fee._id} className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{fee.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{fee.description}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      isPaid 
                        ? 'bg-green-100 text-green-700' 
                        : isOverdue 
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Amount:</span>
                      <span className="font-bold text-slate-900">₹{fee.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Due Date:</span>
                      <span className="font-medium text-slate-900">
                        {new Date(fee.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    {fee.semester && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Semester:</span>
                        <span className="font-medium text-slate-900">{fee.semester}</span>
                      </div>
                    )}
                  </div>

                  {!isPaid && (
                    <button
                      onClick={() => {
                        setSelectedFee(fee);
                        setShowPaymentForm(true);
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {totalFeePages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setFeePage((prev) => Math.max(1, prev - 1))}
                disabled={currentFeePage === 1}
                className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-slate-600">Page {currentFeePage} / {totalFeePages}</span>
              <button
                onClick={() => setFeePage((prev) => Math.min(totalFeePages, prev + 1))}
                disabled={currentFeePage === totalFeePages}
                className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
          </>
        )}
      </div>

      {/* Payment History */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-slate-900">Payment History</h2>
          <select
            value={historyStatusFilter}
            onChange={(e) => {
              setHistoryStatusFilter(e.target.value);
              setHistoryPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        {filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center border border-slate-100">
            <p className="text-slate-600">No payment history</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Receipt #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {payment.receiptNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {payment.feeTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                        ₹{payment.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          payment.status === 'completed' 
                            ? 'bg-green-100 text-green-700'
                            : payment.status === 'pending'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDownloadReceipt(payment._id)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalHistoryPages > 1 && (
              <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200">
                <button
                  onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentHistoryPage === 1}
                  className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-600">Page {currentHistoryPage} / {totalHistoryPages}</span>
                <button
                  onClick={() => setHistoryPage((prev) => Math.min(totalHistoryPages, prev + 1))}
                  disabled={currentHistoryPage === totalHistoryPages}
                  className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedFee && (() => {
        // Calculate late fee
        const now = new Date();
        const dueDate = new Date(selectedFee.dueDate);
        let lateFee = 0;
        let daysLate = 0;
        
        if (now > dueDate) {
          daysLate = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
          lateFee = daysLate * 10; // ₹10 per day
        }
        
        const totalAmount = selectedFee.amount + lateFee;
        
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Make Payment</h2>
                  <button
                    onClick={() => {
                      setShowPaymentForm(false);
                      setSelectedFee(null);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-bold text-slate-900 mb-3">{selectedFee.title}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Fee Amount:</span>
                      <span className="font-bold">₹{selectedFee.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Due Date:</span>
                      <span className={daysLate > 0 ? 'text-red-600 font-medium' : ''}>
                        {new Date(selectedFee.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    {lateFee > 0 && (
                      <>
                        <div className="flex justify-between text-red-600">
                          <span>Late Fee ({daysLate} days × ₹10):</span>
                          <span className="font-bold">₹{lateFee?.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-slate-300 flex justify-between">
                          <span className="text-slate-900 font-bold">Total Amount:</span>
                          <span className="font-bold text-blue-600 text-lg">₹{totalAmount?.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({...paymentFormData, paymentMethod: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online Payment">Online Payment</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.transactionId}
                    onChange={(e) => setPaymentFormData({...paymentFormData, transactionId: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter transaction ID if applicable"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={paymentFormData.remarks}
                    onChange={(e) => setPaymentFormData({...paymentFormData, remarks: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Any additional notes"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setSelectedFee(null);
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={feesLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {feesLoading ? 'Processing...' : 'Submit Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};

export default StudentFees;
