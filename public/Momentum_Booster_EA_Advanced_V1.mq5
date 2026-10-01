//+------------------------------------------------------------------+
//| Momentum_Booster_EA_Advanced_V1.mq5                              |
//| VTA — Vector Trade & Analytics                                  |
//| Multi-timeframe, risk-first, explainable MT5 execution engine    |
//|                                                                  |
//| This source is built from the supplied specification.            |
//| MetaEditor/Strategy Tester validation must be performed by the   |
//| user in an MT5 environment; this sandbox has no MetaTrader.       |
//+------------------------------------------------------------------+
#property strict
#property version   "1.00"
#property description "Momentum Booster EA — Advanced V1"
#property description "H1 context -> M15 structure -> M5 confirmation -> M1 execution"

#include <Trade/Trade.mqh>

#define EA_NAME "Momentum Booster Advanced"
#define EA_VERSION "1.00-ADVANCED-V1"
#define STATE_PREFIX "VTA_MB_V1_"

enum MBStrategyMode { MODE_TREND=0, MODE_BREAKOUT=1, MODE_MEAN_REVERSION=2, MODE_AUTO=3 };
enum MBRiskProfile { RISK_CONSERVATIVE=0, RISK_BALANCED=1, RISK_AGGRESSIVE=2, RISK_CUSTOM=3 };
enum MBBias { BIAS_BULLISH=0, BIAS_BEARISH=1, BIAS_NEUTRAL=2, BIAS_UNSTABLE=3 };
enum MBRegime { REGIME_STRONG_TREND=0, REGIME_WEAK_TREND=1, REGIME_BREAKOUT=2, REGIME_COMPRESSION=3, REGIME_MEAN_REVERSION=4, REGIME_ABNORMAL=5, REGIME_UNCLEAR=6 };
enum MBMomentum { MOM_STRONG=0, MOM_NORMAL=1, MOM_WEAKENING=2, MOM_CONFLICT=3 };
enum MBVolatility { VOL_LOW=0, VOL_NORMAL=1, VOL_EXPANDING=2, VOL_ABNORMAL=3 };

typedef struct MBScore {
   double liquidity;
   double structure;
   double momentum;
   double volatility;
   double volume;
   double candle;
   double context;
   double total;
};

typedef struct MBState {
   double peak_equity;
   double day_start_equity;
   double week_start_equity;
   int consecutive_losses;
   int trades_this_hour;
   datetime hour_stamp;
   datetime last_entry;
   datetime last_closed_deal;
   bool circuit_breaker;
   string last_block;
   string last_signal;
};

//----------------------------- inputs ------------------------------
input group "Identity and execution"
input ulong InpMagic = 501001;
input string InpLicenseProduct = "Momentum Booster EA — Advanced V1";
input string InpLicenseActivation = "UNCONFIGURED";
input datetime InpLicenseExpiry = D'2035.12.31 23:59';
input bool InpDemoOnly = true;
input int InpSlippagePoints = 20;
input int InpMaxSpreadPoints = 40;
input int InpMaxPositions = 1;
input int InpMaxTradesPerHour = 2;
input int InpCooldownMinutes = 15;
input int InpMaxHoldingMinutes = 180;

input group "Strategy pipeline"
input MBStrategyMode InpStrategy = MODE_AUTO;
input bool InpUseH1Filter = true;
input int InpMinScore = 70;
input bool InpRequireM5Agreement = true;
input bool InpRequireRetestForBreakout = false;
input int InpSwingLookback = 30;
input int InpRangeLookback = 20;

input group "Indicators"
input int InpFastEMA = 20;
input int InpSlowEMA = 50;
input int InpRSIPeriod = 14;
input int InpADXPeriod = 14;
input int InpATRPeriod = 14;
input int InpBandsPeriod = 20;
input double InpBandsDeviation = 2.0;
input double InpAbnormalATRRatio = 2.25;
input double InpExpansionATRRatio = 1.35;

input group "Signal weights"
input double InpWeightLiquidity = 20.0;
input double InpWeightStructure = 20.0;
input double InpWeightMomentum = 20.0;
input double InpWeightVolatility = 10.0;
input double InpWeightVolume = 10.0;
input double InpWeightCandle = 10.0;
input double InpWeightContext = 10.0;

input group "Risk profiles"
input MBRiskProfile InpRiskProfile = RISK_BALANCED;
input double InpCustomRiskPercent = 0.50;
input double InpMaxDrawdownPercent = 8.0;
input double InpMaxDailyLossPercent = 3.0;
input double InpMaxWeeklyLossPercent = 6.0;
input int InpMaxConsecutiveLosses = 4;
input double InpMinMarginLevel = 300.0;
input bool InpUseFixedLot = false;
input double InpFixedLot = 0.01;
input double InpMaxFixedLotRiskPercent = 0.50;
input double InpMaxSymbolExposureLots = 1.0;

input group "Stops and management"
input double InpSL_ATR = 1.50;
input double InpTP_RR = 1.80;
input double InpTP_ATR = 2.70;
input bool InpUseBreakEven = true;
input double InpBreakEvenR = 1.0;
input bool InpUseATRTrailing = true;
input double InpTrailATR = 1.20;
input bool InpUsePartialClose = false;
input double InpPartialAtR = 1.0;
input double InpPartialPercent = 50.0;
input bool InpExitOppositeSignal = false;
input bool InpExitMomentumLoss = true;

input group "Sessions and news"
input bool InpUseSessionFilter = true;
input int InpSessionStartHour = 7;
input int InpSessionEndHour = 20;
input bool InpProtectFridayLate = true;
input int InpFridayStopHour = 18;
input bool InpManualNewsBlackout = false;
input datetime InpNewsBlackoutStart = D'1970.01.01 00:00';
input datetime InpNewsBlackoutEnd = D'1970.01.01 00:00';
input bool InpRequireNewsProvider = false;

input group "Optional AI guard"
input bool InpUseAI = false;
input string InpAIAllowlistedEndpoint = "";
input string InpAIAllowedHost = "";
input int InpAITTLSeconds = 60;

//----------------------------- globals ------------------------------
CTrade g_trade;
MBState g_state;
datetime g_last_bar = 0;
string g_symbol;

