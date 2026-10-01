import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { SignJWT, jwtVerify } from 'jose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 3000);
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "script-src 'self'",
    "connect-src 'self' ws: wss:",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '));
  next();
});

function cookies(header = '') {
  return Object.fromEntries(header.split(';').map((item) => {
    const index = item.indexOf('=');
    return index === -1 ? [] : [item.slice(0, index).trim(), decodeURIComponent(item.slice(index + 1).trim())];
  }).filter((entry) => entry.length));
}

function sessionSecret() {
  const secret = process.env.MANUS_JWT_SECRET;
  return secret ? new TextEncoder().encode(secret) : null;
}

async function currentUser(req) {
  const secret = sessionSecret();
  const token = cookies(req.headers.cookie).webdev_app_session;
  if (!secret || !token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    if (process.env.MANUS_PROJECT_ID && payload.appId !== process.env.MANUS_PROJECT_ID) return null;
    if (typeof payload.openId !== 'string') return null;
    return { openId: payload.openId, name: typeof payload.name === 'string' ? payload.name : 'VTA client' };
  } catch {
    return null;
  }
}

function isAdmin(user) {
  const allowed = (process.env.VTA_ADMIN_OPEN_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  return Boolean(user && allowed.includes(user.openId));
}

function secureCookie(res, name, value, maxAge) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge,
    path: '/',
  });
}

function publicOrigin() {
  const value = process.env.VTA_PUBLIC_ORIGIN;
  return value && /^https:\/\//.test(value) ? value.replace(/\/$/, '') : null;
}

const portalRoutePaths = new Set([
  '/portal', '/portal/accounts', '/portal/accounts/new', '/portal/wallet', '/portal/deposit', '/portal/withdraw', '/portal/transactions', '/portal/markets', '/portal/terminal', '/portal/positions', '/portal/orders', '/portal/history', '/portal/robot', '/portal/robot/subscription', '/portal/alerts', '/portal/news', '/portal/calendar', '/portal/support', '/portal/profile', '/portal/kyc', '/portal/security', '/portal/settings',
]);
const adminRoutePaths = new Set([
  '/admin', '/admin/clients', '/admin/kyc', '/admin/accounts', '/admin/wallets', '/admin/deposits', '/admin/withdrawals', '/admin/transactions', '/admin/orders', '/admin/positions', '/admin/markets', '/admin/instruments', '/admin/pricing', '/admin/risk', '/admin/robot', '/admin/subscriptions', '/admin/payments', '/admin/reports', '/admin/support', '/admin/notifications', '/admin/employees', '/admin/roles', '/admin/audit', '/admin/settings',
]);
const publicSitemapPaths = ['/', '/markets', '/platforms', '/web-terminal', '/mt4', '/mt5', '/robots/momentum-booster', '/news', '/calendar', '/analysis', '/about', '/faq', '/contact'];
function isKnownPrivateRoute(pathname) {
  return portalRoutePaths.has(pathname) || adminRoutePaths.has(pathname) || /^\/admin\/clients\/[^/]+$/.test(pathname);
}

app.get('/_app/health', (_req, res) => {
  res.type('text/plain').send('ok');
});

app.get('/robots.txt', (_req, res) => {
  const origin = publicOrigin();
  const lines = ['User-agent: *', 'Allow: /', 'Disallow: /portal/', 'Disallow: /admin/', 'Disallow: /api/', 'Disallow: /_app/'];
  if (origin) lines.push(`Sitemap: ${origin}/sitemap.xml`);
  else lines.push('# Sitemap is published only after VTA_PUBLIC_ORIGIN is configured.');
  res.type('text/plain').send(`${lines.join('\n')}\n`);
});

app.get('/sitemap.xml', (_req, res) => {
  const origin = publicOrigin();
  if (!origin) {
    res.status(503).type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><error>VTA_PUBLIC_ORIGIN is required before publishing a sitemap.</error>');
    return;
  }
  const urls = publicSitemapPaths.map((pathname) => `<url><loc>${origin}${pathname}</loc></url>`).join('');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});

app.use('/api', (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(404).json({ error: 'not_found', message: `No API route exists for ${req.originalUrl}` });
});

app.get('/auth/login', (req, res) => {
  const origin = publicOrigin();
  const portal = process.env.MANUS_OAUTH_PORTAL_URL;
  const appId = process.env.MANUS_PROJECT_ID;
  if (!origin || !portal || !appId) {
    res.status(503).json({ error: 'identity_not_configured', message: 'VTA application identity is not configured for this environment.' });
    return;
  }
  const nonce = crypto.randomUUID();
  secureCookie(res, 'vta_oauth_state', nonce, 5 * 60 * 1000);
  const state = Buffer.from(JSON.stringify({ nonce, redirectUri: `${origin}/auth/callback` })).toString('base64url');
  const endpoint = new URL('/app-auth', portal);
  endpoint.searchParams.set('appId', appId);
  endpoint.searchParams.set('redirectUri', `${origin}/auth/callback`);
  endpoint.searchParams.set('state', state);
  endpoint.searchParams.set('responseType', 'code');
  res.redirect(302, endpoint.toString());
});

