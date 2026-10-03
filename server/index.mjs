import crypto from 'node:crypto';
import { createServer } from 'node:http';
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
    "img-src 'self' data: https://hebbkx1anhila5yf.public.blob.vercel-storage.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    isProduction ? "script-src 'self'" : "script-src 'self' 'unsafe-inline'",
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
const previewPortalSurfaces = new Set(['deposit', 'withdraw']);
function previewEnabled() {
  return process.env.VTA_ENABLE_PREVIEW_PORTAL === 'true' && typeof process.env.VTA_PREVIEW_TOKEN === 'string' && process.env.VTA_PREVIEW_TOKEN.length >= 16;
}
function previewSecret() {
  const token = process.env.VTA_PREVIEW_TOKEN;
  return token ? new TextEncoder().encode(crypto.createHash('sha256').update(`vta-preview:${token}`).digest('hex')) : null;
}
function safeTokenMatch(candidate, expected) {
  if (!candidate || !expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
async function previewSessionAllowed(req, pathname) {
  if (!previewEnabled() || !pathname.startsWith('/portal/')) return false;
  const surface = pathname.slice('/portal/'.length).split('/')[0];
  if (!previewPortalSurfaces.has(surface)) return false;
  const secret = previewSecret();
  const token = cookies(req.headers.cookie).vta_preview_session;
  if (!secret || !token) return false;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return payload.preview === true && Array.isArray(payload.surfaces) && payload.surfaces.includes(surface);
  } catch {
    return false;
  }
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

const marketSymbolMap = new Map([
  ['BTC/USDT', 'BTCUSDT'], ['ETH/USDT', 'ETHUSDT'], ['BNB/USDT', 'BNBUSDT'], ['SOL/USDT', 'SOLUSDT'],
]);
const marketIntervalMap = new Map([
  ['1m', '1m'], ['3m', '3m'], ['5m', '5m'], ['15m', '15m'], ['30m', '30m'],
  ['1h', '1h'], ['2h', '2h'], ['4h', '4h'], ['1d', '1d'], ['1w', '1w'],
]);
app.get('/api/market/klines', async (req, res) => {
  const symbol = typeof req.query.symbol === 'string' ? req.query.symbol : '';
  const interval = typeof req.query.interval === 'string' ? req.query.interval.toLowerCase() : '1h';
  const providerSymbol = marketSymbolMap.get(symbol);
  const providerInterval = marketIntervalMap.get(interval);
  const requestedLimit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 500;
  const limit = Number.isInteger(requestedLimit) ? Math.min(1000, Math.max(1, requestedLimit)) : 500;
  const startTime = typeof req.query.startTime === 'string' ? Number(req.query.startTime) : undefined;
  const endTime = typeof req.query.endTime === 'string' ? Number(req.query.endTime) : undefined;
  res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=45');
  if (!providerSymbol || !providerInterval) {
    return res.status(404).json({ state: 'UNAVAILABLE', bars: [], message: 'Historical data is not available for this instrument or timeframe.' });
  }
  if ((startTime !== undefined && (!Number.isSafeInteger(startTime) || startTime < 0)) ||
      (endTime !== undefined && (!Number.isSafeInteger(endTime) || endTime < 0)) ||
      (startTime !== undefined && endTime !== undefined && startTime >= endTime)) {
    return res.status(400).json({ state: 'UNAVAILABLE', bars: [], message: 'The requested historical date range is invalid.' });
  }
  try {
    const providerUrl = new URL('https://api.binance.com/api/v3/klines');
    providerUrl.searchParams.set('symbol', providerSymbol);
    providerUrl.searchParams.set('interval', providerInterval);
    providerUrl.searchParams.set('limit', String(limit));
    if (startTime !== undefined) providerUrl.searchParams.set('startTime', String(startTime));
    if (endTime !== undefined) providerUrl.searchParams.set('endTime', String(endTime));
    const response = await fetch(providerUrl, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`provider_${response.status}`);
    const rows = await response.json();
    const completedRows = Array.isArray(rows) ? rows.filter((row) => Number(row[6]) < Date.now()) : [];
    const bars = completedRows.map((row) => ({ time: Math.floor(Number(row[0]) / 1000), open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]), volume: Number(row[5]) })).filter((bar) => Object.values(bar).every(Number.isFinite));
    if (!bars.length) return res.json({ state: 'UNAVAILABLE', source: 'Binance public market data API', symbol, interval, bars: [], message: 'No completed historical candles were returned for this range.' });
    return res.json({ state: 'HISTORICAL DATA', source: 'Binance public market data API · completed candles', symbol, interval, bars });
  } catch (error) {
    console.error('market_data_unavailable', error);
    return res.status(502).json({ state: 'UNAVAILABLE', bars: [], message: 'Historical market data provider is unavailable. Retry when the source is reachable.' });
  }
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
app.get('/__preview/portal/:surface', async (req, res) => {
  const surface = typeof req.params.surface === 'string' ? req.params.surface : '';
  if (!previewPortalSurfaces.has(surface)) return res.status(404).send('Preview surface not found.');
  if (!previewEnabled()) return res.status(404).send('Preview Portal is disabled.');
  const candidate = typeof req.query.token === 'string' ? req.query.token : '';
  if (!safeTokenMatch(candidate, process.env.VTA_PREVIEW_TOKEN)) return res.status(401).send('Preview token is invalid.');
  const secret = previewSecret();
  const session = await new SignJWT({ preview: true, surfaces: [...previewPortalSurfaces] })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30m').sign(secret);
  secureCookie(res, 'vta_preview_session', session, 30 * 60 * 1000);
  res.redirect(302, `/portal/${surface}`);
});

const httpServer = createServer(app);
let vite;
if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  vite = await createViteServer({
    root,
    appType: 'custom',
    server: { middlewareMode: true, hmr: { server: httpServer } },
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
    const previewAllowed = await previewSessionAllowed(req, pathname);
    const user = previewAllowed ? null : await currentUser(req);
    if (!previewAllowed && !user) return res.redirect(302, `/login?next=${encodeURIComponent(req.originalUrl)}`);
  }
  if (pathname.startsWith('/admin')) {
    const user = await currentUser(req);
    if (!user) return res.redirect(302, `/login?next=${encodeURIComponent(req.originalUrl)}`);
    if (!isAdmin(user)) return renderPage(req, res, '/admin?denied=1', 403);
  }
  return renderPage(req, res);
});

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`VTA listening on http://0.0.0.0:${port}`);
});
