---
name: Replit OIDC deployed auth fix
description: Why auth breaks on deployment with "Unknown authentication strategy oidc" and how to fix it.
---

## The Rule

Never pass `REPLIT_DEPLOYMENT_ID` as the third argument to `openid-client`'s `discovery()`. In production it is a non-empty string (e.g. `"dep-abc123"`), which `discovery()` treats as invalid `clientMetadata` and throws — silently caught by the surrounding try/catch — so the `'oidc'` strategy is never registered. Then `passport.authenticate('oidc')` crashes on any login attempt.

Always guard `/api/login` and `/api/callback` with an `oidcReady` boolean set only after `passport.use('oidc', ...)` succeeds.

**Why:** `discovery(issuerURL, clientId, clientMetadata?)` — `clientMetadata` must be an object or omitted. A deployment-ID string is silently invalid in production but `|| ''` evaluates to falsy in dev so it happened to work locally.

**How to apply:**
```js
// CORRECT
const issuer = await discovery(new URL('https://replit.com/oidc'), replId);

// Guard routes
let oidcReady = false;
// ... after passport.use('oidc', ...) succeeds:
oidcReady = true;

app.get('/api/login', (req, res, next) => {
  if (!oidcReady) return res.status(503).send('Auth not configured');
  return passport.authenticate('oidc')(req, res, next);
});
```
