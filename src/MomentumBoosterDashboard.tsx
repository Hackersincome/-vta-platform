import { useState } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Bell, Bot, CalendarDays,
  Check, ChevronDown, CircleHelp, Clock3, FileText, Gauge, History,
  LayoutDashboard, LockKeyhole, Pause, Play, Radio, Settings2, ShieldCheck,
  SlidersHorizontal, Square, TrendingUp, WalletCards,
} from 'lucide-react';
import './momentum-booster.css';
import './momentum-booster-overrides.css';

type DashboardTab = 'overview' | 'performance' | 'positions' | 'history' | 'configuration';
type Field = { key: string; label: string; value: string | number | boolean; type?: 'number' | 'toggle' | 'select' | 'text'; options?: string[]; suffix?: string; locked?: boolean };

const initialConfig: Record<string, string | number | boolean> = {
  InpMagic: 501001, InpLicenseProduct: 'Momentum Booster EA — Advanced V1', InpLicenseActivation: 'UNCONFIGURED', InpLicenseExpiry: '2035.12.31 23:59', InpDemoOnly: true,
  InpStrategy: 'Auto', InpUseH1Filter: true, InpMinScore: 70, InpRequireM5Agreement: true, InpRequireRetestForBreakout: false, InpSwingLookback: 30, InpRangeLookback: 20,
  InpFastEMA: 20, InpSlowEMA: 50, InpRSIPeriod: 14, InpADXPeriod: 14, InpATRPeriod: 14, InpBandsPeriod: 20, InpBandsDeviation: 2, InpAbnormalATRRatio: 2.25, InpExpansionATRRatio: 1.35,
  InpWeightLiquidity: 20, InpWeightStructure: 20, InpWeightMomentum: 20, InpWeightVolatility: 10, InpWeightVolume: 10, InpWeightCandle: 10, InpWeightContext: 10,
  InpRiskProfile: 'Balanced', InpCustomRiskPercent: 0.5, InpMaxDrawdownPercent: 8, InpMaxDailyLossPercent: 3, InpMaxWeeklyLossPercent: 6, InpMaxConsecutiveLosses: 4, InpMinMarginLevel: 300, InpUseFixedLot: false, InpFixedLot: 0.01, InpMaxFixedLotRiskPercent: 0.5, InpMaxSymbolExposureLots: 1,
  InpSlippagePoints: 20, InpMaxSpreadPoints: 40, InpMaxPositions: 1, InpMaxTradesPerHour: 2, InpCooldownMinutes: 15, InpMaxHoldingMinutes: 180,
  InpSL_ATR: 1.5, InpTP_RR: 1.8, InpTP_ATR: 2.7, InpUseBreakEven: true, InpBreakEvenR: 1, InpUseATRTrailing: true, InpTrailATR: 1.2, InpUsePartialClose: false, InpPartialAtR: 1, InpPartialPercent: 50, InpExitOppositeSignal: false, InpExitMomentumLoss: true,
  InpUseSessionFilter: true, InpSessionStartHour: 7, InpSessionEndHour: 20, InpProtectFridayLate: true, InpFridayStopHour: 18, InpManualNewsBlackout: false, InpNewsBlackoutStart: '1970.01.01 00:00', InpNewsBlackoutEnd: '1970.01.01 00:00', InpRequireNewsProvider: false,
  InpUseAI: false, InpAIAllowlistedEndpoint: '', InpAIAllowedHost: '', InpAITTLSeconds: 60,
};