int g_ema20_h1, g_ema50_h1, g_adx_h1, g_atr_h1;
int g_ema20_m15, g_ema50_m15, g_adx_m15, g_atr_m15;
int g_ema20_m5, g_ema50_m5, g_rsi_m5, g_adx_m5, g_atr_m5, g_bands_m5;
int g_ema20_m1, g_ema50_m1, g_rsi_m1, g_adx_m1, g_atr_m1, g_bands_m1;

string StateKey(const string suffix) { return STATE_PREFIX + IntegerToString((long)AccountInfoInteger(ACCOUNT_LOGIN)) + "_" + g_symbol + "_" + suffix; }

bool IsFiniteValue(const double value) { return MathIsValidNumber(value) && value != EMPTY_VALUE; }

bool CopyOne(const int handle, const int buffer, const int shift, double &value) {
   double data[1];
   ArraySetAsSeries(data, true);
   if(handle == INVALID_HANDLE || CopyBuffer(handle, buffer, shift, 1, data) != 1) return false;
   value = data[0];
   return IsFiniteValue(value);
}

bool CopyRatesClosed(const ENUM_TIMEFRAMES tf, const int count, MqlRates &rates[]) {
   ArraySetAsSeries(rates, true);
   return CopyRates(g_symbol, tf, 1, count, rates) == count;
}

bool CreateIndicators() {
   g_ema20_h1 = iMA(g_symbol, PERIOD_H1, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE);
   g_ema50_h1 = iMA(g_symbol, PERIOD_H1, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE);
   g_adx_h1 = iADX(g_symbol, PERIOD_H1, InpADXPeriod);
   g_atr_h1 = iATR(g_symbol, PERIOD_H1, InpATRPeriod);
   g_ema20_m15 = iMA(g_symbol, PERIOD_M15, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE);
   g_ema50_m15 = iMA(g_symbol, PERIOD_M15, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE);
   g_adx_m15 = iADX(g_symbol, PERIOD_M15, InpADXPeriod);
   g_atr_m15 = iATR(g_symbol, PERIOD_M15, InpATRPeriod);
   g_ema20_m5 = iMA(g_symbol, PERIOD_M5, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE);
   g_ema50_m5 = iMA(g_symbol, PERIOD_M5, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE);
   g_rsi_m5 = iRSI(g_symbol, PERIOD_M5, InpRSIPeriod, PRICE_CLOSE);
   g_adx_m5 = iADX(g_symbol, PERIOD_M5, InpADXPeriod);
   g_atr_m5 = iATR(g_symbol, PERIOD_M5, InpATRPeriod);
   g_bands_m5 = iBands(g_symbol, PERIOD_M5, InpBandsPeriod, 0, InpBandsDeviation, PRICE_CLOSE);
   g_ema20_m1 = iMA(g_symbol, PERIOD_M1, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE);
   g_ema50_m1 = iMA(g_symbol, PERIOD_M1, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE);
   g_rsi_m1 = iRSI(g_symbol, PERIOD_M1, InpRSIPeriod, PRICE_CLOSE);
   g_adx_m1 = iADX(g_symbol, PERIOD_M1, InpADXPeriod);
   g_atr_m1 = iATR(g_symbol, PERIOD_M1, InpATRPeriod);
   g_bands_m1 = iBands(g_symbol, PERIOD_M1, InpBandsPeriod, 0, InpBandsDeviation, PRICE_CLOSE);
   int handles[] = {g_ema20_h1,g_ema50_h1,g_adx_h1,g_atr_h1,g_ema20_m15,g_ema50_m15,g_adx_m15,g_atr_m15,g_ema20_m5,g_ema50_m5,g_rsi_m5,g_adx_m5,g_atr_m5,g_bands_m5,g_ema20_m1,g_ema50_m1,g_rsi_m1,g_adx_m1,g_atr_m1,g_bands_m1};
   for(int i=0;i<ArraySize(handles);i++) if(handles[i] == INVALID_HANDLE) return false;
   return true;
}

void ReleaseIndicators() {
   int handles[] = {g_ema20_h1,g_ema50_h1,g_adx_h1,g_atr_h1,g_ema20_m15,g_ema50_m15,g_adx_m15,g_atr_m15,g_ema20_m5,g_ema50_m5,g_rsi_m5,g_adx_m5,g_atr_m5,g_bands_m5,g_ema20_m1,g_ema50_m1,g_rsi_m1,g_adx_m1,g_atr_m1,g_bands_m1};
   for(int i=0;i<ArraySize(handles);i++) if(handles[i] != INVALID_HANDLE) IndicatorRelease(handles[i]);
}

void PersistState() {
   GlobalVariableSet(StateKey("peak"), g_state.peak_equity);
   GlobalVariableSet(StateKey("day"), g_state.day_start_equity);
   GlobalVariableSet(StateKey("week"), g_state.week_start_equity);
   GlobalVariableSet(StateKey("losses"), g_state.consecutive_losses);
   GlobalVariableSet(StateKey("last_deal"), (double)g_state.last_closed_deal);
   GlobalVariableSet(StateKey("hour_stamp"), (double)g_state.hour_stamp);
   GlobalVariableSet(StateKey("hour_trades"), g_state.trades_this_hour);
   GlobalVariableSet(StateKey("breaker"), g_state.circuit_breaker ? 1.0 : 0.0);
}

void LoadState() {
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   g_state.peak_equity = GlobalVariableCheck(StateKey("peak")) ? GlobalVariableGet(StateKey("peak")) : equity;
   g_state.day_start_equity = GlobalVariableCheck(StateKey("day")) ? GlobalVariableGet(StateKey("day")) : equity;
   g_state.week_start_equity = GlobalVariableCheck(StateKey("week")) ? GlobalVariableGet(StateKey("week")) : equity;
   g_state.consecutive_losses = (int)(GlobalVariableCheck(StateKey("losses")) ? GlobalVariableGet(StateKey("losses")) : 0);
   g_state.last_closed_deal = (datetime)(GlobalVariableCheck(StateKey("last_deal")) ? GlobalVariableGet(StateKey("last_deal")) : 0);
   g_state.hour_stamp = (datetime)(GlobalVariableCheck(StateKey("hour_stamp")) ? GlobalVariableGet(StateKey("hour_stamp")) : 0);
   g_state.trades_this_hour = (int)(GlobalVariableCheck(StateKey("hour_trades")) ? GlobalVariableGet(StateKey("hour_trades")) : 0);
   g_state.circuit_breaker = GlobalVariableCheck(StateKey("breaker")) && GlobalVariableGet(StateKey("breaker")) > 0.5;
   if(equity > g_state.peak_equity) { g_state.peak_equity = equity; PersistState(); }
}

