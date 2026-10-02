import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, CandlestickChart, Check,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Download, Expand, Eye,
  Focus, Minus, Plus, RefreshCw, Search, ShieldCheck, Shrink, SlidersHorizontal,
  TrendingDown, TrendingUp, X,
} from 'lucide-react';
import type {
  IChartApi, IPriceLine, ISeriesApi, LineData, Time, UTCTimestamp,
} from 'lightweight-charts';
import {
  browserMarketDataProvider, instrumentRegistry,
} from './terminal-data';
import type {
  AssetClass, Bar, HistoricalBarsResult, Instrument,
} from './terminal-data';
import './terminal.css';

type OverlayName = 'SMA 20' | 'EMA 20' | 'VWAP' | 'Bollinger Bands';
type OscillatorName = 'None' | 'RSI 14' | 'MACD 12/26/9' | 'ATR 14';
type DrawingTool = 'Cursor' | 'Horizontal line' | 'Trend line' | 'Fibonacci';
type Drawing = {
  id: string;
  symbol: string;
  tool: Exclude<DrawingTool, 'Cursor'>;
  first: { time: number; price: number };
  second?: { time: number; price: number };
};
type MarketSnapshot = { result: HistoricalBarsResult; bars: Bar[] };

const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1w'];
const OVERLAYS: { name: OverlayName; color: string }[] = [
  { name: 'SMA 20', color: '#eabf71' },
  { name: 'EMA 20', color: '#8eb8ed' },
  { name: 'VWAP', color: '#bc9ae8' },
  { name: 'Bollinger Bands', color: '#78a99e' },
];
const WATCHLIST_DEFAULT = ['BTC/USDT', 'ETH/USDT', 'EUR/USD', 'XAU/USD'];
const DATE_FORMAT = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

function precisionFor(price: number) {
  return price >= 100 ? 2 : price >= 1 ? 4 : 6;
}

function formatPrice(value: number, precision = precisionFor(value)) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: precision }).format(value);
}

function toLineData(values: (number | null)[], bars: Bar[]): LineData<Time>[] {
  return values.flatMap((value, index) => value === null || !Number.isFinite(value)
    ? []
    : [{ time: bars[index].time as UTCTimestamp, value }]);
}

function sma(values: number[], period: number): (number | null)[] {
  return values.map((_, index) => index < period - 1
    ? null
    : values.slice(index - period + 1, index + 1).reduce((sum, value) => sum + value, 0) / period);
}

function ema(values: number[], period: number): (number | null)[] {
  const output: (number | null)[] = Array(values.length).fill(null);
  if (values.length < period) return output;
  const multiplier = 2 / (period + 1);
  let current = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  output[period - 1] = current;
  for (let index = period; index < values.length; index += 1) {
    current = (values[index] - current) * multiplier + current;
    output[index] = current;
  }
  return output;
}

function indicatorValues(bars: Bar[], name: OscillatorName) {
  const closes = bars.map((bar) => bar.close);
  if (name === 'RSI 14') {
    const output: (number | null)[] = Array(bars.length).fill(null);
    let averageGain = 0;
    let averageLoss = 0;
    if (bars.length <= 14) return { primary: output };
    for (let index = 1; index <= 14; index += 1) {
      const change = closes[index] - closes[index - 1];
      averageGain += Math.max(change, 0) / 14;
      averageLoss += Math.max(-change, 0) / 14;
    }
    output[14] = averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);
    for (let index = 15; index < bars.length; index += 1) {
      const change = closes[index] - closes[index - 1];
      averageGain = (averageGain * 13 + Math.max(change, 0)) / 14;
      averageLoss = (averageLoss * 13 + Math.max(-change, 0)) / 14;
      output[index] = averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);
    }
    return { primary: output };
  }
  if (name === 'MACD 12/26/9') {
    const fast = ema(closes, 12);
    const slow = ema(closes, 26);
    const macd = closes.map((_, index) => fast[index] === null || slow[index] === null ? null : fast[index]! - slow[index]!);
    const signalInput = macd.flatMap((value, index) => value === null ? [] : [{ index, value }]);
    const signalValues = ema(signalInput.map((point) => point.value), 9);
    const signal: (number | null)[] = Array(bars.length).fill(null);
    signalInput.forEach((point, index) => { signal[point.index] = signalValues[index]; });
    return { primary: macd, signal };
  }
  if (name === 'ATR 14') {
    const ranges = bars.map((bar, index) => index === 0
      ? bar.high - bar.low
      : Math.max(bar.high - bar.low, Math.abs(bar.high - bars[index - 1].close), Math.abs(bar.low - bars[index - 1].close)));
    const output: (number | null)[] = Array(bars.length).fill(null);
    if (ranges.length >= 14) {
      let current = ranges.slice(0, 14).reduce((sum, value) => sum + value, 0) / 14;
      output[13] = current;
      for (let index = 14; index < ranges.length; index += 1) {
        current = (current * 13 + ranges[index]) / 14;
        output[index] = current;
      }
    }
    return { primary: output };
  }
  return { primary: [] as (number | null)[] };
}

