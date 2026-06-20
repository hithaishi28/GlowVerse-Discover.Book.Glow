import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 8080,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/glowverse',
  jwtSecret: process.env.JWT_SECRET || 'dev-glowverse-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.FROM_EMAIL || 'GlowVerse <no-reply@glowverse.app>'
  }
};
