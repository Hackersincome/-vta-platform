# VTA WEBSITE AI HANDOFF

## Receiving-AI instruction
You are continuing work on a website project named **VTA — Vector Trade & Analytics**. Use this file as the compact architectural context. Preserve the existing brand, route taxonomy, visual language, truthful availability states, security boundaries, and separation between public, client, and admin areas. Do not invent live market data, customer records, payment confirmations, KYC results, broker executions, performance results, credentials, or connected services. If exact implementation details are required, inspect the original project files.

## Product identity
VTA is a premium multi-asset trading technology ecosystem. Brand promise: **Precision for every market decision.** The product combines public market education/product pages, a Web Terminal architecture, MT4/MT5 platform surfaces, automation products, a private Client Portal, and a private Operations/Admin workspace.

The current site is a functional architecture and presentation layer. Many operational areas intentionally show empty or unavailable states because no authenticated market, broker, payment, KYC, wallet, news, calendar, or customer-data connector is configured.

## Technical stack and structure
- React + TypeScript + Vite.
- Express server with SSR entry and protected route handling.
- Client entry: `src/main.tsx`.
- SSR entry: `src/entry-server.tsx`.
- Main UI and routes: `src/App.tsx`.
- Shared route metadata and public/private classification: `src/meta.ts`.
- Design system: `src/styles.css`.
- Server and route/security boundary: `server/index.mjs`.
- Canonical route manifest: `public/manus-routes.json`.
- Public robots policy: `public/robots.txt`.
- Brand assets: `public/logo-mark.svg`, `public/logo-mark.png`, `public/favicon.svg`.
- Atmospheric globe asset: `public/assets/nasa-black-marble.jpg`; attribution is in `public/assets/ATTRIBUTION.md`.
- Managed server runtime listens on port 3000 and exposes `/_app/health`.
- Deployment uses the project Dockerfile and server health path `/ _app/health` without the space.

## Information architecture

### Public routes
- `/` — VTA home and ecosystem overview.
- `/markets` — Forex, Metals, Energies, Indices, Stocks, Crypto market families.
- `/platforms` — Web Terminal, MT4, MT5, wallet and automation architecture.
- `/web-terminal` — terminal workspace architecture; no fabricated live prices.
- `/mt4` — MetaTrader 4 integration surface.
- `/mt5` — MetaTrader 5 integration surface.
- `/robots/momentum-booster` — Momentum Booster EA — Advanced V1 product page.
- `/news` — editorial/news architecture; unavailable without a verified source.
- `/calendar` — economic-calendar architecture; no fabricated events.
- `/analysis` — market intelligence, research and AI-analysis architecture.
- `/about` — VTA principles and product philosophy.
- `/faq` — transparent answers about access, data and availability.
- `/contact` — contact surface.
- `/login` and `/register` — client access/registration architecture.

### Client Portal routes
`/portal`, `/portal/accounts`, `/portal/accounts/new`, `/portal/wallet`, `/portal/deposit`, `/portal/withdraw`, `/portal/transactions`, `/portal/markets`, `/portal/terminal`, `/portal/positions`, `/portal/orders`, `/portal/history`, `/portal/robot`, `/portal/robot/subscription`, `/portal/alerts`, `/portal/news`, `/portal/calendar`, `/portal/support`, `/portal/profile`, `/portal/kyc`, `/portal/security`, `/portal/settings`.

The Portal is private, uses a desktop sidebar of approximately 244px, collapses on mobile, and uses intent-led empty states. `/portal/robot` includes the Momentum Booster module map. Unauthenticated Portal access redirects to `/login`.

### Admin / Operations routes
`/admin`, `/admin/clients`, `/admin/clients/:clientId`, `/admin/kyc`, `/admin/accounts`, `/admin/wallets`, `/admin/deposits`, `/admin/withdrawals`, `/admin/transactions`, `/admin/orders`, `/admin/positions`, `/admin/markets`, `/admin/instruments`, `/admin/pricing`, `/admin/risk`, `/admin/robot`, `/admin/subscriptions`, `/admin/payments`, `/admin/reports`, `/admin/support`, `/admin/notifications`, `/admin/employees`, `/admin/roles`, `/admin/audit`, `/admin/settings`.

Admin is private, denser than the public site, and prepared for search/filter/table operations. It must not create fake clients, balances, KYC records, payments, orders, positions, or execution history.

## Design system

The visual direction is **institutional vector intelligence**: a calm, dark financial operating environment that feels precise, inspectable and premium—not a casino, meme-coin dashboard, loud neon terminal or generic AI interface.

Core colors:
- Foundation: `#08151A` / `#081417`
- Deep panels: `#102126` / `#122A2E`
- Primary text: `#EDF4F1`
- Muted text: `#96AAA5` / `#6F8881`
- Signal mint/emerald: `#35D3A1` / `#19B985`
- Caution amber: `#EFC171`
- Risk red: `#E58383`

