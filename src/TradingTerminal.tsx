import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { ArrowUpRight, BarChart3, Camera, Check, ChevronDown, Clock3, Crosshair, Download, Expand, Minus, MoveRight, PanelTop, Plus, Search, ShieldAlert, Trash2, TrendingUp, WifiOff, X } from 'lucide-react';
import { CandlestickSeries, ColorType, CrosshairMode, createChart, HistogramSeries, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { browserMarketDataProvider, instrumentRegistry } from './terminal-data';
import type { Bar, HistoricalBarsResult, Instrument } from './terminal-data';
import { Link } from 'react-router-dom';

type Interval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
type Range = '1D' | '1W' | '1M' | '3M' | 'ALL';
type Indicator = 'none' | 'sma20' | 'sma50' | 'both';
type Tool = 'cursor' | 'trendline' | 'ray';
type Point = { time: Time; price: number };
type Drawing = { type: 'trendline' | 'ray'; start: Point; end: Point };
type LoadState = 'loading' | HistoricalBarsResult['state'];
type ChartCapture = { current: (() => HTMLCanvasElement) | null };
const INTERVALS: Interval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
const RANGES: Range[] = ['1D', '1W', '1M', '3M', 'ALL'];
const RANGE_MS: Record<Exclude<Range, 'ALL'>, number> = { '1D': 86400000, '1W': 604800000, '1M': 2592000000, '3M': 7776000000 };
const WINDOW_NAME: Record<Range, string> = { '1D': '24 hours', '1W': '7 days', '1M': '30 days', '3M': '90 days', ALL: 'available history' };
const formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
const timeFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const showPrice = (n?: number) => n !== undefined && Number.isFinite(n) ? formatter.format(n) : '—';

function sma(bars: Bar[], length: number) {
  return bars.map((bar, i) => ({ time: bar.time as Time, value: i < length - 1 ? null : bars.slice(i - length + 1, i + 1).reduce((sum, item) => sum + item.close, 0) / length })).filter((point): point is { time: Time; value: number } => point.value !== null);
}

function exportBars(symbol: string, interval: Interval, bars: Bar[]) {
  const slug = symbol.replace(/[^a-zA-Z0-9_-]/g, '-');
  const csv = ['time_utc,open,high,low,close,volume', ...bars.map((bar) => [new Date(bar.time * 1000).toISOString(), bar.open, bar.high, bar.low, bar.close, bar.volume ?? ''].join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = `vta-${slug}-${interval}-historical.csv`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Watchlist({ selected, items, price, choose, add, remove }: { selected: Instrument; items: Instrument[]; price?: number; choose: (item: Instrument) => void; add: (item: Instrument) => void; remove: (symbol: string) => void }) {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => instrumentRegistry.filter((item) => !items.some((saved) => saved.symbol === item.symbol) && `${item.symbol} ${item.assetClass}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5), [items, query]);
  return <section className="vta-panel vta-watch-panel" aria-label="Market watchlist">
    <header className="vta-panel-heading"><div><span className="vta-overline">YOUR MARKETS</span><h2>Watchlist</h2></div><span className="vta-panel-count">{String(items.length).padStart(2, '0')}</span></header>
    <div className="vta-search-wrap"><Search size={14} aria-hidden="true" /><input aria-label="Search instruments to add" type="search" placeholder="Add an instrument" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={13} /></button>}</div>
    {query.trim() && <div className="vta-search-results" role="listbox" aria-label="Matching instruments">{matches.length ? matches.map((item) => <button key={item.symbol} role="option" aria-selected="false" type="button" onClick={() => { add(item); setQuery(''); }}><span><strong>{item.display}</strong><small>{item.assetClass}</small></span><Plus size={15} /></button>) : <p>No additional instruments match.</p>}</div>}
    <div className="vta-market-labels" aria-hidden="true"><span>INSTRUMENT</span><span>LAST COMPLETED</span></div>
    <ul className="vta-watch-list">{items.map((item) => <li key={item.symbol}><button type="button" className={`vta-watch-instrument${selected.symbol === item.symbol ? ' is-selected' : ''}`} aria-current={selected.symbol === item.symbol ? 'true' : undefined} onClick={() => choose(item)}><span className="vta-market-icon">{item.assetClass === 'Crypto' ? 'CR' : item.assetClass === 'Forex' ? 'FX' : item.assetClass.slice(0, 2).toUpperCase()}</span><span className="vta-watch-symbol"><strong>{item.display}</strong><small>{item.assetClass}</small></span><span className="vta-watch-quote"><strong>{selected.symbol === item.symbol && price !== undefined ? showPrice(price) : item.status === 'HISTORICAL AVAILABLE' ? 'View' : '—'}</strong><small>{selected.symbol === item.symbol && price !== undefined ? 'HISTORICAL' : item.status === 'HISTORICAL AVAILABLE' ? 'HISTORY' : 'UNAVAILABLE'}</small></span></button><button type="button" aria-label={`Remove ${item.display} from watchlist`} className="vta-watch-remove" onClick={() => remove(item.symbol)}><X size={12} /></button></li>)}</ul>
    <div className="vta-watch-note"><WifiOff size={13} /><span>Only the selected instrument loads historical prices.</span></div>
  </section>;
}

function MarketChart({ bars, state, message, source, instrument, interval, setInterval, indicator, style, volume, tool, drawings, pending, hover, capture, onCrosshair, onPlace }: { bars: Bar[]; state: LoadState; hover: Bar | null; capture: ChartCapture; message: string; source: string; instrument: Instrument; interval: Interval; setInterval: (i: Interval) => void; indicator: Indicator; style: 'candles' | 'line'; volume: boolean; tool: Tool; drawings: Drawing[]; pending: Point | null; onCrosshair: (bar: Bar | null) => void; onPlace: (point: Point) => void; }) {
  const el = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const candles = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const closeLine = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeries = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ma20 = useRef<ISeriesApi<'Line'> | null>(null);
  const ma50 = useRef<ISeriesApi<'Line'> | null>(null);
  const [width, setWidth] = useState(0);
  const byTime = useMemo(() => new Map(bars.map((bar) => [bar.time, bar])), [bars]);
  const last = bars.at(-1);
  const display = hover || last;

  useEffect(() => {
    if (!el.current) return;
    const api = createChart(el.current, { width: el.current.clientWidth, height: el.current.clientHeight || 356, layout: { background: { type: ColorType.Solid, color: '#0b1319' }, textColor: '#75838e', fontFamily: 'DM Sans, Arial, sans-serif', fontSize: 11, attributionLogo: true }, grid: { vertLines: { color: 'rgba(126,148,160,.055)' }, horzLines: { color: 'rgba(126,148,160,.085)' } }, crosshair: { mode: CrosshairMode.Normal, vertLine: { color: 'rgba(94,230,191,.48)', width: 1, style: 2, labelBackgroundColor: '#17372f' }, horzLine: { color: 'rgba(94,230,191,.48)', width: 1, style: 2, labelBackgroundColor: '#17372f' } }, rightPriceScale: { borderColor: 'rgba(126,148,160,.14)', scaleMargins: { top: .1, bottom: .25 } }, timeScale: { borderColor: 'rgba(126,148,160,.14)', timeVisible: true, rightOffset: 4, barSpacing: 8, minBarSpacing: 2 }, localization: { dateFormat: 'dd MMM yyyy', locale: 'en-US' }, handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true }, handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false } });
    const precision = instrument.assetClass === 'Forex' ? instrument.symbol.endsWith('JPY') ? 3 : 5 : 2;
    const cs = api.addSeries(CandlestickSeries, { upColor: '#36c994', downColor: '#ee6977', borderUpColor: '#36c994', borderDownColor: '#ee6977', wickUpColor: '#36c994', wickDownColor: '#ee6977', priceFormat: { type: 'price', precision, minMove: 10 ** -precision }, lastValueVisible: false, priceLineVisible: false });
    const ls = api.addSeries(LineSeries, { color: '#55ddae', lineWidth: 2, lastValueVisible: false, priceLineVisible: false, visible: false });
    const a20 = api.addSeries(LineSeries, { color: '#e9bd70', lineWidth: 1, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false, visible: false });
    const a50 = api.addSeries(LineSeries, { color: '#92a9ff', lineWidth: 1, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false, visible: false });
    const vs = api.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'volume', lastValueVisible: false, priceLineVisible: false });
    api.priceScale('volume').applyOptions({ scaleMargins: { top: .81, bottom: 0 }, borderVisible: false, visible: false });
    chart.current = api; candles.current = cs; closeLine.current = ls; ma20.current = a20; ma50.current = a50; volumeSeries.current = vs; capture.current = () => api.takeScreenshot(true, true);
    const observer = new ResizeObserver(([entry]) => { const w = Math.floor(entry.contentRect.width); const h = Math.floor(entry.contentRect.height); if (w > 0 && h > 0) { api.applyOptions({ width: w, height: h }); setWidth(w); } });
    observer.observe(el.current);
    return () => { observer.disconnect(); capture.current = null; api.remove(); chart.current = null; candles.current = null; closeLine.current = null; ma20.current = null; ma50.current = null; volumeSeries.current = null; };
  }, [capture, instrument.assetClass, instrument.symbol]);

  useEffect(() => {
    if (!chart.current || !candles.current || !closeLine.current || !volumeSeries.current) return;
    candles.current.setData(bars.map((b) => ({ time: b.time as Time, open: b.open, high: b.high, low: b.low, close: b.close })));
    closeLine.current.setData(bars.map((b) => ({ time: b.time as Time, value: b.close })));
    volumeSeries.current.setData(bars.map((b) => ({ time: b.time as Time, value: b.volume || 0, color: b.close >= b.open ? 'rgba(54,201,148,.32)' : 'rgba(238,105,119,.32)' })));
    ma20.current?.setData(indicator === 'sma20' || indicator === 'both' ? sma(bars, 20) : []);
    ma50.current?.setData(indicator === 'sma50' || indicator === 'both' ? sma(bars, 50) : []);
    if (bars.length) chart.current.timeScale().fitContent();
  }, [bars, indicator, instrument.symbol]);
  useEffect(() => { candles.current?.applyOptions({ visible: style === 'candles' }); closeLine.current?.applyOptions({ visible: style === 'line' }); ma20.current?.applyOptions({ visible: indicator === 'sma20' || indicator === 'both' }); ma50.current?.applyOptions({ visible: indicator === 'sma50' || indicator === 'both' }); chart.current?.priceScale('volume').applyOptions({ visible: volume }); }, [style, indicator, volume]);
  useEffect(() => { const api = chart.current; if (!api) return; const handler = (event: { time?: Time }) => onCrosshair(typeof event.time === 'number' ? byTime.get(event.time) || null : null); api.subscribeCrosshairMove(handler); return () => api.unsubscribeCrosshairMove(handler); }, [byTime, onCrosshair]);

  function plot(event: MouseEvent<HTMLDivElement>) {
    const api = chart.current; const series = candles.current; if (!api || !series) return;
    const rect = event.currentTarget.getBoundingClientRect(); const time = api.timeScale().coordinateToTime(event.clientX - rect.left); const price = series.coordinateToPrice(event.clientY - rect.top);
    if (time !== null && price !== null && Number.isFinite(price)) onPlace({ time, price });
  }
  const lines = drawings.map((drawing, i) => { const x1 = chart.current?.timeScale().timeToCoordinate(drawing.start.time); const y1 = candles.current?.priceToCoordinate(drawing.start.price); const x2 = drawing.type === 'ray' ? width - 64 : chart.current?.timeScale().timeToCoordinate(drawing.end.time); const y2 = candles.current?.priceToCoordinate(drawing.end.price); return x1 == null || y1 == null || x2 == null || y2 == null ? null : <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={drawing.type === 'ray' ? '#e9bd70' : '#55ddae'} strokeWidth="1.5" strokeDasharray={drawing.type === 'ray' ? '5 4' : undefined} />; });
  const y = pending ? candles.current?.priceToCoordinate(pending.price) : null;
  const x = pending ? chart.current?.timeScale().timeToCoordinate(pending.time) : null;
  return <section className="vta-panel vta-chart-panel" aria-label={`${instrument.display} historical market chart`}>
    <header className="vta-chart-instrument-row"><div className="vta-instrument-heading"><span className="vta-chart-asset-mark">{instrument.assetClass === 'Crypto' ? 'CR' : instrument.assetClass.slice(0, 2).toUpperCase()}</span><span className="vta-instrument-name"><strong>{instrument.display}</strong><small>{instrument.assetClass} · {instrument.quoteCurrency || 'Quote'} · Provider mapped</small></span>{last && <span className={`vta-chart-last${last.close >= last.open ? ' is-up' : ' is-down'}`}><strong>{showPrice(last.close)}</strong><small>LAST COMPLETED CANDLE</small></span>}</div><span className="vta-source-chip"><i className={state === 'HISTORICAL DATA' ? 'is-up' : state === 'loading' ? 'is-pending' : ''} />{state === 'loading' ? 'FETCHING HISTORY' : state}</span></header>
    <div className="vta-chart-toolbar"><div className="vta-chart-intervals" role="group" aria-label="Candle interval">{INTERVALS.map((value) => <button key={value} type="button" aria-pressed={interval === value} className={interval === value ? 'is-active' : ''} onClick={() => setInterval(value)}>{value}</button>)}</div><span className="vta-ohlc-caption">{display ? `O ${showPrice(display.open)}　H ${showPrice(display.high)}　L ${showPrice(display.low)}　C ${showPrice(display.close)}${display.volume !== undefined ? `　V ${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(display.volume)}` : ''}` : 'O —　H —　L —　C —'} <small>UTC</small></span></div>
    <div className="vta-chart-canvas" aria-label={`${instrument.display} actual completed historical ${style} chart. Scroll or pinch to zoom; drag to pan.`}><div ref={el} className="vta-lwc-chart" />
      {tool !== 'cursor' && !!bars.length && <div className="vta-draw-capture" onClick={plot} role="presentation"><span>{tool === 'ray' ? 'PLACE PRICE RAY' : pending ? 'SELECT ENDPOINT' : 'SELECT START POINT'}</span></div>}
      <svg className="vta-drawing-overlay" width="100%" height="100%" aria-hidden="true">{lines}{x != null && y != null && <circle cx={x} cy={y} r="4" fill="#55ddae" />}</svg>
      {state === 'loading' && <div className="vta-chart-message" role="status" aria-live="polite"><span className="vta-loading-indicator" /><strong>Loading completed candles</strong><small>Requesting the selected instrument and period.</small></div>}
      {state === 'UNAVAILABLE' && <div className="vta-chart-message vta-chart-message--empty"><WifiOff size={18} /><strong>Historical data unavailable</strong><small>{message || 'No candles are available from the configured provider.'}</small></div>}
      {state === 'HISTORICAL DATA' && !bars.length && <div className="vta-chart-message vta-chart-message--empty"><WifiOff size={18} /><strong>No completed candles in this window</strong><small>Try a wider time range. Prices are never simulated.</small></div>}
      {state === 'HISTORICAL DATA' && !!bars.length && <span className="vta-chart-watermark">VTA · HISTORICAL CANDLES</span>}
    </div>
    <footer className="vta-chart-footer"><span><i className={state === 'HISTORICAL DATA' ? 'is-up' : state === 'loading' ? 'is-pending' : ''} />{state === 'HISTORICAL DATA' ? `COMPLETED DATA · ${bars.length} BARS` : state === 'loading' ? 'REQUEST IN PROGRESS' : 'NO PRICE DATA'}</span><span>{source}{last ? ` · closed ${timeFormatter.format(last.time * 1000)} UTC` : ''}</span></footer>
  </section>;
}

function PaperTicket({ instrument, price, state }: { instrument: Instrument; price?: number; state: LoadState }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy'); const [type, setType] = useState<'market' | 'limit'>('market'); const [quantity, setQuantity] = useState('0.01'); const [limit, setLimit] = useState('');
  const [receipt, setReceipt] = useState<{ side: string; price: number; quantity: number; total: number } | null>(null);
  const units = Number(quantity); const reference = type === 'limit' ? Number(limit) : price || 0; const unavailable = state !== 'HISTORICAL DATA' || !price;
  const issue = unavailable ? 'Verified historical pricing is required.' : !Number.isFinite(units) || units <= 0 ? 'Enter an amount greater than zero.' : !Number.isFinite(reference) || reference <= 0 ? 'Enter a valid reference limit price.' : !Number.isFinite(reference * units) ? 'The paper estimate exceeds the supported numeric range.' : '';
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!issue) setReceipt({ side, price: reference, quantity: units, total: units * reference }); }
  return <section className="vta-panel vta-order-panel" aria-label="Paper-only order ticket">
    <header className="vta-panel-heading"><div><span className="vta-overline">REHEARSAL ONLY</span><h2>Order ticket</h2></div><span className="vta-paper-chip"><ShieldAlert size={12} />PAPER ONLY</span></header>
    <div className="vta-sideswitch" role="group" aria-label="Paper order direction"><button type="button" aria-pressed={side === 'buy'} className={side === 'buy' ? 'is-buy-active' : ''} onClick={() => { setSide('buy'); setReceipt(null); }}><TrendingUp size={14} />Buy</button><button type="button" aria-pressed={side === 'sell'} className={side === 'sell' ? 'is-sell-active' : ''} onClick={() => { setSide('sell'); setReceipt(null); }}><TrendingUp className="vta-sell-arrow" size={14} />Sell</button></div>
    <form className="vta-order-form" onSubmit={submit}>
      <label className="vta-form-field"><span>Instrument</span><span className="vta-readonly-field">{instrument.display}<small>{instrument.assetClass}</small></span></label>
      <label className="vta-form-field"><span>Order type</span><span className="vta-select-field"><select aria-label="Paper order type" value={type} onChange={(e) => { setType(e.target.value as 'market' | 'limit'); setReceipt(null); }}><option value="market">Market estimate</option><option value="limit">Limit estimate</option></select><ChevronDown size={13} /></span></label>
      <label className="vta-form-field"><span>Amount</span><span className="vta-order-input-wrap"><input aria-label="Paper order amount" type="number" step="any" min="0.00000001" inputMode="decimal" value={quantity} onChange={(e) => { setQuantity(e.target.value); setReceipt(null); }} /><small>units</small></span></label>
      {type === 'limit' && <label className="vta-form-field"><span>Reference limit price</span><span className="vta-order-input-wrap"><input aria-label="Paper limit price" type="number" step="any" min="0.00000001" inputMode="decimal" placeholder={showPrice(price)} value={limit} onChange={(e) => { setLimit(e.target.value); setReceipt(null); }} /><small>{instrument.quoteCurrency || '—'}</small></span></label>}
      <div className="vta-ticket-reference"><span>Last completed close</span><strong>{unavailable ? 'Unavailable' : showPrice(price)}</strong></div><button className="vta-paper-submit" type="submit"><BarChart3 size={15} />Preview paper estimate<ArrowUpRight size={14} /></button>{issue && <p className="vta-ticket-validation" role="status">{issue}</p>}
    </form>
    {receipt && <div className="vta-preview-receipt" role="status"><div className="vta-receipt-heading"><Check size={14} /> PAPER ESTIMATE · NOT SUBMITTED</div><div className="vta-receipt-row"><span>Direction / symbol</span><strong>{receipt.side.toUpperCase()} {instrument.display}</strong></div><div className="vta-receipt-row"><span>Historical close × units</span><strong>{showPrice(receipt.price)} × {formatter.format(receipt.quantity)}</strong></div><div className="vta-receipt-row vta-receipt-total"><span>Indicative notional</span><strong>{showPrice(receipt.total)} {instrument.quoteCurrency}</strong></div><p>Not an order, execution, account balance or financial recommendation.</p></div>}
    <div className="vta-paper-disclosure"><ShieldAlert size={14} /><p>No broker is connected. This estimate uses historical prices; <strong>nothing is sent, stored or executed.</strong></p></div>
  </section>;
}

function AccountActivity() {
  const [tab, setTab] = useState('Positions'); const tabs = ['Positions', 'Orders', 'History'];
  return <section className="vta-panel vta-activity-panel" aria-label="Broker account activity"><header className="vta-activity-header"><div className="vta-panel-heading"><div><span className="vta-overline">ACCOUNT DATA</span><h2>Activity</h2></div></div><div className="vta-activity-tabs" role="tablist" aria-label="Account activity view">{tabs.map((label) => <button key={label} id={`vta-tab-${label}`} type="button" role="tab" aria-selected={tab === label} aria-controls="vta-activity-content" onClick={() => setTab(label)}>{label}</button>)}</div></header><div className="vta-activity-content" id="vta-activity-content" role="tabpanel" aria-labelledby={`vta-tab-${tab}`}><span className="vta-activity-empty-icon"><PanelTop size={17} /></span><div><strong>{tab} are unavailable</strong><p>Connect a verified broker to display actual {tab.toLowerCase()}. Paper estimates are never recorded here.</p></div><span className="vta-unavailable-badge"><i />NOT CONNECTED</span></div></section>;
}

export function TradingTerminalExperience() {
  const [selected, setSelected] = useState(instrumentRegistry[0]);
  const [watchlist, setWatchlist] = useState(() => instrumentRegistry.filter((item) => ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'EUR/USD'].includes(item.symbol)));
  const [interval, setInterval] = useState<Interval>('1h'); const [range, setRange] = useState<Range>('1W');
  const [indicator, setIndicator] = useState<Indicator>('none'); const [style, setStyle] = useState<'candles' | 'line'>('candles'); const [volume, setVolume] = useState(true);
  const [tool, setTool] = useState<Tool>('cursor'); const [drawings, setDrawings] = useState<Drawing[]>([]); const [pending, setPending] = useState<Point | null>(null);
  const [bars, setBars] = useState<Bar[]>([]); const [state, setState] = useState<LoadState>('loading'); const [source, setSource] = useState('Binance public market data API'); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [hover, setHover] = useState<Bar | null>(null);
  const chartCard = useRef<HTMLDivElement>(null); const chartImage = useRef<(() => HTMLCanvasElement) | null>(null); const last = bars.at(-1);
  const crosshair = useCallback((bar: Bar | null) => setHover(bar), []);

  useEffect(() => {
    const controller = new AbortController(); setBars([]); setHover(null); setState('loading'); setError(''); setSource('Binance public market data API'); setPending(null); setDrawings([]);
    const startTime = range === 'ALL' ? undefined : Date.now() - RANGE_MS[range];
    browserMarketDataProvider.getHistoricalBars(selected.symbol, interval, { limit: 1000, startTime, signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return;
      setBars(result.bars); setState(result.state); setSource(result.source || 'No verified historical-data response'); setError(result.message || '');
    }).catch(() => { if (!controller.signal.aborted) { setState('UNAVAILABLE'); setSource('Historical-data provider could not be reached'); setError('Prices have not been generated. Retry when the provider is reachable.'); } });
    return () => controller.abort();
  }, [selected.symbol, interval, range]);

  function choose(item: Instrument) { setSelected(item); setTool('cursor'); setPending(null); }
  function add(item: Instrument) { setWatchlist((current) => current.some((entry) => entry.symbol === item.symbol) ? current : [...current, item].slice(-8)); choose(item); }
  function remove(symbol: string) { if (watchlist.length <= 1) return; setWatchlist((current) => current.filter((item) => item.symbol !== symbol)); if (selected.symbol === symbol) choose(watchlist.find((item) => item.symbol !== symbol)!); }
  function place(point: Point) {
    if (tool === 'ray' && last) { const seconds: Record<Interval, number> = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1d': 86400 }; setDrawings((current) => [...current, { type: 'ray', start: point, end: { time: (last.time + seconds[interval] * 200) as Time, price: point.price } }]); }
    else if (tool === 'trendline' && pending) { setDrawings((current) => [...current, { type: 'trendline', start: pending, end: point }]); setPending(null); setTool('cursor'); }
    else if (tool === 'trendline') setPending(point);
  }
  function saveImage() { const canvas = chartImage.current?.(); if (!canvas) { setNotice('The chart is still loading.'); return; } canvas.toBlob((blob) => { if (!blob) { setNotice('This browser cannot export the chart image.'); return; } const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `vta-${selected.symbol.replace(/[^a-zA-Z0-9_-]/g, '-')}-${interval}-chart.png`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice('Chart image downloaded.'); }, 'image/png'); }
  function toggleFullscreen() { if (document.fullscreenElement) void document.exitFullscreen(); else if (chartCard.current) void chartCard.current.requestFullscreen().catch(() => setNotice('Fullscreen is not available in this browser.')); }
  const maOptions: [Indicator, string][] = [['none', 'Indicators · off'], ['sma20', 'Simple MA · 20'], ['sma50', 'Simple MA · 50'], ['both', 'Simple MAs · 20 + 50']];
  return <section className="vta-terminal-page">
    <header className="vta-terminal-page-heading"><div className="vta-terminal-heading-lockup"><span className="vta-terminal-symbol"><BarChart3 size={19} /></span><div><span className="vta-overline">VTA WEB TRADING TERMINAL</span><h1>Web Terminal</h1></div></div><div className="vta-terminal-status-cluster"><span className="vta-connection-status"><i />NO BROKER CONNECTED</span><span className="vta-data-label"><Clock3 size={13} />HISTORICAL DATA ONLY</span></div></header>
    <div className="vta-connection-banner" role="note"><ShieldAlert size={15} /><span><strong>Research workspace.</strong> VTA&apos;s proprietary Momentum Booster automation experience is part of this terminal. Completed, source-attributed candles are available for supported crypto pairs; no live feed, broker, account balance or order execution.</span><Link className="vta-preview-tag" to="/robots/momentum-booster">Explore Momentum Booster</Link><span className="vta-preview-tag">PAPER PREVIEW ONLY</span></div>
    <div className="vta-terminal-grid">
      <Watchlist selected={selected} items={watchlist} price={last?.close} choose={choose} add={add} remove={remove} />
      <div className="vta-chart-column" ref={chartCard}>
        <MarketChart bars={bars} state={state} message={error} source={source} instrument={selected} interval={interval} setInterval={setInterval} indicator={indicator} style={style} volume={volume} tool={tool} drawings={drawings} pending={pending} hover={hover} capture={chartImage} onCrosshair={crosshair} onPlace={place} />
        <section className="vta-panel vta-history-panel" aria-label="Chart range and display controls"><div className="vta-history-toolbar"><div className="vta-control-group vta-window-controls" role="group" aria-label="Historical time range"><span className="vta-toolbar-caption">RANGE</span>{RANGES.map((value) => <button type="button" key={value} aria-pressed={range === value} className={range === value ? 'is-active' : ''} onClick={() => setRange(value)}>{value}</button>)}</div><span className="vta-range-detail">{WINDOW_NAME[range]} · {bars.length ? `${bars.length} candles` : state === 'loading' ? 'Loading…' : 'No bars'}</span>
          <div className="vta-tool-actions"><div className="vta-drawing-tools" role="group" aria-label="Chart drawings"><button type="button" aria-label="Crosshair cursor" title="Crosshair cursor" aria-pressed={tool === 'cursor'} onClick={() => { setTool('cursor'); setPending(null); }}><Crosshair size={14} /></button><button type="button" aria-label="Draw trendline" title="Draw trendline" aria-pressed={tool === 'trendline'} className={tool === 'trendline' ? 'is-active' : ''} onClick={() => { setTool(tool === 'trendline' ? 'cursor' : 'trendline'); setPending(null); }}><MoveRight size={14} /></button><button type="button" aria-label="Draw horizontal price ray" title="Draw price ray" aria-pressed={tool === 'ray'} className={tool === 'ray' ? 'is-active' : ''} onClick={() => { setTool(tool === 'ray' ? 'cursor' : 'ray'); setPending(null); }}><Minus size={14} /></button><button type="button" aria-label="Clear drawings" title="Clear drawings" disabled={!drawings.length && !pending} onClick={() => { setDrawings([]); setPending(null); }}><Trash2 size={14} /></button></div>
          <label className="vta-indicator-select"><span className="sr-only">Moving average indicator</span><select aria-label="Moving average indicator" value={indicator} onChange={(event) => setIndicator(event.target.value as Indicator)}>{maOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={12} /></label><button className={`vta-small-tool${volume ? ' is-selected' : ''}`} type="button" aria-pressed={volume} onClick={() => setVolume((value) => !value)}><BarChart3 size={13} /><span>VOL</span></button></div>
        </div><div className="vta-history-footnote"><span><Crosshair size={12} />Drag to pan · scroll or pinch to zoom</span><span>Provider limit: 1,000 completed candles.</span></div></section>
      </div>
      <aside className="vta-side-column" aria-label="Paper order ticket and chart tools"><PaperTicket instrument={selected} price={last?.close} state={state} />
        <section className="vta-panel vta-export-panel" aria-label="Chart exports and controls"><header className="vta-panel-heading"><div><span className="vta-overline">CHART CONTROLS</span><h2>Tools</h2></div></header><div className="vta-export-grid"><button type="button" disabled={!bars.length} onClick={() => bars.length && exportBars(selected.symbol, interval, bars)}><Download size={15} /><span>Export CSV</span><small>Completed bars</small></button><button type="button" disabled={!bars.length} onClick={saveImage}><Camera size={15} /><span>Save chart</span><small>PNG image</small></button><button type="button" onClick={toggleFullscreen}><Expand size={15} /><span>Expand chart</span><small>Full screen</small></button><button type="button" aria-pressed={style === 'line'} onClick={() => setStyle((current) => current === 'candles' ? 'line' : 'candles')}><PanelTop size={15} /><span>{style === 'candles' ? 'Line view' : 'Candle view'}</span><small>Chart type</small></button></div>{notice && <div className="vta-export-notice" role="status"><span>{notice}</span><button type="button" aria-label="Dismiss notice" onClick={() => setNotice('')}><X size={13} /></button></div>}<p className="vta-tools-attribution">Data: {state === 'HISTORICAL DATA' ? source : 'Provider unavailable for this instrument'}.</p></section>
        <div className="vta-risk-note"><ShieldAlert size={14} /><span><strong>No financial advice.</strong> Historical prices are not indicative of future results.</span></div>
      </aside>
    </div>
    <AccountActivity />
    <footer className="vta-terminal-disclaimer"><span>VTA · MARKET RESEARCH</span><span>Historical prices can be delayed or unavailable. Independently verify prices before making financial decisions.</span><a href="https://github.com/tradingview/lightweight-charts" target="_blank" rel="noreferrer">Charting library <ArrowUpRight size={11} /></a></footer>
  </section>;
}

export default TradingTerminalExperience;
