const session = require('express-session');
const connectPg = require('connect-pg-simple');
const passport = require('passport');
const { Strategy: OpenIDConnectStrategy } = require('openid-client/passport');
const { discovery } = require('openid-client');
const { pool } = require('./db');
const { upsertUser, getUserById } = require('./storage');

function getCallbackURL() {
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0].trim()}/api/callback`;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}/api/callback`;
  }
  return 'http://localhost:5000/api/callback';
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

  const replId = process.env.REPL_ID;
  if (!replId) {
    console.warn('[auth] REPL_ID not set — Replit Auth will not work');
  } else {
    try {
      const issuer = await discovery(
        new URL('https://replit.com/oidc'),
        replId,
      );

      const callbackURL = getCallbackURL();
      console.log('[auth] Replit OIDC callback URL:', callbackURL);

      passport.use(
        'oidc',
        new OpenIDConnectStrategy(
          {
            config: issuer,
            scope: 'openid email profile',
            callbackURL,
          },
          async (tokens, done) => {
            try {
              const claims = tokens.claims();
              const id = claims.sub;
              const email = claims.email || '';
              const firstName = claims.first_name || claims.given_name || '';
              const lastName = claims.last_name || claims.family_name || '';
              const profileImageUrl = claims.profile_image_url || claims.picture || '';

              const user = await upsertUser({
                id,
                email,
                first_name: firstName,
                last_name: lastName,
                profile_image_url: profileImageUrl,
                language: 'en',
              });

              return done(null, user);
            } catch (err) {
              return done(err);
            }
          }
        )
      );
      oidcReady = true;
      console.log('[auth] Replit OIDC strategy registered successfully');
    } catch (err) {
      console.warn('[auth] Failed to set up Replit OIDC:', err.message);
    }
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await getUserById(String(id));
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  app.get('/api/login', (req, res, next) => {
    if (!oidcReady) {
      return res.status(503).send('Authentication is not configured. REPL_ID may be missing or OIDC discovery failed.');
    }
    return passport.authenticate('oidc')(req, res, next);
  });

  app.get('/api/callback', (req, res, next) => {
    if (!oidcReady) {
      return res.redirect('/?auth=failed');
    }
    return passport.authenticate('oidc', { failureRedirect: '/?auth=failed' })(req, res, (err) => {
      if (err) return next(err);
      req.session.userId = req.user?.id;
      req.session.user = { id: req.user?.id, email: req.user?.email };
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
