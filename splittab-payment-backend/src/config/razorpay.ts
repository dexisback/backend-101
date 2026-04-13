// src/config/razorpay.ts
import Razorpay from 'razorpay';
import { env } from './env.js';


const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID ,
  key_secret: env.RAZORPAY_KEY_SECRET 
});

export default razorpay;