function getOverlayLines(bars: Bar[], names: OverlayName[]) {
  const closes = bars.map((bar) => bar.close);
  const lines: { name: string; color: string; values: (number | null)[] }[] = [];
  if (names.includes('SMA 20')) lines.push({ name: 'SMA 20', color: '#eabf71', values: sma(closes, 20) });
  if (names.includes('EMA 20')) lines.push({ name: 'EMA 20', color: '#8eb8ed', values: ema(closes, 20) });
  if (names.includes('Bollinger Bands')) {
    const middle = sma(closes, 20);
    const deviation = closes.map((_, index) => {
      if (index < 19 || middle[index] === null) return null;
      const window = closes.slice(index - 19, index + 1);
      return Math.sqrt(window.reduce((sum, value) => sum + ((value - middle[index]!) ** 2), 0) / 20) * 2;
    });
    lines.push({ name: 'BB upper', color: '#78a99e', values: middle.map((value, index) => value === null || deviation[index] === null ? null : value + deviation[index]!) });
    lines.push({ name: 'BB lower', color: '#78a99e', values: middle.map((value, index) => value === null || deviation[index] === null ? null : value - deviation[index]!) });
  }
  if (names.includes('VWAP')) {
    let cumulativeVolume = 0;
    let cumulativeValue = 0;
    const values = bars.map((bar) => {
      const volume = bar.volume ?? 0;
      cumulativeVolume += volume;
      cumulativeValue += ((bar.high + bar.low + bar.close) / 3) * volume;
      return cumulativeVolume ? cumulativeValue / cumulativeVolume : null;
    });
    lines.push({ name: 'VWAP', color: '#bc9ae8', values });
  }
  return lines;
}

function TooltipReadout({ bar, previous }: { bar: Bar | null; previous: Bar | null }) {
  if (!bar) return null;
  const change = previous ? bar.close - previous.close : 0;
  return <div className="vta-readout" aria-live="polite">
    <time>{DATE_FORMAT.format(bar.time * 1000)}</time>
    <span>O <b>{formatPrice(bar.open)}</b></span>
    <span>H <b>{formatPrice(bar.high)}</b></span>
    <span>L <b>{formatPrice(bar.low)}</b></span>
    <span>C <b>{formatPrice(bar.close)}</b></span>
    <span className={change >= 0 ? 'is-positive' : 'is-negative'}>Δ <b>{change >= 0 ? '+' : ''}{formatPrice(change)}</b></span>
    {bar.volume !== undefined && <span>VOL <b>{new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(bar.volume)}</b></span>}
  </div>;
}

