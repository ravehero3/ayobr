const session        = require('express-session');
const connectPg      = require('connect-pg-simple');
const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool }       = require('./db');
const { upsertUser, getUserById } = require('./storage');

/* ── Session ─────────────────────────────────────────────── */
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 7 days
  const PgStore    = connectPg(session);
  const sessionStore = new PgStore({
    pool,
    createTableIfMissing: false,
    ttl: sessionTtl / 1000,
    tableName: 'sessions',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  return session({
    secret: process.env.SESSION_SECRET || 'typebeatz-dev-secret-change-in-prod',
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

/* ── Google OAuth Strategy ───────────────────────────────── */
function getCallbackURL() {
  if (process.env.APP_URL)    return `${process.env.APP_URL}/api/callback`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}/api/callback`;
  if (process.env.REPLIT_DOMAINS) return `https://${process.env.REPLIT_DOMAINS.split(',')[0].trim()}/api/callback`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/callback`;
  return 'http://localhost:3001/api/callback';
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  getCallbackURL(),
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email        = profile.emails?.[0]?.value || '';
        const firstName    = profile.name?.givenName  || '';
        const lastName     = profile.name?.familyName || '';
        const profileImage = profile.photos?.[0]?.value || '';

        const user = await upsertUser({
          id: profile.id,
          email,
          first_name:        firstName,
          last_name:         lastName,
          profile_image_url: profileImage,
        });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
} else {
  console.warn('[auth] Google OAuth strategy not registered — GOOGLE_CLIENT_ID/SECRET missing');
}

passport.serializeUser((user, done)   => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(String(id));
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

/* ── Mount auth routes ───────────────────────────────────── */
async function setupAuth(app) {
  app.set('trust proxy', 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  /* Kick off Google login */
  app.get('/api/login', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).json({ message: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  });

  /* Google redirects here after the user grants access */
  app.get('/api/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      // Store userId for backward-compat with isAuthenticated middleware
      req.session.userId = req.user?.id;
      req.session.user   = { id: req.user?.id, email: req.user?.email };
      res.redirect('/app');
    }
  );

  app.get('/api/logout', (req, res) => {
    req.logout(() => {
      req.session.destroy(() => res.redirect('/'));
    });
  });
}

/* ── Auth middleware ─────────────────────────────────────── */
const isAuthenticated = (req, res, next) => {
  // Support both passport session (req.user) and manual userId session
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
