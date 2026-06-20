# GlowVerse API

Base URL: `/api`

## Health

`GET /health`

Returns API status.

## Auth

`POST /auth/register`

Body: `name`, `email`, `password`

`POST /auth/login`

Body: `email`, `password`

`POST /auth/google`

Body: `email`, `name`, `googleId`, `avatar`

`GET /auth/me`

Requires JWT.

## Salons

`GET /salons`

Query:

- `q`: salon, service, stylist, or locality search
- `locality`
- `rating`
- `priceMax`
- `distance`
- `luxury=true`
- `ecoFriendly=true`
- `openNow=true`
- `sort=rating|popularity|price|distance|aiMatch`
- `lat`, `lng`

`GET /salons/nearby?lat=12.97&lng=77.59`

Returns distance and estimated travel time.

`GET /salons/trending`

Returns most booked salons, top rated salons, trending hairstyles, treatments, and makeup looks.

`GET /salons/:slug`

Returns salon details, reviews, rating distribution, and AI sentiment summary.

## Bookings

All booking routes require JWT.

`GET /bookings`

Returns user booking history.

`POST /bookings`

Body:

```json
{
  "salonId": "...",
  "serviceId": "...",
  "stylistId": "...",
  "date": "2026-07-01",
  "slot": "10:00 AM",
  "paymentMethod": "upi"
}
```

Payment methods: `upi`, `gpay`, `phonepe`, `paytm`, `card`, `netbanking`, `wallet`.

`PATCH /bookings/:id/cancel`

`PATCH /bookings/:id/reschedule`

Body: `date`, `slot`

## Experience

`POST /experience/assistant`

Body: `prompt`

Returns salon, service, package, and stylist recommendations.

`POST /experience/quiz`

Body: `hairType`, `skinType`, `budget`, `occasion`, `location`

Returns beauty profile, recommendations, salon matches, and AI match score.

`GET /experience/packages`

Returns occasion-based package recommendations.

JWT required:

- `GET /experience/dashboard`
- `POST /experience/spin`
- `POST /experience/gift-cards`

Owner/admin required:

- `GET /experience/analytics`
