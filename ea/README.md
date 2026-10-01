# Momentum Booster EA — Advanced V1

## Source

- `Momentum_Booster_EA_Advanced_V1.mq5` — complete single-file MT5 Expert Advisor source.
- The implementation is built from the supplied specification. No historical EA source was recovered or inspected.

## Implemented architecture

- H1 bias: EMA20/50, ADX14, DI+/DI−, ATR and EMA separation.
- M15 structure: closed-candle swing direction and BOS-style HH/HL or LH/LL context.
- M5 confirmation: EMA alignment, RSI14, ADX14, DI agreement and closed-candle close location.
- M1 execution: liquidity sweep/reclaim, candle quality, momentum and volume-aware score.
- Regimes: strong trend, weak trend, breakout, compression, mean reversion, abnormal volatility and unclear.
- Strategies: `TREND`, `BREAKOUT`, `MEAN_REVERSION`, and `AUTO`.
- Weighted score: liquidity 20, structure 20, momentum 20, volatility 10, volume 10, candle 10, context 10; normalized using enabled weights.
- Risk profiles: conservative 0.25%, balanced 0.50%, aggressive 1.00%, bounded custom risk.
- Risk controls: daily/weekly loss, persistent peak-equity drawdown, consecutive losses, margin, exposure, spread, session, manual news blackout, cooldown and position limits.
- Position sizing: `OrderCalcProfit`, broker min/max/step, fixed-lot risk validation, ATR SL and RR/ATR TP.
- Position management: break-even, ATR trailing, maximum holding time, optional partial close.
- Safety: no martingale, no grid, no revenge logic, no automatic risk increase after losses, no live order without protective SL.
- Persistence: terminal Global Variables preserve peak equity, day/week state, consecutive losses and circuit breaker across restart.
- Execution reconciliation: ticket, order, deal and broker retcode are logged after trade requests.
- Dashboard/audit: on-chart state, bias, structure, regime, score, risk, spread, news/session, drawdown and last block/signal reason.
- AI: off by default; when enabled it remains a restrictive gate and cannot increase risk or override safety controls. No arbitrary outbound URL is accepted.
- License: product, activation and expiry gate new trades while existing positions retain local protective management.

## Required MT5 assumptions

- MetaTrader 5 with the standard `Trade/Trade.mqh` library.
- A symbol with available H1, M15, M5 and M1 history, tick data, and normal trading permissions.
- Broker symbol properties expose volume min/max/step, tick size/value, stops/freeze levels and margin calculation.
- The source uses only standard MQL5/MQL5 Standard Library facilities and has no custom `.mqh` dependencies.

## Installation and compilation

1. Copy `Momentum_Booster_EA_Advanced_V1.mq5` into `MQL5/Experts/VTA/`.
2. Open MetaEditor and open the file.
3. Compile with MetaEditor. Resolve any broker/build-specific warnings according to the broker's symbol rules.
4. Attach to an M1 chart of the desired symbol.
5. Keep `InpDemoOnly=true` until compilation, Strategy Tester checks, and a controlled forward demo are complete.
6. Set a non-default `InpLicenseActivation` only when a real licensing workflow is available; the default state intentionally blocks new trades.
7. Configure `InpMaxSpreadPoints`, sessions, risk profile, symbol exposure and news policy for the account.

## WebRequest / AI

AI is disabled by default. No WebRequest is needed in the default configuration. If an AI gateway is later implemented, use a single explicitly allowlisted HTTPS endpoint and add authentication, signed/schema-validated responses, TTL, correlation IDs and server-side risk authority before enabling it. AI must remain able only to block or reduce risk.

## VTA connector configuration

The current VTA website exposes the connector and dashboard architecture as `DEMO / UNAVAILABLE`. A production connector still needs to be implemented with authenticated account identity, license, heartbeat, signal, position, order, execution, risk-state, reconnect and reconciliation endpoints. Broker credentials must never be placed in the frontend. Server-side risk must remain authoritative: server NO and EA NO must each prevent new trades.

## User test plan

The user reports that this same EA version was tested. VTA has not independently reproduced the test, and no results are published on the website. The sandbox itself cannot run MetaEditor, MetaTrader, Strategy Tester, broker execution, live trading, or VTA synchronization. The following remains the user-owned test and integration plan:

1. MetaEditor compilation and warnings.
2. Strategy Tester with Trend BUY/SELL, Breakout BUY/SELL, Mean Reversion and AUTO.
3. Conservative, Balanced, Aggressive and bounded Custom risk profiles.
4. Daily/weekly loss, drawdown peak, consecutive-loss persistence and terminal restart persistence.
5. Broker stops/freeze levels, SL/TP, minimum volume rejection, margin protection and max positions/exposure.
6. Break-even, ATR trailing, maximum holding time and optional partial close.
7. Session filter, Friday protection, manual news blackout and Safe Mode when data/news is unavailable.
8. Optional AI failure/expired response behavior with a controlled allowlisted test endpoint.
9. License unconfigured/expired behavior: no new trades, while local management continues.
10. Connector authentication, heartbeat, reconnect, idempotency, reconciliation and VTA dashboard synchronization.

Do not interpret Strategy Tester or backtest results as a future profitability guarantee. Test multiple symbols, regimes, volatility environments, periods and spreads with in-sample, out-of-sample and forward-demo separation.

## Changelog: baseline behavior → Advanced V1

### Implemented

- Rebuilt the source under the final product identity `Momentum Booster EA — Advanced V1`.
- Added a multi-timeframe pipeline rather than a single-indicator trigger.
- Added deterministic bias, structure, regime, liquidity, momentum, volatility, volume and candle components.
- Added normalized seven-component scoring and configurable strategy modes.
- Added risk-first sizing, persistent drawdown/loss state, margin/exposure protection and broker-rule validation.
- Added protective position management, structured execution reconciliation, dashboard state and audit logging.
- Added license and restrictive AI gates with safe defaults.
- Added truthful VTA public and Portal module surfaces for the implemented source and unavailable runtime.

### Requires user testing

- MetaEditor compilation on the target MT5 build.
- Strategy Tester, broker-specific symbol behavior, demo execution, connector and VTA synchronization.

### Not available in Manus environment

- MetaEditor/MT5 compilation.
- Backtests, forward demo results, broker execution, live trading, profitability, win-rate or drawdown claims.
- A production VTA backend/connector, license service, market/news provider or AI gateway.

## Validation calibration

The user reports testing this same source version. VTA does not independently reproduce or publish those results, and the website does not present them as a performance guarantee. Runtime connectivity, broker synchronization and live data remain unavailable. The VTA UI uses `USER TESTED / RESULTS PRIVATE`, `SOURCE PRESENT`, `CODED / UNTESTED`, and `DEMO / UNAVAILABLE` to preserve that distinction.