void UpdateCalendarState() {
   MqlDateTime now; TimeToStruct(TimeCurrent(), now);
   MqlDateTime day; TimeToStruct(TimeCurrent(), day); day.hour=0; day.min=0; day.sec=0;
   datetime day_stamp = StructToTime(day);
   if(day_stamp > (datetime)GlobalVariableGet(StateKey("day_stamp"))) {
      GlobalVariableSet(StateKey("day_stamp"), (double)day_stamp);
      g_state.day_start_equity = AccountInfoDouble(ACCOUNT_EQUITY);
   }
   int days_from_monday = (now.day_of_week + 6) % 7;
   datetime week_stamp = day_stamp - days_from_monday * 86400;
   if(week_stamp > (datetime)GlobalVariableGet(StateKey("week_stamp"))) {
      GlobalVariableSet(StateKey("week_stamp"), (double)week_stamp);
      g_state.week_start_equity = AccountInfoDouble(ACCOUNT_EQUITY);
   }
   if(AccountInfoDouble(ACCOUNT_EQUITY) > g_state.peak_equity) g_state.peak_equity = AccountInfoDouble(ACCOUNT_EQUITY);
   PersistState();
}

bool LicenseAllowsNewTrades(string &reason) {
   if(InpLicenseActivation == "UNCONFIGURED") { reason="LICENSE_UNCONFIGURED"; return false; }
   if(TimeCurrent() > InpLicenseExpiry) { reason="LICENSE_EXPIRED"; return false; }
   return true;
}

bool DataFresh(const ENUM_TIMEFRAMES tf) {
   MqlTick tick; if(!SymbolInfoTick(g_symbol, tick)) return false;
   if(tick.time == 0 || (TimeCurrent() - (datetime)tick.time) > 120) return false;
   MqlRates rates[]; if(!CopyRatesClosed(tf, 3, rates)) return false;
   return rates[0].time > 0;
}

MBBias H1Bias() {
   double fast, slow, adx, plus, minus, atr;
   if(!CopyOne(g_ema20_h1,0,1,fast) || !CopyOne(g_ema50_h1,0,1,slow) || !CopyOne(g_adx_h1,0,1,adx) || !CopyOne(g_adx_h1,1,1,plus) || !CopyOne(g_adx_h1,2,1,minus) || !CopyOne(g_atr_h1,0,1,atr)) return BIAS_UNSTABLE;
   MqlRates r[]; if(!CopyRatesClosed(PERIOD_H1,5,r)) return BIAS_UNSTABLE;
   double separation = MathAbs(fast-slow);
   if(adx < 12.0 || separation < atr*0.08) return BIAS_NEUTRAL;
   if(adx > 38.0 && separation > atr*0.18) {
      if(fast > slow && plus > minus && r[0].close > fast) return BIAS_BULLISH;
      if(fast < slow && minus > plus && r[0].close < fast) return BIAS_BEARISH;
   }
   if((fast > slow && plus < minus) || (fast < slow && plus > minus)) return BIAS_UNSTABLE;
   return fast > slow ? BIAS_BULLISH : BIAS_BEARISH;
}

string BiasName(const MBBias bias) { if(bias==BIAS_BULLISH)return "BULLISH"; if(bias==BIAS_BEARISH)return "BEARISH"; if(bias==BIAS_UNSTABLE)return "UNSTABLE"; return "NEUTRAL"; }

int SwingDirection(const ENUM_TIMEFRAMES tf) {
   MqlRates r[]; int count = MathMax(InpSwingLookback, 10); if(!CopyRatesClosed(tf,count,r)) return 0;
   int highs=0, lows=0;
   for(int i=2;i<count-2;i++) {
      if(r[i].high > r[i-1].high && r[i].high > r[i+1].high) highs++;
      if(r[i].low < r[i-1].low && r[i].low < r[i+1].low) lows++;
   }
   double recentHigh=r[0].high, priorHigh=r[1].high, recentLow=r[0].low, priorLow=r[1].low;
   double swing_high_1=0, swing_high_2=0, swing_low_1=0, swing_low_2=0;
   for(int i=2;i<count-2;i++) {
      if(r[i].high>r[i-1].high && r[i].high>r[i+1].high) { if(swing_high_1==0) swing_high_1=r[i].high; else if(swing_high_2==0) swing_high_2=r[i].high; }
      if(r[i].low<r[i-1].low && r[i].low<r[i+1].low) { if(swing_low_1==0) swing_low_1=r[i].low; else if(swing_low_2==0) swing_low_2=r[i].low; }
   }
   bool bullish_structure=swing_high_1>swing_high_2 && swing_low_1>swing_low_2;
   bool bearish_structure=swing_high_1<swing_high_2 && swing_low_1<swing_low_2;
   bool bullish_break=r[0].close>swing_high_1 && r[1].close<=swing_high_1;
   bool bearish_break=r[0].close<swing_low_1 && r[1].close>=swing_low_1;
   if((bullish_structure||bullish_break) && highs>0 && lows>0) return 1;
   if((bearish_structure||bearish_break) && highs>0 && lows>0) return -1;
   return 0;
}

string StructureName(const int direction) { return direction>0 ? "HH_HL_BOS_RETEST" : direction<0 ? "LH_LL_BOS_RETEST" : "NEUTRAL_STRUCTURE"; }

MBRegime MarketRegime(const int structure, const double atr, const double atr_ref, const double adx, const double band_width) {
   if(atr_ref <= 0 || atr/atr_ref >= InpAbnormalATRRatio) return REGIME_ABNORMAL;
   if(adx >= 30 && MathAbs(structure) > 0) return REGIME_STRONG_TREND;
   if(adx >= 20 && MathAbs(structure) > 0) return REGIME_WEAK_TREND;
   if(band_width > atr*2.0 && adx >= 22) return REGIME_BREAKOUT;
   if(band_width < atr*0.9) return REGIME_COMPRESSION;
   if(adx < 18) return REGIME_MEAN_REVERSION;
   return REGIME_UNCLEAR;
}

string RegimeName(const MBRegime r) { string a[]={"STRONG_TREND","WEAK_TREND","BREAKOUT","COMPRESSION","MEAN_REVERSION","ABNORMAL","UNCLEAR"}; return a[(int)r]; }