function TradingChart({
  bars, symbol, timeframe, overlays, oscillator, drawingTool, drawings, onDrawPoint, onChartError,
}: {
  bars: Bar[];
  symbol: string;
  timeframe: string;
  overlays: OverlayName[];
  oscillator: OscillatorName;
  drawingTool: DrawingTool;
  drawings: Drawing[];
  onDrawPoint: (point: { time: number; price: number }) => void;
  onChartError: (message: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const indicatorHostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const overlaySeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
  const drawingSeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
  const drawingPriceLinesRef = useRef<IPriceLine[]>([]);
  const oscillatorChartRef = useRef<IChartApi | null>(null);
  const activeToolRef = useRef(drawingTool);
  const onDrawPointRef = useRef(onDrawPoint);
  const barsRef = useRef(bars);
  const [chartReady, setChartReady] = useState(false);
  const [hoverBar, setHoverBar] = useState<Bar | null>(null);
  const [draftStart, setDraftStart] = useState(false);

  activeToolRef.current = drawingTool;
  onDrawPointRef.current = onDrawPoint;
  barsRef.current = bars;
  const lastBar = bars[bars.length - 1] ?? null;
  const readout = hoverBar ?? lastBar;
  const previousBar = readout ? bars[bars.findIndex((bar) => bar.time === readout.time) - 1] ?? null : null;

  useEffect(() => {
    let cancelled = false;
    let chart: IChartApi | null = null;
    let indicatorChart: IChartApi | null = null;
    setChartReady(false);
    setHoverBar(null);
    setDraftStart(false);
    if (!hostRef.current || !bars.length) return;

    async function create() {
      try {
        const library = await import('lightweight-charts');
        if (cancelled || !hostRef.current) return;
        chart = library.createChart(hostRef.current, {
          autoSize: true,
          layout: { background: { type: library.ColorType.Solid, color: '#0a1117' }, textColor: '#83939b', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10 },
          grid: { vertLines: { color: 'rgba(181,201,206,.055)' }, horzLines: { color: 'rgba(181,201,206,.075)' } },
          rightPriceScale: { borderColor: 'rgba(181,201,206,.13)', minimumWidth: 76 },
          timeScale: { borderColor: 'rgba(181,201,206,.13)', timeVisible: true, secondsVisible: false, rightOffset: 5, barSpacing: 8, minBarSpacing: 2 },
          crosshair: { mode: library.CrosshairMode.Normal, vertLine: { color: 'rgba(76,203,164,.55)', style: library.LineStyle.Dashed, labelBackgroundColor: '#167a62' }, horzLine: { color: 'rgba(76,203,164,.55)', style: library.LineStyle.Dashed, labelBackgroundColor: '#167a62' } },
          handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
          handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
          localization: { priceFormatter: (price: number) => formatPrice(price) },
        });
        const candle = chart.addSeries(library.CandlestickSeries, {
          upColor: '#31c89a', downColor: '#e27474', borderUpColor: '#31c89a', borderDownColor: '#e27474',
          wickUpColor: '#31c89a', wickDownColor: '#e27474', priceLineColor: '#31c89a', priceLineStyle: library.LineStyle.Dashed,
          lastValueVisible: true, priceFormat: { type: 'price', precision: precisionFor(barsRef.current.at(-1)?.close ?? 1), minMove: 10 ** -precisionFor(barsRef.current.at(-1)?.close ?? 1) },
        });
        const volume = chart.addSeries(library.HistogramSeries, {
          priceScaleId: 'volume', priceFormat: { type: 'volume' }, lastValueVisible: false, priceLineVisible: false,
        });
        volume.priceScale().applyOptions({ scaleMargins: { top: 0.84, bottom: 0 }, visible: false });
        candle.setData(barsRef.current.map((bar) => ({ time: bar.time as UTCTimestamp, open: bar.open, high: bar.high, low: bar.low, close: bar.close })));
        volume.setData(barsRef.current.map((bar) => ({
          time: bar.time as UTCTimestamp, value: bar.volume ?? 0,
          color: bar.close >= bar.open ? 'rgba(49,200,154,.30)' : 'rgba(226,116,116,.30)',
        })));
        chart.timeScale().fitContent();
        candleRef.current = candle;
        volumeRef.current = volume;
        chartRef.current = chart;
        chart.subscribeCrosshairMove((event) => {
          if (!event.time) { setHoverBar(null); return; }
          const data = event.seriesData.get(candle) as { time?: Time; open?: number; high?: number; low?: number; close?: number } | undefined;
          if (!data || data.open === undefined || typeof data.time !== 'number') { setHoverBar(null); return; }
          const original = barsRef.current.find((bar) => bar.time === data.time);
          setHoverBar(original ?? { time: data.time, open: data.open, high: data.high ?? data.open, low: data.low ?? data.open, close: data.close ?? data.open });
        });
        chart.subscribeClick((event) => {
          if (activeToolRef.current === 'Cursor' || !event.point || typeof event.time !== 'number') return;
          const price = candle.coordinateToPrice(event.point.y);
          if (price !== null) onDrawPointRef.current({ time: event.time, price });
        });

        if (oscillator !== 'None' && indicatorHostRef.current) {
          indicatorChart = library.createChart(indicatorHostRef.current, {
            autoSize: true,
            layout: { background: { type: library.ColorType.Solid, color: '#0a1117' }, textColor: '#83939b', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 9 },
            grid: { vertLines: { color: 'rgba(181,201,206,.04)' }, horzLines: { color: 'rgba(181,201,206,.07)' } },
            rightPriceScale: { borderColor: 'rgba(181,201,206,.13)', minimumWidth: 76 },
            timeScale: { borderColor: 'rgba(181,201,206,.13)', timeVisible: true, secondsVisible: false, rightOffset: 5, barSpacing: 8, minBarSpacing: 2, visible: false },
            crosshair: { mode: library.CrosshairMode.Normal }, handleScroll: false, handleScale: false,
          });
          const values = indicatorValues(barsRef.current, oscillator);
          const primary = indicatorChart.addSeries(oscillator === 'MACD 12/26/9' ? library.HistogramSeries : library.LineSeries, {
            color: oscillator === 'RSI 14' ? '#8eb8ed' : oscillator === 'ATR 14' ? '#eabf71' : '#31c89a',
            lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: oscillator,
          });
          if (oscillator === 'MACD 12/26/9') {
            primary.setData(barsRef.current.flatMap((bar, index) => {
              const value = values.primary[index];
              return value === null ? [] : [{ time: bar.time as UTCTimestamp, value, color: value >= 0 ? 'rgba(49,200,154,.65)' : 'rgba(226,116,116,.65)' }];
            }));
            const signal = indicatorChart.addSeries(library.LineSeries, { color: '#eabf71', lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: 'Signal' });
            signal.setData(toLineData(values.signal ?? [], barsRef.current));
          } else {
            primary.setData(toLineData(values.primary, barsRef.current));
            if (oscillator === 'RSI 14') {
              primary.createPriceLine({ price: 70, color: 'rgba(226,116,116,.5)', lineStyle: library.LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false, title: '70' });
              primary.createPriceLine({ price: 30, color: 'rgba(49,200,154,.45)', lineStyle: library.LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false, title: '30' });
            }
          }
          indicatorChart.timeScale().fitContent();
          oscillatorChartRef.current = indicatorChart;
          let syncing = false;
          chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            if (syncing || !range || !indicatorChart) return;
            syncing = true;
            indicatorChart.timeScale().setVisibleLogicalRange(range);
            syncing = false;
          });
          indicatorChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            if (syncing || !range || !chart) return;
            syncing = true;
            chart.timeScale().setVisibleLogicalRange(range);
            syncing = false;
          });
        }
        setChartReady(true);
      } catch {
        if (!cancelled) onChartError('The chart renderer could not be started. Reload this terminal to retry.');
      }
    }
    void create();
    return () => {
      cancelled = true;
      chart?.remove();
      indicatorChart?.remove();
      if (chartRef.current === chart) chartRef.current = null;
      if (oscillatorChartRef.current === indicatorChart) oscillatorChartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      overlaySeriesRef.current = [];
      drawingSeriesRef.current = [];
      drawingPriceLinesRef.current = [];
    };
  }, [bars, symbol, timeframe, oscillator, onChartError]);

  useEffect(() => {
    const chart = chartRef.current;
    const candle = candleRef.current;
    if (!chart || !candle || !chartReady) return;
    const libraryPromise = import('lightweight-charts');
    let cancelled = false;
    void libraryPromise.then((library) => {
      if (cancelled || chartRef.current !== chart) return;
      overlaySeriesRef.current.forEach((series) => chart.removeSeries(series));
      overlaySeriesRef.current = [];
      getOverlayLines(bars, overlays).forEach((line) => {
        const series = chart.addSeries(library.LineSeries, { color: line.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: line.name });
        series.setData(toLineData(line.values, bars));
        overlaySeriesRef.current.push(series);
      });

      drawingSeriesRef.current.forEach((series) => chart.removeSeries(series));
      drawingPriceLinesRef.current.forEach((priceLine) => candle.removePriceLine(priceLine));
      drawingSeriesRef.current = [];
      drawingPriceLinesRef.current = [];
      drawings.filter((drawing) => drawing.symbol === symbol).forEach((drawing) => {
        if (drawing.tool === 'Horizontal line') {
          drawingPriceLinesRef.current.push(candle.createPriceLine({ price: drawing.first.price, color: '#eabf71', lineWidth: 1, lineStyle: library.LineStyle.Dashed, axisLabelVisible: true, title: 'VTA level' }));
          return;
        }
        if (!drawing.second) return;
        if (drawing.tool === 'Fibonacci') {
          [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].forEach((ratio) => {
            const price = drawing.first.price + (drawing.second!.price - drawing.first.price) * ratio;
            drawingPriceLinesRef.current.push(candle.createPriceLine({ price, color: ratio === 0.5 ? '#eabf71' : 'rgba(142,184,237,.7)', lineWidth: 1, lineStyle: library.LineStyle.Dashed, axisLabelVisible: true, title: `${(ratio * 100).toFixed(1)}%` }));
          });
          return;
        }
        const points = [drawing.first, drawing.second].sort((a, b) => a.time - b.time);
        const series = chart.addSeries(library.LineSeries, { color: '#eabf71', lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, title: 'VTA trend line' });
        series.setData(points.map((point) => ({ time: point.time as UTCTimestamp, value: point.price })));
        drawingSeriesRef.current.push(series);
      });
    });
    return () => { cancelled = true; };
  }, [bars, overlays, drawings, symbol, chartReady]);

  const chartKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const chart = chartRef.current;
    if (!chart) return;
    if (event.key === '+' || event.key === '=') {
      const range = chart.timeScale().getVisibleLogicalRange();
      if (range) { event.preventDefault(); const center = (range.from + range.to) / 2; const half = (range.to - range.from) * 0.4; chart.timeScale().setVisibleLogicalRange({ from: center - half, to: center + half }); }
    } else if (event.key === '-') {
      const range = chart.timeScale().getVisibleLogicalRange();
      if (range) { event.preventDefault(); const center = (range.from + range.to) / 2; const half = (range.to - range.from) * 0.625; chart.timeScale().setVisibleLogicalRange({ from: center - half, to: center + half }); }
    } else if (event.key === '0') {
      event.preventDefault(); chart.timeScale().fitContent();
    }
  }, []);

  if (!bars.length) return <div className="vta-chart-empty"><Activity size={22} /><strong>Market data unavailable</strong><p>No completed historical candles are available for this selection. VTA does not generate replacement prices.</p></div>;

  return <div className="vta-chart-stack">
    <TooltipReadout bar={readout} previous={previousBar} />
    <div className="vta-price-chart-wrap">
      {!chartReady && <div className="vta-chart-loading" role="status">Preparing chart…</div>}
      <div ref={hostRef} className="vta-price-chart" tabIndex={0} onKeyDown={chartKeyDown} aria-label={`${symbol} candlestick chart. Use mouse wheel or pinch to zoom, drag to pan, plus and minus to zoom, zero to fit.`} />
      {draftStart && <span className="vta-drawing-hint">Select a second anchor on the chart</span>}
    </div>
    {oscillator !== 'None' && <div className="vta-indicator-chart-wrap"><div className="vta-indicator-caption">{oscillator}<span>{oscillator === 'RSI 14' ? '30 / 70 reference' : oscillator === 'MACD 12/26/9' ? 'EMA 12 · EMA 26 · signal 9' : 'Wilder ATR · 14'}</span></div><div ref={indicatorHostRef} className="vta-indicator-chart" />{bars.length < (oscillator === 'MACD 12/26/9' ? 35 : 15) && <span className="vta-indicator-warmup">More candles are needed for this indicator.</span>}</div>}
    <div className="vta-chart-credit"><span>{bars.length.toLocaleString()} completed candles loaded · Historical only</span><a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">Charts by TradingView</a></div>
  </div>;
}

