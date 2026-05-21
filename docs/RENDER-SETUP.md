# TypeBeatz on Render — simple setup guide

## That webpack line in the logs is NOT an error

During deploy you may see:

```
Use 'stats.errorDetails: true' resp. '--stats-error-details' to show it.
```

That is a normal webpack **warning** from the build step. If the deploy finishes and you see **"TypeBeatz API server running on port …"**, the server is fine.

## Real errors to look for

Search Render logs for these (bad):

- `[CRITICAL] Missing required environment variables`
- `Failed to start server`
- `exit code 1` right after deploy

## Render settings (check once)

| Setting | Value |
|--------|--------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` or `node server/index.js` |

## Environment variables you must keep

Deleting Paddle variables is correct. **Do not delete these:**

| Variable | What it does |
|----------|----------------|
| `DATABASE_URL` | Database — app won't start without it |
| `SESSION_SECRET` | Login sessions |
| `GOOGLE_CLIENT_ID` | Google login |
| `GOOGLE_CLIENT_SECRET` | Google login |
| `APP_URL` | `https://typebeatz.voodoo808.com` (no trailing slash) |

## Lemon Squeezy (payments)

| Variable | Where to get it |
|----------|-----------------|
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy → Settings → API |
| `LEMONSQUEEZY_STORE_ID` | Settings → Stores |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Settings → Webhooks |
| `LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID` | Products → Pro → Variants |
| `LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID` | Products → Pro → Variants |
| `LEMONSQUEEZY_UNLIMITED_MONTHLY_VARIANT_ID` | Products → Unlimited → Variants |
| `LEMONSQUEEZY_UNLIMITED_YEARLY_VARIANT_ID` | Products → Unlimited → Variants |

Variant IDs are **numbers** from Lemon Squeezy — not Paddle `pri_...` IDs.

Optional: `FRONTEND_URL=https://typebeatz.voodoo808.com`

## If the site looks broken in the browser

1. Wait 2–3 minutes after deploy (Render can be slow).
2. Hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows).
3. Try an incognito/private window.
4. Open `https://typebeatz.voodoo808.com/api/health` — you should see `{"ok":true}`.

## Google login

In [Google Cloud Console](https://console.cloud.google.com/) → your OAuth client → **Authorized redirect URIs** must include:

`https://typebeatz.voodoo808.com/api/callback`

`APP_URL` on Render must match that domain.
