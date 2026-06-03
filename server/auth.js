const session = require('express-session');
const connectPg = require('connect-pg-simple');
const passport = require('passport');
const { Strategy: OpenIDConnectStrategy } = require('openid-client/passport');
const { discovery } = require('openid-client');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { pool } = require('./db');
const { upsertUser, getUserById } = require('./storage');

function getBaseURL() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
  if (process.env.REPLIT_DOMAINS) return `https://${process.env.REPLIT_DOMAINS.split(',')[0].trim()}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return 'http://localhost:5000';
}

function getCallbackURL() {
  return `${getBaseURL()}/api/callback`;
}

function getGoogleCallbackURL() {
  return `${getBaseURL()}/api/auth/google/callback`;
}

function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    pool,
    createTableIfMissing: false,
    ttl: sessionTtl / 1000,
    tableName: 'sessions',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: sessionTtl,
    },
  });
}

async function setupAuth(app) {
  app.set('trust proxy', 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  let oidcReady = false;
  let googleReady = false;

  // ── Replit OIDC (dev / Replit-hosted) ──────────────────────────────────────
  const replId = process.env.REPL_ID;
  if (!replId) {
    console.warn('[auth] REPL_ID not set — Replit OIDC will not work');
  } else {
    try {
      const issuer = await discovery(new URL('https://replit.com/oidc'), replId);
      const callbackURL = getCallbackURL();
      console.log('[auth] Replit OIDC callback URL:', callbackURL);

      passport.use('oidc', new OpenIDConnectStrategy(
        { config: issuer, scope: 'openid email profile', callbackURL },
        async (tokens, done) => {
          try {
            const claims = tokens.claims();
            const user = await upsertUser({
              id: claims.sub,
              email: claims.email || '',
              first_name: claims.first_name || claims.given_name || '',
              last_name: claims.last_name || claims.family_name || '',
              profile_image_url: claims.profile_image_url || claims.picture || '',
              language: 'en',
            });
            return done(null, user);
          } catch (err) { return done(err); }
        }
      ));
      oidcReady = true;
      console.log('[auth] Replit OIDC strategy registered');
    } catch (err) {
      console.warn('[auth] Replit OIDC setup failed:', err.message);
    }
  }

  // ── Google OAuth 2.0 (production / Render) ─────────────────────────────────
  const googleClientId     = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (googleClientId && googleClientSecret) {
    try {
      const googleCallbackURL = getGoogleCallbackURL();
      console.log('[auth] Google OAuth callback URL:', googleCallbackURL);

      passport.use('google', new GoogleStrategy(
        {
          clientID:     googleClientId,
          clientSecret: googleClientSecret,
          callbackURL:  googleCallbackURL,
          scope:        ['email', 'profile'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value || '';
            const user = await upsertUser({
              id:                `google_${profile.id}`,
              email,
              first_name:        profile.name?.givenName || '',
              last_name:         profile.name?.familyName || '',
              profile_image_url: profile.photos?.[0]?.value || '',
              language:          'en',
            });
            return done(null, user);
          } catch (err) { return done(err); }
        }
      ));
      googleReady = true;
      console.log('[auth] Google OAuth strategy registered');
    } catch (err) {
      console.warn('[auth] Google OAuth setup failed:', err.message);
    }
  } else {
    console.warn('[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google OAuth will not work');
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await getUserById(String(id));
      done(null, user || false);
    } catch (err) { done(err); }
  });

  // ── Routes ─────────────────────────────────────────────────────────────────

  // Primary login — prefers Replit OIDC (dev), falls back to Google (prod)
  app.get('/api/login', (req, res, next) => {
    if (oidcReady)   return passport.authenticate('oidc')(req, res, next);
    if (googleReady) return passport.authenticate('google', { scope: ['email', 'profile'] })(req, res, next);
    return res.status(503).send('Authentication is not configured. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET or REPL_ID.');
  });

  // Replit OIDC callback
  app.get('/api/callback', (req, res, next) => {
    if (!oidcReady) return res.redirect('/?auth=failed');
    return passport.authenticate('oidc', { failureRedirect: '/?auth=failed' })(req, res, (err) => {
      if (err) return next(err);
      req.session.userId = req.user?.id;
      req.session.user   = { id: req.user?.id, email: req.user?.email };
      res.redirect('/app');
    });
  });

  // Google OAuth routes
  app.get('/api/auth/google', (req, res, next) => {
    if (!googleReady) return res.status(503).send('Google auth not configured.');
    return passport.authenticate('google', { scope: ['email', 'profile'] })(req, res, next);
  });

  app.get('/api/auth/google/callback', (req, res, next) => {
    if (!googleReady) return res.redirect('/?auth=failed');
    return passport.authenticate('google', { failureRedirect: '/?auth=failed' })(req, res, (err) => {
      if (err) return next(err);
      req.session.userId = req.user?.id;
      req.session.user   = { id: req.user?.id, email: req.user?.email };
      res.redirect('/app');
    });
  });

  app.get('/api/logout', (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.redirect('/');
      });
    });
  });
}

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated?.() || req.session?.userId) {
    if (!req.user && req.session?.user) req.user = req.session.user;
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
};

const isAdmin = async (req, res, next) => {
  await isAuthenticated(req, res, async () => {
    const dbUser = await getUserById(String(req.user?.id));
    if (dbUser?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.dbUser = dbUser;
    next();
  });
};

module.exports = { setupAuth, isAuthenticated, isAdmin };