bool M5Agreement(const int direction) {
   double fast,slow,rsi,adx,plus,minus; MqlRates r[];
   if(!CopyOne(g_ema20_m5,0,1,fast)||!CopyOne(g_ema50_m5,0,1,slow)||!CopyOne(g_rsi_m5,0,1,rsi)||!CopyOne(g_adx_m5,0,1,adx)||!CopyOne(g_adx_m5,1,1,plus)||!CopyOne(g_adx_m5,2,1,minus)||!CopyRatesClosed(PERIOD_M5,3,r)) return false;
   if(adx < 14) return false;
   if(direction>0) return fast>slow && plus>minus && r[0].close>fast && rsi>50 && rsi<78;
   if(direction<0) return fast<slow && minus>plus && r[0].close<fast && rsi<50 && rsi>22;
   return false;
}

int CandleDirection(const ENUM_TIMEFRAMES tf, double &quality) {
   MqlRates r[]; quality=0; if(!CopyRatesClosed(tf,3,r)) return 0;
   double range=r[0].high-r[0].low; if(range<=0) return 0;
   double body=MathAbs(r[0].close-r[0].open), upper=r[0].high-MathMax(r[0].open,r[0].close), lower=MathMin(r[0].open,r[0].close)-r[0].low;
   quality=MathMin(100.0,(body/range)*65.0 + ((r[0].close-r[0].low)/range)*35.0);
   if(r[0].close>r[0].open && lower<range*.45) return 1;
   if(r[0].close<r[0].open && upper<range*.45) return -1;
   return 0;
}

int LiquidityDirection(const ENUM_TIMEFRAMES tf, double &quality) {
   MqlRates r[]; quality=0; if(!CopyRatesClosed(tf,8,r)) return 0;
   double previousHigh=r[1].high, previousLow=r[1].low;
   for(int i=2;i<8;i++){ previousHigh=MathMax(previousHigh,r[i].high); previousLow=MathMin(previousLow,r[i].low); }
   if(r[0].low<previousLow && r[0].close>previousLow) { quality=90; return 1; }
   if(r[0].high>previousHigh && r[0].close<previousHigh) { quality=90; return -1; }
   if(r[0].close>previousHigh) { quality=75; return 1; }
   if(r[0].close<previousLow) { quality=75; return -1; }
   quality=35; return r[0].close>r[0].open ? 1 : r[0].close<r[0].open ? -1 : 0;
}

int MomentumDirection(const ENUM_TIMEFRAMES tf, const int ema20, const int ema50, const int rsi_handle, const int adx_handle, double &quality) {
   double fast,slow,rsi,adx,plus,minus; quality=0;
   if(!CopyOne(ema20,0,1,fast)||!CopyOne(ema50,0,1,slow)||!CopyOne(rsi_handle,0,1,rsi)||!CopyOne(adx_handle,0,1,adx)||!CopyOne(adx_handle,1,1,plus)||!CopyOne(adx_handle,2,1,minus)) return 0;
   if(adx<12) { quality=25; return 0; }
   if(fast>slow && plus>minus && rsi>50 && rsi<80) { quality=MathMin(100.0,45+adx); return 1; }
   if(fast<slow && minus>plus && rsi<50 && rsi>20) { quality=MathMin(100.0,45+adx); return -1; }
   quality=20; return 0;
}

bool ATRValues(const int handle, double &atr, double &reference) {
   if(!CopyOne(handle,0,1,atr)) return false;
   double values[]; ArrayResize(values,20); ArraySetAsSeries(values,true); if(CopyBuffer(handle,0,2,20,values)!=20) return false;
   reference=0; for(int i=0;i<20;i++) reference+=values[i]; reference/=20.0; return reference>0;
}

double VolumeQuality(const ENUM_TIMEFRAMES tf) {
   MqlRates r[]; if(!CopyRatesClosed(tf,21,r)) return 0;
   double avg=0; for(int i=1;i<21;i++) avg+=(double)r[i].tick_volume; avg/=20.0;
   if(avg<=0) return 0;
   double ratio=(double)r[0].tick_volume/avg;
   return MathMax(0.0,MathMin(100.0,50.0+ratio*25.0));
}

bool SessionAllowed(string &reason) {
   if(!InpUseSessionFilter) return true;
   MqlDateTime now; TimeToStruct(TimeCurrent(),now);
   if(now.hour<InpSessionStartHour || now.hour>=InpSessionEndHour) { reason="SESSION_FILTER"; return false; }
   if(InpProtectFridayLate && now.day_of_week==5 && now.hour>=InpFridayStopHour) { reason="FRIDAY_LATE_PROTECTION"; return false; }
   return true;
}

bool NewsAllowed(string &reason) {
   datetime now=TimeCurrent();
   if(InpManualNewsBlackout && now>=InpNewsBlackoutStart && now<=InpNewsBlackoutEnd) { reason="MANUAL_NEWS_BLACKOUT"; return false; }
   if(InpRequireNewsProvider) { reason="NEWS_PROVIDER_UNAVAILABLE_SAFE_MODE"; return false; }
   return true;
}

bool RiskAllowed(string &reason) {
   double equity=AccountInfoDouble(ACCOUNT_EQUITY); if(equity<=0) { reason="EQUITY_UNAVAILABLE"; return false; }
   if(g_state.circuit_breaker) { reason="CIRCUIT_BREAKER"; return false; }
   double dd=(g_state.peak_equity-equity)/g_state.peak_equity*100.0;
   double daily=(g_state.day_start_equity-equity)/g_state.day_start_equity*100.0;
   double weekly=(g_state.week_start_equity-equity)/g_state.week_start_equity*100.0;
   if(dd>=InpMaxDrawdownPercent) { g_state.circuit_breaker=true; PersistState(); reason="MAX_DRAWDOWN"; return false; }
   if(daily>=InpMaxDailyLossPercent) { reason="DAILY_LOSS_LIMIT"; return false; }
   if(weekly>=InpMaxWeeklyLossPercent) { reason="WEEKLY_LOSS_LIMIT"; return false; }
   if(g_state.consecutive_losses>=InpMaxConsecutiveLosses) { reason="CONSECUTIVE_LOSS_LIMIT"; return false; }
   if(AccountInfoDouble(ACCOUNT_MARGIN_LEVEL)>0 && AccountInfoDouble(ACCOUNT_MARGIN_LEVEL)<InpMinMarginLevel) { reason="MARGIN_LEVEL"; return false; }
   return true;
}

