// src/config/razorpay.ts
import Razorpay from 'razorpay';
import 'dotenv/config';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export default razorpay;