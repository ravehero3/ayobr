const passport = require('passport');
const session = require('express-session');
const connectPg = require('connect-pg-simple');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('./db');
const { upsertUser, getUserById } = require('./storage');

function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    pool,
    createTableIfMissing: false,
    ttl: sessionTtl / 1000,
    tableName: 'sessions'
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const isReplit = !!(process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS);

  return session({
    secret: process.env.SESSION_SECRET || 'typebeatz-dev-secret-change-in-prod',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction || isReplit,
      sameSite: isProduction || isReplit ? 'none' : 'lax',
      maxAge: sessionTtl
    }
  });
}

function getCallbackURL(req) {
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}/api/callback`;
  if (process.env.REPLIT_DOMAINS) return `https://${process.env.REPLIT_DOMAINS.split(',')[0].trim()}/api/callback`;
  const host = req?.headers?.host || 'localhost:3001';
  const proto = req?.headers?.['x-forwarded-proto'] || 'https';
  return `${proto}://${host}/api/callback`;
}

async function setupAuth(app) {
  app.set('trust proxy', 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));

  app.get('/api/login', (req, res, next) => {
    const callbackURL = getCallbackURL(req);
    passport.use(new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          await upsertUser({
            id: profile.id,
            email: profile.emails?.[0]?.value || '',
            first_name: profile.name?.givenName || '',
            last_name: profile.name?.familyName || '',
            profile_image_url: profile.photos?.[0]?.value || ''
          });
          done(null, { id: profile.id, email: profile.emails?.[0]?.value || '' });
        } catch (err) {
          done(err);
        }
      }
    ));
    passport.authenticate('google', {
      scope: ['openid', 'email', 'profile']
    })(req, res, next);
  });

  app.get('/api/callback', (req, res, next) => {
    passport.authenticate('google', {
      successRedirect: '/app',
      failureRedirect: '/login'
    })(req, res, next);
  });

  app.get('/api/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });
}

const isAuthenticated = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return next();
};

const isAdmin = async (req, res, next) => {
  await isAuthenticated(req, res, async () => {
    const dbUser = await getUserById(req.user.id);
    if (dbUser?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.dbUser = dbUser;
    next();
  });
};

module.exports = { setupAuth, isAuthenticated, isAdmin };
