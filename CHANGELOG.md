# Changelog

## 0.1.6

- Update dependencies (convex 1.41.0, stripe ^22.2.2, react 19.2.7, vite 8.0.16,
  vitest 4.1.9, typescript-eslint, eslint, and others)
- Bump `react` peer dependency to `^19.2.7` (drops React 18 support)

## 0.1.5

- Switch the fork to source-only GitHub dependency distribution
- Add package-version based GitHub release tagging
- Remove npm/dist publish artifacts and placeholder React export

## 0.1.4

- Fix subscription quantity updates outside component actions
- Add userId to customers table to prevent duplicates
- Fix cancelAtPeriodEnd not set when canceling via Stripe Portal
- Fix updateSubscriptionMetadata undefined wipe for orgId/userId

credit: advaitpaliwal

## 0.1.3

- Fix subscription sync: `priceId` now updates on plan changes, and
  `cancelAtPeriodEnd` is correctly derived when Stripe sets `cancel_at`

## 0.1.2

- Fix updateSubscriptionQuantity: we now pass in STRIPE_SECRET_KEY explicitly.
  component context did not have access to process.env

## 0.1.1

- Update docs

## 0.1.0

- Initial release.
