# Environment Setup

## Required

Server `.env`:

```bash
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/glowverse
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
```

Client `.env`:

```bash
VITE_API_URL=http://localhost:8080/api
```

## Optional Integrations

Google Maps:

```bash
GOOGLE_MAPS_API_KEY=
VITE_GOOGLE_MAPS_API_KEY=
```

OpenAI:

```bash
OPENAI_API_KEY=
```

Razorpay:

```bash
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
```

Email:

```bash
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=GlowVerse <no-reply@glowverse.app>
```

When optional credentials are missing, the app uses demo-safe fallbacks so hackathon demos still work.
