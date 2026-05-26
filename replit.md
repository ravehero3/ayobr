# TypeBeatz — Type Beat Video Generator Platform

## What This App Is

TypeBeatz is a full SaaS platform for music producers who create "type beat" videos for YouTube. Producers drag and drop up to 100 files (50 audio + 50 images), the app auto-pairs them, and generates all MP4 videos in-browser using FFmpeg WebAssembly. No server needed for video processing — it's entirely client-side.

**Brand identity**: "You sleep, we work." The sleeping alien mascot (ZZZ) animates during video generation.

---

## Architecture

### Single server (port 5000)
- Express.js serves both the API and the pre-built React frontend from `dist/`
- React 19, Zustand, Framer Motion, TailwindCSS v4
- Webpack 5 + Babel — `npm run build` produces production bundles in `dist/`
- react-router-dom for routing: `/` (landing), `/login`, `/app` (protected), `/admin` (admin-only), `/account` (user settings)
- All routes are lazy-loaded (React.lazy) so FFmpeg WASM only downloads on `/app`

### Backend
- Express.js server (`node server/index.js`)
- Replit Auth (OIDC via openid-client + passport) for login
- PostgreSQL (Replit DB) via `pg` pool (max 10 connections)
- Sessions stored in DB via `connect-pg-simple`
- LemonSqueezy for PRO/Unlimited subscriptions
- GoPay for Czech payment gateway (sandbox by default — set `GOPAY_IS_PRODUCTION=true` + credentials for live)
- Rate limiting: 200 req/15 min general, 30 req/15 min auth, 20 req/hr payments
- Gzip compression on all responses

### Database (Replit PostgreSQL)
Tables: `sessions`, `users`, `credits`, `subscriptions`, `feature_flags`, `referral_uses`, `email_logs`

---

## Routes

### Frontend Routes
- `/` — Landing page (public)
- `/login` — Login page with rights agreement modal
- `/app` — Video generator app (protected, redirects to /login if not authed)
- `/admin` — Admin panel (protected, admin role only)
- `/account` — Account settings (profile, usage history, subscription, referrals)
- `/upgrade` — Upgrade/pricing page (protected)
- `/success` — Post-payment success page (protected)

### Backend API Routes
- `GET /api/health` — Health check
- `GET /api/login` — Initiates Replit OIDC auth flow
- `GET /api/callback` — OIDC callback, creates session
- `GET /api/logout` — Ends session, redirects to Replit logout
- `GET /api/user/me` — Current user profile + credits
- `POST /api/user/agree-rights` — Mark rights agreement accepted
- `POST /api/user/deduct-credit` — Deduct 1 credit (called before video generation)
- `GET /api/user/features` — Feature flags for current user's plan
- `GET /api/user/referral` — Get current user's referral code + stats
- `POST /api/user/referral/apply` — Apply a referral code (awarded once per user)
- `GET /api/admin/stats` — Dashboard stats (admin only)
- `GET /api/admin/users` — All users (admin only)
- `PATCH /api/admin/users/:id/role` — Change user role (admin only)
- `GET /api/admin/emails` — Opted-in email list (admin only)
- `GET /api/admin/features` — All feature flags (admin only)
- `PATCH /api/admin/features` — Toggle a feature flag (admin only)
- `POST /api/admin/reset-credits` — Manually reset monthly credits (admin only)
- `GET /api/admin/email-templates` — List email templates (admin only)
- `GET /api/admin/email-templates/:id/preview` — Render template HTML (admin only)
- `GET /api/admin/smtp-status` — Whether SMTP is configured (admin only)
- `POST /api/admin/newsletter` — Send campaign to a user segment (admin only)
- `GET /api/ls/config` — Lemon Squeezy store + variant IDs
- `POST /api/ls/create-checkout` — Create Lemon Squeezy checkout
- `GET /api/ls/subscription` — Get current subscription status
- `POST /api/ls/cancel` — Cancel subscription
- `POST /api/ls/webhook` — Lemon Squeezy webhook handler
- `POST /api/gopay/create-payment` — Create GoPay payment
- `GET /api/gopay/callback` — GoPay redirect after payment
- `POST /api/gopay/notification` — GoPay server-to-server webhook

---

## Key Files

### Backend
- `server/index.js` — Express entry point, cron scheduler
- `server/app.js` — App factory: compression, rate limiting, CORS, COOP/COEP headers, static serving
- `server/auth.js` — Replit Auth OIDC setup, session management, isAuthenticated/isAdmin middleware
- `server/db.js` — PostgreSQL pool (max 10 connections)
- `server/storage.js` — All DB CRUD operations
- `server/schema.sql` — DB schema (applied on server start via IF NOT EXISTS)
- `server/email.js` — Nodemailer transactional emails + EMAIL_TEMPLATES
- `server/routes/user.js` — User API routes
- `server/routes/admin.js` — Admin API routes
- `server/routes/lemonsqueezy.js` — Lemon Squeezy routes + webhook
- `server/routes/gopay.js` — GoPay Czech payment gateway