export function TradingTerminalExperience() {
  const [search, setSearch] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass | 'All'>('All');
  const [selectedSymbol, setSelectedSymbol] = useState<Instrument>(instrumentRegistry[0]);
  const [timeframe, setTimeframe] = useState('1h');
  const [bars, setBars] = useState<Bar[]>([]);
  const [dataResult, setDataResult] = useState<HistoricalBarsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState('');
  const [retry, setRetry] = useState(0);
  const [watchlist, setWatchlist] = useState(WATCHLIST_DEFAULT);
  const [watchSnapshots, setWatchSnapshots] = useState<Record<string, MarketSnapshot>>({});
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'Market' | 'Limit' | 'Stop'>('Market');
  const [quantity, setQuantity] = useState('0.01');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [activeTab, setActiveTab] = useState<'Positions' | 'Orders'>('Positions');
  const [overlays, setOverlays] = useState<OverlayName[]>(['SMA 20']);
  const [oscillator, setOscillator] = useState<OscillatorName>('None');
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('Cursor');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [pendingDrawing, setPendingDrawing] = useState<{ tool: DrawingTool; symbol: string; first: { time: number; price: number } } | null>(null);
  const [chartError, setChartError] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);

  const filteredInstruments = useMemo(() => instrumentRegistry.filter((instrument) =>
    (assetClass === 'All' || instrument.assetClass === assetClass) &&
    (!search.trim() || `${instrument.symbol} ${instrument.assetClass}`.toLowerCase().includes(search.trim().toLowerCase()))), [assetClass, search]);
  const latestBar = bars.at(-1) ?? null;
  const previousBar = bars.at(-2) ?? null;
  const priceChange = latestBar && previousBar ? ((latestBar.close - previousBar.close) / previousBar.close) * 100 : null;
  const priceDigits = latestBar ? precisionFor(latestBar.close) : 4;
  const quantityValue = Number(quantity);
  const estimate = latestBar && Number.isFinite(quantityValue) && quantityValue > 0 ? latestBar.close * quantityValue : null;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setBars([]);
    setRequestError('');
    setDataResult(null);
    void browserMarketDataProvider.getHistoricalBars(selectedSymbol.symbol, timeframe, { limit: 500, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setBars(result.bars);
        setDataResult(result);
        if (result.state === 'UNAVAILABLE') setRequestError(result.message ?? 'The selected market source is unavailable.');
      })
      .catch(() => { if (!controller.signal.aborted) setRequestError('The market data request failed. Check the connection and retry.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selectedSymbol.symbol, timeframe, retry]);

  useEffect(() => {
    let cancelled = false;
    const symbols = [...new Set(watchlist)];
    void Promise.all(symbols.map(async (symbol) => {
      const result = await browserMarketDataProvider.getHistoricalBars(symbol, '1h', { limit: 2 });
      return [symbol, { result, bars: result.bars }] as const;
    })).then((entries) => {
      if (!cancelled) setWatchSnapshots((current) => ({ ...current, ...Object.fromEntries(entries) }));
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [watchlist]);

  useEffect(() => {
    const handleFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => document.removeEventListener('fullscreenchange', handleFullscreen);
  }, []);

  const chooseInstrument = (instrument: Instrument) => {
    setSelectedSymbol(instrument);
    setWatchlist((current) => current.includes(instrument.symbol) ? current : [instrument.symbol, ...current].slice(0, 8));
    setRequestError('');
    setExportMessage('');
  };

  const addDrawingPoint = useCallback((point: { time: number; price: number }) => {
    if (drawingTool === 'Cursor') return;
    if (drawingTool === 'Horizontal line') {
      setDrawings((current) => [...current, { id: crypto.randomUUID(), symbol: selectedSymbol.symbol, tool: drawingTool, first: point }]);
      setPendingDrawing(null);
      return;
    }
    if (!pendingDrawing || pendingDrawing.tool !== drawingTool || pendingDrawing.symbol !== selectedSymbol.symbol) {
      setPendingDrawing({ tool: drawingTool, symbol: selectedSymbol.symbol, first: point });
      return;
    }
    setDrawings((current) => [...current, {
      id: crypto.randomUUID(), symbol: selectedSymbol.symbol, tool: drawingTool as Exclude<DrawingTool, 'Cursor'>,
      first: pendingDrawing.first, second: point,
    }]);
    setPendingDrawing(null);
  }, [drawingTool, pendingDrawing, selectedSymbol.symbol]);

  const toggleOverlay = (name: OverlayName) => {
    setOverlays((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };

  const exportCsv = () => {
    if (!bars.length || dataResult?.state !== 'HISTORICAL DATA') {
      setExportMessage('No historical rows are available to export.');
      return;
    }
    const rows = [
      ['timestamp', 'open', 'high', 'low', 'close', 'volume', 'symbol', 'timeframe'],
      ...bars.map((bar) => [new Date(bar.time * 1000).toISOString(), bar.open, bar.high, bar.low, bar.close, bar.volume ?? '', selectedSymbol.symbol, timeframe]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `vta-${selectedSymbol.symbol.replace('/', '-')}-${timeframe}-historical.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportMessage(`${bars.length.toLocaleString()} historical candles exported as CSV.`);
  };

  const zoomChart = (direction: 'in' | 'out' | 'fit') => {
    const chart = document.querySelector('.vta-price-chart') as HTMLDivElement | null;
    if (!chart) return;
    const chartApi = (chart as HTMLDivElement & { __vtaChart?: IChartApi }).__vtaChart;
    if (!chartApi) return;
    if (direction === 'fit') { chartApi.timeScale().fitContent(); return; }
    const range = chartApi.timeScale().getVisibleLogicalRange();
    if (!range) return;
    const center = (range.from + range.to) / 2;
    const factor = direction === 'in' ? 0.8 : 1.25;
    const half = (range.to - range.from) * factor / 2;
    chartApi.timeScale().setVisibleLogicalRange({ from: center - half, to: center + half });
  };

  const toggleFullscreen = async () => {
    if (!layoutRef.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await layoutRef.current.requestFullscreen();
    } catch {
      setChartError('Fullscreen is not available in this browser.');
    }
  };

  const onOrderSubmit = (event: FormEvent<HTMLFormElement>) => event.preventDefault();

  return <section className={`vta-terminal shell${fullscreen ? ' vta-terminal--fullscreen' : ''}`} ref={layoutRef}>
    <header className="vta-terminal-heading">
      <div className="vta-terminal-title"><span className="vta-overline">VTA / WEB TRADING TERMINAL</span><h1>Market workspace</h1><p>Historical context with explicit data and execution boundaries.</p></div>
      <div className="vta-connection-rail"><span className={dataResult?.state === 'HISTORICAL DATA' ? 'vta-source-dot available' : 'vta-source-dot'} /><span>{dataResult?.state === 'HISTORICAL DATA' ? 'HISTORICAL DATA' : loading ? 'REQUESTING DATA' : 'MARKET DATA UNAVAILABLE'}</span><i>·</i><b>NO BROKER CONNECTION</b></div>
    </header>

    <div className="vta-terminal-layout">
      <aside className="vta-watch-panel" aria-label="Market watchlist">
        <div className="vta-panel-heading"><div><span className="vta-overline">MARKETS</span><h2>Watchlist</h2></div><span className="vta-mini-count">{watchlist.length}</span></div>
        <label className="vta-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an instrument" aria-label="Find an instrument" /></label>
        <select className="vta-class-select" aria-label="Filter instruments by asset class" value={assetClass} onChange={(event) => setAssetClass(event.target.value as AssetClass | 'All')}>
          <option value="All">All markets</option><option>Crypto</option><option>Forex</option><option>Metals</option><option>Indices</option><option>Commodities</option><option>Stocks</option>
        </select>
        <div className="vta-market-columns"><span>INSTRUMENT</span><span>LAST / 1H</span></div>
        <div className="vta-watch-list">
          {filteredInstruments.map((instrument) => {
            const selected = selectedSymbol.symbol === instrument.symbol;
            const snapshot = watchSnapshots[instrument.symbol];
            const latest = snapshot?.bars.at(-1);
            const prior = snapshot?.bars.at(-2);
            const change = latest && prior ? ((latest.close - prior.close) / prior.close) * 100 : null;
            return <button type="button" key={instrument.symbol} className={`vta-watch-row${selected ? ' selected' : ''}`} onClick={() => chooseInstrument(instrument)} aria-pressed={selected}>
              <span className="vta-watch-instrument"><b>{instrument.display}</b><small>{instrument.assetClass} · {snapshot?.result.state === 'HISTORICAL DATA' ? 'History' : instrument.status === 'UNAVAILABLE' ? 'No feed' : 'Loading'}</small></span>
              <span className="vta-watch-quote">{latest ? <><b>{formatPrice(latest.close)}</b><small className={change === null ? '' : change >= 0 ? 'is-positive' : 'is-negative'}>{change === null ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}</small></> : <><b>—</b><small>Unavailable</small></>}</span>
            </button>;
          })}
          {!filteredInstruments.length && <p className="vta-watch-empty">No matching instruments.</p>}
        </div>
        <div className="vta-watch-note"><ShieldCheck size={13} /><span>Quotes show the latest completed 1h candle. No bid/ask feed is connected.</span></div>
      </aside>

      <main className="vta-chart-panel">
        <div className="vta-instrument-header">
          <div className="vta-instrument-identity"><span className="vta-symbol-mark"><CandlestickChart size={16} /></span><div><div className="vta-symbol-line"><h2>{selectedSymbol.display}</h2><span>{selectedSymbol.assetClass.toUpperCase()}</span></div><small>{selectedSymbol.status === 'HISTORICAL AVAILABLE' ? 'BINANCE SPOT · HISTORICAL CANDLES' : 'NO MARKET PROVIDER MAPPED'}</small></div></div>
          <div className="vta-last-price">{latestBar ? <><b>{formatPrice(latestBar.close, priceDigits)}</b><span className={priceChange === null ? '' : priceChange >= 0 ? 'is-positive' : 'is-negative'}>{priceChange === null ? '—' : `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`} / last bar</span></> : <span>Price unavailable</span>}</div>
        </div>
        <div className="vta-chart-topbar">
          <div className="vta-timeframes" role="group" aria-label="Chart timeframe">
            {TIMEFRAMES.map((period) => <button type="button" key={period} className={timeframe === period ? 'active' : ''} onClick={() => setTimeframe(period)} aria-pressed={timeframe === period}>{period}</button>)}
          </div>
          <div className="vta-chart-top-actions">
            <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => zoomChart('in')}><Plus size={14} /></button>
            <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => zoomChart('out')}><Minus size={14} /></button>
            <button type="button" title="Fit all candles" aria-label="Fit all candles" onClick={() => zoomChart('fit')}><Focus size={14} /></button>
            <button type="button" title={fullscreen ? 'Exit fullscreen' : 'Fullscreen chart'} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen chart'} onClick={() => void toggleFullscreen()}>{fullscreen ? <Shrink size={14} /> : <Expand size={14} />}</button>
          </div>
        </div>
        <div className="vta-tools-row">
          <div className="vta-drawing-tools" role="group" aria-label="Chart drawing tools">
            {(['Cursor', 'Horizontal line', 'Trend line', 'Fibonacci'] as DrawingTool[]).map((tool) => <button key={tool} type="button" className={drawingTool === tool ? 'active' : ''} aria-pressed={drawingTool === tool} onClick={() => { setDrawingTool(tool); setPendingDrawing(null); setChartError(''); }} title={tool}>{tool === 'Cursor' ? <ArrowUpRight size={14} /> : tool === 'Horizontal line' ? <Minus size={14} /> : tool === 'Trend line' ? <TrendingUp size={14} /> : <SlidersHorizontal size={14} />}<span>{tool}</span></button>)}
          </div>
          <details className="vta-indicator-menu"><summary><Activity size={14} /> Studies <ChevronDown size={12} /></summary><div className="vta-indicator-popover"><span className="vta-overline">PRICE OVERLAYS</span>{OVERLAYS.map((item) => <label key={item.name}><input type="checkbox" checked={overlays.includes(item.name)} onChange={() => toggleOverlay(item.name)} /><i style={{ background: item.color }} />{item.name}</label>)}<span className="vta-overline">LOWER STUDY</span><select aria-label="Lower technical indicator" value={oscillator} onChange={(event) => setOscillator(event.target.value as OscillatorName)}><option value="None">None</option><option value="RSI 14">RSI · 14</option><option value="MACD 12/26/9">MACD · 12 / 26 / 9</option><option value="ATR 14">ATR · 14</option></select><small>VWAP is cumulative over the loaded history window.</small></div></details>
          <div className="vta-chart-actions"><button type="button" className="vta-export-button" onClick={exportCsv} disabled={!bars.length || dataResult?.state !== 'HISTORICAL DATA'}><Download size={13} /> Export CSV</button><button type="button" className="vta-icon-button" aria-label="Remove most recent drawing" title="Undo last drawing" onClick={() => setDrawings((current) => current.slice(0, -1))} disabled={!drawings.length}><ChevronLeft size={14} /></button><button type="button" className="vta-icon-button" aria-label="Clear drawings" title="Clear drawings" onClick={() => setDrawings([])} disabled={!drawings.length}><X size={14} /></button></div>
        </div>

        <div className="vta-chart-surface">
          {loading && <div className="vta-data-overlay" role="status"><RefreshCw size={16} className="vta-spin" /> Loading completed candles…</div>}
          {!loading && requestError && <div className="vta-data-overlay vta-data-overlay--error"><CircleHelp size={18} /><b>Market data unavailable</b><span>{requestError}</span><button type="button" onClick={() => setRetry((current) => current + 1)}><RefreshCw size={13} /> Retry</button></div>}
          {chartError && <div className="vta-chart-alert" role="alert">{chartError}<button type="button" aria-label="Dismiss chart message" onClick={() => setChartError('')}><X size={13} /></button></div>}
          <TradingChart bars={bars} symbol={selectedSymbol.symbol} timeframe={timeframe} overlays={overlays} oscillator={oscillator} drawingTool={drawingTool} drawings={drawings} onDrawPoint={addDrawingPoint} onChartError={setChartError} />
        </div>
        <div className="vta-chart-footer"><span><span className={dataResult?.state === 'HISTORICAL DATA' ? 'vta-source-dot available' : 'vta-source-dot'} />{dataResult?.source ?? 'Source not connected'}</span><span>{bars.length ? `${bars.length} candles` : 'No candles'}</span><span>LAST BAR {latestBar ? DATE_FORMAT.format(latestBar.time * 1000) + ' UTC' : '—'}</span></div>
        {exportMessage && <div className="vta-export-feedback" role="status">{exportMessage}<button type="button" aria-label="Dismiss export status" onClick={() => setExportMessage('')}><X size={12} /></button></div>}
      </main>

      <aside className="vta-order-panel" aria-label="Order ticket">
        <div className="vta-panel-heading"><div><span className="vta-overline">ORDER TICKET</span><h2>Trade setup</h2></div><span className="vta-paper-pill">PAPER UI</span></div>
        <div className="vta-execution-warning"><ShieldCheck size={14} /><span>Execution unavailable — broker connection required.</span></div>
        <div className="vta-ticket-symbol"><b>{selectedSymbol.display}</b><span>{latestBar ? formatPrice(latestBar.close, priceDigits) : '—'} <small>last completed candle</small></span></div>
        <div className="vta-side-toggle" role="group" aria-label="Order side"><button type="button" className={side === 'BUY' ? 'buy active' : ''} onClick={() => setSide('BUY')} aria-pressed={side === 'BUY'}><TrendingUp size={13} /> Buy</button><button type="button" className={side === 'SELL' ? 'sell active' : ''} onClick={() => setSide('SELL')} aria-pressed={side === 'SELL'}><TrendingDown size={13} /> Sell</button></div>
        <form className="vta-ticket-form" onSubmit={onOrderSubmit}>
          <label>Order type<select value={orderType} onChange={(event) => setOrderType(event.target.value as 'Market' | 'Limit' | 'Stop')}><option>Market</option><option>Limit</option><option>Stop</option></select></label>
          {(orderType === 'Limit' || orderType === 'Stop') && <label>{orderType} price<input inputMode="decimal" value={limitPrice} onChange={(event) => setLimitPrice(event.target.value)} placeholder="Enter price" /></label>}
          <label>Quantity<input inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0.01" /></label>
          <label>Stop loss <span className="vta-optional">OPTIONAL</span><input inputMode="decimal" value={stopLoss} onChange={(event) => setStopLoss(event.target.value)} placeholder="Not set" /></label>
          <label>Take profit <span className="vta-optional">OPTIONAL</span><input inputMode="decimal" value={takeProfit} onChange={(event) => setTakeProfit(event.target.value)} placeholder="Not set" /></label>
          <div className="vta-ticket-estimate"><span>Estimated value</span><b>{estimate === null ? 'Unavailable' : `${formatPrice(estimate, Math.min(priceDigits + 2, 8))} ${selectedSymbol.quoteCurrency ?? ''}`}</b><span>Available balance</span><b>Not connected</b><span>Margin / buying power</span><b>Not connected</b></div>
          <button className="vta-execution-disabled" type="submit" disabled aria-describedby="vta-execution-disclosure">{side} {selectedSymbol.symbol} · Execution unavailable</button>
        </form>
        <p id="vta-execution-disclosure" className="vta-execution-disclosure">This ticket does not submit, simulate, or persist orders. Account, margin, positions, fills and P&amp;L require a verified broker or paper-trading service.</p>
        <div className="vta-ticket-safety"><ShieldCheck size={13} /><span>NO BROKER · NO ORDER SENT</span></div>
      </aside>

      <section className="vta-account-panels" aria-label="Positions and orders">
        <div className="vta-account-panel-head"><div className="vta-tab-group" role="tablist" aria-label="Account activity"><button role="tab" aria-selected={activeTab === 'Positions'} className={activeTab === 'Positions' ? 'active' : ''} onClick={() => setActiveTab('Positions')}>Positions</button><button role="tab" aria-selected={activeTab === 'Orders'} className={activeTab === 'Orders' ? 'active' : ''} onClick={() => setActiveTab('Orders')}>Orders</button></div><span>ACCOUNT SERVICE NOT CONNECTED</span></div>
        <div className="vta-empty-account"><Eye size={16} /><span><b>{activeTab} unavailable</b><small>Connect a verified account service to view real {activeTab.toLowerCase()}, order status, fills or P&amp;L. No account records are fabricated.</small></span></div>
      </section>
    </div>
    <div className="vta-terminal-disclaimer"><ShieldCheck size={13} /><span>Historical spot candles only · Not a live quote · No connected broker · Orders are not sent</span><span>VTA · TRADING SYSTEMS</span></div>
  </section>;
}

export function VtaTerminalFallback() {
  return null;
}