Typography:
- Headings/brand: Manrope.
- Body/UI: DM Sans.
- Technical labels: monospace with uppercase tracking.

Signature elements are the reconstructed VTA monogram, mint vector lines, a charcoal globe grid, hairline borders, translucent elevated panels, compact monospace metadata, restrained status pills and high-quality empty states. Use mint only for meaningful status, focus and primary actions. Motion is subtle and respects reduced-motion preferences.

## Truthful state model
Use explicit states rather than fake data:
- `AVAILABLE` — a verified connected capability exists.
- `CONNECTED` — an authenticated integration is connected.
- `PREVIEW` — interface architecture is visible but not operational.
- `HISTORICAL` — sourced historical information only.
- `UNAVAILABLE` — capability has no configured source.
- `NOT CONNECTED` — account/service connection is absent.
- `DEMO` — demonstration state, not live execution.
- `CODED / UNTESTED` — behavior exists in source but has not been independently verified in the relevant runtime.
- `USER TESTED / RESULTS PRIVATE` — the user reports testing the same EA version; no test numbers are published.
- `NO LIVE DATA` — no live provider is connected.
- `AWAITING CONFIGURATION` — setup is required before activation.

Never simulate price ticks, account balances, wallet addresses, QR codes, deposits, withdrawals, news stories, calendar events, orders, positions, profit, win rate, drawdown or payment success.

## Momentum Booster EA integration
The product is **Momentum Booster EA — Advanced V1**. The source is `ea/Momentum_Booster_EA_Advanced_V1.mq5` and is mirrored at `public/Momentum_Booster_EA_Advanced_V1.mq5`.

The EA architecture is:
`Data freshness → H1 bias → M15 structure → M5 confirmation → M1 execution → risk gates → order → retcode/reconciliation`.

It includes MT5 standard Trade/Trade.mqh, multi-timeframe indicators, TREND/BREAKOUT/MEAN_REVERSION/AUTO modes, seven-component weighted scoring, risk profiles, OrderCalcProfit sizing, broker-rule validation, persistent safety state, drawdown/loss/margin/exposure/spread/session protections, ATR SL/TP, position management, audit logging, dashboard, license gating and restrictive AI defaults.

The website must distinguish source presence from runtime connectivity. Current intended labels are `SOURCE PRESENT`, `USER TESTED / RESULTS PRIVATE`, `CODED / UNTESTED`, `DEMO`, `UNAVAILABLE`, and `NOT CONNECTED`. The user reports testing the same EA version, but no test report or performance values are published. No MT5 broker connector, live market feed, account identity, license service or VTA synchronization is configured.

## Security and routing rules
- Public pages can be indexed when appropriate.
- Portal, Admin, login and register metadata use `noindex,nofollow`.
- `/portal/*` and `/admin/*` are server-protected and redirect unauthenticated users to login.
- `/api/*` is server-routed and unknown API paths return JSON 404 rather than public HTML.
- Unknown frontend routes return a branded 404.
- Never expose API keys, broker credentials, session secrets or private configuration in client code.
- Never bypass the server route guard with client-only protection.
- Do not add `X-Frame-Options: DENY` or `frame-ancestors 'none'`; the Preview is embedded through a cross-site iframe.

## Existing UI primitives
Reusable components include `PublicShell`, `PublicHeader`, `Footer`, `Brand`, `Status`, `PageIntro`, `SectionHeading`, `EmptyState`, `MiniGraph`, `Metric`, `PanelHead`, `AppTopbar`, `PortalRoute`, `AdminRoute`, `PortalContent`, `RobotContent`, `AdminContent`, `AdminOperationsContent`, and `NotFound`.

## Development and handoff rules
- Preserve the VTA identity and existing route manifest.
- Before changing architecture, inspect `src/App.tsx`, `src/meta.ts`, `src/styles.css`, `server/index.mjs`, and `public/manus-routes.json`.
- After UI changes run `pnpm check` and `pnpm build`.
- Keep public, Portal and Admin behavior distinct.
- Keep unavailable states honest until a real connector is configured.
- For EA changes, MetaEditor/MT5 compilation and Strategy Tester validation must be performed in a real MT5 environment; do not claim those checks were done in the sandbox.
- Preserve documentation and update this handoff when the route map, architecture or status model materially changes.

## One-paragraph summary for a new AI
VTA is a dark institutional React/Vite/Express trading technology website with public marketing/product pages, a private Client Portal, and a private Admin/Operations area. Its route map is already defined in `public/manus-routes.json`, metadata and privacy classification live in `src/meta.ts`, the main UI is in `src/App.tsx`, and the design system is in `src/styles.css`. The site intentionally shows truthful empty and unavailable states because no live market, broker, payment, wallet, news, KYC or customer-data connectors are configured. The integrated product is Momentum Booster EA — Advanced V1, whose source is an MQL5 file; the user reports testing it, but results are private and must not be invented. Preserve the existing dark mint visual language, route security, public/private separation, and no-fabricated-data policy.
