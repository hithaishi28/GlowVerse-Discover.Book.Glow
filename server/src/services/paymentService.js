import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';

export async function createRazorpayOrder(amount, receipt) {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    return {
      id: `demo_order_${Date.now()}`,
      amount: amount * 100,
      currency: 'INR',
      receipt,
      demo: true
    };
  }

  const razorpay = new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret
  });

  return razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR',
    receipt
  });
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  if (!env.razorpayKeySecret) return true;
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', env.razorpayKeySecret).update(payload).digest('hex');
  if (!signature || expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''));
}
