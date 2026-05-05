const passport = require('passport');
const session = require('express-session');
const connectPg = require('connect-pg-simple');
const { Strategy } = require('openid-client/passport');
const client = require('openid-client');
const memoize = require('memoizee');
const { pool } = require('./db');
const { upsertUser, getUserById } = require('./storage');

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL || 'https://replit.com/oidc'),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1000 }
);

function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    pool,
    createTableIfMissing: false,
    ttl: sessionTtl / 1000,
    tableName: 'sessions'
  });

  // In Replit, all traffic comes through HTTPS proxy even in dev.
  // trust proxy + sameSite:none + secure:true is required for cookies to work
  // across the Replit proxy iframe in both dev and production.
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

function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function setupAuth(app) {
  app.set('trust proxy', 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();
  const registeredStrategies = new Set();

  // Use the real public domain for callbacks, not localhost
  const getPublicDomain = (reqHostname) => {
    if (process.env.REPLIT_DEV_DOMAIN) return process.env.REPLIT_DEV_DOMAIN;
    if (process.env.REPLIT_DOMAINS) return process.env.REPLIT_DOMAINS.split(',')[0].trim();
    return reqHostname;
  };

  const ensureStrategy = (domain) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: 'openid email profile offline_access',
          callbackURL: `https://${domain}/api/callback`
        },
        async (tokens, verified) => {
          const user = {};
          updateUserSession(user, tokens);
          const claims = tokens.claims();
          await upsertUser({
            id: claims.sub,
            email: claims.email,
            first_name: claims.first_name,
            last_name: claims.last_name,
            profile_image_url: claims.profile_image_url
          });
          verified(null, user);
        }
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));

  app.get('/api/login', (req, res, next) => {
    const domain = getPublicDomain(req.hostname);
    ensureStrategy(domain);
    passport.authenticate(`replitauth:${domain}`, {
      prompt: 'login consent',
      scope: ['openid', 'email', 'profile', 'offline_access']
    })(req, res, next);
  });

  app.get('/api/callback', (req, res, next) => {
    const domain = getPublicDomain(req.hostname);
    ensureStrategy(domain);
    passport.authenticate(`replitauth:${domain}`, {
      successRedirect: '/app',
      failureRedirect: '/login'
    })(req, res, next);
  });

  app.get('/api/logout', (req, res) => {
    req.logout(async () => {
      try {
        const config = await getOidcConfig();
        const domain = getPublicDomain(req.hostname);
        const endSessionUrl = client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `https://${domain}`
        });
        res.redirect(endSessionUrl.href);
      } catch {
        res.redirect('/');
      }
    });
  });
}

const isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) return next();

  if (!user.refresh_token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, user.refresh_token);
    updateUserSession(user, tokenResponse);
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

const isAdmin = async (req, res, next) => {
  await isAuthenticated(req, res, async () => {
    const userId = req.user.claims.sub;
    const dbUser = await getUserById(userId);
    if (dbUser?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.dbUser = dbUser;
    next();
  });
};

module.exports = { setupAuth, isAuthenticated, isAdmin };