int CountPositions() { int count=0; for(int i=PositionsTotal()-1;i>=0;i--) if(PositionSelectByTicket(PositionGetTicket(i)) && PositionGetString(POSITION_SYMBOL)==g_symbol && (ulong)PositionGetInteger(POSITION_MAGIC)==InpMagic) count++; return count; }

double RiskPercent() { if(InpRiskProfile==RISK_CONSERVATIVE)return .25; if(InpRiskProfile==RISK_AGGRESSIVE)return 1.0; if(InpRiskProfile==RISK_CUSTOM)return MathMax(.10,MathMin(2.0,InpCustomRiskPercent)); return .50; }

double NormalizeVolume(const double lots) {
   double minv=SymbolInfoDouble(g_symbol,SYMBOL_VOLUME_MIN), maxv=SymbolInfoDouble(g_symbol,SYMBOL_VOLUME_MAX), step=SymbolInfoDouble(g_symbol,SYMBOL_VOLUME_STEP);
   if(step<=0) return 0; double volume=MathFloor(lots/step)*step; if(volume<minv) return 0; return NormalizeDouble(MathMin(maxv,volume),2);
}

double CalculateVolume(const int direction, const double entry, const double sl, string &reason) {
   double volume=InpFixedLot;
   if(!InpUseFixedLot) {
      double risk_money=AccountInfoDouble(ACCOUNT_EQUITY)*RiskPercent()/100.0;
      double loss_one_lot=0;
      ENUM_ORDER_TYPE type=direction>0 ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
      if(!OrderCalcProfit(type,g_symbol,1.0,entry,sl,loss_one_lot)) { reason="ORDERCALC_PROFIT_FAILED"; return 0; }
      loss_one_lot=MathAbs(loss_one_lot); if(loss_one_lot<=0) { reason="SL_LOSS_UNAVAILABLE"; return 0; }
      volume=risk_money/loss_one_lot;
   }
   volume=NormalizeVolume(volume);
   if(volume<=0) { reason="MIN_VOLUME_EXCEEDS_APPROVED_RISK"; return 0; }
   double estimated=0; ENUM_ORDER_TYPE type=direction>0 ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   if(!OrderCalcProfit(type,g_symbol,volume,entry,sl,estimated)) { reason="VOLUME_RISK_CHECK_FAILED"; return 0; }
   double max_loss=AccountInfoDouble(ACCOUNT_EQUITY)* (InpUseFixedLot ? InpMaxFixedLotRiskPercent : RiskPercent())/100.0;
   if(MathAbs(estimated)>max_loss*1.02) { reason="VOLUME_EXCEEDS_RISK_LIMIT"; return 0; }
   return volume;
}

double NormalizeToTick(const double price) {
   double tick_size=SymbolInfoDouble(g_symbol,SYMBOL_TRADE_TICK_SIZE);
   int digits=(int)SymbolInfoInteger(g_symbol,SYMBOL_DIGITS);
   if(tick_size<=0) tick_size=SymbolInfoDouble(g_symbol,SYMBOL_POINT);
   return NormalizeDouble(MathRound(price/tick_size)*tick_size,digits);
}

bool StopsValid(const int direction, const double entry, const double sl, const double tp, string &reason) {
   int stops=(int)SymbolInfoInteger(g_symbol,SYMBOL_TRADE_STOPS_LEVEL); int freeze=(int)SymbolInfoInteger(g_symbol,SYMBOL_TRADE_FREEZE_LEVEL); double point=SymbolInfoDouble(g_symbol,SYMBOL_POINT);
   long mode=SymbolInfoInteger(g_symbol,SYMBOL_TRADE_MODE); if(mode==SYMBOL_TRADE_MODE_DISABLED) { reason="SYMBOL_TRADING_DISABLED"; return false; }
   double min_distance=MathMax(stops,freeze)*point;
   if(direction>0 && (sl>=entry-min_distance || tp<=entry+min_distance)) { reason="BUY_STOPS_LEVEL"; return false; }
   if(direction<0 && (sl<=entry+min_distance || tp>=entry-min_distance)) { reason="SELL_STOPS_LEVEL"; return false; }
   double tick_size=SymbolInfoDouble(g_symbol,SYMBOL_TRADE_TICK_SIZE); if(tick_size<=0 || MathAbs(sl/ tick_size-MathRound(sl/tick_size))>0.00001 || MathAbs(tp/tick_size-MathRound(tp/tick_size))>0.00001) { reason="TICK_SIZE_NORMALIZATION"; return false; }
   return true;
}

