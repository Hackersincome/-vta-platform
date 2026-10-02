export type PageMeta = {
  title: string;
  description: string;
  robots: string;
  public: boolean;
  status: number;
};

const brand = 'VTA — Vector Trading Alliance';
const publicMeta: Record<string, Omit<PageMeta, 'public' | 'status'>> = {
  '/': { title: `${brand} | Precision for every market decision.`, description: 'VTA brings markets, terminal access, analytics, and product architecture into one composed trading ecosystem.', robots: 'index,follow' },
  '/markets': { title: `Markets | ${brand}`, description: 'Explore VTA’s multi-asset market structure across Forex, Metals, Energies, Indices, Stocks, and Crypto.', robots: 'index,follow' },
  '/platforms': { title: `Platforms | ${brand}`, description: 'Discover the VTA ecosystem: Web Terminal, MetaTrader platforms, wallet architecture, and automation products.', robots: 'index,follow' },
  '/web-terminal': { title: `Web Terminal | ${brand}`, description: 'Preview VTA’s connected market workspace architecture with transparent no-live-data states.', robots: 'index,follow' },
  '/mt4': { title: `MetaTrader 4 | ${brand}`, description: 'Review VTA’s prepared MT4 integration architecture and platform experience.', robots: 'index,follow' },
  '/mt5': { title: `MetaTrader 5 | ${brand}`, description: 'Review VTA’s prepared MT5 integration architecture and platform experience.', robots: 'index,follow' },
  '/robots/momentum-booster': { title: `Momentum Booster EA — Advanced V1 | ${brand}`, description: 'Explore the transparent product architecture for Momentum Booster EA — Advanced V1.', robots: 'index,follow' },
  '/analysis': { title: `Market Analysis | ${brand}`, description: 'Explore VTA’s market intelligence, research, and AI analysis architecture.', robots: 'index,follow' },
  '/news': { title: `Market News | ${brand}`, description: 'VTA market news architecture with transparent editorial availability states.', robots: 'index,follow' },
  '/calendar': { title: `Economic Calendar | ${brand}`, description: 'VTA economic calendar architecture with no fabricated live event data.', robots: 'index,follow' },
  '/about': { title: `About VTA | ${brand}`, description: 'Learn about VTA’s approach to transparent multi-asset technology and analytics.', robots: 'index,follow' },
  '/faq': { title: `FAQ | ${brand}`, description: 'Read transparent answers about VTA platforms, account access, data, and product availability.', robots: 'index,follow' },
  '/contact': { title: `Contact VTA | ${brand}`, description: 'Contact VTA for product and operating information.', robots: 'index,follow' },
  '/demo': { title: `VTA Demo Workspace | ${brand}`, description: 'VTA institutional trading command-center preview with synthetic data only.', robots: 'noindex,nofollow' },
};

export const portalPaths = [
  '/portal', '/portal/accounts', '/portal/accounts/new', '/portal/wallet', '/portal/deposit', '/portal/withdraw', '/portal/transactions', '/portal/markets', '/portal/terminal', '/portal/positions', '/portal/orders', '/portal/history', '/portal/robot', '/portal/robot/subscription', '/portal/alerts', '/portal/news', '/portal/calendar', '/portal/support', '/portal/profile', '/portal/kyc', '/portal/security', '/portal/settings',
];

export const adminPaths = [
  '/admin', '/admin/clients', '/admin/kyc', '/admin/accounts', '/admin/wallets', '/admin/deposits', '/admin/withdrawals', '/admin/transactions', '/admin/orders', '/admin/positions', '/admin/markets', '/admin/instruments', '/admin/pricing', '/admin/risk', '/admin/robot', '/admin/subscriptions', '/admin/payments', '/admin/reports', '/admin/support', '/admin/notifications', '/admin/employees', '/admin/roles', '/admin/audit', '/admin/settings',
];

function cleanPath(pathname: string) {
  const path = pathname.split('?')[0] || '/';
  return path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path;
}

export function isKnownPath(pathname: string) {
  const path = cleanPath(pathname);
  return Boolean(publicMeta[path])
    || path === '/login'
    || path === '/register'
    || portalPaths.includes(path)
    || adminPaths.includes(path)
    || /^\/admin\/clients\/[^/]+$/.test(path);
}

export function getPageMeta(pathname: string): PageMeta {
  const path = cleanPath(pathname);
  if (publicMeta[path]) return { ...publicMeta[path], public: true, status: 200 };
  if (path === '/login') return { title: `Client access | ${brand}`, description: 'Secure VTA client access.', robots: 'noindex,nofollow', public: false, status: 200 };
  if (path === '/register') return { title: `Registration | ${brand}`, description: 'VTA account registration architecture.', robots: 'noindex,nofollow', public: false, status: 200 };
  if (portalPaths.includes(path)) return { title: `Client Portal | ${brand}`, description: 'Private VTA client portal.', robots: 'noindex,nofollow', public: false, status: 200 };
  if (adminPaths.includes(path) || /^\/admin\/clients\/[^/]+$/.test(path)) return { title: `Operations | ${brand}`, description: 'Private VTA operations workspace.', robots: 'noindex,nofollow', public: false, status: 200 };
  return { title: `Page not found | ${brand}`, description: 'The requested VTA page could not be found.', robots: 'noindex,nofollow', public: false, status: 404 };
}

export function renderHead(pathname: string) {
  const meta = getPageMeta(pathname);
  const safeTitle = meta.title.replace(/&/g, '&amp;');
  const safeDescription = meta.description.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDescription}">`,
    `<meta name="robots" content="${meta.robots}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="VTA — Vector Trading Alliance">`,
    `<meta property="og:title" content="${safeTitle}">`,
    `<meta property="og:description" content="${safeDescription}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${safeTitle}">`,
    `<meta name="twitter:description" content="${safeDescription}">`,
  ].join('\n');
}