const groups: { title: string; caption: string; fields: Field[] }[] = [
  { title: 'General', caption: 'Identity and execution', fields: [
    { key: 'InpDemoOnly', label: 'Demo-only mode', value: true, type: 'toggle', locked: true },
    { key: 'InpMagic', label: 'Expert magic number', value: 501001, type: 'number' },
    { key: 'InpLicenseProduct', label: 'License product', value: 'Momentum Booster EA — Advanced V1', type: 'text', locked: true },
    { key: 'InpLicenseActivation', label: 'License activation', value: 'UNCONFIGURED', type: 'text', locked: true },
    { key: 'InpLicenseExpiry', label: 'License expiry', value: '2035.12.31 23:59', type: 'text', locked: true },
  ] },
  { title: 'Trading & strategy', caption: 'Strategy pipeline', fields: [
    { key: 'InpStrategy', label: 'Strategy mode', value: 'Auto', type: 'select', options: ['Trend', 'Breakout', 'Mean reversion', 'Auto'] },
    { key: 'InpUseH1Filter', label: 'Use H1 context filter', value: true, type: 'toggle' },
    { key: 'InpMinScore', label: 'Minimum signal score', value: 70, type: 'number', suffix: '/ 100' },
    { key: 'InpRequireM5Agreement', label: 'Require M5 agreement', value: true, type: 'toggle' },
    { key: 'InpRequireRetestForBreakout', label: 'Require breakout retest', value: false, type: 'toggle' },
    { key: 'InpSwingLookback', label: 'Swing lookback', value: 30, type: 'number', suffix: 'bars' },
    { key: 'InpRangeLookback', label: 'Range lookback', value: 20, type: 'number', suffix: 'bars' },
  ] },
  { title: 'Risk', caption: 'Risk profiles', fields: [
    { key: 'InpRiskProfile', label: 'Risk profile', value: 'Balanced', type: 'select', options: ['Conservative', 'Balanced', 'Aggressive', 'Custom'] },
    { key: 'InpCustomRiskPercent', label: 'Custom risk per trade', value: 0.5, type: 'number', suffix: '%' },
    { key: 'InpMaxDrawdownPercent', label: 'Maximum drawdown', value: 8, type: 'number', suffix: '%' },
    { key: 'InpMaxDailyLossPercent', label: 'Maximum daily loss', value: 3, type: 'number', suffix: '%' },
    { key: 'InpMaxWeeklyLossPercent', label: 'Maximum weekly loss', value: 6, type: 'number', suffix: '%' },
    { key: 'InpMaxConsecutiveLosses', label: 'Maximum consecutive losses', value: 4, type: 'number' },
    { key: 'InpMinMarginLevel', label: 'Minimum margin level', value: 300, type: 'number', suffix: '%' },
    { key: 'InpUseFixedLot', label: 'Use fixed lot', value: false, type: 'toggle' },
    { key: 'InpFixedLot', label: 'Fixed lot', value: 0.01, type: 'number' },
    { key: 'InpMaxFixedLotRiskPercent', label: 'Maximum fixed-lot risk', value: 0.5, type: 'number', suffix: '%' },
    { key: 'InpMaxSymbolExposureLots', label: 'Maximum symbol exposure', value: 1, type: 'number', suffix: 'lots' },
  ] },
  { title: 'Execution', caption: 'Spread, slippage and trade limits', fields: [
    { key: 'InpSlippagePoints', label: 'Slippage protection', value: 20, type: 'number', suffix: 'points' },
    { key: 'InpMaxSpreadPoints', label: 'Maximum spread', value: 40, type: 'number', suffix: 'points' },
    { key: 'InpMaxPositions', label: 'Maximum open positions', value: 1, type: 'number' },
    { key: 'InpMaxTradesPerHour', label: 'Maximum trades per hour', value: 2, type: 'number' },
    { key: 'InpCooldownMinutes', label: 'Cooldown', value: 15, type: 'number', suffix: 'min' },
    { key: 'InpMaxHoldingMinutes', label: 'Maximum holding time', value: 180, type: 'number', suffix: 'min' },
  ] },
  { title: 'Stops & management', caption: 'Stops and management', fields: [
    { key: 'InpSL_ATR', label: 'Stop loss', value: 1.5, type: 'number', suffix: '× ATR' },
    { key: 'InpTP_RR', label: 'Take profit risk/reward', value: 1.8, type: 'number', suffix: 'R' },
    { key: 'InpTP_ATR', label: 'Take profit', value: 2.7, type: 'number', suffix: '× ATR' },
    { key: 'InpUseBreakEven', label: 'Move stop to break-even', value: true, type: 'toggle' },
    { key: 'InpBreakEvenR', label: 'Break-even trigger', value: 1, type: 'number', suffix: 'R' },
    { key: 'InpUseATRTrailing', label: 'Use ATR trailing stop', value: true, type: 'toggle' },
    { key: 'InpTrailATR', label: 'Trailing distance', value: 1.2, type: 'number', suffix: '× ATR' },
    { key: 'InpUsePartialClose', label: 'Use partial close', value: false, type: 'toggle' },
    { key: 'InpPartialAtR', label: 'Partial close trigger', value: 1, type: 'number', suffix: 'R' },
    { key: 'InpPartialPercent', label: 'Partial close size', value: 50, type: 'number', suffix: '%' },
    { key: 'InpExitOppositeSignal', label: 'Exit on opposite signal', value: false, type: 'toggle' },
    { key: 'InpExitMomentumLoss', label: 'Exit on momentum loss', value: true, type: 'toggle' },
  ] },
  { title: 'Sessions & news', caption: 'Session filters and news safeguards', fields: [
    { key: 'InpUseSessionFilter', label: 'Use session filter', value: true, type: 'toggle' },
    { key: 'InpSessionStartHour', label: 'Session start hour', value: 7, type: 'number' },
    { key: 'InpSessionEndHour', label: 'Session end hour', value: 20, type: 'number' },
    { key: 'InpProtectFridayLate', label: 'Protect late Friday', value: true, type: 'toggle' },
    { key: 'InpFridayStopHour', label: 'Friday stop hour', value: 18, type: 'number' },
    { key: 'InpManualNewsBlackout', label: 'Manual news blackout', value: false, type: 'toggle' },
    { key: 'InpNewsBlackoutStart', label: 'News blackout start', value: '1970.01.01 00:00', type: 'text' },
    { key: 'InpNewsBlackoutEnd', label: 'News blackout end', value: '1970.01.01 00:00', type: 'text' },
    { key: 'InpRequireNewsProvider', label: 'Require news provider', value: false, type: 'toggle' },
  ] },
  { title: 'Indicators & scoring', caption: 'Indicators and signal weights', fields: [
    { key: 'InpFastEMA', label: 'Fast EMA', value: 20, type: 'number' }, { key: 'InpSlowEMA', label: 'Slow EMA', value: 50, type: 'number' },
    { key: 'InpRSIPeriod', label: 'RSI period', value: 14, type: 'number' }, { key: 'InpADXPeriod', label: 'ADX period', value: 14, type: 'number' },
    { key: 'InpATRPeriod', label: 'ATR period', value: 14, type: 'number' }, { key: 'InpBandsPeriod', label: 'Bands period', value: 20, type: 'number' },
    { key: 'InpBandsDeviation', label: 'Bands deviation', value: 2, type: 'number' }, { key: 'InpAbnormalATRRatio', label: 'Abnormal ATR ratio', value: 2.25, type: 'number' },
    { key: 'InpExpansionATRRatio', label: 'Expansion ATR ratio', value: 1.35, type: 'number' },
    { key: 'InpWeightLiquidity', label: 'Liquidity weight', value: 20, type: 'number' }, { key: 'InpWeightStructure', label: 'Structure weight', value: 20, type: 'number' },
    { key: 'InpWeightMomentum', label: 'Momentum weight', value: 20, type: 'number' }, { key: 'InpWeightVolatility', label: 'Volatility weight', value: 10, type: 'number' },
    { key: 'InpWeightVolume', label: 'Volume weight', value: 10, type: 'number' }, { key: 'InpWeightCandle', label: 'Candle weight', value: 10, type: 'number' },
    { key: 'InpWeightContext', label: 'Context weight', value: 10, type: 'number' },
  ] },
  { title: 'Optional AI guard', caption: 'AI guard · off by default', fields: [
    { key: 'InpUseAI', label: 'Enable optional AI guard', value: false, type: 'toggle' },
    { key: 'InpAIAllowlistedEndpoint', label: 'Allowlisted endpoint', value: '', type: 'text' },
    { key: 'InpAIAllowedHost', label: 'Allowed host', value: '', type: 'text' },
    { key: 'InpAITTLSeconds', label: 'Cache duration', value: 60, type: 'number', suffix: 'sec' },
  ] },
];