### Frontend
- `src/App.jsx` — BrowserRouter + lazy-loaded route definitions
- `src/context/AuthContext.jsx` — Auth state, login/logout, deductCredit, agreeToRights
- `src/VideoApp.jsx` — Video generator (accepts `onBeforeGenerate` prop for credit gating)
- `src/pages/LandingPage.jsx` — Public marketing page
- `src/pages/LoginPage.jsx` — Login + rights agreement
- `src/pages/AppPage.jsx` — Protected app wrapper, credit/upgrade UI
- `src/pages/AdminPage.jsx` — Admin panel (6 tabs: Přehled, Uživatelé, Emaily, Automatické emaily, Newsletter, Nastavení)
- `src/components/Navbar.jsx` — App navbar with credits/PRO badge
- `src/pages/AccountPage.jsx` — Account settings page (profile, usage, subscription, referrals)
- `src/components/UpgradeBanner.jsx` — Low-credit warning banner
- `webpack.config.js` — Build config: production minification, code splitting, filesystem cache

---

## User Roles
- `free` — 5 credits/month, reset on the 1st of each month
- `pro` — Unlimited video generation (paid via LemonSqueezy)
- `unlimited` — Full unlimited access (paid via LemonSqueezy)
- `admin` — Full access + admin panel

## Setting First Admin
Pre-approved admin emails are set in `server/storage.js` → `PRE_APPROVED_ADMINS` array.
They are automatically promoted on first login. Alternatively run:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Environment Variables / Secrets
- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit DB)
- `SESSION_SECRET` — Random string for session signing
- `REPL_ID` — Auto-set by Replit (used as OIDC client_id)
- `REPLIT_DEV_DOMAIN` — Auto-set by Replit (used for auth callback URL)
- `LEMONSQUEEZY_API_KEY` — Lemon Squeezy API key
- `LEMONSQUEEZY_STORE_ID` — Lemon Squeezy store ID
- `LEMONSQUEEZY_WEBHOOK_SECRET` — Lemon Squeezy webhook signing secret
- `LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID` / `LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID` — PRO plan variants
- `LEMONSQUEEZY_UNLIMITED_MONTHLY_VARIANT_ID` / `LEMONSQUEEZY_UNLIMITED_YEARLY_VARIANT_ID` — Unlimited plan variants
- `GOPAY_GOID` — GoPay Merchant ID (required for live Czech payments)
- `GOPAY_CLIENT_ID` — GoPay Client ID
- `GOPAY_CLIENT_SECRET` — GoPay Client Secret
- `GOPAY_IS_PRODUCTION` — Set to `"true"` to use live GoPay gateway
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` — SMTP credentials for transactional email
- `EMAIL_FROM` — Sender address e.g. `TypeBeatz <noreply@yourdomain.com>`

---

## Email System
Transactional emails (nodemailer) are sent automatically:
- **Welcome** — on first login
- **Purchase confirmation** — on PRO/Unlimited subscription activation (via LemonSqueezy webhook)
- **Credit limit** — when a free user reaches 0 credits

Email requires SMTP env vars. Without them the server starts fine but emails are silently skipped.
Admin can preview all templates and send newsletter campaigns from the admin panel → Newsletter tab.

---

## Credit System
- Free users start with 5 credits; each video generation costs 1 credit
- `POST /api/user/deduct-credit` is called by `AppPage` before generation starts — returns 402 if no credits
- Monthly reset runs automatically at 00:00 UTC on the 1st of each month (node-cron)
- Admin can manually trigger reset via admin panel → Nastavení tab

---

## Workflow
- **Start application** — `node server/index.js` (Express on port 5000, serves API + pre-built frontend)
- Run `npm run build` to rebuild the frontend (webpack production build → `dist/`)
- Run `npm run dev` for local development with webpack HMR on port 5000 (requires separate API server on port 3001)

---

## Tech Stack
- React 19, Zustand, Framer Motion, TailwindCSS v4
- FFmpeg WebAssembly (@ffmpeg/ffmpeg 0.12.x) — client-side video processing, lazy-loaded
- Express 5, Passport, openid-client (Replit Auth OIDC)
- pg (PostgreSQL), connect-pg-simple (session store)
- LemonSqueezy + GoPay (payments)
- express-rate-limit, compression
- Webpack 5, Babel

## Critical Headers (FFmpeg SharedArrayBuffer)
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
Set in `server/app.js` for all responses and in `_headers` for Cloudflare/Netlify deployments.

---

## UI/UX Design Language
- Dark theme: deep navy (#050a13) + matte black backgrounds
- Dark blue to sky blue gradient accents (#3b82f6 → #0ea5e9)
- Glassmorphism containers: semi-transparent, backdrop blur, border
- Framer Motion animations throughout
- Sleeping alien mascot during video generation
- Czech UI labels throughout (app targets Czech-speaking music producers)
