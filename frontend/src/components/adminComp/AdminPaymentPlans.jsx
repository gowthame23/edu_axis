import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  Check,
  X,
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Clock
} from 'lucide-react';

const AdminPaymentPlans = () => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    fetchPlansAndSubscription();
  }, []);

  const fetchPlansAndSubscription = async () => {
    try {
      setLoading(true);
      const [plansRes, subscriptionRes] = await Promise.all([
        adminAPI.getAvailablePlans(),
        adminAPI.getCurrentSubscription()
      ]);

      setPlans(plansRes.data.data.plans);
      setCurrentSubscription(subscriptionRes.data.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPaymentError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClick = (plan) => {
    setSelectedPlan(plan);
    setPaymentError('');
    setPaymentSuccess('');
  };

  const ensureRazorpayLoaded = () => {
    if (window.Razorpay) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleProcessPayment = async () => {
    if (!selectedPlan) return;

    try {
      setProcessingPayment(true);
      setPaymentError('');
      setPaymentSuccess('');

      const razorpayReady = await ensureRazorpayLoaded();
      if (!razorpayReady) {
        setPaymentError('Unable to load Razorpay checkout. Please try again.');
        return;
      }

      const response = await adminAPI.createSubscriptionRazorpayOrder({
        newPlan: selectedPlan.id,
        billingCycle: billingCycle,
        paymentMethod: paymentMethod
      });

      if (response.data.success) {
        const options = {
          key: response.data.key,
          amount: response.data.amount,
          currency: response.data.currency,
          name: 'EduAxis',
          description: `${selectedPlan.name} Plan Subscription`,
          order_id: response.data.orderId,
          theme: {
            color: '#dc2626'
          },
          handler: async (rzpResponse) => {
            try {
              const verifyResponse = await adminAPI.verifySubscriptionRazorpayPayment({
                paymentId: response.data.paymentId,
                razorpayOrderId: rzpResponse.razorpay_order_id,
                razorpayPaymentId: rzpResponse.razorpay_payment_id,
                razorpaySignature: rzpResponse.razorpay_signature,
                newPlan: selectedPlan.id,
                billingCycle
              });

              if (verifyResponse.data.success) {
                setPaymentSuccess(`Successfully upgraded to ${selectedPlan.name} plan!`);
                setTimeout(() => {
                  setSelectedPlan(null);
                  setPaymentError('');
                  setPaymentSuccess('');
                  setPaymentMethod('credit_card');
                  setTransactionId('');
                  fetchPlansAndSubscription();
                }, 1500);
              }
            } catch (verifyError) {
              console.error('Subscription verify error:', verifyError);
              setPaymentError(verifyError.response?.data?.message || 'Payment verification failed.');
            }
          }
        };

        const razorpayCheckout = new window.Razorpay(options);
        razorpayCheckout.on('payment.failed', () => {
          setPaymentError('Payment failed. Please try again.');
        });
        razorpayCheckout.open();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscription Plans</h1>
          <p className="text-slate-600 mt-1">Upgrade your school's plan to unlock more features</p>
        </div>
        <button
          onClick={fetchPlansAndSubscription}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Current Subscription Info */}
      {currentSubscription && currentSubscription.currentPlan !== 'trial' && (
        <div className="bg-linear-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-blue-600 text-sm font-medium">Current Plan</p>
              <p className="text-2xl font-bold text-blue-900 mt-1 capitalize">
                {currentSubscription.currentPlan}
              </p>
            </div>
            <div>
              <p className="text-blue-600 text-sm font-medium">Billing Cycle</p>
              <p className="text-lg font-semibold text-blue-900 mt-1 capitalize">
                {currentSubscription.billingCycle}
              </p>
            </div>
            <div>
              <p className="text-blue-600 text-sm font-medium">Students Using</p>
              <p className="text-lg font-semibold text-blue-900 mt-1">
                {currentSubscription.totalStudents}/{currentSubscription.maxStudents || 'Unlimited'}
              </p>
            </div>
            <div>
              <p className="text-blue-600 text-sm font-medium">Expires In</p>
              <p className="text-lg font-semibold text-blue-900 mt-1">
                {currentSubscription.daysRemaining} days
              </p>
            </div>
          </div>
          {currentSubscription.paymentStatus === 'overdue' && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">Your payment is overdue. Please renew your subscription.</p>
            </div>
          )}
        </div>
      )}

      {/* Billing Cycle Selector */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Billing Cycle</h2>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              value="monthly"
              checked={billingCycle === 'monthly'}
              onChange={(e) => setBillingCycle(e.target.value)}
              className="w-4 h-4 text-red-600"
            />
            <span className="text-slate-700 font-medium">Monthly Billing</span>
            <span className="text-xs text-slate-600">(Renew every month)</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              value="annual"
              checked={billingCycle === 'annual'}
              onChange={(e) => setBillingCycle(e.target.value)}
              className="w-4 h-4 text-red-600"
            />
            <span className="text-slate-700 font-medium">Annual Billing</span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">(Save 17%)</span>
          </label>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl shadow-md overflow-hidden transition-all duration-300 transform hover:scale-105 ${
              currentSubscription?.currentPlan === plan.id
                ? 'border-2 border-red-600 bg-red-50'
                : 'border border-slate-200 bg-white'
            }`}
          >
            {/* Plan Header */}
            <div className="bg-linear-to-r from-slate-700 to-slate-900 text-white p-6">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-slate-300 text-sm mt-2">{plan.description}</p>

              {currentSubscription?.currentPlan === plan.id && (
                <span className="inline-block mt-3 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                  Current Plan
                </span>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-slate-50 border-b border-slate-200 p-6">
              <div className="text-center">
                <p className="text-slate-600 text-sm mb-2">
                  {billingCycle === 'annual' ? 'Per Year' : 'Per Month'}
                </p>
                <p className="text-4xl font-bold text-slate-900">
                  ₹{(billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice).toLocaleString('en-IN')}
                </p>
                {billingCycle === 'annual' && (
                  <p className="text-xs text-green-600 font-medium mt-2">
                    ₹{Math.round(plan.annualPrice / 12).toLocaleString('en-IN')}/month
                  </p>
                )}
              </div>
            </div>

            {/* Features List */}
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Features Included</span>
                </h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limitations */}
              {plan.limitations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                    <X className="w-5 h-5 text-slate-400" />
                    <span>Not Included</span>
                  </h4>
                  <ul className="space-y-2">
                    {plan.limitations.map((limitation, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <X className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-600">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="p-6 border-t border-slate-200">
              {currentSubscription?.currentPlan === plan.id ? (
                <button
                  disabled
                  className="w-full py-3 px-4 bg-slate-300 text-slate-600 font-semibold rounded-lg cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handlePaymentClick(plan)}
                  className="w-full py-3 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Upgrade Now</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Plan Payment</h2>
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setPaymentError('');
                    setPaymentSuccess('');
                    setPaymentMethod('credit_card');
                    setTransactionId('');
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Order Summary */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">{selectedPlan.name} Plan</h3>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Billing Cycle:</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {billingCycle === 'annual' ? 'Annual (12 months)' : 'Monthly'}
                  </span>
                </div>
                {billingCycle === 'annual' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Annual Price:</span>
                    <span className="font-medium text-slate-900">
                      ₹{selectedPlan.annualPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-300 pt-3 flex justify-between">
                  <span className="text-slate-900 font-bold">Total Amount:</span>
                  <span className="font-bold text-red-600 text-lg">
                    ₹{(billingCycle === 'annual' 
                      ? selectedPlan.annualPrice 
                      : selectedPlan.monthlyPrice
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Error & Success Messages */}
              {paymentError && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm mb-4">
                  {paymentError}
                </div>
              )}

              {paymentSuccess && (
                <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm mb-4">
                  {paymentSuccess}
                </div>
              )}

              {/* Payment Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProcessPayment();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="net_banking">Net Banking</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter transaction ID if applicable"
                  />
                </div>

                {/* Info Box */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-800">
                    Your subscription will activate immediately after payment confirmation.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlan(null);
                      setPaymentError('');
                      setPaymentSuccess('');
                      setPaymentMethod('credit_card');
                      setTransactionId('');
                    }}
                    disabled={processingPayment}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingPayment}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {processingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentPlans;