const tabs: { id: DashboardTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'positions', label: 'Positions', icon: Activity },
  { id: 'history', label: 'Trade history', icon: History },
  { id: 'configuration', label: 'Configuration', icon: Settings2 },
];

function RobotStatus({ label, tone = 'amber' }: { label: string; tone?: 'amber' | 'green' }) {
  return <span className={`mb-state mb-state--${tone}`}><i aria-hidden="true" />{label}</span>;
}

function ConfigField({ field, value, onChange }: { field: Field; value: string | number | boolean; onChange: (value: string | number | boolean) => void }) {
  return <label className={`mb-config-field${field.type === 'toggle' ? ' mb-config-field--toggle' : ''}`}>
    <span className="mb-config-label">{field.label}<small>{field.key}</small></span>
    {field.type === 'toggle'
      ? <input type="checkbox" checked={Boolean(value)} disabled={field.locked} onChange={(event) => onChange(event.target.checked)} aria-label={field.label} />
      : field.type === 'select'
        ? <select aria-label={field.label} value={String(value)} disabled={field.locked} onChange={(event) => onChange(event.target.value)}>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>
        : <span className="mb-config-input-wrap"><input aria-label={field.label} type={field.type === 'number' ? 'number' : 'text'} step={field.type === 'number' ? 'any' : undefined} value={String(value)} readOnly={field.locked} onChange={(event) => onChange(field.type === 'number' ? event.target.value : event.target.value)} />{field.suffix && <small>{field.suffix}</small>}</span>}
  </label>;
}