app.get('/auth/callback', async (req, res) => {
  const origin = publicOrigin();
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const expectedNonce = cookies(req.headers.cookie).vta_oauth_state;
  const secret = sessionSecret();
  if (!origin || !code || !state || !expectedNonce || !secret) {
    res.status(400).send('VTA identity callback could not be verified.');
    return;
  }
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    if (parsed.nonce !== expectedNonce || parsed.redirectUri !== `${origin}/auth/callback`) throw new Error('state_mismatch');
    const exchange = await fetch(`${process.env.MANUS_OAUTH_API_URL}/webdev.v1.WebDevAuthPublicService/ExchangeToken`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clientId: process.env.MANUS_PROJECT_ID, grantType: 'authorization_code', code, redirectUri: `${origin}/auth/callback` }),
    });
    if (!exchange.ok) throw new Error('exchange_failed');
    const token = await exchange.json();
    const infoResponse = await fetch(`${process.env.MANUS_OAUTH_API_URL}/webdev.v1.WebDevAuthPublicService/GetUserInfo`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accessToken: token.accessToken }),
    });
    if (!infoResponse.ok) throw new Error('identity_failed');
    const user = await infoResponse.json();
    const session = await new SignJWT({ openId: user.openId, name: user.name || '', appId: process.env.MANUS_PROJECT_ID })
      .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(secret);
    secureCookie(res, 'webdev_app_session', session, 8 * 60 * 60 * 1000);
    res.clearCookie('vta_oauth_state', { path: '/', secure: true, sameSite: 'none' });
    res.redirect(302, '/portal');
  } catch {
    res.status(400).send('VTA identity callback could not be verified.');
  }
});

app.post('/auth/logout', (_req, res) => {
  res.clearCookie('webdev_app_session', { path: '/', secure: true, sameSite: 'none' });
  res.status(204).end();
});

let vite;
if (!isProduction) {
  const { createServer } = await import('vite');
  vite = await createServer({
    root,
    appType: 'custom',
    server: { middlewareMode: true, hmr: false },
  });
  app.use(vite.middlewares);
} else {
  app.use('/assets', express.static(path.join(root, 'dist/assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(path.join(root, 'dist'), { index: false, maxAge: 0 }));
}

async function renderPage(req, res, forcedUrl, forcedStatus) {
  const url = forcedUrl || req.originalUrl;
  try {
    let template;
    let render;
    if (!isProduction) {
      template = await fs.readFile(path.join(root, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      ({ render } = await vite.ssrLoadModule('/src/entry-server.tsx'));
    } else {
      template = await fs.readFile(path.join(root, 'dist/index.html'), 'utf-8');
      ({ render } = await import(path.join(root, 'dist/server/entry-server.js')));
    }
    const output = render(url);
    const status = forcedStatus || output.status;
    const privatePath = url.startsWith('/portal') || url.startsWith('/admin') || url.startsWith('/login') || url.startsWith('/register');
    res.status(status);
    res.setHeader('Cache-Control', privatePath ? 'private, no-store' : 'no-cache');
    res.type('html').send(template.replace('<!--head-->', output.head).replace('<!--ssr-outlet-->', output.appHtml));
  } catch (error) {
    if (!isProduction) vite?.ssrFixStacktrace(error);
    console.error(error);
    res.status(500).type('text/plain').send('VTA could not render this page.');
  }
}

app.use(async (req, res) => {
  const pathname = req.path;
  if ((pathname.startsWith('/portal') || pathname.startsWith('/admin')) && !isKnownPrivateRoute(pathname)) {
    return renderPage(req, res, req.originalUrl, 404);
  }
  if (pathname.startsWith('/portal')) {
    const user = await currentUser(req);
    if (!user) return res.redirect(302, `/login?next=${encodeURIComponent(req.originalUrl)}`);
  }
  if (pathname.startsWith('/admin')) {
    const user = await currentUser(req);
    if (!user) return res.redirect(302, `/login?next=${encodeURIComponent(req.originalUrl)}`);
    if (!isAdmin(user)) return renderPage(req, res, '/admin?denied=1', 403);
  }
  return renderPage(req, res);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`VTA listening on http://0.0.0.0:${port}`);
});