bool BuildSignal(int &direction, MBScore &score, MBRegime &regime, MBBias &bias, string &reason, double &atr) {
   direction=0; ZeroMemory(score); bias=H1Bias();
   int structure=SwingDirection(PERIOD_M15); double atr_ref=0, adx=0, band_up=0, band_low=0, band_mid=0;
   if(!ATRValues(g_atr_m5,atr,atr_ref)||!CopyOne(g_adx_m5,0,1,adx)||!CopyOne(g_bands_m5,0,1,band_mid)||!CopyOne(g_bands_m5,1,1,band_up)||!CopyOne(g_bands_m5,2,1,band_low)) { reason="INDICATOR_DATA_UNAVAILABLE"; return false; }
   regime=MarketRegime(structure,atr,atr_ref,adx,band_up-band_low);
   if(regime==REGIME_ABNORMAL || regime==REGIME_UNCLEAR || regime==REGIME_COMPRESSION) { reason="REGIME_BLOCK_"+RegimeName(regime); return false; }
   double q=0; int liq=LiquidityDirection(PERIOD_M1,q); score.liquidity=q;
   int candle=CandleDirection(PERIOD_M1,q); score.candle=q;
   int mom=MomentumDirection(PERIOD_M1,g_ema20_m1,g_ema50_m1,g_rsi_m1,g_adx_m1,q); score.momentum=q;
   score.structure=structure==0 ? 35 : 85;
   score.context=50;
   if(bias==BIAS_BULLISH) score.context=structure>0?95:55;
   if(bias==BIAS_BEARISH) score.context=structure<0?95:55;
   score.volatility=regime==REGIME_STRONG_TREND||regime==REGIME_BREAKOUT?85:65;
   score.volume=VolumeQuality(PERIOD_M5);
   double weight_sum=InpWeightLiquidity+InpWeightStructure+InpWeightMomentum+InpWeightVolatility+InpWeightVolume+InpWeightCandle+InpWeightContext;
   if(weight_sum<=0) { reason="INVALID_SCORE_WEIGHTS"; return false; }
   score.total=(score.liquidity*InpWeightLiquidity+score.structure*InpWeightStructure+score.momentum*InpWeightMomentum+score.volatility*InpWeightVolatility+score.volume*InpWeightVolume+score.candle*InpWeightCandle+score.context*InpWeightContext)/weight_sum;
   if(score.total<InpMinScore) { reason=StringFormat("SCORE_%0.1f_BELOW_%d",score.total,InpMinScore); return false; }
   if(InpUseH1Filter && ((bias==BIAS_BULLISH && mom<0)||(bias==BIAS_BEARISH && mom>0)||bias==BIAS_UNSTABLE)) { reason="H1_CONFLICT"; return false; }
   direction=(mom!=0?mom:liq); if(direction==0 || candle!=direction) { reason="M1_TRIGGER_CONFLICT"; return false; }
   if(InpRequireM5Agreement && !M5Agreement(direction)) { reason="M5_CONFIRMATION_MISSING"; return false; }
   if(InpStrategy==MODE_BREAKOUT && regime!=REGIME_BREAKOUT) { reason="BREAKOUT_REGIME_REQUIRED"; return false; }
   if(InpStrategy==MODE_TREND && regime!=REGIME_STRONG_TREND && regime!=REGIME_WEAK_TREND) { reason="TREND_REGIME_REQUIRED"; return false; }
   if(InpStrategy==MODE_MEAN_REVERSION && regime!=REGIME_MEAN_REVERSION) { reason="MEAN_REVERSION_REGIME_REQUIRED"; return false; }
   if(InpStrategy==MODE_AUTO && regime==REGIME_BREAKOUT && InpRequireRetestForBreakout && liq==0) { reason="BREAKOUT_RETEST_REQUIRED"; return false; }
   reason=StringFormat("%s score=%0.1f structure=%s liquidity=%0.0f momentum=%0.0f candle=%0.0f",RegimeName(regime),score.total,StructureName(structure),score.liquidity,score.momentum,score.candle);
   return true;
}

bool AIAllows(const int direction, const double score, string &reason) {
   if(!InpUseAI) return true;
   string prefix=StringLen(InpAIAllowedHost)>0 ? "https://"+InpAIAllowedHost+"/" : "";
   if(StringLen(prefix)==0 || StringFind(InpAIAllowlistedEndpoint,prefix)!=0) { reason="AI_ENDPOINT_NOT_ALLOWLISTED"; return false; }
   if(InpAITTLSeconds<=0) { reason="AI_TTL_INVALID"; return false; }
   // AI is a restrictive gate. This source intentionally safe-blocks until a signed,
   // schema-validated, fresh response is implemented behind the allowlisted host.
   reason="AI_RESPONSE_UNAVAILABLE_SAFE_MODE"; return false;
}

void DrawDashboard(const string state, const string block, const string signal, const MBScore &score, const MBBias bias, const MBRegime regime) {
   string text=EA_NAME+"\n"+EA_VERSION+"\n"+g_symbol+"  |  "+state+"\nH1: "+BiasName(bias)+"  M15: "+StructureName(SwingDirection(PERIOD_M15))+"\nRegime: "+RegimeName(regime)+"  Strategy: "+IntegerToString((int)InpStrategy)+"\nScore: "+DoubleToString(score.total,1)+"  Risk: "+DoubleToString(RiskPercent(),2)+"%\nSpread: "+IntegerToString((int)SymbolInfoInteger(g_symbol,SYMBOL_SPREAD))+"  Positions: "+IntegerToString(CountPositions())+"\nSession: "+(SessionAllowed(block)?"OPEN":"BLOCKED")+"  News: "+(NewsAllowed(block)?"CLEAR":"BLOCKED")+"\nDrawdown peak: "+DoubleToString(g_state.peak_equity,2)+"\nConsecutive losses: "+IntegerToString(g_state.consecutive_losses)+"\nAI: "+(InpUseAI?"RESTRICTIVE GATE":"OFF")+"\nLast block: "+block+"\nLast signal: "+signal;
   Comment(text);
}

void LogDecision(const string event_name, const int direction, const MBScore &score, const MBBias bias, const MBRegime regime, const string reason) {
   PrintFormat("VTA_MB_AUDIT event=%s symbol=%s strategy=%d regime=%s h1=%s direction=%d score=%.1f risk=%.2f reason=%s license=%s",event_name,g_symbol,(int)InpStrategy,RegimeName(regime),BiasName(bias),direction,score.total,RiskPercent(),reason,InpLicenseActivation);
}

void ManagePositions() {
   for(int i=PositionsTotal()-1;i>=0;i--) {
      ulong ticket=PositionGetTicket(i); if(ticket==0 || !PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL)!=g_symbol || (ulong)PositionGetInteger(POSITION_MAGIC)!=InpMagic) continue;
      long type=PositionGetInteger(POSITION_TYPE); double open=PositionGetDouble(POSITION_PRICE_OPEN), sl=PositionGetDouble(POSITION_SL), tp=PositionGetDouble(POSITION_TP), volume=PositionGetDouble(POSITION_VOLUME); datetime opened=(datetime)PositionGetInteger(POSITION_TIME);
      MqlTick tick; if(!SymbolInfoTick(g_symbol,tick)) continue; double price=type==POSITION_TYPE_BUY?tick.bid:tick.ask; double initial=MathAbs(open-sl); if(initial<=0) continue; double profit_distance=type==POSITION_TYPE_BUY?price-open:open-price; double r=profit_distance/initial;
      if(InpUseBreakEven && r>=InpBreakEvenR) { double new_sl=NormalizeDouble(open, (int)SymbolInfoInteger(g_symbol,SYMBOL_DIGITS)); if((type==POSITION_TYPE_BUY && (sl<new_sl || sl==0))||(type==POSITION_TYPE_SELL && (sl>new_sl || sl==0))) g_trade.PositionModify(ticket,new_sl,tp); }
      if(InpUseATRTrailing) { double atr=0,ref=0; if(ATRValues(g_atr_m1,atr,ref)) { double candidate=type==POSITION_TYPE_BUY?price-atr*InpTrailATR:price+atr*InpTrailATR; candidate=NormalizeDouble(candidate,(int)SymbolInfoInteger(g_symbol,SYMBOL_DIGITS)); if((type==POSITION_TYPE_BUY && candidate>sl && candidate<price)||(type==POSITION_TYPE_SELL && (sl==0||candidate<sl) && candidate>price)) g_trade.PositionModify(ticket,candidate,tp); } }
      if(InpUsePartialClose && volume>SymbolInfoDouble(g_symbol,SYMBOL_VOLUME_MIN) && r>=InpPartialAtR) { double close_vol=NormalizeVolume(volume*InpPartialPercent/100.0); if(close_vol>0 && close_vol<volume) g_trade.PositionClosePartial(ticket,close_vol); }
      if(InpMaxHoldingMinutes>0 && TimeCurrent()-opened>InpMaxHoldingMinutes*60) g_trade.PositionClose(ticket);
   }
}

