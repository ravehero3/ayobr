# TypeBeatz — Type Beat Video Generator Platform

## What This App Is

TypeBeatz is a full SaaS platform for music producers who create "type beat" videos for YouTube. Producers drag and drop up to 100 files (50 audio + 50 images), the app auto-pairs them, and generates all MP4 videos in-browser using FFmpeg WebAssembly. No server needed for video processing — it's entirely client-side.

**Brand identity**: "You sleep, we work." The sleeping alien mascot (ZZZ) animates during video generation.

---

## Architecture

### Frontend (port 5000)
- React 19, Zustand, Framer Motion, TailwindCSS v4
- Webpack 5 + Babel dev server
- react-router-dom for routing: `/` (landing), `/login`, `/app` (protected), `/admin` (admin-only)
- Webpack proxy: all `/api/*` requests forwarded to backend on port 3001

### Backend (port 3001)
- Express.js server (`npm run server` → `server/index.js`)
- Replit Auth (openid-client + passport) for OIDC login
- PostgreSQL (Replit DB) via `pg` pool
- Sessions stored in DB via `connect-pg-simple`
- Stripe integration for PRO subscriptions

### Database (Replit PostgreSQL)
Tables: `sessions`, `users`, `credits`, `subscriptions`, `feature_flags`

---

## Routes

### Frontend Routes
- `/` — Landing page (public)
- `/login` — Login page with rights agreement modal
- `/app` — Video generator app (protected, redirects to /login if not authed)
- `/admin` — Admin panel (protected, admin role only)

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
- `GET /api/admin/users` — All users (admin only)
- `PATCH /api/admin/users/:id/role` — Change user role (admin only)
- `GET /api/admin/features` — All feature flags (admin only)
- `PATCH /api/admin/features` — Toggle a feature flag (admin only)
- `POST /api/admin/reset-credits` — Manually reset monthly credits (admin only)
- `GET /api/paddle/config` — Public Paddle client token + price ID
- `POST /api/paddle/create-checkout` — Create Paddle checkout
- `GET /api/paddle/subscription` — Get current subscription status
- `POST /api/paddle/cancel` — Cancel subscription
- `POST /api/paddle/webhook` — Paddle webhook handler

---

## Key Files

### Backend
- `server/index.js` — Express entry, CORS, middleware, scheduler
- `server/auth.js` — Replit Auth OIDC setup, session management, isAuthenticated/isAdmin middleware
- `server/db.js` — PostgreSQL pool
- `server/storage.js` — All DB CRUD operations
- `server/schema.sql` — DB schema (applied on server start)
- `server/routes/user.js` — User API routes
- `server/routes/admin.js` — Admin API routes
- `server/routes/paddle.js` — Paddle routes + webhook

### Frontend
- `src/App.jsx` — BrowserRouter + all route definitions
- `src/context/AuthContext.jsx` — Auth state, login/logout, deductCredit, agreeToRights
- `src/VideoApp.jsx` — Original video generator (accepts `onBeforeGenerate` prop for credit gating)
- `src/pages/LandingPage.jsx` — Public marketing page
- `src/pages/LoginPage.jsx` — Login + rights agreement
- `src/pages/AppPage.jsx` — Protected app wrapper, credit/upgrade UI
- `src/pages/AdminPage.jsx` — Admin panel
- `src/components/Navbar.jsx` — App navbar with credits/PRO badge
- `src/components/UpgradeBanner.jsx` — Low-credit warning banner
- `webpack.config.js` — Build config, dev server, COOP/COEP headers, `/api` proxy

---

## User Roles
- `free` — 5 credits/month, reset on the 1st
- `pro` — Unlimited video generation ($9.99/month via Stripe)
- `admin` — Full access + admin panel

## Setting First Admin
To make the first user an admin, run in the DB:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Environment Variables / Secrets
- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit DB blueprint)
- `SESSION_SECRET` — Random string for session signing
- `REPL_ID` — Auto-set by Replit (used as OIDC client_id)
- `REPLIT_DEV_DOMAIN` — Auto-set by Replit (used for auth callback URL)
- `PADDLE_API_KEY` — Paddle secret API key (set when ready for payments)
- `PADDLE_CLIENT_TOKEN` — Paddle public client token (safe for frontend)
- `PADDLE_PRO_PRICE_ID` — Paddle price ID for the $9.99/month PRO plan
- `PADDLE_WEBHOOK_SECRET` — Paddle webhook signing secret
- `PADDLE_ENV` — Set to `production` for live payments, otherwise uses sandbox

---

## Credit System
- Free users start with 5 credits, each video generation costs 1 credit
- `POST /api/user/deduct-credit` is called by `AppPage` via `onBeforeGenerate` prop before generation starts
- Returns 402 if no credits remaining
- Monthly reset scheduler runs every hour, resets on the 1st of each month
- Admin can manually trigger reset via admin panel

---

## Workflows
- **Start application** — `npm run dev` (webpack on port 5000, webview)
- **API Server** — `npm run server` (Express on port 3001, console)
- Both start automatically via the **Project** parallel workflow

---

## Tech Stack
- React 19, Zustand, Framer Motion, TailwindCSS v4
- FFmpeg WebAssembly (@ffmpeg/ffmpeg 0.12.x) — client-side video processing
- Express 5, Passport, openid-client (Replit Auth OIDC)
- pg (PostgreSQL), connect-pg-simple (session store)
- Stripe (payments)
- Webpack 5, Babel

## Critical Headers (FFmpeg SharedArrayBuffer)
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
Set in webpack devServer config (dev) and must be set in hosting config for production.

---

## UI/UX Design Language
- Dark theme: deep navy (#050a13) + matte black backgrounds
- Blue-purple gradient accents (#3b82f6 → #8b5cf6)
- Glassmorphism containers: semi-transparent, backdrop blur, border
- Framer Motion animations throughout
- Sleeping alien mascot during video generation
