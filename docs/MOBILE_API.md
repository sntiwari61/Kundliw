# Mobile app API (version 1)

The mobile app talks to the same server as the website. It signs in with **tokens** instead of the website's cookie, and after that it calls the **same `/api/...` routes** the website uses. Every route that needs a signed-in person (`guardApiUser`, `guardApiAssociate`, `guardApiAdmin`) accepts the app's token, because the single function that identifies the caller (`getCurrentUser` in `src/lib/auth/guards.ts`) reads `Authorization: Bearer <access token>`.

All requests are HTTPS JSON. The app does not send an `Origin` header, which the server's CSRF check allows.

## Tokens

| Token | Use | Valid |
|---|---|---|
| access | sent as `Authorization: Bearer <accessToken>` on every request | 1 hour |
| refresh | kept in the phone's secure storage; only used on `/auth/refresh` | 60 days |

- Both are signed with the server secret and carry a `typ` claim; an access token cannot be used as a refresh token or the other way round.
- The role is **always read from the database** on each request, never from the token.
- A token stops working when the account's password changes (reset) or the account is deleted.
- There is no server-side session list: signing out in the app deletes the tokens from the phone.

## Sign in

### Ask for an OTP
`POST /api/auth/otp/send` `{ "phone": "9876543210" }` — the existing route (rate limited per IP and per number).

### Sign in with OTP
`POST /api/mobile/v1/auth/otp/verify` `{ "phone": "9876543210", "otp": "123456", "portal": "user" | "associate" }`

### Sign in with e-mail or mobile number and password
`POST /api/mobile/v1/auth/login` `{ "identifier": "name@example.com", "password": "...", "portal": "user" | "associate" }`
(Super Admin does not sign in from the app.)

Both return:
```json
{
  "user": { "id": "...", "name": "...", "email": "...", "phone": "+91...", "role": "USER", "associateStatus": "APPROVED" },
  "accessToken": "...", "refreshToken": "...", "expiresIn": 3600, "tokenType": "Bearer"
}
```
`associateStatus` is present for Associates only. Errors: `401 { "error": "..." }` for wrong details; `429` when rate limited (login: 10 attempts per IP and 5 per account in 15 minutes; OTP: 5 wrong tries per code).

### Refresh
`POST /api/mobile/v1/auth/refresh` `{ "refreshToken": "..." }` → same body as sign-in. `401` means "sign in again".

### Who am I
`GET /api/mobile/v1/me` → `{ "user": { ... } }`

## Register
`POST /api/auth/register` — the existing route (name, phone, email, optional password, `accountType`, `adultConfirmed: true`). After registering, the app signs in as above.

## Delete my account
`POST /api/account/delete` `{ "confirm": "DELETE", "password": "..." }` (password only for accounts that have one).
Removes the sign-in details, Vault files, ticket contact details and Associate payout details; keeps orders, invoices and commission records (tax law). Refused with `409` while a paid order is in progress or an Associate is owed commission. A public explanation page is at `/delete-account` (the web address to give Google Play).

## Booking and orders (read-only helpers for the app)
- `GET /api/mobile/v1/catalog` (no sign-in) → `{ services: [{ slug, titleEn, titleHi, packages, plans: [{ id, slug, titleEn, titleHi, pricePaise, originalPricePaise, deliveryDays, pages, hasCall, callDurationMinutes }] }], slots: [{ id, date, startTime, endTime }], gstRateBasisPoints }`. Services paid on a partner website are left out. Prices are for display; the server calculates the real amount again when the order is created.
- `GET /api/mobile/v1/payment-info` (signed in) → the UPI ID, QR code and bank details the admin has set.
- `GET /api/mobile/v1/orders` and `GET /api/mobile/v1/orders/{id}` (signed in) → the customer's own orders. Another customer's order answers `404`. Birth details and payment proof are not included.

- `GET /api/mobile/v1/vault` (signed in) → `{ files: [{ id, titleEn, titleHi, fileName, fileSize, mimeType, uploadedByRole, uploadedAt }] }`, the person's own files (no storage path). Open one with `GET /api/vault/{id}?download=1` and the Bearer token; upload with `POST /api/vault/upload` (multipart `file`, `title`; 4 MB limit).
- `GET /api/mobile/v1/tickets` and `GET /api/mobile/v1/tickets/{id}` (signed in) → the person's own support tickets, and one with its messages. Raise one with `POST /api/tickets`, reply with `POST /api/tickets/{id}` `{ message }`.
- Associates use the existing `GET /api/associate/summary`, `POST /api/associate/payout` and `POST /api/associate/referral-code` with the Bearer token.

Booking itself uses the existing routes with the same Bearer token: `POST /api/booking` (send an `idempotencyKey` so a retry never creates a second order), `POST /api/offers/validate`, and `POST /api/payments/manual/submit` `{ orderId, paymentMode: "MANUAL_UPI" | "MANUAL_BANK", manualPaymentRef }`.

## Existing routes the app uses unchanged
Services and booking (`/api/booking/*`), payments (`/api/payments/*`), orders (`/api/orders/*`, `/api/orders/track`), invoices (`/api/invoice/[id]`, `/api/ticket/[id]`), Vault (`/api/vault/*`), support tickets (`/api/tickets/*`), associate (`/api/associate/*`), offers, FAQ, chatbot (`/api/chatbot/ask`), contact, guides (`/api/guides/[slug]`). Their request and response shapes are those used by the website.

## Not in this slice yet
Google sign-in for the app, push notifications (needs a device-token table and Firebase), and a typed `/api/mobile/v1/*` wrapper for the content lists. See `docs/APP_DEVELOPMENT_PLAN.md`.
