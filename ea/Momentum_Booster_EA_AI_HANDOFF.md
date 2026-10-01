# AI HANDOFF — Momentum Booster EA Advanced V1

## Instruction to the receiving AI
You are reviewing or explaining an MT5 Expert Advisor named **Momentum Booster EA — Advanced V1**. Treat this document as a compact specification and handoff summary. Do not invent backtest results, profitability, win rate, broker compatibility, live execution, or source behavior that is not stated here. If exact code behavior is required, ask for or inspect the original `.mq5` source file.

## Runtime target
- Platform: MetaTrader 5 / MQL5.
- Source filename: `Momentum_Booster_EA_Advanced_V1.mq5`.
- Standard dependency: `#include <Trade/Trade.mqh>`.
- No custom `.mqh` dependency is intended.
- Install source under `MQL5/Experts/VTA/`, open in MetaEditor, compile, then attach the generated `.ex5` to an M1 chart.
- MetaEditor and Strategy Tester validation must be performed in a real MT5 environment.

## Core pipeline
The decision pipeline is:

`Data freshness → H1 bias → M15 structure → M5 confirmation → M1 execution → risk gates → order → retcode/reconciliation`

## Indicators and analysis
- H1: EMA20/EMA50, ADX14, DI+/DI−, ATR14, EMA separation.
- M15: closed-candle swing structure and BOS-style direction.
- M5: EMA alignment, RSI14, ADX14, DI agreement and candle close location.
- M1: liquidity sweep/reclaim, candle quality, momentum, volume and execution trigger.
- Regimes: strong trend, weak trend, breakout, compression, mean reversion, abnormal volatility, unclear.
- Strategy modes: TREND, BREAKOUT, MEAN_REVERSION, AUTO.

## Signal score
The normalized score has seven components with default weights:

- Liquidity: 20
- Structure: 20
- Momentum: 20
- Volatility: 10
- Volume: 10
- Candle: 10
- Context: 10

Default minimum score: 70. The score is a filter, not a guarantee of profitability.

## Risk and protection
- Risk profiles: Conservative 0.25%, Balanced 0.50%, Aggressive 1.00%, Custom with bounds.
- Position sizing uses `OrderCalcProfit` when dynamic risk is enabled.
- Fixed-lot mode includes a maximum-loss validation.
- Uses broker volume min/max/step rules.
- Uses ATR-based stop-loss and take-profit with configurable RR/ATR behavior.
- Uses broker stop/freeze levels and tick-size normalization.
- Checks margin, projected margin level, spread, session, Friday protection, data freshness, cooldown, hourly trades, max positions and symbol exposure.
- Persistent state uses MT5 Global Variables for peak equity, daily/weekly state, consecutive losses, circuit breaker, closed-deal progress and hourly trade count.
- Closed-deal processing aggregates completed position exits to avoid treating partial closes as separate completed losses.
- Position management can perform break-even, ATR trailing, maximum holding-time close and optional partial close.

## Safety rules
- Demo-only mode is available and should remain enabled during initial testing.
- Default license activation is unconfigured, which blocks new trades.
- No martingale.
- No grid.
- No revenge trading.
- No automatic risk increase after losses.
- No new trade without protective SL/TP validation.
- AI is OFF by default. If enabled, it is a restrictive gate only and cannot increase risk or override local safety controls. AI must use an explicitly allowlisted HTTPS host; the source remains safe-blocking until a signed/schema-validated response path is implemented.
- News behavior is conservative/manual; no live news provider is assumed.

## Audit and dashboard
The EA logs decision and execution information including symbol, strategy, regime, H1 bias, direction, score, risk, reason, license state, retcode, order and deal identifiers. The chart dashboard exposes state, bias, structure, regime, score, risk, spread, positions, session/news state, drawdown, AI state, last block and last signal.

## Current integration state
- VTA website page: Momentum Booster EA — Advanced V1.
- The user reports that this same source version was tested.
- Test details and results are intentionally private and are not published as performance claims.
- Website runtime status: DEMO / UNAVAILABLE.
- MT5 broker connector, live market feed, account identity, license service and VTA synchronization are not connected.

## What must not be claimed
Do not claim that the EA is profitable, guaranteed, broker-compatible, live-connected, independently validated, or tested by the reviewing AI. Do not create win-rate, drawdown, profit-factor or backtest numbers without a supplied report.

## What the receiving AI can help with
- Explain the code and its architecture.
- Help install and compile it in MT5.
- Diagnose MetaEditor compiler errors if the exact error messages are supplied.
- Review Strategy Tester reports supplied by the user.
- Suggest safe configuration changes without removing risk gates.
- Prepare a connector/API design while keeping broker credentials server-side.

## Important distinction
This handoff file is a compact explanation for another AI. It is **not executable**. The only file intended for MetaTrader 5 is:

`Momentum_Booster_EA_Advanced_V1.mq5`
