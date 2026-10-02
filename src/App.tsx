import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, Bell, Bot, BriefcaseBusiness,
  CalendarDays, Check, ChevronDown, CircleDollarSign, Clock3, Command, CreditCard,
  Database, ExternalLink, FileText, Globe2, HelpCircle, Info, KeyRound, LayoutDashboard,
  LineChart, LockKeyhole, Menu, MessageSquare, Package, PanelLeft, Plus, Radar,
  Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles, TerminalSquare,
  UserRound, Users, WalletCards, X, Zap, Landmark,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { getPageMeta } from './meta';
import { browserMarketDataProvider, instrumentRegistry, type AssetClass, type Bar, type Instrument } from './terminal-data';

type IconItem = { label: string; to: string; icon: LucideIcon; note?: string };
type ProductCard = { title: string; text: string; icon: LucideIcon; to: string; flag: string };

const publicNav = [
  { label: 'Markets', to: '/markets' },
  { label: 'Platforms', to: '/platforms' },
  { label: 'Analysis', to: '/analysis' },
  { label: 'Momentum Booster', to: '/robots/momentum-booster' },
];

const products: ProductCard[] = [
  { title: 'Web Terminal', text: 'A composed workspace for market context, order architecture and account access.', icon: TerminalSquare, to: '/web-terminal', flag: 'NO LIVE CONNECTION' },
  { title: 'MetaTrader 4', text: 'Prepared platform architecture for established workflow continuity.', icon: LineChart, to: '/mt4', flag: 'INTEGRATION PREPARED' },
  { title: 'MetaTrader 5', text: 'A multi-asset platform experience with an integration-ready VTA layer.', icon: BarChart3, to: '/mt5', flag: 'INTEGRATION PREPARED' },
  { title: 'Momentum Booster', text: 'Advanced V1 source integration with transparent runtime states.', icon: Bot, to: '/robots/momentum-booster', flag: 'INACTIVE' },
];

const ecosystem = [
  { title: 'Markets', icon: Globe2, text: 'Cross-asset market structure with transparent data availability.' },
  { title: 'Terminal', icon: TerminalSquare, text: 'A focused workspace designed around order and position visibility.' },
  { title: 'Portfolio', icon: BriefcaseBusiness, text: 'Account, wallet and funding architecture without fictional balances.' },
  { title: 'Intelligence', icon: Sparkles, text: 'Research and AI modules that disclose when analysis is unavailable.' },
  { title: 'Automation', icon: Bot, text: 'Robot status and configuration surfaces built for legitimate linkage.' },
  { title: 'Operations', icon: ShieldCheck, text: 'A governed administrative layer for future operational workflows.' },
];

const marketFamilies = [
  { name: 'Forex', symbol: 'FX', text: 'Major, minor and emerging-market currency pairs.', accent: 'emerald' },
  { name: 'Metals', symbol: 'MT', text: 'Precious and industrial metals market architecture.', accent: 'amber' },
  { name: 'Energies', symbol: 'EN', text: 'Energy instruments and volatility-aware research spaces.', accent: 'red' },
  { name: 'Indices', symbol: 'IX', text: 'Global equity index market structure.', accent: 'blue' },
  { name: 'Stocks', symbol: 'EQ', text: 'Equity instrument discovery and research architecture.', accent: 'violet' },
  { name: 'Crypto', symbol: 'CR', text: 'Digital-asset market research with no implied custody.', accent: 'mint' },
];

const portalNav: IconItem[] = [
  { label: 'Overview', to: '/portal', icon: LayoutDashboard },
  { label: 'Accounts', to: '/portal/accounts', icon: BriefcaseBusiness },
  { label: 'Create account', to: '/portal/accounts/new', icon: Plus },
  { label: 'Wallet', to: '/portal/wallet', icon: WalletCards },
  { label: 'Deposit', to: '/portal/deposit', icon: Plus },
  { label: 'Withdraw', to: '/portal/withdraw', icon: ArrowUpRight },
  { label: 'Transactions', to: '/portal/transactions', icon: Clock3 },
  { label: 'Markets', to: '/portal/markets', icon: Globe2 },
  { label: 'Terminal', to: '/portal/terminal', icon: TerminalSquare },
  { label: 'Positions', to: '/portal/positions', icon: Activity },
  { label: 'Orders', to: '/portal/orders', icon: FileText },
  { label: 'History', to: '/portal/history', icon: CalendarDays },
  { label: 'Momentum Booster', to: '/portal/robot', icon: Bot },
  { label: 'Alerts', to: '/portal/alerts', icon: Bell },
  { label: 'News', to: '/portal/news', icon: MessageSquare },
  { label: 'Calendar', to: '/portal/calendar', icon: CalendarDays },
  { label: 'Support', to: '/portal/support', icon: HelpCircle },
  { label: 'Profile', to: '/portal/profile', icon: UserRound },
  { label: 'KYC', to: '/portal/kyc', icon: ShieldCheck },
  { label: 'Security', to: '/portal/security', icon: KeyRound },
  { label: 'Settings', to: '/portal/settings', icon: Settings },
];

const adminNav: IconItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Clients', to: '/admin/clients', icon: Users },
  { label: 'KYC', to: '/admin/kyc', icon: ShieldCheck },
  { label: 'Accounts', to: '/admin/accounts', icon: BriefcaseBusiness },
  { label: 'Wallets', to: '/admin/wallets', icon: WalletCards },
  { label: 'Deposits', to: '/admin/deposits', icon: Plus },
  { label: 'Withdrawals', to: '/admin/withdrawals', icon: ArrowUpRight },
  { label: 'Transactions', to: '/admin/transactions', icon: Clock3 },
  { label: 'Orders', to: '/admin/orders', icon: FileText },
  { label: 'Positions', to: '/admin/positions', icon: Activity },
  { label: 'Markets', to: '/admin/markets', icon: Globe2 },
  { label: 'Instruments', to: '/admin/instruments', icon: Package },
  { label: 'Pricing', to: '/admin/pricing', icon: CircleDollarSign },
  { label: 'Risk', to: '/admin/risk', icon: Radar },
  { label: 'Robot', to: '/admin/robot', icon: Bot },
  { label: 'Subscriptions', to: '/admin/subscriptions', icon: CreditCard },
  { label: 'Payments', to: '/admin/payments', icon: CircleDollarSign },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
  { label: 'Support', to: '/admin/support', icon: MessageSquare },
  { label: 'Notifications', to: '/admin/notifications', icon: Bell },
  { label: 'Employees', to: '/admin/employees', icon: Users },
  { label: 'Roles', to: '/admin/roles', icon: LockKeyhole },
  { label: 'Audit', to: '/admin/audit', icon: FileText },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

function usePageMeta() {
  const location = useLocation();
  useEffect(() => {
    const meta = getPageMeta(location.pathname);
    document.title = meta.title;
    const upsert = (selector: string, attribute: 'name' | 'property', key: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = value;
    };
    upsert('meta[name="description"]', 'name', 'description', meta.description);
    upsert('meta[name="robots"]', 'name', 'robots', meta.robots);
    upsert('meta[property="og:title"]', 'property', 'og:title', meta.title);
    upsert('meta[property="og:description"]', 'property', 'og:description', meta.description);
    // Canonicals are emitted only by the server when a real VTA_PUBLIC_ORIGIN is configured.
    // Never infer a production canonical from a Preview or internal browser origin.
    document.head.querySelector('link[rel="canonical"]')?.remove();
  }, [location.pathname]);
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link className={`brand ${compact ? 'brand--compact' : ''}`} to="/" aria-label="VTA home">
    <img src="/logo-mark.svg" width="36" height="36" alt="" />
    <span><strong>VTA</strong><em>VECTOR TRADE &amp; ANALYTICS</em></span>
  </Link>;
}

function Status({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'amber' | 'risk' }) {
  return <span className={`status status--${tone}`}><i />{children}</span>;
}

function ArrowLink({ to, children, className = '' }: { to: string; children: React.ReactNode; className?: string }) {
  return <Link className={`arrow-link ${className}`} to={to}>{children}<ArrowRight size={16} aria-hidden="true" /></Link>;
}

function PublicHeader() {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <div className="shell header-inner">
      <Brand />
      <nav className="desktop-nav" aria-label="Primary navigation">
        {publicNav.map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}
        <NavLink to="/about">About</NavLink>
      </nav>
      <div className="header-actions">
        <Link className="text-link" to="/login">Client login</Link>
        <Link className="button button--small" to="/register">Open portal <ArrowUpRight size={15} /></Link>
      </div>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation" aria-label="Toggle navigation">
        {open ? <X /> : <Menu />}
      </button>
    </div>
    <nav id="mobile-navigation" className={`mobile-nav ${open ? 'mobile-nav--open' : ''}`} aria-label="Mobile navigation">
      {publicNav.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>{item.label}</NavLink>)}
      <NavLink to="/about" onClick={() => setOpen(false)}>About</NavLink>
      <NavLink to="/login" onClick={() => setOpen(false)}>Client login</NavLink>
      <NavLink className="button" to="/register" onClick={() => setOpen(false)}>Open portal <ArrowUpRight size={15} /></NavLink>
    </nav>
  </header>;
}

function Footer() {
  return <footer className="site-footer">
    <div className="shell footer-grid">
      <div><Brand /><p>Precision for every market decision.</p><span className="source-note">Earth texture: NASA Black Marble. No live market connection.</span></div>
      <div><h2>Explore</h2><Link to="/markets">Markets</Link><Link to="/platforms">Platforms</Link><Link to="/analysis">Analysis</Link></div>
      <div><h2>Access</h2><Link to="/web-terminal">Web Terminal</Link><Link to="/robots/momentum-booster">Momentum Booster</Link><Link to="/login">Client login</Link></div>
      <div><h2>Company</h2><Link to="/about">About</Link><Link to="/faq">FAQ</Link><Link to="/contact">Contact</Link></div>
    </div>
    <div className="shell footer-bottom"><span>© 2026 VTA — Vector Trade &amp; Analytics</span><span>Product architecture preview · No financial service is active here</span></div>
  </footer>;
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return <><PublicHeader /><main id="main-content">{children}</main><Footer /></>;
}

function PageIntro({ eyebrow, title, text, actions }: { eyebrow: string; title: string; text: string; actions?: React.ReactNode }) {
  return <section className="page-intro"><div className="shell"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p>{actions && <div className="hero-actions">{actions}</div>}</div></section>;
}

function SectionHeading({ label, title, copy, link }: { label: string; title: string; copy?: string; link?: { to: string; text: string } }) {
  return <div className="section-heading"><div><span className="eyebrow">{label}</span><h2>{title}</h2>{copy && <p>{copy}</p>}</div>{link && <ArrowLink to={link.to}>{link.text}</ArrowLink>}</div>;
}

function MiniGraph({ accent = 'var(--mint)' }: { accent?: string }) {
  return <svg className="mini-graph" viewBox="0 0 260 70" role="img" aria-label="Illustrative data line"><path d="M0 56H260M0 32H260M0 9H260" stroke="rgba(203,233,223,.09)" /><path d="M0 48 C28 38, 45 58, 70 42 S112 23, 137 38 S176 48, 197 20 S235 34,260 10" fill="none" stroke={accent} strokeWidth="2" /><circle cx="260" cy="10" r="4" fill={accent} /></svg>;
}