bool ExecuteTrade(const int direction, const double atr, const MBScore &score, const MBBias bias, const MBRegime regime, string &reason) {
   MqlTick tick; if(!SymbolInfoTick(g_symbol,tick)) { reason="TICK_UNAVAILABLE"; return false; }
   double point=SymbolInfoDouble(g_symbol,SYMBOL_POINT); int digits=(int)SymbolInfoInteger(g_symbol,SYMBOL_DIGITS); double entry=direction>0?tick.ask:tick.bid; double sl=direction>0?entry-atr*InpSL_ATR:entry+atr*InpSL_ATR; double tp_distance=MathMax(MathAbs(entry-sl)*InpTP_RR,atr*InpTP_ATR); double tp=direction>0?entry+tp_distance:entry-tp_distance; sl=NormalizeToTick(sl); tp=NormalizeToTick(tp);
   if(!StopsValid(direction,entry,sl,tp,reason)) return false;
   if(CountPositions()>=InpMaxPositions) { reason="POSITION_LIMIT"; return false; }
   if(InpMaxSymbolExposureLots>0) {
      double exposure=0;
      for(int i=PositionsTotal()-1;i>=0;i--) {
         ulong position_ticket=PositionGetTicket(i);
         if(position_ticket>0 && PositionSelectByTicket(position_ticket) && PositionGetString(POSITION_SYMBOL)==g_symbol && (ulong)PositionGetInteger(POSITION_MAGIC)==InpMagic) exposure+=PositionGetDouble(POSITION_VOLUME);
      }
      if(exposure>=InpMaxSymbolExposureLots) { reason="SYMBOL_EXPOSURE"; return false; }
   }
   double volume=CalculateVolume(direction,entry,sl,reason); if(volume<=0) return false;
   double margin=0; ENUM_ORDER_TYPE type=direction>0?ORDER_TYPE_BUY:ORDER_TYPE_SELL; if(!OrderCalcMargin(type,g_symbol,volume,entry,margin)) { reason="MARGIN_CALC_FAILED"; return false; }
   if(InpMaxSymbolExposureLots>0) {
      double exposure=0;
      for(int i=PositionsTotal()-1;i>=0;i--) { ulong position_ticket=PositionGetTicket(i); if(position_ticket>0 && PositionSelectByTicket(position_ticket) && PositionGetString(POSITION_SYMBOL)==g_symbol && (ulong)PositionGetInteger(POSITION_MAGIC)==InpMagic) exposure+=PositionGetDouble(POSITION_VOLUME); }
      if(exposure+volume>InpMaxSymbolExposureLots) { reason="SYMBOL_EXPOSURE_WITH_ORDER"; return false; }
   }
   double used_margin=AccountInfoDouble(ACCOUNT_MARGIN), equity=AccountInfoDouble(ACCOUNT_EQUITY);
   double projected_level=(used_margin+margin)>0 ? equity/(used_margin+margin)*100.0 : 999999.0;
   if(AccountInfoDouble(ACCOUNT_MARGIN_FREE)<=margin || projected_level<InpMinMarginLevel) { reason="PROJECTED_MARGIN_PROTECTION"; return false; }
   g_trade.SetExpertMagicNumber(InpMagic); g_trade.SetDeviationInPoints(InpSlippagePoints); g_trade.SetTypeFillingBySymbol(g_symbol);
   bool sent=direction>0?g_trade.Buy(volume,g_symbol,entry,sl,tp,"VTA_MB_V1") : g_trade.Sell(volume,g_symbol,entry,sl,tp,"VTA_MB_V1");
   uint ret=g_trade.ResultRetcode();
   if(!sent || (ret!=TRADE_RETCODE_DONE && ret!=TRADE_RETCODE_PLACED && ret!=TRADE_RETCODE_DONE_PARTIAL)) { reason=StringFormat("EXECUTION_REJECTED_%u",ret); return false; }
   g_state.last_entry=TimeCurrent(); g_state.trades_this_hour++; g_state.last_signal=StringFormat("dir=%d score=%.1f sl=%s tp=%s vol=%.2f",direction,score.total,DoubleToString(sl,digits),DoubleToString(tp,digits),volume); PersistState(); reason=StringFormat("EXECUTED retcode=%u order=%I64u deal=%I64u",ret,g_trade.ResultOrder(),g_trade.ResultDeal()); return true;
}

bool HourlyLimitAllowed(string &reason) {
   MqlDateTime now; TimeToStruct(TimeCurrent(),now); now.min=0; now.sec=0; datetime hour=StructToTime(now);
   if(g_state.hour_stamp!=hour) { g_state.hour_stamp=hour; g_state.trades_this_hour=0; PersistState(); }
   if(InpMaxTradesPerHour>0 && g_state.trades_this_hour>=InpMaxTradesPerHour) { reason="HOURLY_TRADE_LIMIT"; return false; }
   return true;
}

