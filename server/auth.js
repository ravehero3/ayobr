const session = require('express-session');
const connectPg = require('connect-pg-simple');
const { discovery, authorizationCodeGrant, buildAuthorizationUrl, randomPKCECodeVerifier, calculatePKCECodeChallenge } = require('openid-client');
const { pool } = require('./db');
const { upsertUser, getUserById } = require('./storage');

let _oidcConfig = null;

async function getOidcConfig() {
  if (_oidcConfig) return _oidcConfig;
  const issuer = new URL('https://replit.com/oidc');
  const clientId = process.env.REPL_ID;
  _oidcConfig = await discovery(issuer, clientId);
  return _oidcConfig;
}

function getBaseURL() {
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  if (process.env.REPLIT_DOMAINS) return `https://${process.env.REPLIT_DOMAINS.split(',')[0].trim()}`;
  return 'http://localhost:3001';
}

function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    pool,
    createTableIfMissing: false,
    ttl: sessionTtl / 1000,
    tableName: 'sessions'
  });

  const isReplit = !!(process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS);

  return session({
    secret: process.env.SESSION_SECRET || 'typebeatz-dev-secret-change-in-prod',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isReplit,
      sameSite: isReplit ? 'none' : 'lax',
      maxAge: sessionTtl
    }
  });
}

async function setupAuth(app) {
  app.set('trust proxy', 1);
  app.use(getSession());

  app.get('/api/login', async (req, res) => {
    try {
      const config = await getOidcConfig();
      const codeVerifier = randomPKCECodeVerifier();
      const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
      const callbackURL = `${getBaseURL()}/api/callback`;
      const state = Math.random().toString(36).slice(2);

      req.session.codeVerifier = codeVerifier;
      req.session.oauthState = state;
      await new Promise((resolve, reject) =>
        req.session.save(err => err ? reject(err) : resolve())
      );

      const authUrl = buildAuthorizationUrl(config, {
        redirect_uri: callbackURL,
        scope: 'openid email profile',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state
      });
      res.redirect(authUrl.href);
    } catch (err) {
      console.error('Login error:', err);
      res.redirect('/login');
    }
  });

  app.get('/api/callback', async (req, res) => {
    try {
      const config = await getOidcConfig();
      const callbackURL = `${getBaseURL()}/api/callback`;
      const codeVerifier = req.session.codeVerifier;
      const expectedState = req.session.oauthState;

      const tokens = await authorizationCodeGrant(config, new URL(req.url, callbackURL), {
        pkceCodeVerifier: codeVerifier,
        expectedState
      });

      const claims = tokens.claims();
      const userId = String(claims.sub);
      const email = claims.email || '';
      const nameParts = (claims.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const profileImage = claims.picture || '';

      await upsertUser({ id: userId, email, first_name: firstName, last_name: lastName, profile_image_url: profileImage });

      req.session.userId = userId;
      req.session.user = { id: userId, email };
      delete req.session.codeVerifier;
      delete req.session.oauthState;
      await new Promise((resolve, reject) =>
        req.session.save(err => err ? reject(err) : resolve())
      );
      res.redirect('/app');
    } catch (err) {
      console.error('Callback error:', err);
      res.redirect('/login');
    }
  });

  app.get('/api/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
  });
}

const isAuthenticated = async (req, res, next) => {
  if (req.session?.userId) {
    req.user = req.session.user;
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
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
