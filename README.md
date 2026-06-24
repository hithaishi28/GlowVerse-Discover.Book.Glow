# GlowVerse

Discover. Book. Glow.

GlowVerse is a premium salon marketplace MVP for Bangalore with salon discovery, nearby search, booking, rewards, memberships, gift cards, AI assistant, quiz recommendations, and dashboards for users, salon owners, and admins.

## Tech Stack

- React, Tailwind CSS, Framer Motion
- Node.js, Express
- MongoDB, Mongoose
- JWT auth, Google OAuth hooks
- Razorpay-ready payment API
- Google Maps-ready location UX
- OpenAI-ready assistant service with demo fallback

## Quick Start

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run seed
npm run dev
```

Client: `http://localhost:5173`

API: `http://localhost:8080/api`

## Demo Credentials

After seeding:

- User: `demo@glowverse.app` / `Password123!`
- Salon owner: `owner@glowverse.app` / `Password123!`
- Admin: `admin@glowverse.app` / `Password123!`

## Documentation

- [API Documentation](docs/API.md)
- [Environment Setup](docs/ENVIRONMENT.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Production Checklist](docs/PRODUCTION_CHECKLIST.md)
- [Razorpay and Google Maps Setup](docs/RAZORPAY_GOOGLE_SETUP.md)


Deployed with Vercel.