function EmptyTable({ columns, title, description }: { columns: string[]; title: string; description: string }) {
  return <div className="mb-table-wrap"><table className="mb-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody><tr><td colSpan={columns.length}><div className="mb-table-empty"><span><Radio size={17} /></span><strong>{title}</strong><p>{description}</p></div></td></tr></tbody></table></div>;
}

export default function MomentumBoosterDashboard() {
  const [tab, setTab] = useState<DashboardTab>('overview');
  const [acknowledged, setAcknowledged] = useState(false);
  const [notice, setNotice] = useState('');
  const [config, setConfig] = useState(initialConfig);
  const [draftSaved, setDraftSaved] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('All activity');
  const [period, setPeriod] = useState('1M');

  const startRobot = () => setNotice(acknowledged
    ? 'Start blocked. Demo-only mode is enforced by the EA, its license is unconfigured, and no MT5 account or connection is available. No trading action was sent.'
    : 'Please review the risk disclosure. Robot start remains blocked by demo-only mode and the missing account connection.');
  const saveDraft = () => {
    setDraftSaved(true);
    setNotice('Preview draft updated on this screen only. Changes have not been saved to an account or applied to MetaTrader.');
  };

  return <section className="mb-dashboard" aria-label="Momentum Booster automated trading dashboard">
    <header className="mb-command-hero">
      <div className="mb-hero-art"><img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/robot_command_center.png-zfcxKSxnXPjG0hgswYlavkD11xnIGu.webp" alt="White and gold Momentum Booster robot in a blue-lit trading command center" /><div className="mb-art-wash" /><span className="mb-art-caption">VTA AUTOMATION<br /><b>ADVANCED V1</b></span><span className="mb-art-index">01 / EA</span></div>
      <div className="mb-hero-panel">
        <div className="mb-hero-topline"><span className="mb-kicker">AUTOMATED TRADING / MT5 EXPERT ADVISOR</span><RobotStatus label="NOT CONFIGURED" /></div>
        <div className="mb-title-row"><div><h2>Momentum Booster <span>Advanced Edition</span></h2><p>Risk-first automation through a measured multi-timeframe decision path.</p></div><span className="mb-edition">V1.00</span></div>
        <div className="mb-account-context">
          <label><span>TRADING ACCOUNT</span><select aria-label="Trading account" value="" disabled><option value="">No account linked</option></select></label>
          <div className="mb-platform-tag"><span>MT5</span><div><small>PLATFORM / ACCOUNT TYPE</small><strong>Not connected · unknown</strong></div><ChevronDown size={14} /></div>
        </div>
        <div className="mb-hero-readouts"><div><WalletCards size={15} /><span><small>ACCOUNT BALANCE</small><strong>—</strong><em>Awaiting account link</em></span></div><div><FileText size={15} /><span><small>LICENSE</small><strong>Unconfigured</strong><em>No license activation</em></span></div></div>
        <label className="mb-disclosure"><input type="checkbox" checked={acknowledged} onChange={(event) => { setAcknowledged(event.target.checked); setNotice(''); }} /><span>I understand automated trading risks and the <button type="button" onClick={() => setNotice('Automated trading can lose money. No broker is connected to this preview, and no trade or performance data is shown.')}>risk disclosure</button>.</span></label>
        <div className="mb-control-row"><button type="button" className="mb-button mb-button--start" onClick={startRobot}><Play size={13} fill="currentColor" />Start robot</button><button type="button" className="mb-button mb-button--muted" disabled aria-label="Pause robot. No runtime is connected"><Pause size={14} />Pause</button><button type="button" className="mb-button mb-button--muted" disabled aria-label="Stop robot. No runtime is connected"><Square size={12} fill="currentColor" />Stop</button><button type="button" className="mb-button mb-button--configure" onClick={() => { setTab('configuration'); setNotice(''); }}><SlidersHorizontal size={14} />Configure</button></div>
        {notice && <p className="mb-inline-notice" role="status"><AlertTriangle size={14} />{notice}</p>}
        <div className="mb-hero-foot"><LockKeyhole size={12} />DEMO ONLY · NO ACCOUNT LINKED · ORDERS DISABLED</div>
      </div>
    </header>

    <div className="mb-connection-rail" aria-label="Robot connection chain">
      {[['VTA', 'Interface available', Check], ['Trading account', 'Not configured', WalletCards], ['MT5 terminal', 'Not connected', Radio], ['Momentum Booster', 'Demo only', Bot], ['Automated trading', 'Disabled', LockKeyhole]].map(([name, state, Icon], index) => { const StageIcon = Icon as typeof Check; return <div className="mb-connection-node" key={name as string}><span className={`mb-connection-mark${index === 0 ? ' mb-connection-mark--good' : ''}`}><StageIcon size={13} /></span><span><small>{name as string}</small><strong>{state as string}</strong></span>{index < 4 && <ArrowRight className="mb-connection-arrow" size={14} />}</div>; })}
    </div>

    <nav className="mb-tabs" aria-label="Momentum Booster sections" role="tablist">{tabs.map(({ id, label, icon: Icon }) => <button type="button" key={id} id={`mb-tab-${id}`} role="tab" aria-selected={tab === id} aria-controls="mb-tabpanel" onClick={() => { setTab(id); setNotice(''); }} className={tab === id ? 'is-active' : ''}><Icon size={15} />{label}</button>)}</nav>

    <div id="mb-tabpanel" className="mb-tabpanel" role="tabpanel" aria-labelledby={`mb-tab-${tab}`}>
      {tab === 'overview' && <div className="mb-overview-content">
        <div className="mb-section-heading"><div><span className="mb-kicker">ACCOUNT SNAPSHOT</span><h3>Performance at a glance</h3></div><span className="mb-unavailable-tag"><i />Awaiting verified MT5 data</span></div>
        <div className="mb-metric-grid">{[
          { label: 'Balance', note: 'No account connected', icon: WalletCards }, { label: 'Equity', note: 'No account connected', icon: Gauge },
          { label: 'P/L', note: 'No position feed available', icon: TrendingUp }, { label: 'Net P/L', note: 'No trade history available', icon: Activity },
          { label: 'Drawdown', note: 'No account data available', icon: BarChart3 }, { label: 'Win rate', note: 'No closed trades available', icon: TrendingUp },
          { label: 'Number of trades', note: 'No trade history available', icon: FileText }, { label: 'Active positions', note: 'Position feed unavailable', icon: Radio },
        ].map(({ label, note, icon: Icon }) => <article className="mb-metric" key={label}><div className="mb-metric-head"><span>{label}</span><Icon size={15} /></div><strong>—</strong><small>{note}</small></article>)}</div>
        <div className="mb-overview-lower"><section className="mb-panel mb-activity-panel"><div className="mb-panel-heading"><div><span className="mb-kicker">POSITION MONITOR</span><h3>Active positions</h3></div><button type="button" className="mb-text-button" onClick={() => setTab('positions')}>View positions <ArrowRight size={13} /></button></div><EmptyTable columns={['SYMBOL', 'SIDE / VOLUME', 'ENTRY', 'MARKET', 'SL / TP', 'FLOATING P/L']} title="No live positions" description="Position details will appear after a verified account connection. Nothing is simulated." /></section><section className="mb-panel mb-activity-panel"><div className="mb-panel-heading"><div><span className="mb-kicker">LATEST ACTIVITY</span><h3>Recent trades</h3></div><button type="button" className="mb-text-button" onClick={() => setTab('history')}>View history <ArrowRight size={13} /></button></div><EmptyTable columns={['TIME', 'SYMBOL', 'DIRECTION', 'P/L', 'STATUS']} title="No trade activity" description="Trade history is unavailable until an MT5 account is connected." /></section></div>
      </div>}

      {tab === 'performance' && <section className="mb-panel mb-detail-panel"><div className="mb-section-heading"><div><span className="mb-kicker">PERFORMANCE / ACCOUNT-DERIVED DATA</span><h3>Performance overview</h3></div><span className="mb-unavailable-tag"><i />No verified data</span></div><div className="mb-period-picker" aria-label="Chart period">{['1W', '1M', '3M', '6M', '1Y', 'ALL'].map((item) => <button type="button" key={item} aria-pressed={item === period} onClick={() => setPeriod(item)}>{item}</button>)}</div><div className="mb-empty-chart"><div className="mb-chart-axis"><span>—</span><span>—</span><span>—</span><span>—</span></div><svg viewBox="0 0 700 230" preserveAspectRatio="none" role="img" aria-label={`Performance chart unavailable for ${period}; no account data is connected`}><path d="M0 28H700M0 84H700M0 140H700M0 196H700" /><path className="mb-chart-axis-vertical" d="M1 0V220M175 0V220M350 0V220M525 0V220M699 0V220" /></svg><div className="mb-chart-empty-label"><BarChart3 size={18} /><span>Performance history not available</span><small>No account balance or trade history has been provided by a connected account.</small></div><div className="mb-chart-times">{['—', '—', '—', '—', '—'].map((label, index) => <span key={index}>{label}</span>)}</div></div><div className="mb-performance-grid">{['Gross profit', 'Gross loss', 'Average trade', 'Largest win', 'Largest loss', 'Trade count'].map((label) => <div key={label}><small>{label}</small><strong>—</strong></div>)}</div></section>}

      {tab === 'positions' && <section className="mb-panel mb-detail-panel"><div className="mb-section-heading"><div><span className="mb-kicker">MT5 ACCOUNT / OPEN EXPOSURE</span><h3>Active positions</h3></div><RobotStatus label="POSITION FEED UNAVAILABLE" /></div><EmptyTable columns={['SYMBOL', 'SIDE', 'VOLUME', 'ENTRY PRICE', 'CURRENT PRICE', 'STOP LOSS', 'TAKE PROFIT', 'FLOATING P/L', 'OPEN TIME', 'STATUS']} title="No active positions to display" description="There is no connected trading account. No live positions or simulated trade data is shown." /><p className="mb-data-note"><CircleHelp size={14} />Position details require a verified account connection.</p></section>}

      {tab === 'history' && <section className="mb-panel mb-detail-panel"><div className="mb-section-heading"><div><span className="mb-kicker">ACCOUNT RECORD / READ-ONLY</span><h3>Trade history</h3></div><div className="mb-history-actions"><label className="mb-history-filter"><CalendarDays size={14} /><select aria-label="Filter trade history" value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)}><option>All activity</option><option>Today</option><option>Last 7 days</option><option>Last 30 days</option></select><ChevronDown size={13} /></label><button type="button" className="mb-button mb-export-button" disabled><FileText size={14} />Export</button></div></div><EmptyTable columns={['DATE / TIME', 'SYMBOL', 'DIRECTION', 'ENTRY', 'EXIT', 'VOLUME', 'P/L', 'DURATION', 'STATUS']} title={`No ${historyFilter.toLowerCase()} available`} description="Trade history and export require a verified account connection." /></section>}

      {tab === 'configuration' && <div className="mb-config-content"><div className="mb-section-heading"><div><span className="mb-kicker">EA INPUTS / MOMENTUM_BOOSTER_ADVANCED_V1</span><h3>Robot configuration</h3><p>Fields and defaults mirror the shipped MQL5 source. Changes stay in this preview and are never sent to MT5.</p></div><span className="mb-preview-only-label"><LockKeyhole size={12} />PREVIEW ONLY</span></div><div className="mb-config-banner"><ShieldCheck size={16} /><span><strong>Demo-only safety is locked on.</strong> The EA input <code>InpDemoOnly = true</code> prevents order execution. License activation is unconfigured.</span></div><div className="mb-config-groups">{groups.map((group, index) => <details className="mb-config-section" key={group.title} open={index < 3}><summary><span className="mb-config-summary-icon">{index === 2 ? <ShieldCheck size={15} /> : index > 2 ? <Gauge size={15} /> : <Settings2 size={15} />}</span><span><strong>{group.title}</strong><small>{group.caption}</small></span><span className="mb-config-count">{group.fields.length} inputs</span><ChevronDown className="mb-config-chevron" size={15} /></summary><div className="mb-config-fields">{group.fields.map((field) => <ConfigField key={field.key} field={field} value={config[field.key]} onChange={(value) => { setDraftSaved(false); setConfig((current) => ({ ...current, [field.key]: value })); }} />)}</div></details>)}</div><div className="mb-config-footer"><span><LockKeyhole size={13} />Temporary draft; not synchronized with MT5.</span><button type="button" className="mb-button mb-button--save" onClick={saveDraft}><Check size={14} />{draftSaved ? 'Draft updated' : 'Save preview draft'}</button></div></div>}
    </div>

    <footer className="mb-safety-footer"><span><ShieldCheck size={15} />SAFETY GATES ACTIVE</span><span>DEMO ONLY · LICENSE UNCONFIGURED · ACCOUNT NOT CONNECTED</span><span><Bell size={13} />No automated orders or live performance data</span></footer>
  </section>;
}
