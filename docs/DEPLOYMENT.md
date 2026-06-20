# Deployment Guide

## Frontend

Build:

```bash
npm run build --workspace client
```

Deploy `client/dist` to Vercel, Netlify, Cloudflare Pages, or static hosting.

Set:

```bash
VITE_API_URL=https://your-api.example.com/api
VITE_GOOGLE_MAPS_API_KEY=...
VITE_RAZORPAY_KEY_ID=...
```

## Backend

Deploy the `server` workspace to Render, Railway, Fly.io, AWS, Azure, or GCP.

Start command:

```bash
npm run start --workspace server
```

Set production env vars:

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CLIENT_URL=https://your-client.example.com
```

## Database

Use MongoDB Atlas for production.

Seed demo data:

```bash
npm run seed
```

For a real launch, replace generated salon and review data with verified owner-submitted listings.

## Payments

Create Razorpay API keys and configure webhook verification before enabling real charges.

Recommended webhooks:

- `payment.captured`
- `payment.failed`
- `refund.processed`

## Maps

Restrict Google Maps keys by domain and API.

Enable:

- Maps JavaScript API
- Places API
- Directions API
- Distance Matrix API
