import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayClient = null;

export const getRazorpayClient = () => {
  if (razorpayClient) {
    return razorpayClient;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured');
  }

  razorpayClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });

  return razorpayClient;
};

export const toPaise = (amount) => {
  const numericAmount = Number(amount || 0);
  return Math.round(numericAmount * 100);
};

export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expected === signature;
};

export const getRazorpayPublicKey = () => process.env.RAZORPAY_KEY_ID;
