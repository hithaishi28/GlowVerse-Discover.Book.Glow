# Production Checklist

## Security

- Use strong `JWT_SECRET`.
- Add refresh tokens or session rotation for long-lived sessions.
- Verify Google OAuth tokens server-side.
- Verify Razorpay payment signatures and webhooks.
- Add stricter API rate limits for auth and payments.
- Restrict CORS to production domains.
- Store secrets in platform secret managers.

## Data Quality

- Add admin salon approval workflows.
- Add owner KYC and payout verification.
- Add review moderation and abusive-content checks.
- Replace demo photos with licensed or owner-provided media.

## Reliability

- Add request logging and error monitoring.
- Add database backups.
- Add transactional email provider.
- Add SMS and push providers.
- Add queue workers for email, notifications, and invoices.

## Performance

- Add server-side pagination for salons and reviews.
- Add Redis caching for high-traffic discovery queries.
- Optimize image delivery through a CDN.
- Add MongoDB geospatial indexes for production nearby search.

## Accessibility

- Test keyboard navigation.
- Test color contrast in both themes.
- Add screen-reader labels for all icon-only buttons.
- Verify reduced-motion behavior for animations.

## Testing

- Unit test service logic.
- Integration test auth, discovery, booking, payments, and rewards.
- End-to-end test booking flow and dashboards.
- Load test discovery and nearby search.
