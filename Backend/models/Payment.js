import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required'],
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // Only required if not a subscription payment
      return this.paymentType !== 'subscription';
    }
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    required: function() {
      // Only required if not a subscription payment
      return this.paymentType !== 'subscription';
    }
  },
  feeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fee',
    required: function() {
      // Only required if not a subscription payment
      return this.paymentType !== 'subscription';
    }
  },
  feeTitle: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Online Payment', 'Check', 'UPI', 'Other', 'credit_card', 'debit_card', 'net_banking', 'upi', 'bank_transfer'],
    default: 'Cash'
  },
  paymentType: {
    type: String,
    enum: ['fee', 'subscription'],
    default: 'fee'
  },
  description: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  razorpayOrderId: {
    type: String,
    trim: true,
    index: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    index: true
  },
  razorpaySignature: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String,
    trim: true
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Auto-generate receipt number
paymentSchema.pre('save', function(next) {
  if (this.isNew && !this.receiptNumber) {
    this.receiptNumber = `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