function EmptyState({ icon: Icon = Database, title, text, action }: { icon?: LucideIcon; title: string; text: string; action?: React.ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={22} /></div><div><h3>{title}</h3><p>{text}</p>{action}</div></div>;
}

function HomePage() {
  return <>
    <section className="hero"><div className="shell hero-grid">
      <div className="hero-copy"><span className="eyebrow">UNIFIED. INTELLIGENT. AHEAD.</span><h1>Precision for every <span>market decision.</span></h1><p>VTA brings multi-asset market access, analytics and technology into a measured ecosystem—built around clarity before complexity.</p><div className="hero-actions"><Link className="button" to="/register">Explore VTA access <ArrowUpRight size={17} /></Link><Link className="button button--ghost" to="/web-terminal">View Web Terminal <TerminalSquare size={17} /></Link></div><div className="connection-line"><Status>NOT CONNECTED</Status><span>Connect a legitimate VTA account when access is available.</span></div></div>
      <div className="globe-stage" aria-label="Illustrative VTA digital globe"><div className="globe-grid" /><img src="/assets/nasa-black-marble.jpg" alt="" /><div className="orbit orbit--one" /><div className="orbit orbit--two" /><div className="vector-line vector-line--one"><i /><b /></div><div className="vector-line vector-line--two"><i /><b /></div><div className="globe-card globe-card--top"><Status tone="good">SYSTEM READY</Status><strong>VTA ecosystem</strong><span>Architecture online</span></div><div className="globe-card globe-card--bottom"><span className="mono">GLOBAL SIGNAL MAP</span><strong>6 market areas</strong><span>Data connection unavailable</span></div></div>
    </div></section>
    <section className="shell signal-strip" aria-label="VTA system status"><div><span className="mono">MARKET DATA</span><Status>UNAVAILABLE</Status></div><div><span className="mono">CLIENT ACCOUNT</span><strong>Not connected</strong></div><div><span className="mono">AUTOMATION</span><strong>Inactive</strong></div><div><span className="mono">RESEARCH ENGINE</span><strong>Preview only</strong></div></section>
    <section className="section shell"><SectionHeading label="ONE INTELLIGENT LAYER" title="A coherent trading ecosystem." copy="VTA keeps platforms, intelligence, funding architecture and operations in one intentional product language." /><div className="product-grid">{products.map(({ icon: Icon, title, text, to, flag }) => <article className="product-card" key={title}><div className="card-top"><div className="icon-tile"><Icon size={22} /></div><span className="mono">{flag}</span></div><h3>{title}</h3><p>{text}</p><MiniGraph accent={title === 'Momentum Booster' ? 'var(--amber)' : 'var(--mint)'} /><ArrowLink to={to}>Explore product</ArrowLink></article>)}</div></section>
    <section className="section section--soft"><div className="shell"><SectionHeading label="THE VTA SYSTEM" title="Six areas, designed to work together." /><div className="ecosystem-grid">{ecosystem.map(({ icon: Icon, title, text }, index) => <article className="ecosystem-item" key={title}><span className="ecosystem-number">0{index + 1}</span><Icon size={21} /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
    <section className="section shell"><div className="terminal-showcase"><div className="terminal-copy"><span className="eyebrow">VTA WEB TERMINAL</span><h2>See the context before the action.</h2><p>A premium workspace for instruments, research, positions and execution controls—with nothing implied as live until a verified connection exists.</p><div className="terminal-badges"><Status>NO LIVE MARKET DATA</Status><Status>ORDERS DISABLED</Status></div><ArrowLink to="/web-terminal">Open terminal preview</ArrowLink></div><TerminalFrame /></div></section>
    <section className="section shell"><div className="cta-panel"><div><span className="eyebrow">TRANSPARENT BY DESIGN</span><h2>Start with the system. Connect when it is real.</h2><p>Explore the VTA product architecture without invented balances, performance or account activity.</p></div><div><Link className="button" to="/platforms">Explore platforms <ArrowRight size={17} /></Link></div></div></section>
  </>;
}

function TerminalFrame() {
  return <div className="terminal-frame"><div className="terminal-top"><div className="terminal-dots"><i /><i /><i /></div><span className="terminal-brand"><img src="/logo-mark.svg" alt="" aria-hidden="true"/>VTA / WEB TERMINAL</span><Status>OFFLINE</Status></div><div className="terminal-body"><aside><span className="mono">WATCHLIST</span>{['FX · EUR/USD', 'MT · XAU/USD', 'IX · US 500', 'CR · BTC/USD'].map((item) => <button key={item}>{item}<span>—</span></button>)}</aside><div className="chart-area"><div className="chart-tools"><span>EUR/USD</span><div><button>1H</button><button className="active">4H</button><button>1D</button></div></div><div className="chart-empty"><LineChart size={36} /><strong>No live market data</strong><span>Connect a verified feed to view charts.</span></div></div></div></div>;
}

function MarketsPage() {
  return <PublicShell><PageIntro eyebrow="MULTI-ASSET STRUCTURE" title="Markets, without the noise." text="Explore VTA’s market taxonomy across six global areas. Reference cards describe product scope only; no live prices are displayed." actions={<><Link className="button" to="/web-terminal">Open terminal preview <ArrowUpRight size={17} /></Link><Link className="button button--ghost" to="/analysis">Explore analysis</Link></>} /><section className="section shell"><div className="market-grid">{marketFamilies.map((market) => <article className={`market-card market-card--${market.accent}`} key={market.name}><div><span className="market-symbol">{market.symbol}</span><Status>REFERENCE</Status></div><h2>{market.name}</h2><p>{market.text}</p><ArrowLink to="/web-terminal">View in terminal</ArrowLink></article>)}</div></section><section className="section shell"><SectionHeading label="MARKET SNAPSHOTS" title="Connected data appears here when verified." copy="These instruments are navigation references—not price, liquidity, or execution information." /><div className="table-card table-scroll"><table><thead><tr><th>Instrument</th><th>Market area</th><th>Data status</th><th>Last update</th></tr></thead><tbody>{[['EUR/USD','Forex'],['XAU/USD','Metals'],['Brent','Energies'],['US 500','Indices'],['Global equity','Stocks'],['BTC/USD','Crypto']].map(([instrument, area]) => <tr key={instrument}><td><strong>{instrument}</strong></td><td>{area}</td><td><Status>NO LIVE DATA</Status></td><td className="muted">Unavailable</td></tr>)}</tbody></table></div></section></PublicShell>;
}

function PlatformsPage() {
  return <PublicShell><PageIntro eyebrow="VTA ECOSYSTEM" title="Platforms with a shared point of view." text="Each VTA environment follows one design language while remaining truthful about connection and platform availability." /><section className="section shell platform-stack">{products.map(({ title, text, icon: Icon, to, flag }, index) => <article className="platform-row" key={title}><div className="platform-index">0{index + 1}</div><div className="icon-tile"><Icon /></div><div><span className="mono">{flag}</span><h2>{title}</h2><p>{text}</p></div><ArrowLink to={to}>Explore</ArrowLink></article>)}</section><section className="section section--soft"><div className="shell split-panel"><div><span className="eyebrow">ONE ACCOUNT LAYER</span><h2>Connection is explicit.</h2><p>VTA will never infer a broker, wallet, or account connection. Account access, platform linking and funding actions remain visibly unconnected until a verified integration is present.</p></div><div className="state-stack"><Status>ACCOUNT NOT CONNECTED</Status><Status>PLATFORM NOT LINKED</Status><Status>WALLET UNAVAILABLE</Status></div></div></section></PublicShell>;
}

function TerminalChart({ bars, timeframe, symbol }: { bars: Bar[]; timeframe: string; symbol: string }) {
  if (!bars.length) return <div className="terminal-chart terminal-chart--empty"><EmptyState icon={Activity} title="Historical data unavailable" text="This instrument or timeframe is not available from the configured provider. No synthetic candles are generated." /></div>;
  const width = 1000; const height = 360; const pad = { left: 52, right: 18, top: 22, bottom: 34 };
  const lows = bars.map((bar) => bar.low); const highs = bars.map((bar) => bar.high);
  const min = Math.min(...lows); const max = Math.max(...highs); const range = max - min || 1;
  const x = (index: number) => pad.left + (index / Math.max(1, bars.length - 1)) * (width - pad.left - pad.right);
  const y = (value: number) => pad.top + (1 - (value - min) / range) * (height - pad.top - pad.bottom);
  const points = bars.map((bar, index) => `${x(index)},${y(bar.close)}`).join(' ');
  const candleWidth = Math.max(2, Math.min(8, (width - pad.left - pad.right) / bars.length * .58));
  const last = bars[bars.length - 1];
  return <div className="terminal-chart terminal-chart--historical"><div className="chart-watermark">HISTORICAL DATA · {symbol} · {timeframe}</div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${symbol} historical candlestick chart`} className="professional-chart"><g className="chart-grid-lines">{[0,1,2,3,4].map((line) => <line key={line} x1={pad.left} x2={width - pad.right} y1={pad.top + line * ((height - pad.top - pad.bottom) / 4)} y2={pad.top + line * ((height - pad.top - pad.bottom) / 4)} />)}</g>{bars.map((bar, index) => { const rising = bar.close >= bar.open; const cx = x(index); return <g key={`${bar.time}-${index}`} className={rising ? 'candle candle--up' : 'candle candle--down'}><line x1={cx} x2={cx} y1={y(bar.high)} y2={y(bar.low)} /><rect x={cx - candleWidth / 2} y={Math.min(y(bar.open), y(bar.close))} width={candleWidth} height={Math.max(1.5, Math.abs(y(bar.open) - y(bar.close)))} /></g>; })}<polyline className="chart-close-line" points={points} /><line className="chart-last-line" x1={pad.left} x2={width - pad.right} y1={y(last.close)} y2={y(last.close)} /><text className="chart-last-label" x={width - pad.right - 5} y={y(last.close) - 5} textAnchor="end">{last.close.toFixed(last.close > 100 ? 2 : 4)}</text><g className="chart-axis-labels"><text x="8" y={pad.top + 5}>{max.toFixed(max > 100 ? 2 : 4)}</text><text x="8" y={height / 2}>{((max + min) / 2).toFixed(max > 100 ? 2 : 4)}</text><text x="8" y={height - pad.bottom}>{min.toFixed(min > 100 ? 2 : 4)}</text><text x={pad.left} y={height - 8}>{new Date(bars[0].time * 1000).toLocaleDateString()}</text><text x={width - pad.right} y={height - 8} textAnchor="end">{new Date(last.time * 1000).toLocaleDateString()}</text></g></svg><div className="chart-readout"><span>O <b>{last.open.toFixed(last.open > 100 ? 2 : 4)}</b></span><span>H <b>{last.high.toFixed(last.high > 100 ? 2 : 4)}</b></span><span>L <b>{last.low.toFixed(last.low > 100 ? 2 : 4)}</b></span><span>C <b>{last.close.toFixed(last.close > 100 ? 2 : 4)}</b></span><span>V <b>{last.volume ? last.volume.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</b></span></div></div>;
}

function TerminalPage() {
  const [query, setQuery] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass | 'All'>('All');
  const [selectedSymbol, setSelectedSymbol] = useState<Instrument>(instrumentRegistry[0]);
  const [timeframe, setTimeframe] = useState('1H');
  const [bars, setBars] = useState<Bar[]>([]);
  const [dataState, setDataState] = useState<'HISTORICAL DATA' | 'UNAVAILABLE'>('UNAVAILABLE');
  const [source, setSource] = useState('No provider response');
  const [watchlist, setWatchlist] = useState(['BTC/USDT', 'ETH/USDT', 'EUR/USD', 'XAU/USD']);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState('Market');
  const [indicator, setIndicator] = useState('None');
  const [drawingTool, setDrawingTool] = useState('Cursor');
  const [orderMessage, setOrderMessage] = useState('');
  useEffect(() => { let active = true; setBars([]); setDataState('UNAVAILABLE'); browserMarketDataProvider.getHistoricalBars(selectedSymbol.symbol, timeframe).then((result) => { if (!active) return; setBars(result.bars); setDataState(result.state); setSource(result.source || 'No provider response'); }).catch(() => { if (active) setDataState('UNAVAILABLE'); }); return () => { active = false; }; }, [selectedSymbol.symbol, timeframe]);
  const filtered = useMemo(() => instrumentRegistry.filter((item) => (assetClass === 'All' || item.assetClass === assetClass) && (!query.trim() || `${item.symbol} ${item.assetClass}`.toLowerCase().includes(query.toLowerCase()))), [query, assetClass]);
  const choose = (item: Instrument) => { setSelectedSymbol(item); setOrderMessage(''); if (!watchlist.includes(item.symbol)) setWatchlist((current) => [item.symbol, ...current].slice(0, 8)); };
  const submitOrder = (event: FormEvent) => { event.preventDefault(); setOrderMessage(`DEMO / PAPER EXECUTION · ${side} ${selectedSymbol.symbol} · Order was not sent to a broker.`); };
  return <PublicShell><section className="terminal-page shell"><div className="terminal-page-head"><div><span className="eyebrow">VTA WEB TRADING TERMINAL / PHASE 1</span><h1>Market context before execution.</h1><p>Provider-separated workspace with historical candles, symbol discovery and paper-only order rehearsal.</p></div><div className="terminal-status-stack"><Status tone={dataState === 'HISTORICAL DATA' ? 'good' : 'amber'}>{dataState}</Status><small>{source}</small></div></div><div className="terminal-workspace terminal-workspace--pro"><aside className="terminal-sidebar"><div className="search-control"><Search size={16}/><input aria-label="Search instruments" placeholder="Search symbol or asset class" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="terminal-filter-row"><select aria-label="Filter asset class" value={assetClass} onChange={(event) => setAssetClass(event.target.value as AssetClass | 'All')}><option>All</option><option>Forex</option><option>Crypto</option><option>Metals</option><option>Indices</option><option>Commodities</option><option>Stocks</option></select><span className="mono">{filtered.length} SYMBOLS</span></div><span className="mono">WATCHLIST</span><div className="watch-list watch-list--pro">{watchlist.map((symbol) => { const item = instrumentRegistry.find((candidate) => candidate.symbol === symbol); return item ? <button type="button" className={selectedSymbol.symbol === item.symbol ? 'active' : ''} key={symbol} onClick={() => choose(item)}><span><b>{item.display}</b><small>{item.assetClass} · {item.status}</small></span><em>{item.status === 'HISTORICAL AVAILABLE' ? 'HIST' : '—'}</em></button> : null; })}</div><span className="mono">INSTRUMENT REGISTRY</span><div className="watch-list watch-list--registry">{filtered.map((item) => <button type="button" className={selectedSymbol.symbol === item.symbol ? 'active' : ''} key={item.symbol} onClick={() => choose(item)}><span><b>{item.display}</b><small>{item.assetClass}</small></span><em>{item.status === 'HISTORICAL AVAILABLE' ? 'DATA' : 'N/A'}</em></button>)}</div></aside><section className="terminal-main terminal-main--pro"><div className="terminal-toolbar terminal-toolbar--pro"><div><strong>{selectedSymbol.display}</strong><span>{selectedSymbol.assetClass} · {dataState} · {selectedSymbol.status === 'HISTORICAL AVAILABLE' ? 'Provider connected' : 'Provider unavailable'}</span></div><div className="periods periods--pro">{['1m','5m','15m','30m','1H','4H','1D','1W','1M'].map((period) => <button type="button" className={timeframe === period ? 'active' : ''} key={period} onClick={() => setTimeframe(period)}>{period}</button>)}</div></div><div className="chart-toolbar-pro"><div className="drawing-tools">{['Cursor','Crosshair','Trend Line','Horizontal','Vertical','Rectangle','Fibonacci'].map((tool) => <button type="button" className={drawingTool === tool ? 'active' : ''} key={tool} title={`${tool} drawing tool`} onClick={() => setDrawingTool(tool)}>{tool}</button>)}</div><label>Indicator<select value={indicator} onChange={(event) => setIndicator(event.target.value)}><option>None</option><option>SMA</option><option>EMA</option><option>RSI</option><option>MACD</option><option>Bollinger Bands</option><option>Stochastic</option><option>ATR</option><option>ADX</option><option>Volume</option></select></label><Status>{drawingTool.toUpperCase()}</Status></div><TerminalChart bars={bars} timeframe={timeframe} symbol={selectedSymbol.display}/><div className="terminal-indicator-panel"><span className="mono">INDICATOR PANEL</span><strong>{indicator === 'None' ? 'No indicator selected' : `${indicator} · configuration surface ready`}</strong><small>{indicator === 'None' ? 'Choose an indicator to reserve a separate panel below the chart.' : 'Indicator calculation is isolated for the next provider-backed phase.'}</small></div><div className="terminal-lower terminal-lower--pro"><div className="terminal-data-panel"><div className="terminal-data-panel-head"><span className="mono">POSITIONS</span><Status>NO CONNECTED ACCOUNT</Status></div><EmptyState icon={BriefcaseBusiness} title="No positions" text="Positions appear only after an approved account provider is connected." /></div><div className="terminal-data-panel"><div className="terminal-data-panel-head"><span className="mono">ORDERS / HISTORY</span><Status>UNAVAILABLE</Status></div><EmptyState icon={FileText} title="No order history" text="No execution is claimed from this terminal preview." /></div></div></section><aside className="order-ticket order-ticket--pro"><div className="ticket-head"><span className="mono">ORDER TICKET</span><Status tone="amber">PAPER ONLY</Status></div><div className="ticket-symbol"><span>{selectedSymbol.display}</span><small>{selectedSymbol.assetClass} · {dataState}</small></div><div className="ticket-side"><button type="button" className={side === 'BUY' ? 'active buy' : ''} onClick={() => setSide('BUY')}>BUY</button><button type="button" className={side === 'SELL' ? 'active sell' : ''} onClick={() => setSide('SELL')}>SELL</button></div><form onSubmit={submitOrder}><label>Order type<select value={orderType} onChange={(event) => setOrderType(event.target.value)}><option>Market</option><option>Limit</option><option>Stop</option><option>Stop Limit</option></select></label><label>Volume<input type="number" min="0.001" step="0.001" defaultValue="0.010" /></label><label>Price<input placeholder={orderType === 'Market' ? 'Market price' : 'Required for pending order'} disabled={orderType === 'Market'} /></label><div className="ticket-estimate"><span>Spread <b>Provider dependent</b></span><span>Margin <b>Not calculated</b></span><span>Execution <b>Paper rehearsal</b></span></div><button className="button button--block" type="submit">Review {side} order <ArrowRight size={15}/></button></form>{orderMessage && <div className="ticket-message" role="status">{orderMessage}</div>}<p className="ticket-disclosure">Orders are never sent to a broker in this preview. Any review is labelled DEMO / PAPER EXECUTION.</p></aside></div></section></PublicShell>;
}

function PlatformDetail({ platform }: { platform: 'MT4' | 'MT5' }) {
  const isMt5 = platform === 'MT5';
  return <PublicShell><PageIntro eyebrow={`VTA × ${platform}`} title={`${platform} architecture, prepared with restraint.`} text={isMt5 ? 'A multi-asset platform surface designed for future legitimate VTA account and research integration.' : 'A deliberate bridge for established MT4 workflows, prepared without implying a broker connection or download.'} actions={<Link className="button" to="/platforms">Explore platforms <ArrowRight size={17}/></Link>} /><section className="section shell"><div className="platform-detail-grid"><div className="platform-visual"><div className="platform-window"><div className="platform-window-top"><span className="platform-window-brand"><img src="/assets/branding/metatrader5.svg" alt="" aria-hidden="true"/>{platform} / VTA</span><Status>NOT LINKED</Status></div><div className="platform-window-body"><div className="platform-rail"><i/><i/><i/><i/></div><div className="platform-canvas"><MiniGraph /><span className="mono">CONNECTION REQUIRED</span></div></div></div></div><div><span className="eyebrow">INTEGRATION CONCEPT</span><h2>Designed to surface platform status clearly.</h2><p>VTA will present account linkage, terminal availability, research context and automation readiness without claiming that any platform, broker account or download is currently active.</p><ul className="feature-list"><li><Check/> Platform status architecture</li><li><Check/> Future account-link surface</li><li><Check/> Research-context handoff</li><li><Check/> {isMt5 ? 'MT5 automation architecture prepared' : 'MT4 automation architecture prepared'}</li></ul></div></div></section><section className="section section--soft"><div className="shell split-panel"><div><span className="eyebrow">MOMENTUM BOOSTER</span><h2>Compatibility is not assumed.</h2><p>The product architecture is ready to record confirmed platform compatibility only after the original robot file is inspected and a legitimate integration path is approved.</p></div><div className="state-stack"><Status>ROBOT FILE NOT PROVIDED</Status><Status>COMPATIBILITY UNCONFIRMED</Status></div></div></section></PublicShell>;
}

function MomentumBoosterPage() {
  const modules = [
    ['Overview', 'SOURCE IMPLEMENTED'], ['Live Status', 'DEMO / UNAVAILABLE'], ['Market Regime', 'CODED / UNTESTED'], ['Signal', 'CODED / UNTESTED'], ['Signal Score', '7 COMPONENTS'], ['Risk', 'RISK-FIRST'], ['Positions', 'UNAVAILABLE'], ['Trade History', 'UNAVAILABLE'], ['Execution Log', 'CODED / UNTESTED'], ['Strategy', '4 MODES'], ['Risk Configuration', 'CONFIGURABLE'], ['News', 'SAFE MODE'], ['AI', 'OFF BY DEFAULT'], ['License', 'LOCAL GATE'], ['Audit', 'STRUCTURED LOGGING'],
  ];
  return <PublicShell><section className="booster-hero"><div className="shell booster-hero-grid"><div><span className="eyebrow">AUTOMATION / ADVANCED V1</span><h1>Momentum Booster <span>EA — Advanced V1.</span></h1><p>A from-scratch MT5 Expert Advisor built around H1 context, M15 structure, M5 confirmation and precise M1 execution. The user has tested this same source version; VTA does not publish the test results or present them as a performance guarantee.</p><div className="hero-actions"><a className="button" href="#architecture">Review engine architecture <ArrowUpRight size={17} /></a><Link className="button button--ghost" to="/portal/robot">Open Portal module <Bot size={17} /></Link></div></div><div className="booster-orbit"><div className="booster-core"><Bot size={40}/><span>MB V1</span></div><div className="booster-ring booster-ring--a"/><div className="booster-ring booster-ring--b"/><div className="booster-node booster-node--1"><Status tone="good">SOURCE READY</Status></div><div className="booster-node booster-node--2"><Status>DEMO MODE</Status></div><div className="booster-node booster-node--3"><Status tone="amber">USER TESTED / RESULTS PRIVATE</Status></div></div></div></section><section id="architecture" className="section shell"><div className="booster-status-grid"><article><span className="mono">SOURCE + TEST STATUS</span><strong>USER TESTED</strong><p>The user reports testing this same source version. Results remain private and are not presented as a performance claim.</p></article><article><span className="mono">DECISION PIPELINE</span><strong>H1 → M15 → M5 → M1</strong><p>Context, structure, confirmation and execution are kept in separate deterministic stages.</p></article><article><span className="mono">CURRENT RUNTIME</span><Status>DEMO / UNAVAILABLE</Status><p>No broker, connector, license service or live market feed is configured here.</p></article><article><span className="mono">PERFORMANCE CLAIMS</span><Status tone="amber">NONE</Status><p>No profitability, win-rate, drawdown or backtest result is claimed.</p></article></div><div className="engine-pipeline"><span>DATA QUALITY</span><b>→</b><span>H1 BIAS</span><b>→</b><span>M15 STRUCTURE</span><b>→</b><span>M5 CONFIRMATION</span><b>→</b><span>M1 EXECUTION</span><b>→</b><span>RISK</span><b>→</b><span>ORDER RECONCILIATION</span></div></section><section className="section section--soft"><div className="shell"><SectionHeading label="IMPLEMENTED MODULE MAP" title="Every required surface has a named state." copy="The VTA layer exposes architecture without fabricating live account, position, execution, news or AI values." /><div className="booster-module-grid">{modules.map(([name, state], index) => <article key={name}><span className="step-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{name}</h3><Status tone={state === 'SOURCE IMPLEMENTED' || state === 'RISK-FIRST' ? 'good' : state === 'MT5 TESTING REQUIRED' ? 'amber' : 'neutral'}>{state}</Status></div></article>)}</div></div></section><section className="section shell"><div className="booster-architecture"><article><span className="step-number">01</span><h3>Deterministic signal engine</h3><p>EMA20/50, RSI14, ADX14, DI+/DI−, ATR14, Bollinger width, closed-candle structure, liquidity, volume and candle quality feed weighted scoring.</p></article><article><span className="step-number">02</span><h3>Risk authority</h3><p>Conservative, balanced, aggressive and bounded custom profiles feed OrderCalcProfit sizing, drawdown, loss, margin, exposure, session, spread and position limits.</p></article><article><span className="step-number">03</span><h3>Protective management</h3><p>Every live order requires validated SL/TP. Break-even, ATR trailing, holding-time and optional partial-close controls manage existing positions locally.</p></article><article><span className="step-number">04</span><h3>Explainable audit</h3><p>Dashboard and structured logs expose regime, bias, structure, score, risk, block reason, retcode, ticket, license and execution reconciliation.</p></article></div></section><section className="section shell robot-console"><div><span className="eyebrow">CLIENT PORTAL MODULE</span><h2>Robot state is visible without pretending it is live.</h2><p>Open the Portal to inspect the same module map, with DEMO, SAFE MODE, BLOCKED, READY and LIVE states reserved for verified runtime conditions.</p><ArrowLink to="/portal/robot">View Portal robot state</ArrowLink></div><div className="robot-status-panel"><div><span>Source</span><Status tone="good">SOURCE PRESENT</Status></div><div><span>Runtime</span><Status>DEMO</Status></div><div><span>Account</span><Status>NOT CONNECTED</Status></div><div><span>Executions</span><Status>UNAVAILABLE</Status></div></div></section></PublicShell>;
}

function AnalysisPage() {
  const modules = [
    ['Market Intelligence', Globe2], ['Signal Analysis', Activity], ['Pattern Analysis', Radar], ['Risk Analysis', ShieldCheck], ['Sentiment Analysis', MessageSquare], ['Portfolio Intelligence', BriefcaseBusiness], ['Trade Analysis', BarChart3], ['Market Scanner', Search], ['AI Assistant', Sparkles], ['Research Assistant', FileText],
  ] as [string, LucideIcon][];
  return <PublicShell><PageIntro eyebrow="ANALYTICS & INTELLIGENCE" title="Insight earns its signal." text="VTA’s intelligence architecture makes the difference between an unavailable engine, a preview, and a verified analysis result explicit." /><section className="section shell"><div className="analysis-grid">{modules.map(([name, Icon], index) => <article className="analysis-card" key={name}><div><span className="mono">MODULE {String(index + 1).padStart(2,'0')}</span><Icon size={21}/></div><h2>{name}</h2><p>Prepared VTA module. No live data or AI result is currently supplied.</p><div className="analysis-footer"><Status>{index % 2 ? 'ANALYSIS UNAVAILABLE' : 'PREVIEW'}</Status><ArrowRight size={16}/></div></article>)}</div></section><section className="section section--soft"><div className="shell split-panel"><div><span className="eyebrow">RESEARCH PRINCIPLE</span><h2>Never mistake presentation for prediction.</h2><p>Where VTA has no connected engine or validated data, its research modules disclose that condition rather than producing fabricated analysis.</p></div><EmptyState icon={Sparkles} title="Research engine unavailable" text="A live research connector has not been configured." /></div></section></PublicShell>;
}

function NewsPage() { return <PublicShell><PageIntro eyebrow="MARKET NEWS" title="Editorial context, when sourcing is available." text="VTA does not populate news cards with invented stories. This space is ready for a verified editorial or news-data connection." /><section className="section shell"><EmptyState icon={MessageSquare} title="News feed unavailable" text="No authenticated editorial or market-news source is connected to this environment." action={<Link className="button button--small" to="/analysis">Explore research architecture</Link>} /></section></PublicShell>; }
function CalendarPage() { return <PublicShell><PageIntro eyebrow="ECONOMIC CALENDAR" title="Timing matters. So does the source." text="A credible economic calendar requires a connected, attributable data provider. VTA will not invent events, releases or outcomes." /><section className="section shell"><div className="calendar-shell"><div className="calendar-head"><div><CalendarDays/><span>Economic events</span></div><Status>NO LIVE DATA</Status></div><EmptyState icon={CalendarDays} title="Calendar unavailable" text="No economic-calendar provider is connected. This is an intentionally empty state." /></div></section></PublicShell>; }

function AboutPage() { return <PublicShell><PageIntro eyebrow="ABOUT VTA" title="A system for clearer market decisions." text="VTA is a premium multi-asset product ecosystem designed around calm intelligence, explicit status and future-ready technical architecture." /><section className="section shell about-grid"><article><span className="eyebrow">01 / CLARITY</span><h2>State is never hidden.</h2><p>Connection, data, availability and execution status are presented plainly so users can distinguish a ready interface from a live operating service.</p></article><article><span className="eyebrow">02 / PRECISION</span><h2>Every surface has a purpose.</h2><p>Markets, Terminal, Wallet, Research, Automation and Operations share a coherent design system without becoming one generic dashboard.</p></article><article><span className="eyebrow">03 / PROGRESSION</span><h2>Architecture precedes claims.</h2><p>VTA can grow into verified integrations without starting from a deceptive product shell or fabricated operating history.</p></article></section></PublicShell>; }

function FaqPage() {
  const items = [
    ['Is VTA connected to live market data?', 'No. This initial environment shows architecture and truthful unavailable states only.'],
    ['Can I place an order or make a deposit?', 'No. Order placement, account funding, withdrawals and custody are unavailable until legitimate operational integrations are connected.'],
    ['Is Momentum Booster active?', 'No. The original robot file has not been supplied or inspected, so no implementation, compatibility, parameter or performance claim is made.'],
    ['Are the VTA Portal and Admin areas live?', 'They are protected product architectures. No client or operational records are created, displayed or simulated.'],
    ['Why are some modules marked Preview or Unavailable?', 'VTA deliberately distinguishes future-ready interface architecture from connected services and verified data.'],
  ];
  return <PublicShell><PageIntro eyebrow="SUPPORT / FAQ" title="Clear answers, no implied infrastructure." text="The VTA initial rebuild uses direct language about what is, and is not, currently connected." /><section className="section shell faq-list">{items.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{question}</span><ChevronDown size={18}/></summary><p>{answer}</p></details>)}</section></PublicShell>;
}

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSubmitted(true); }
  return <PublicShell><PageIntro eyebrow="CONTACT VTA" title="Start with the right conversation." text="Use this form to prepare a product enquiry. Message delivery is not configured in this initial environment." /><section className="section shell contact-grid"><div><span className="eyebrow">PRODUCT & ACCESS</span><h2>Designed for a measured next step.</h2><p>VTA is rebuilding its product foundation. A live client support channel, operating desk and account onboarding are not connected here.</p><div className="contact-points"><div><MessageSquare/><span><b>General information</b><em>Response channel unavailable</em></span></div><div><ShieldCheck/><span><b>Account access</b><em>Requires approved identity integration</em></span></div><div><Bot/><span><b>Momentum Booster</b><em>Awaiting original robot file</em></span></div></div></div><form className="contact-form" onSubmit={handleSubmit}><label>Full name<input required name="name" autoComplete="name" /></label><label>Email address<input required type="email" name="email" autoComplete="email" /></label><label>Subject<select required name="subject" defaultValue=""><option value="" disabled>Select topic</option><option>Platform architecture</option><option>Client access</option><option>Momentum Booster</option><option>General information</option></select></label><label>Message<textarea required name="message" rows={5}/></label><button className="button" type="submit">Prepare enquiry <ArrowRight size={17}/></button>{submitted && <p className="form-note"><Check size={16}/> This enquiry is not sent because a VTA support channel is not connected.</p>}</form></section></PublicShell>;
}

function AuthPage({ register = false }: { register?: boolean }) {
  const title = register ? 'Access begins with verified identity.' : 'Client access is intentionally protected.';
  const description = register ? 'Registration will become available through an approved VTA account and identity workflow.' : 'Use a genuine application identity flow when it is configured. No sample client credentials exist.';
  return <PublicShell><section className="auth-page shell"><div className="auth-copy"><Brand/><span className="eyebrow">{register ? 'CLIENT REGISTRATION' : 'CLIENT LOGIN'}</span><h1>{title}</h1><p>{description}</p><ul className="feature-list"><li><Check/> Server-side session architecture</li><li><Check/> Secure, HttpOnly cookie policy</li><li><Check/> No seeded account or administrator access</li></ul><Link className="text-link" to="/faq">Read access FAQ <ArrowRight size={15}/></Link></div><div className="auth-card"><Status>IDENTITY REQUIRED</Status><h2>{register ? 'Registration unavailable' : 'Sign in when identity is configured'}</h2><p>{register ? 'No onboarding workflow or customer record has been connected. VTA will not create a fictional application account.' : 'A verified VTA identity flow needs an explicitly configured public origin and provider callback.'}</p><button className="button button--block" disabled>{register ? 'Create account unavailable' : 'Continue with identity'} <LockKeyhole size={16}/></button><div className="auth-divider"><span>or</span></div><Link className="button button--ghost button--block" to={register ? '/login' : '/register'}>{register ? 'Return to client login' : 'Explore registration architecture'}</Link><p className="auth-foot">No passwords, balances, account IDs or access roles are supplied in the frontend.</p></div></section></PublicShell>;
}

function PortalRoute() {
  const location = useLocation();
  const known = portalNav.some((item) => item.to === location.pathname);
  return known ? <PortalPage /> : <NotFound />;
}

function AdminRoute() {
  const location = useLocation();
  const known = adminNav.some((item) => item.to === location.pathname) || /^\/admin\/clients\/[^/]+$/.test(location.pathname);
  return known ? <AdminPage /> : <NotFound />;
}

function PortalPage() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const active = portalNav.find((item) => item.to === location.pathname) || portalNav[0];
  return <div className="app-shell portal-shell"><aside className={`app-sidebar ${open ? 'app-sidebar--open' : ''}`}><Brand compact/><div className="sidebar-caption">CLIENT PORTAL</div><nav aria-label="Portal navigation">{portalNav.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} end={to === '/portal'} onClick={() => setOpen(false)}><Icon size={17}/><span>{label}</span></NavLink>)}</nav><div className="sidebar-footer"><Status>NOT CONNECTED</Status><span>Identity required</span></div></aside><main className="app-main"><AppTopbar title={active.label} onMenu={() => setOpen(!open)} kind="portal"/><div className="app-content"><PortalContent active={active.label} path={location.pathname}/></div></main></div>;
}

function AppTopbar({ title, onMenu, kind }: { title: string; onMenu: () => void; kind: 'portal' | 'admin' }) {
  return <header className="app-topbar"><button className="app-menu" onClick={onMenu} aria-label="Open navigation"><PanelLeft size={20}/></button><div><span className="mono">{kind === 'portal' ? 'CLIENT PORTAL' : 'VTA OPERATIONS'}</span><h1>{title}</h1></div><div className="topbar-actions"><button aria-label="Notifications" className="icon-button"><Bell size={18}/><i/></button><div className="identity-chip"><UserRound size={16}/><span>{kind === 'portal' ? 'Client access required' : 'Admin authorization required'}</span></div></div></header>;
}

function PaymentLogo({ name, label }: { name: 'tether' | 'bitcoin' | 'ethereum' | 'binance' | 'tron' | 'visa' | 'mastercard'; label: string }) {
  return <span className="payment-logo" title={label}><img src={`/assets/payment/${name}.svg`} alt="" aria-hidden="true"/><span>{label}</span></span>;
}
type DashboardTimeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
function InstitutionalChart({ timeframe }: { timeframe: DashboardTimeframe }) {
  const profiles: Record<DashboardTimeframe, { change: string; points: string; hover: string[] }> = {
    '1D': { change: '+0.42%', points: '0,78 44,68 88,74 132,55 176,62 220,42 264,48 308,32 352,37 390,20', hover: ['24,940', '24,972', '24,948', '24,988', '24,985'] },
    '1W': { change: '+1.18%', points: '0,88 44,76 88,80 132,61 176,67 220,44 264,56 308,35 352,42 390,18', hover: ['24,840', '24,902', '24,934', '24,981', '24,990'] },
    '1M': { change: '+2.54%', points: '0,88 44,76 88,82 132,56 176,62 220,38 264,50 308,24 352,31 390,10', hover: ['24,420', '24,560', '24,610', '24,744', '24,850'] },
    '3M': { change: '+6.18%', points: '0,92 44,82 88,75 132,84 176,58 220,66 264,45 308,52 352,25 390,14', hover: ['23,900', '24,120', '24,420', '24,610', '24,850'] },
    '6M': { change: '+10.80%', points: '0,100 44,92 88,84 132,88 176,70 220,76 264,57 308,48 352,28 390,10', hover: ['22,980', '23,420', '23,880', '24,210', '24,850'] },
    '1Y': { change: '+18.40%', points: '0,104 44,96 88,86 132,90 176,72 220,78 264,56 308,42 352,34 390,12', hover: ['20,980', '21,840', '22,940', '23,760', '24,850'] },
    ALL: { change: '+24.10%', points: '0,108 44,100 88,92 132,94 176,76 220,80 264,58 308,46 352,30 390,10', hover: ['19,600', '21,180', '22,940', '23,760', '24,850'] },
  };
  const profile = profiles[timeframe];
  const [hover, setHover] = useState<{ x: number; y: number; value: string } | null>(null);
  const points = profile.points.split(' ').map((point, index) => { const [x, y] = point.split(',').map(Number); return { x, y, value: profile.hover[Math.min(index, profile.hover.length - 1)] }; });
  return <div className="institutional-chart-wrap"><div className="chart-readout-row"><div><span>LAST MARK</span><strong>1.0842</strong><small className="demo-positive">{profile.change}</small></div><div><span>EQUITY</span><strong>$24,850.50</strong><small>Paper account · USD</small></div><div><span>HIGH / LOW</span><strong>1.0918 / 1.0768</strong><small>synthetic session range</small></div><div><span>DATA STATE</span><strong>DEMO</strong><small>NO LIVE FEED</small></div></div><div className="institutional-chart institutional-chart--interactive"><div className="chart-axis"><span>25,000</span><span>24,500</span><span>24,000</span><span>23,500</span></div><svg viewBox="0 0 390 120" role="img" aria-label={`Simulated VTA account performance ${timeframe} chart`} onMouseLeave={() => setHover(null)}>{points.map((point) => <circle key={point.x} className="chart-hover-target" cx={point.x} cy={point.y} r="9" onMouseEnter={() => setHover(point)} />)}<polyline className="chart-benchmark" points="0,64 70,60 140,63 210,54 280,49 390,43"/><polyline className="chart-line" points={profile.points}/><polyline className="chart-area-line" points={`${profile.points} 390,120 0,120`}/><line className="chart-current-line" x1="0" y1="31" x2="390" y2="31"/><circle className="chart-current-dot" cx="390" cy="10" r="4"/><text x="333" y="26">$24,850</text>{hover && <g className="chart-tooltip"><line x1={hover.x} y1="0" x2={hover.x} y2="120"/><rect x={Math.min(hover.x + 5, 315)} y={Math.max(hover.y - 28, 3)} width="70" height="20" rx="3"/><text x={Math.min(hover.x + 10, 320)} y={Math.max(hover.y - 15, 16)}>${hover.value}</text></g>}</svg><div className="chart-time"><span>OPEN</span><span>CONTEXT</span><span>RISK</span><span>CLOSE</span></div></div><div className="chart-legend"><span><i className="legend-dot legend-dot--mint"/>VTA performance</span><span><i className="legend-dot legend-dot--blue"/>Benchmark</span><span className="chart-legend-state">{timeframe} · SIMULATED · NO LIVE FEED</span></div></div>;
}
function InstitutionalDashboard({ portal = false }: { portal?: boolean }) {
  const [timeframe, setTimeframe] = useState<DashboardTimeframe>('1M');
  const [accountOpen, setAccountOpen] = useState(false);
  const [account, setAccount] = useState('VTA-PAPER-001');
  const [selectedRow, setSelectedRow] = useState('');
  const [platformChoice, setPlatformChoice] = useState('web');
  const returns: Record<DashboardTimeframe, string> = { '1D': '+0.42%', '1W': '+1.18%', '1M': '+2.54%', '3M': '+6.18%', '6M': '+10.80%', '1Y': '+18.40%', ALL: '+24.10%' };
  const positions = [['EUR/USD', 'Buy 0.40', '1.0821', '1.0842', '+$84.20', 'OPEN'], ['XAU/USD', 'Sell 0.12', '2,342.8', '2,338.4', '+$52.80', 'OPEN'], ['US 500', 'Buy 0.20', '5,214.4', '5,208.1', '-$18.40', 'OPEN']];
  const orders = [['EUR/USD', 'Limit Buy', '1.0790', '0.40', 'PENDING'], ['BTC/USD', 'Market', '—', '0.08', 'DISABLED']];
  return <div className="command-center"><div className="command-center-head"><div><span className="eyebrow">{portal ? 'CLIENT PORTAL / HOME COMMAND CENTER' : 'VTA DEMO DESK / HOME'}</span><h2>Good morning, Trader.</h2><p>Account context, performance, exposure and platform readiness in one operating view.</p></div><div className="account-context"><button type="button" className="account-selector" title="Choose active paper account" aria-label={`Active account: ${account}. Open account selector`} onClick={() => setAccountOpen(!accountOpen)}><span className="account-selector-mark"><img src="/logo-mark.svg" alt="" aria-hidden="true"/></span><span><small>ACTIVE ACCOUNT</small><strong>{account}</strong><em>Paper trading · USD</em></span><ChevronDown size={16}/></button>{accountOpen && <div className="account-menu"><button type="button" title="Switch to primary paper account" onClick={() => { setAccount('VTA-PAPER-001'); setAccountOpen(false); }}>VTA-PAPER-001 <small>Primary paper account</small></button><button type="button" title="Switch to research sandbox" onClick={() => { setAccount('VTA-DEMO-002'); setAccountOpen(false); }}>VTA-DEMO-002 <small>Research sandbox</small></button></div>}<Status tone="amber">DEMO / NOT CONNECTED</Status></div></div><div className="command-kpi-rail"><div><span>Balance</span><strong>$25,000.00</strong><small>paper ledger · USD</small></div><div><span>Equity</span><strong>$24,850.50</strong><small className="demo-positive">-$149.50 floating</small></div><div><span>Available margin</span><strong>$21,605.00</strong><small>86.9% available</small></div><div><span>Margin level</span><strong>765.8%</strong><small className="demo-positive">healthy · synthetic</small></div><div><span>Unrealized P&amp;L</span><strong className="demo-positive">+$118.60</strong><small>3 open positions</small></div><div><span>Today’s P&amp;L</span><strong className="demo-positive">+$84.20</strong><small>{timeframe} return {returns[timeframe]}</small></div></div><div className="quick-action-strip"><span className="mono">QUICK ACTIONS</span><Link to={portal ? '/portal/deposit' : '/demo'}><Plus size={14}/> Deposit</Link><Link to={portal ? '/portal/withdraw' : '/demo'}><ArrowUpRight size={14}/> Withdraw</Link><Link to={portal ? '/portal/terminal' : '/web-terminal'}><LineChart size={14}/> Trade</Link><Link to={portal ? '/portal/positions' : '/demo'}><BriefcaseBusiness size={14}/> View positions</Link><Link to={portal ? '/portal/robot' : '/robots/momentum-booster'}><Bot size={14}/> Momentum Booster</Link></div><div className="command-primary-grid"><section className="command-panel command-panel--performance"><div className="command-panel-head"><div><span className="mono">PERFORMANCE / EQUITY CURVE</span><h3>Account performance</h3></div><div className="dashboard-periods"><Status>SIMULATED</Status>{(['1D','1W','1M','3M','6M','1Y','ALL'] as DashboardTimeframe[]).map((item) => <button type="button" key={item} className={timeframe === item ? 'active' : ''} onClick={() => setTimeframe(item)}>{item}</button>)}</div></div><InstitutionalChart timeframe={timeframe}/><div className="chart-summary"><span>Net P/L <b className="demo-positive">+$600.50</b></span><span>Return <b className="demo-positive">{returns[timeframe]}</b></span><span>Drawdown <b>1.8%</b></span><span>Volatility <b>LOW</b></span></div></section><aside className="command-side-stack"><section className="command-panel compact-panel"><div className="command-panel-head"><div><span className="mono">ACTION REQUIRED</span><h3>Alerts</h3></div><Status tone="amber">2 OPEN</Status></div><div className="alert-list"><Link to={portal ? '/portal/security' : '/demo'}><ShieldCheck size={15}/><span><strong>Identity not connected</strong><small>Complete verification before live access.</small></span><ArrowRight size={14}/></Link><Link to={portal ? '/portal/robot' : '/robots/momentum-booster'}><Bot size={15}/><span><strong>Momentum Booster is preview-only</strong><small>Runtime and execution are unavailable.</small></span><ArrowRight size={14}/></Link></div></section><section className="command-panel compact-panel"><div className="command-panel-head"><div><span className="mono">MARKET SNAPSHOT</span><h3>Context</h3></div><Status>NO LIVE DATA</Status></div><div className="market-snapshot"><div><span>EUR/USD</span><strong>1.0842</strong><small className="demo-positive">+0.42% synthetic</small></div><div><span>XAU/USD</span><strong>2,338.4</strong><small className="text-amber">-0.18% synthetic</small></div><div><span>BTC/USD</span><strong>—</strong><small>feed unavailable</small></div></div></section></aside></div><div className="command-secondary-grid"><section className="command-panel table-panel"><div className="command-panel-head"><div><span className="mono">TRADING ACTIVITY</span><h3>Open positions</h3></div><Link className="text-link" to={portal ? '/portal/positions' : '/demo'}>View all <ArrowRight size={14}/></Link></div><div className="data-table data-table--positions"><div className="data-table-head"><span>Instrument</span><span>Side / size</span><span>Entry</span><span>Mark</span><span>P/L</span><span>Status</span></div>{positions.map((row) => <button type="button" className={`data-table-row ${selectedRow === row[0] ? 'selected' : ''}`} title={`View synthetic position details for ${row[0]}`} aria-label={`View synthetic position details for ${row[0]}`} key={row[0]} onClick={() => setSelectedRow(row[0])}>{row.map((value, index) => <span key={index} className={index === 4 ? (value.startsWith('+') ? 'demo-positive' : 'text-amber') : ''}>{value}</span>)}</button>)}{selectedRow && <div className="row-detail"><strong>{selectedRow}</strong><span>Details are synthetic. Broker position data is not connected.</span><button type="button" onClick={() => setSelectedRow('')}>Dismiss</button></div>}</div></section><section className="command-panel table-panel"><div className="command-panel-head"><div><span className="mono">ORDER BOOK</span><h3>Orders</h3></div><Link className="text-link" to={portal ? '/portal/orders' : '/demo'}>Open orders <ArrowRight size={14}/></Link></div><div className="data-table"><div className="data-table-head"><span>Instrument</span><span>Type</span><span>Price</span><span>Size</span><span>Status</span></div>{orders.map((row) => <button type="button" className="data-table-row" title={`View synthetic order details for ${row[0]}`} aria-label={`View synthetic order details for ${row[0]}`} key={row[0]} onClick={() => setSelectedRow(row[0])}>{row.map((value, index) => <span key={index} className={value === 'PENDING' ? 'text-amber' : value === 'DISABLED' ? 'text-muted' : ''}>{value}</span>)}</button>)}</div></section></div><div className="command-bottom-grid"><section className="command-panel activity-panel"><div className="command-panel-head"><div><span className="mono">RECENT ACTIVITY</span><h3>Latest account events</h3></div><Link className="text-link" to={portal ? '/portal/transactions' : '/demo'}>View ledger <ArrowRight size={14}/></Link></div><div className="activity-rows">{[['09:42','Deposit review','Paper USD ledger','+$2,500.00','good'],['09:18','EUR/USD position','Buy 0.40 · simulated','+$184.20','good'],['Yesterday','Withdrawal review','No destination connected','-$1,200.00','amber'],['Sep 28','Momentum Booster','Signal engine · 78 / 100','PREVIEW','neutral']].map(([time, title, meta, value, tone]) => <div key={time + title}><time>{time}</time><span className={`activity-mark activity-mark--${tone}`}><Activity size={14}/></span><span><strong>{title}</strong><small>{meta}</small></span><b className={tone === 'good' ? 'demo-positive' : tone === 'amber' ? 'text-amber' : ''}>{value}</b></div>)}</div></section><section className="command-panel booster-panel"><div className="command-panel-head"><div><span className="mono">AUTOMATION / PRODUCT MODULE</span><h3>Momentum Booster</h3></div><Status tone="amber">PREVIEW</Status></div><div className="booster-feature"><div className="booster-visual" aria-label="Momentum Booster robot"><div className="booster-visual-grid"/><img src="/assets/branding/momentum-booster-robot.png" alt="Momentum Booster robot"/><span className="booster-visual-caption">VTA / ADVANCED V1</span></div><div className="booster-feature-body"><div className="booster-feature-title"><div><span className="eyebrow">MOMENTUM BOOSTER EA</span><h4>Advanced V1</h4></div><span className="booster-state-dot"><i/> INACTIVE</span></div><p>A rules-based momentum engine with staged context, structure, confirmation and risk controls. The EA source is present in this project, but no broker runtime or performance feed is connected.</p><div className="booster-account-line"><span><small>ASSOCIATED ACCOUNT</small><strong>{account}</strong></span><Status>NOT CONNECTED</Status></div><div className="booster-feature-actions"><Link className="button button--small" title="Open Momentum Booster module" to={portal ? '/portal/robot' : '/robots/momentum-booster'}>Open module <ArrowRight size={14}/></Link><a className="button button--small button--ghost" href="/Momentum_Booster_EA_Advanced_V1.mq5" download>View EA source <FileText size={14}/></a></div></div></div><div className="booster-feature-metrics"><span><small>Robot status</small><b>DEMO / INACTIVE</b></span><span><small>Performance</small><b>NOT AVAILABLE</b></span><span><small>Subscription</small><b>LOCAL GATE</b></span><span><small>Last activity</small><b>SEP 28</b></span><span><small>Connection</small><b>NOT CONNECTED</b></span></div><div className="booster-feature-disclosure"><Info size={14}/><span>Reference visual supplied for Momentum Booster. Execution and performance remain unavailable until an approved connector is configured.</span></div></section></div><div className="command-footer-rail"><span><ShieldCheck size={14}/> Session protected</span><span><Database size={14}/> Local synthetic dataset</span><span><LockKeyhole size={14}/> Broker path blocked</span><span><Bot size={14}/> No live automation</span></div><section className="open-account-rail"><div className="open-account-copy"><span className="eyebrow">NEW CLIENT?</span><h3>Open a live account</h3><p>Choose the VTA platform that fits your workflow. Account opening and live connectivity remain subject to verified onboarding.</p></div><div className="platform-selector" role="tablist" aria-label="Trading platform options"><button type="button" title="Select VTA Web Terminal" aria-label="Select VTA Web Terminal" className={platformChoice === 'web' ? 'platform-option active' : 'platform-option'} onClick={() => setPlatformChoice('web')}><span className="platform-mark platform-mark--vta"><img src="/logo-mark.svg" alt="" aria-hidden="true"/></span><span><strong>VTA Web Terminal</strong><small>Browser-native workspace</small></span><ArrowUpRight size={14}/></button><button type="button" title="Select MetaTrader 4" aria-label="Select MetaTrader 4" className={platformChoice === 'mt4' ? 'platform-option active' : 'platform-option'} onClick={() => setPlatformChoice('mt4')}><span className="platform-mark platform-mark--mt"><img src="/assets/branding/metatrader5.svg" alt="MetaTrader 4"/></span><span><strong>MetaTrader 4</strong><small>Classic FX platform</small></span><ArrowUpRight size={14}/></button><button type="button" title="Select MetaTrader 5" aria-label="Select MetaTrader 5" className={platformChoice === 'mt5' ? 'platform-option active' : 'platform-option'} onClick={() => setPlatformChoice('mt5')}><span className="platform-mark platform-mark--mt"><img src="/assets/branding/metatrader5.svg" alt="MetaTrader 5"/></span><span><strong>MetaTrader 5</strong><small>Multi-asset platform</small></span><ArrowUpRight size={14}/></button></div><div className="open-account-action"><span><b>{platformChoice === 'web' ? 'VTA Web Terminal' : platformChoice === 'mt4' ? 'MetaTrader 4' : 'MetaTrader 5'}</b><small>Selected platform · demo onboarding only</small></span><Link className="button button--small" to={platformChoice === 'web' ? (portal ? '/portal/terminal' : '/web-terminal') : platformChoice === 'mt4' ? '/mt4' : '/mt5'}>Continue <ArrowRight size={14}/></Link></div></section></div>;
}
function DemoRoute() { return <PublicShell><section className="section shell demo-surface"><InstitutionalDashboard /></section></PublicShell>; }
function PortalContent({ active, path }: { active: string; path: string }) {
  if (path === '/portal') return <InstitutionalDashboard portal />;
  if (path === '/portal/wallet' || path === '/portal/deposit' || path === '/portal/withdraw' || path === '/portal/transactions') return <FundsContent active={active}/>;
  if (path === '/portal/robot' || path === '/portal/robot/subscription') return <RobotContent/>;
  if (path === '/portal/terminal') return <div className="panel"><PanelHead title="Terminal access" icon={TerminalSquare}/><EmptyState icon={TerminalSquare} title="Terminal not connected" text="No client account or broker session is linked to this Portal." action={<Link className="button button--small" to="/web-terminal">Open public terminal preview</Link>} /></div>;
  if (path === '/portal/markets') return <div className="panel"><PanelHead title="Market snapshots" icon={Globe2}/><EmptyState icon={Globe2} title="No live market data" text="Market snapshots require a connected data provider." /></div>;
  return <div className="panel"><PanelHead title={active} icon={Database}/><EmptyState title={`No ${active.toLowerCase()} available`} text="This client area remains empty until a verified VTA account and relevant data service are connected." /></div>;
}

function Metric({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: LucideIcon }) { return <article className="metric-card"><div><span>{label}</span><Icon size={18}/></div><strong>{value}</strong><p>{note}</p></article>; }
function PanelHead({ title, icon: Icon }: { title: string; icon: LucideIcon }) { return <div className="panel-head"><div><div className="icon-tile icon-tile--small"><Icon size={17}/></div><h3>{title}</h3></div><button className="icon-button" aria-label={`More ${title}`}><SlidersHorizontal size={17}/></button></div>; }

function LegacyFundsBody({ active }: { active: string }) {
  const isWallet = active === 'Wallet';
  const [selected, setSelected] = useState<'USDT' | 'USD' | 'EUR'>('USDT');
  const methods = selected === 'USDT' ? [{ name: 'tether' as const, label: 'USDT / TRC20', note: 'Synthetic stablecoin rail' }, { name: 'ethereum' as const, label: 'USDT / ERC20', note: 'Synthetic network rail' }] : [{ name: 'visa' as const, label: 'Cards', note: 'Provider not connected' }, { name: 'mastercard' as const, label: 'Cards / Mastercard', note: 'Provider not connected' }];
  return <><div className="funds-command-head"><div><span className="eyebrow">FUNDS / {active.toUpperCase()} / PAPER LEDGER</span><h2>{isWallet ? 'Wallet control center.' : `${active} workflow.`}</h2><p>Asset identity, amount, fee context and review state are kept together. Nothing here can move money or reach a provider.</p></div><Status tone="amber">NO LIVE FUNDS</Status></div><div className="funds-balance-rail"><div><span>Total paper balance</span><strong>$25,000.00</strong><small>USD ledger · fictional</small></div><div><span>Available to allocate</span><strong>$21,605.00</strong><small>Preview buying power</small></div><div><span>Pending requests</span><strong>02</strong><small>Review only</small></div><div><span>Settlement state</span><strong>LOCAL</strong><small>No external provider</small></div></div><div className="funds-workspace"><aside className="funds-asset-rail"><div className="funds-rail-head"><span className="mono">ASSET / METHOD</span><Status>DEMO</Status></div>{[['USDT','Tether USD'],['USD','US Dollar'],['EUR','Euro']].map(([code,label]) => <button type="button" className={selected === code ? 'active' : ''} onClick={() => setSelected(code as typeof selected)} key={code}><span className={`funds-asset-mark funds-asset-mark--${code.toLowerCase()}`}>{code === 'USDT' ? '₮' : code}</span><span><strong>{code}</strong><small>{label}</small></span><em>Paper ledger</em></button>)}<div className="funds-rail-note"><ShieldCheck size={16}/><span>Every asset is a paper-ledger preview. No wallet address, bank instruction or custody state is generated.</span></div></aside><section className="funds-review-panel"><div className="funds-review-head"><div><span className="mono">{selected} / {active.toUpperCase()}</span><h3>{selected === 'USDT' ? 'Tether USD' : selected === 'USD' ? 'US Dollar' : 'Euro'} <Status tone="good">AVAILABLE IN PREVIEW</Status></h3><p>Processing state is simulated and no payment provider is connected.</p></div><div className={`funds-large-mark funds-large-mark--${selected.toLowerCase()}`}>{selected === 'USDT' ? '₮' : selected}</div></div><div className="payment-method-strip">{methods.map((method) => <div className="payment-method" key={method.label}><PaymentLogo name={method.name} label={method.label}/><small>{method.note}</small></div>)}</div><div className="funds-form-grid"><label>Amount<input defaultValue="2,500.00" inputMode="decimal"/><small>Available paper balance: $25,000.00</small></label><label>Method<select defaultValue={methods[0].label}>{methods.map((method) => <option key={method.label}>{method.label}</option>)}</select><small>Provider connection: not configured</small></label></div><div className="funds-detail-grid"><div><span>Processing time</span><strong>Instant preview</strong></div><div><span>Fee</span><strong>0.00 · simulated</strong></div><div><span>Limits</span><strong>Demo policy only</strong></div><div><span>Security</span><strong>Review required</strong></div></div><button type="button" className="button" onClick={() => window.alert(`${active} review is simulated only. No transaction was created.`)}>{active === 'Withdraw' ? 'Review withdrawal request' : active === 'Deposit' ? 'Review deposit request' : 'Review paper-ledger action'} <ArrowRight size={15}/></button><p className="funds-disclaimer"><LockKeyhole size={14}/> This is a visual and interaction preview. No real transaction, address, payment credential or customer balance exists.</p></section></div><section className="funds-history panel"><div className="dashboard-panel-head"><div><span className="mono">LEDGER / ACTIVITY</span><h3>Recent funding state</h3></div><Status>SIMULATED</Status></div>{[['Sep 30','Deposit request','USDT · TRC20','+$2,500.00','REVIEW'],['Sep 29','Withdrawal review','USD · paper ledger','-$1,200.00','PENDING'],['Sep 28','Transfer staged','EUR · internal preview','$600.00','SIMULATED']].map(([date,title,asset,amount,state]) => <div className="funds-history-row" key={date}><span>{date}</span><div><strong>{title}</strong><small>{asset}</small></div><b>{amount}</b><Status>{state}</Status></div>)}</section></>;
}
type FundingMethod = 'Bank transfer' | 'Crypto';
type CryptoAsset = 'USDT' | 'BTC' | 'ETH' | 'BNB';
type CryptoNetwork = 'TRC20' | 'BEP20' | 'ERC20';

const cryptoAssets: { code: CryptoAsset; label: string; icon: 'tether' | 'bitcoin' | 'ethereum' | 'binance'; note: string }[] = [
  { code: 'USDT', label: 'Tether USD', icon: 'tether', note: 'Stablecoin · supported' },
  { code: 'BTC', label: 'Bitcoin', icon: 'bitcoin', note: 'Digital asset · supported' },
  { code: 'ETH', label: 'Ethereum', icon: 'ethereum', note: 'Digital asset · supported' },
  { code: 'BNB', label: 'BNB', icon: 'binance', note: 'Digital asset · supported' },
];
const cryptoNetworks: Record<CryptoAsset, { code: CryptoNetwork; label: string; icon: 'tron' | 'binance' | 'ethereum' | 'bitcoin'; fee: string; eta: string; minimum: string }[]> = {
  USDT: [
    { code: 'TRC20', label: 'TRON / TRC20', icon: 'tron', fee: '1.00 USDT', eta: '2–10 min', minimum: '10 USDT' },
    { code: 'BEP20', label: 'BNB Smart Chain / BEP20', icon: 'binance', fee: '0.80 USDT', eta: '2–8 min', minimum: '10 USDT' },
    { code: 'ERC20', label: 'Ethereum / ERC20', icon: 'ethereum', fee: 'Network variable', eta: '5–30 min', minimum: '25 USDT' },
  ],
  BTC: [{ code: 'ERC20', label: 'Bitcoin network', icon: 'bitcoin', fee: 'Network variable', eta: '10–45 min', minimum: '0.001 BTC' }],
  ETH: [{ code: 'ERC20', label: 'Ethereum / ERC20', icon: 'ethereum', fee: 'Network variable', eta: '5–30 min', minimum: '0.01 ETH' }],
  BNB: [{ code: 'BEP20', label: 'BNB Smart Chain / BEP20', icon: 'binance', fee: '0.005 BNB', eta: '2–8 min', minimum: '0.01 BNB' }],
};

function SyntheticQr({ value }: { value: string }) {
  const cells = Array.from({ length: 169 }, (_, index) => {
    const x = index % 13;
    const y = Math.floor(index / 13);
    const finder = (x < 5 && y < 5) || (x > 7 && y < 5) || (x < 5 && y > 7);
    const ring = finder && (x === 0 || x === 4 || y === 0 || y === 4 || (x > 0 && x < 4 && y > 0 && y < 4 && ((x + y) % 2 === 0)));
    const seeded = ((x * 17 + y * 31 + value.length * 7 + x * y) % 5) < 2;
    return ring || (!finder && seeded);
  });
  return <svg className="funds-qr" viewBox="0 0 13 13" role="img" aria-label="Synthetic QR code preview">{cells.map((on, index) => on ? <rect key={index} x={index % 13} y={Math.floor(index / 13)} width="1" height="1"/> : null)}</svg>;
}

function LegacyFundsContent({ active }: { active: string }) {
  return <LegacyFundsBody active={active}/>;
}

function FundsContent({ active }: { active: string }) {
  if (active === 'Wallet' || active === 'Transactions') return <LegacyFundsContent active={active}/>;
  const withdraw = active === 'Withdraw';
  type Step = 'method' | 'asset' | 'network' | 'details' | 'review' | 'confirmed';
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<FundingMethod>('Crypto');
  const [asset, setAsset] = useState<CryptoAsset>('USDT');
  const [network, setNetwork] = useState<CryptoNetwork>('TRC20');
  const [amount, setAmount] = useState(withdraw ? '1200' : '2500');
  const [destination, setDestination] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [iban, setIban] = useState('');
  const [swift, setSwift] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [copied, setCopied] = useState('');
  const [detailError, setDetailError] = useState('');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const activeNetwork = cryptoNetworks[asset].find((item) => item.code === network) || cryptoNetworks[asset][0];
  const address = asset === 'USDT' && network === 'TRC20' ? 'TQ7A...9VTA2...4K9P' : asset === 'USDT' && network === 'BEP20' ? '0xVTA...BEP20...7A2' : '0xVTA...ERC20...91F';
  const fee = method === 'Crypto' && withdraw ? (activeNetwork.fee.includes('variable') ? 'Network variable' : activeNetwork.fee) : '0.00 · simulated';
  const received = (method === 'Crypto' && withdraw ? Math.max(0, Number(amount || 0) - (activeNetwork.fee.includes('variable') ? 0 : Number.parseFloat(activeNetwork.fee))) : Number(amount || 0)).toFixed(2);
  const isCrypto = method === 'Crypto';
  const progress = isCrypto ? [
    ['method', 'Method'], ['asset', 'Asset'], ['network', 'Network'], ['details', 'Details'], ['review', 'Review'],
  ] as const : [['method', 'Method'], ['details', 'Bank details'], ['review', 'Review']] as const;
  const stepIndex = step === 'confirmed' ? progress.length : progress.findIndex(([key]) => key === step);
  const go = (next: Step) => { setDirection('forward'); setStep(next); };
  const back = () => {
    setDirection('back');
    if (step === 'asset') setStep('method');
    else if (step === 'network') setStep('asset');
    else if (step === 'details') setStep(isCrypto ? 'network' : 'method');
    else if (step === 'review') setStep('details');
    else if (step === 'confirmed') setStep('review');
  };
  const chooseMethod = (next: FundingMethod) => { setMethod(next); setDetailError(''); setDirection('forward'); setStep(next === 'Crypto' ? 'asset' : 'details'); };
  const continueToReview = () => {
    if (withdraw && isCrypto && destination.trim().length < 8) { setDetailError('Enter a destination wallet address before reviewing.'); return; }
    if (withdraw && !isCrypto && [accountName, bankName, iban, swift].some((value) => !value.trim())) { setDetailError('Complete the beneficiary bank details before reviewing.'); return; }
    setDetailError(''); go('review');
  };
  const chooseAsset = (next: CryptoAsset) => { setAsset(next); setNetwork(cryptoNetworks[next][0].code); go('network'); };
  const copyValue = async (label: string, value: string) => { try { await navigator.clipboard?.writeText(value); } catch {} setCopied(label); window.setTimeout(() => setCopied(''), 1500); };
  const methodLabel = method === 'Crypto' ? 'Crypto' : 'Bank transfer';
  const assetLabel = method === 'Crypto' ? `${asset} · ${activeNetwork.label}` : `${currency} bank rail`;
  const stepPanel = step === 'method' ? <div className="step-panel-content"><div className="flow-section-head"><div><span className="mono">STEP 01 / FUNDING METHOD</span><h3>How would you like to {withdraw ? 'withdraw' : 'fund'}?</h3><p>Choose the rail first. The next step stays in this workspace and keeps your choices visible.</p></div><span className="status warn">PREVIEW ONLY</span></div><div className="step-choice-grid method-choice-grid"><button type="button" className={`method-choice ${method === 'Bank transfer' ? 'active' : ''}`} onClick={() => chooseMethod('Bank transfer')}><span className="method-choice-icon"><Landmark size={19}/></span><span><strong>Bank transfer</strong><small>{withdraw ? 'Send to a beneficiary account' : 'Receive with bank instructions'}</small></span><ArrowRight size={15}/></button><button type="button" className={`method-choice ${method === 'Crypto' ? 'active' : ''}`} onClick={() => chooseMethod('Crypto')}><span className="method-brand-stack method-brand-stack--large"><img src="/assets/payment/tether.svg" alt=""/><img src="/assets/payment/bitcoin.svg" alt=""/><img src="/assets/payment/ethereum.svg" alt=""/></span><span><strong>Crypto</strong><small>Asset, network and wallet flow</small></span><ArrowRight size={15}/></button></div></div>
    : step === 'asset' ? <div className="step-panel-content"><div className="flow-section-head"><div><span className="mono">STEP 02 / CRYPTO ASSET</span><h3>{withdraw ? 'What should we send?' : 'What would you like to fund?'}</h3><p>Select the asset first. Network choices will be filtered to compatible rails.</p></div><span className="status good">SUPPORTED ASSETS</span></div><div className="step-choice-grid crypto-choice-grid">{cryptoAssets.map((item) => <button type="button" key={item.code} className={`asset-choice ${asset === item.code ? 'active' : ''}`} onClick={() => chooseAsset(item.code)}><span className="asset-choice-logo"><PaymentLogo name={item.icon} label={item.code}/></span><span><strong>{item.label}</strong><small>{item.note}</small></span><ArrowRight size={15}/></button>)}</div><button type="button" className="flow-back" onClick={back}>← Back to funding method</button></div>
    : step === 'network' ? <div className="step-panel-content"><div className="flow-section-head"><div><span className="mono">STEP 03 / BLOCKCHAIN NETWORK</span><h3>Where should it travel?</h3><p>Choose the exact network shown by your wallet or destination. Sending on the wrong network can permanently lose funds.</p></div><span className="status warn">VERIFY NETWORK</span></div><div className="network-step-list">{cryptoNetworks[asset].map((item) => <button type="button" key={item.code} className={`network-step-choice ${network === item.code ? 'active' : ''}`} onClick={() => { setNetwork(item.code); go('details'); }}><span className="network-choice-brand"><PaymentLogo name={item.icon} label={item.code}/></span><span><strong>{item.label}</strong><small>Fee {item.fee} · Estimated {item.eta} · Minimum {item.minimum}</small></span><ArrowRight size={15}/></button>)}</div><button type="button" className="flow-back" onClick={back}>← Back to asset</button></div>
    : step === 'details' ? <div className="step-panel-content"><div className="flow-section-head"><div><span className="mono">STEP {isCrypto ? '04' : '02'} / {isCrypto ? 'TRANSFER DETAILS' : 'BANK DETAILS'}</span><h3>{isCrypto ? (withdraw ? 'Enter destination and amount' : 'Confirm receiving details') : (withdraw ? 'Enter beneficiary details' : 'Bank transfer instructions')}</h3><p>{isCrypto ? 'Review the address, amount and fee context before continuing.' : 'Only preview information is shown because no VTA banking provider is connected.'}</p></div><span className="status warn">NOT CONNECTED</span></div>{isCrypto ? <div className="detail-layout"><div className="detail-main">{withdraw ? <label className="field-label">Destination wallet address<input className="step-input" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder={`Paste ${asset} wallet address`} /><small>Preview accepts text only. No destination is submitted.</small></label> : <div className="receive-address"><div><span className="mono">DEPOSIT ADDRESS / PREVIEW</span><h4>Send only {asset} on {activeNetwork.label}</h4><p>This address is synthetic and cannot receive funds.</p><div className="copy-field"><input value={address} readOnly/><button type="button" className="button button--small" onClick={() => copyValue('address', address)}>{copied === 'address' ? 'Copied' : 'Copy'}</button></div></div><div className="qr-frame"><SyntheticQr value={`${asset}-${network}-${address}`}/><small>QR PREVIEW</small></div></div>}<label className="field-label">Amount<div className="amount-step-wrap"><input className="step-input" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal"/><span>{asset}</span></div><small>{withdraw ? `Estimated received after fee: ${received} ${asset}` : `Minimum deposit: ${activeNetwork.minimum}`}</small></label></div><aside className="detail-facts"><div><span>Asset</span><strong>{asset}</strong></div><div><span>Network</span><strong>{activeNetwork.label}</strong></div><div><span>Fee</span><strong>{fee}</strong></div><div><span>Processing</span><strong>{activeNetwork.eta}</strong></div><div><span>{withdraw ? 'Estimated received' : 'Settlement'}</span><strong>{withdraw ? `${received} ${asset}` : 'Review only'}</strong></div></aside></div> : <div className="bank-detail-grid">{withdraw ? <><label className="field-label">Account holder name<input className="step-input" value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="Enter account holder"/></label><label className="field-label">Bank name<input className="step-input" value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Enter bank name"/></label><label className="field-label">Account number / IBAN<input className="step-input" value={iban} onChange={(event) => setIban(event.target.value)} placeholder="Enter IBAN or account number"/></label><label className="field-label">SWIFT / BIC<input className="step-input" value={swift} onChange={(event) => setSwift(event.target.value)} placeholder="Enter SWIFT / BIC"/></label><label className="field-label">Currency<select className="step-input" value={currency} onChange={(event) => setCurrency(event.target.value)}><option>USD</option><option>EUR</option></select></label></> : <><div className="bank-instruction"><span>Bank name</span><strong>NOT AVAILABLE IN PREVIEW</strong><small>Provider connection required</small></div><div className="bank-instruction"><span>Account name</span><strong>Vector Trading Alliance</strong><button type="button" onClick={() => copyValue('account', 'Vector Trading Alliance')}>{copied === 'account' ? 'Copied' : 'Copy'}</button></div><div className="bank-instruction"><span>Account / IBAN</span><strong>NOT RECOVERED</strong><small>No real bank destination is configured.</small></div><div className="bank-instruction"><span>SWIFT / BIC</span><strong>NOT RECOVERED</strong><small>Do not send funds from this preview.</small></div><label className="field-label">Currency<select className="step-input" value={currency} onChange={(event) => setCurrency(event.target.value)}><option>USD</option><option>EUR</option></select></label><label className="field-label">Payment reference<input className="step-input" value="VTA-PREVIEW-ONLY" readOnly/></label></>}</div>}{detailError && <div className="step-error" role="alert">{detailError}</div>}<div className="step-warning"><ShieldCheck size={15}/><span>{withdraw ? 'Withdrawal review only. No funds, wallet address or beneficiary details will be submitted.' : 'Deposit review only. Use no real address or bank instruction from this preview.'}</span></div><div className="step-actions"><button type="button" className="button button--small" onClick={back}>← Back</button><button type="button" className="button" onClick={continueToReview}>{withdraw ? 'Review withdrawal' : 'Continue to review'} <ArrowRight size={15}/></button></div></div>
    : step === 'review' ? <div className="step-panel-content"><div className="flow-section-head"><div><span className="mono">STEP {isCrypto ? '05' : '03'} / REVIEW & CONFIRM</span><h3>Review before you continue</h3><p>Check every material value. This preview cannot create or submit a transaction.</p></div><span className="status warn">SIMULATED ONLY</span></div><div className="review-ledger"><div><span>Method</span><strong>{methodLabel}</strong></div><div><span>Asset / network</span><strong>{assetLabel}</strong></div><div><span>Amount</span><strong>{amount || '0.00'} {isCrypto ? asset : currency}</strong></div><div><span>{withdraw ? 'Destination' : 'Address / instructions'}</span><strong>{isCrypto ? (withdraw ? destination || 'Not entered' : address) : 'Not connected'}</strong></div><div><span>Fees</span><strong>{fee}</strong></div><div><span>{withdraw ? 'Estimated received' : 'Estimated settlement'}</span><strong>{withdraw ? `${received} ${isCrypto ? asset : currency}` : 'Review only'}</strong></div></div><div className="step-warning"><ShieldCheck size={15}/><span>DEMO / NOT CONNECTED: confirming below only acknowledges the preview state. No blockchain or banking action occurs.</span></div><div className="step-actions"><button type="button" className="button button--small" onClick={back}>← Back to edit</button><button type="button" className="button" onClick={() => go('confirmed')}>{withdraw ? 'Confirm withdrawal' : 'Confirm deposit'} <Check size={15}/></button></div></div>
    : <div className="step-panel-content confirmation-panel"><div className="confirmation-mark"><Check size={25}/></div><span className="eyebrow">PREVIEW ACKNOWLEDGED</span><h3>{withdraw ? 'Withdrawal review complete' : 'Deposit review complete'}</h3><p>No transaction was created. The selected {methodLabel.toLowerCase()} flow was completed in preview mode and no customer data was submitted.</p><div className="review-ledger compact"><div><span>Method</span><strong>{methodLabel}</strong></div><div><span>Asset / network</span><strong>{assetLabel}</strong></div><div><span>Amount</span><strong>{amount || '0.00'} {isCrypto ? asset : currency}</strong></div></div><button type="button" className="button" onClick={() => { setStep('method'); setDirection('back'); }}>Start another preview <ArrowRight size={15}/></button></div>;
  return <div className="funds-flow-shell"><div className="funds-command-head"><div><span className="eyebrow">FUNDS / {active.toUpperCase()} / PAPER LEDGER</span><h2>{withdraw ? 'Withdraw with control.' : 'Fund with clarity.'}</h2><p>{withdraw ? 'A guided review journey for destination, network, amount and confirmation.' : 'A guided funding journey with explicit method, asset, network and review steps.'}</p></div><div className="funds-flow-state"><Status tone="amber">DEMO / PREVIEW</Status><span>Provider not connected</span></div></div><div className="funds-balance-rail"><div><span>Total paper balance</span><strong>$25,000.00</strong><small>USD ledger · fictional</small></div><div><span>Available to {withdraw ? 'withdraw' : 'allocate'}</span><strong>$21,605.00</strong><small>Preview buying power</small></div><div><span>Current step</span><strong>{step === 'confirmed' ? 'DONE' : `${stepIndex + 1} / ${progress.length}`}</strong><small>{step === 'confirmed' ? 'Preview complete' : progress[stepIndex]?.[1]}</small></div><div><span>Settlement state</span><strong>LOCAL</strong><small>No external provider</small></div></div><div className="flow-progress flow-progress--full">{progress.map(([key, label], index) => <span key={key} className={`progress-step ${index < stepIndex ? 'is-done' : ''} ${key === step ? 'is-current' : ''}`}><b>{index + 1}</b>{label}</span>)}</div><div className={`step-transition step-transition--${direction}`} key={step}>{stepPanel}</div>{step !== 'confirmed' && <div className="flow-footer-note"><LockKeyhole size={14}/> SIMULATED / NO LIVE FEED / NOT FOR TRADING · No funds, wallet credentials or bank details are processed.</div>}</div>;
}

function RobotContent() {
  const modules = ['Overview','Live Status','Market Regime','Signal','Signal Score','Risk','Positions','Trade History','Execution Log','Strategy','Risk Configuration','News','AI','License','Audit'];
  return <><div className="portal-welcome"><div><span className="eyebrow">MOMENTUM BOOSTER / ADVANCED V1</span><h2>Source tested by the user. Runtime still unconnected.</h2><p>The complete MQL5 source is present in the project, and the user reports testing this same version. Test results remain private. This Portal shows truthful DEMO and UNAVAILABLE states until an approved MT5 connector, account identity, license and data feed exist.</p></div><Status tone="good">SOURCE PRESENT</Status></div><div className="metric-grid"><Metric label="Source" value="V1" note="Implemented from specification" icon={FileText}/><Metric label="Test status" value="USER TESTED" note="Results private" icon={Check}/><Metric label="Runtime" value="DEMO" note="No live order path" icon={Bot}/><Metric label="Signal engine" value="7-part" note="Weighted score" icon={Radar}/><Metric label="Executions" value="—" note="Unavailable" icon={Activity}/></div><div className="panel"><PanelHead title="Required module map" icon={SlidersHorizontal}/><div className="portal-module-grid">{modules.map((module) => <div key={module}><span>{module}</span><Status>{module === 'Strategy' ? '4 MODES / UNTESTED' : module === 'Risk' ? 'RISK-FIRST / UNTESTED' : module === 'Audit' ? 'CODED / UNTESTED' : 'DEMO / UNAVAILABLE'}</Status></div>)}</div></div><div className="portal-grid"><div className="panel"><PanelHead title="Runtime gate" icon={ShieldCheck}/><EmptyState icon={LockKeyhole} title="No trade permission" text="License, connector, account, news, risk and margin gates are not configured. Existing local protections remain part of the EA source." /></div><div className="panel"><PanelHead title="Source and testing" icon={FileText}/><EmptyState icon={FileText} title="MetaTrader testing required" text="MetaEditor compilation, Strategy Tester, broker execution and VTA synchronization must be performed by the user in an MT5 environment." /></div></div></>;
}

function AdminPage() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const active = /^\/admin\/clients\/[^/]+$/.test(location.pathname)
    ? { label: 'Client details', to: location.pathname, icon: Users }
    : (adminNav.find((item) => item.to === location.pathname) || adminNav[0]);
  const denied = new URLSearchParams(location.search).has('denied');
  return <div className="app-shell admin-shell"><aside className={`app-sidebar app-sidebar--admin ${open ? 'app-sidebar--open' : ''}`}><Brand compact/><div className="sidebar-caption">ADMIN / OPERATIONS</div><nav aria-label="Admin navigation">{adminNav.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} end={to === '/admin'} onClick={() => setOpen(false)}><Icon size={17}/><span>{label}</span></NavLink>)}</nav><div className="sidebar-footer"><Status tone="amber">RESTRICTED</Status><span>Role-based access</span></div></aside><main className="app-main"><AppTopbar title={active.label} onMenu={() => setOpen(!open)} kind="admin"/><div className="app-content"><div className="access-banner"><LockKeyhole size={18}/><span>{denied ? 'Administrator identity is valid but does not have an approved VTA operations role.' : 'Administrative routes are server-protected. No operational record is exposed without an approved role.'}</span></div><AdminOperationsContent active={active.label}/></div></main></div>;
}

function AdminContent({ active }: { active: string }) { return <><div className="admin-summary"><div><span className="eyebrow">OPERATIONS CONTROL</span><h2>{active}</h2><p>Search, filter and status architecture is ready. There are no client, payment, KYC, market, or execution records in this environment.</p></div><div className="filter-row"><div className="search-control"><Search size={16}/><input aria-label={`Search ${active}`} placeholder={`Search ${active.toLowerCase()}`} /></div><button className="button button--ghost button--small"><SlidersHorizontal size={15}/>Filter</button></div></div><div className="table-card admin-table"><table><thead><tr><th>Record</th><th>State</th><th>Owner</th><th>Updated</th><th aria-label="Actions"></th></tr></thead><tbody><tr><td colSpan={5}><EmptyState icon={Database} title={`No ${active.toLowerCase()} records`} text="VTA does not create example customer or financial operations data. Connect an authorized operational data source to populate this table." /></td></tr></tbody></table></div></>;
}

function AdminOperationsContent({ active }: { active: string }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'review'>('all');
  const emptyTitle = query.trim()
    ? `No ${active.toLowerCase()} match “${query.trim()}”`
    : filter === 'review'
      ? 'No records require review'
      : `No ${active.toLowerCase()} records`;
  return <>
    <div className="admin-summary">
      <div><span className="eyebrow">OPERATIONS CONTROL</span><h2>{active}</h2><p>Search, filter and status controls are ready. There are no client, payment, KYC, market, or execution records in this environment.</p></div>
      <div className="filter-row">
        <div className="search-control"><Search size={16}/><input aria-label={`Search ${active}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${active.toLowerCase()}`} /></div>
        <button className="button button--ghost button--small" type="button" aria-pressed={filter === 'review'} onClick={() => setFilter((value) => value === 'all' ? 'review' : 'all')}><SlidersHorizontal size={15}/>{filter === 'all' ? 'All states' : 'Requires review'}</button>
      </div>
    </div>
    <div className="table-card admin-table"><table><thead><tr><th>Record</th><th>State</th><th>Owner</th><th>Updated</th><th aria-label="Actions"></th></tr></thead><tbody><tr><td colSpan={5}><EmptyState icon={Database} title={emptyTitle} text={query.trim() || filter === 'review' ? 'Adjust search or filters to return to the intentionally empty operational data set.' : 'VTA does not create example customer or financial operations data. Connect an authorized operational data source to populate this table.'} /></td></tr></tbody></table></div>
  </>;
}

function NotFound() { return <PublicShell><section className="not-found shell"><span className="eyebrow">ERROR 404</span><h1>That VTA route is not in the system.</h1><p>The page may have moved, or the address is not part of the public, Portal or Admin route map.</p><div className="hero-actions"><Link className="button" to="/">Return home <ArrowRight size={17}/></Link><Link className="button button--ghost" to="/platforms">Explore platforms</Link></div></section></PublicShell>; }

export function App() {
  usePageMeta();
  return <Routes>
    <Route path="/" element={<PublicShell><HomePage /></PublicShell>} />
    <Route path="/markets" element={<MarketsPage />} />
    <Route path="/platforms" element={<PlatformsPage />} />
    <Route path="/web-terminal" element={<TerminalPage />} />
    <Route path="/mt4" element={<PlatformDetail platform="MT4" />} />
    <Route path="/mt5" element={<PlatformDetail platform="MT5" />} />
    <Route path="/robots/momentum-booster" element={<MomentumBoosterPage />} />
    <Route path="/analysis" element={<AnalysisPage />} />
    <Route path="/news" element={<NewsPage />} />
    <Route path="/calendar" element={<CalendarPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/faq" element={<FaqPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/login" element={<AuthPage />} />
    <Route path="/register" element={<AuthPage register />} />
    <Route path="/demo" element={<DemoRoute />} />
    <Route path="/portal/*" element={<PortalRoute />} />
    <Route path="/admin/*" element={<AdminRoute />} />
    <Route path="*" element={<NotFound />} />
  </Routes>;
}