void Evaluate() {
   UpdateCalendarState();
   string reason=""; MBScore score; MBBias bias=BIAS_UNSTABLE; MBRegime regime=REGIME_UNCLEAR; int direction=0; double atr=0;
   if(!DataFresh(PERIOD_M1)||!DataFresh(PERIOD_M5)||!DataFresh(PERIOD_M15)||!DataFresh(PERIOD_H1)) { reason="STALE_OR_INCOMPLETE_DATA"; g_state.last_block=reason; DrawDashboard("SAFE MODE",reason,g_state.last_signal,score,bias,regime); return; }
   if(!LicenseAllowsNewTrades(reason)) { g_state.last_block=reason; DrawDashboard("BLOCKED",reason,g_state.last_signal,score,bias,regime); return; }
   if(!SessionAllowed(reason)||!NewsAllowed(reason)||!RiskAllowed(reason)||!HourlyLimitAllowed(reason)) { g_state.last_block=reason; DrawDashboard("SAFE MODE",reason,g_state.last_signal,score,bias,regime); return; }
   MqlTick tick; if(!SymbolInfoTick(g_symbol,tick)) { reason="DISCONNECTED"; DrawDashboard("DISCONNECTED",reason,g_state.last_signal,score,bias,regime); return; }
   double point=SymbolInfoDouble(g_symbol,SYMBOL_POINT); if(point<=0 || InpMaxSpreadPoints<=0 || (tick.ask-tick.bid)/point>InpMaxSpreadPoints) { reason="SPREAD_PROTECTION"; DrawDashboard("BLOCKED",reason,g_state.last_signal,score,bias,regime); return; }
   if(InpCooldownMinutes>0 && g_state.last_entry>0 && TimeCurrent()-g_state.last_entry<InpCooldownMinutes*60) { reason="COOLDOWN"; DrawDashboard("BLOCKED",reason,g_state.last_signal,score,bias,regime); return; }
   if(!BuildSignal(direction,score,regime,bias,reason,atr)) { g_state.last_block=reason; LogDecision("BLOCK",direction,score,bias,regime,reason); DrawDashboard("BLOCKED",reason,g_state.last_signal,score,bias,regime); return; }
   if(!AIAllows(direction,score.total,reason)) { g_state.last_block=reason; LogDecision("AI_BLOCK",direction,score,bias,regime,reason); DrawDashboard("SAFE MODE",reason,g_state.last_signal,score,bias,regime); return; }
   g_state.last_signal=reason; bool executed=InpDemoOnly?false:ExecuteTrade(direction,atr,score,bias,regime,reason); g_state.last_block=InpDemoOnly?"DEMO_MODE_NO_ORDER":(executed?"":reason); LogDecision(executed?"EXECUTED":"DEMO_OR_BLOCK",direction,score,bias,regime,g_state.last_block); DrawDashboard(InpDemoOnly?"DEMO":(executed?"LIVE":"BLOCKED"),g_state.last_block,g_state.last_signal,score,bias,regime);
}

bool PositionIdentifierOpen(const ulong identifier) {
   for(int i=PositionsTotal()-1;i>=0;i--) {
      ulong ticket=PositionGetTicket(i);
      if(ticket>0 && PositionSelectByTicket(ticket) && (ulong)PositionGetInteger(POSITION_IDENTIFIER)==identifier) return true;
   }
   return false;
}

void ProcessClosedDeals() {
   datetime from=g_state.last_closed_deal>0?g_state.last_closed_deal:TimeCurrent()-86400*7;
   if(!HistorySelect(from,TimeCurrent())) return;
   int total=HistoryDealsTotal();
   for(int i=0;i<total;i++) {
      ulong deal=HistoryDealGetTicket(i); if(deal==0) continue;
      if(HistoryDealGetString(deal,DEAL_SYMBOL)!=g_symbol || (ulong)HistoryDealGetInteger(deal,DEAL_MAGIC)!=InpMagic) continue;
      long entry=HistoryDealGetInteger(deal,DEAL_ENTRY); datetime stamp=(datetime)HistoryDealGetInteger(deal,DEAL_TIME);
      if(entry!=DEAL_ENTRY_OUT || stamp<=g_state.last_closed_deal) continue;
      ulong position_id=(ulong)HistoryDealGetInteger(deal,DEAL_POSITION_ID);
      if(PositionIdentifierOpen(position_id)) continue;
      if(!HistorySelectByPosition(position_id)) continue;
      double result=0; int position_deals=HistoryDealsTotal();
      for(int j=0;j<position_deals;j++) {
         ulong leg=HistoryDealGetTicket(j);
         if(leg>0 && (long)HistoryDealGetInteger(leg,DEAL_ENTRY)==DEAL_ENTRY_OUT) result+=HistoryDealGetDouble(leg,DEAL_PROFIT)+HistoryDealGetDouble(leg,DEAL_SWAP)+HistoryDealGetDouble(leg,DEAL_COMMISSION);
      }
      if(result<0) g_state.consecutive_losses++; else if(result>0) g_state.consecutive_losses=0;
      g_state.last_closed_deal=stamp; PersistState();
      PrintFormat("VTA_MB_AUDIT event=CLOSED_POSITION position=%I64u result=%.2f losses=%d",position_id,result,g_state.consecutive_losses);
   }
}

int OnInit() {
   g_symbol=_Symbol; ZeroMemory(g_state); g_trade.SetExpertMagicNumber(InpMagic); LoadState();
   if(!CreateIndicators()) { Print("Momentum Booster: indicator handle creation failed"); return INIT_FAILED; }
   if(!GlobalVariableCheck(StateKey("day_stamp"))) GlobalVariableSet(StateKey("day_stamp"),0);
   if(!GlobalVariableCheck(StateKey("week_stamp"))) GlobalVariableSet(StateKey("week_stamp"),0);
   PrintFormat("%s %s initialized on %s. DEMO=%s license=%s",EA_NAME,EA_VERSION,g_symbol,InpDemoOnly?"true":"false",InpLicenseActivation);
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) { Comment(""); ReleaseIndicators(); PersistState(); PrintFormat("Momentum Booster deinitialized reason=%d",reason); }

void OnTick() {
   ManagePositions(); ProcessClosedDeals();
   datetime bar=iTime(g_symbol,PERIOD_M1,0); if(bar==0 || bar==g_last_bar) return; g_last_bar=bar; Evaluate();
}

void OnTradeTransaction(const MqlTradeTransaction &transaction, const MqlTradeRequest &request, const MqlTradeResult &result) {
   if(transaction.symbol!=g_symbol) return;
   PrintFormat("VTA_MB_AUDIT event=TRADE_TRANSACTION type=%d order=%I64u deal=%I64u retcode=%u comment=%s",transaction.type,transaction.order,transaction.deal,result.retcode,transaction.comment);
}
//+------------------------------------------------------------------+
