You are a senior full-stack UI/UX engineer and product designer building 
a production-grade Indian stock market intelligence platform called 
"BharatAlpha". This is NOT a toy project — it competes with Zerodha, 
StockEdge, and Sensibull. Every design decision must earn trust, signal 
credibility, and feel institutional yet accessible.

═══════════════════════════════════════════
PRODUCT IDENTITY
═══════════════════════════════════════════

Name: BharatAlpha
Tagline: "Invest with Intelligence"
Audience: Indian retail investors aged 22–45, Tier 1 and Tier 2 cities,
          mobile-first users, first-generation investors
Tone: Institutional trust + approachable clarity
      Think: Bloomberg meets Zerodha meets a calm financial advisor
      NOT: Crypto pump dashboard, neon gamer UI, AI chatbot aesthetic

═══════════════════════════════════════════
DESIGN SYSTEM — COMMIT TO THESE EXACTLY
═══════════════════════════════════════════

Color Palette:
  --bg-primary: #0A0F1E        /* Deep navy — base background */
  --bg-secondary: #111827      /* Card backgrounds */
  --bg-tertiary: #1C2537       /* Elevated surfaces */
  --border: #1F2D45            /* Subtle borders */
  --accent-green: #00C896      /* Profit / Buy / Positive */
  --accent-red: #FF4D6A        /* Loss / Sell / Negative */
  --accent-blue: #3B82F6       /* Primary CTA, links */
  --accent-gold: #F59E0B       /* Premium signals, highlights */
  --text-primary: #F1F5F9      /* Main text */
  --text-secondary: #94A3B8    /* Subtitles, metadata */
  --text-muted: #475569         /* Disabled, placeholders */
  --gradient-card: linear-gradient(135deg, #111827 0%, #1C2537 100%)

Typography:
  Display font: "DM Serif Display" — for headlines, stock names,
                large numbers
  Body font: "DM Sans" — for all UI text, clean and readable
  Mono font: "JetBrains Mono" — for prices, percentages, numbers
  
  Scale:
    --text-xs: 11px
    --text-sm: 13px
    --text-base: 15px
    --text-lg: 18px
    --text-xl: 22px
    --text-2xl: 28px
    --text-hero: 42px

Spacing: 4px base grid — all spacing multiples of 4
Border radius: 
  --radius-sm: 6px
  --radius-md: 10px
  --radius-lg: 16px
  --radius-xl: 24px

Shadows:
  --shadow-card: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)
  --shadow-elevated: 0 10px 40px rgba(0,0,0,0.5)

═══════════════════════════════════════════
LAYOUT SYSTEM
═══════════════════════════════════════════

Breakpoints:
  Mobile: 320px–767px    (primary target — design mobile first)
  Tablet: 768px–1199px   (iPad, tablet)
  Desktop: 1200px+       (secondary target)

Navigation:
  Mobile: Fixed bottom tab bar (5 tabs, 60px height)
  Tablet: Collapsible left sidebar (240px expanded, 64px collapsed)
  Desktop: Persistent left sidebar (260px) + top header bar

Grid:
  Mobile: 4 column grid, 16px gutter
  Tablet: 8 column grid, 24px gutter  
  Desktop: 12 column grid, 32px gutter

═══════════════════════════════════════════
PAGES TO BUILD — FULL SPECIFICATIONS
═══════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 1: DASHBOARD (Home)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout: Scrollable feed with sticky header

Header (sticky, 56px):
  Left: BharatAlpha logo (SVG wordmark)
  Center: Search bar (expandable, 280px wide on desktop)
           Placeholder: "Search stocks, MFs, indices..."
           On focus: dropdown with recent searches + trending stocks
  Right: Notification bell (badge count) + Avatar

Market Pulse Strip (horizontal scroll, 40px):
  Live chips showing: NIFTY 50 | SENSEX | BANK NIFTY | NIFTY IT
  Each chip: Index name + current value + change % (colored)
  Auto-scrolling on mobile, static on desktop
  Updates every second via WebSocket
  
Portfolio Snapshot Card (prominent, full width):
  Shows: "Your Portfolio Today"
  Large number: Total value (e.g., ₹1,24,580)
  Subtext: Day P&L with arrow (↑ ₹2,340 • +1.9% today)
  Mini sparkline chart (7-day portfolio performance)
  CTA button: "Add Money" (accent-blue)
  Background: gradient-card with subtle grid texture

AI Signal Cards (horizontal scroll on mobile, 2-col grid on desktop):
  Card 1: Top Buy Signal
    - Stock name + sector badge
    - "Strong Buy" tag in accent-green
    - Signal strength: 87% confidence
    - Key reason: "RSI oversold + earnings beat pattern"
    - Price target + stop loss
    
  Card 2: Top Sell/Avoid Signal
    - Same structure, accent-red theme
    
  Card 3: Today's Hidden Gem
    - accent-gold theme
    - Mid/small cap opportunity
    
  Card 4: SIP Opportunity
    - Mutual fund card

Market Regime Banner (full width, 48px):
  Dynamically shows current detected regime:
  BULL MARKET 🟢 | BEAR PHASE 🔴 | SIDEWAYS ⚪ | HIGH VOLATILITY 🟡
  Background color changes with regime
  Text: "Market Regime: Bull Run — Momentum strategies active"

Top Gainers / Losers Tabs (full width):
  Tab toggle: Gainers | Losers | Most Active | 52W High/Low
  List items (5 shown, "See All" link):
    - Rank number
    - Company logo placeholder (colored initial avatar)
    - Stock name + NSE symbol
    - Current price (mono font)
    - Change % (colored pill badge)
    - Mini sparkline (40px wide)

Sectoral Heatmap (full width card):
  Grid of sector tiles colored by performance
  Sectors: IT, Banking, Pharma, Auto, FMCG, Metal, Energy, Realty
  Color intensity = performance strength
  Click → drill into sector stocks

Recent News Feed (3 cards):
  Compact cards with:
  - Source logo + time ago
  - Headline (2 lines max)
  - Affected stock ticker badge
  - Sentiment tag: POSITIVE / NEGATIVE / NEUTRAL

Bottom CTA (mobile only, sticky):
  "Analyse My Portfolio" button — full width, accent-blue
  Floating above bottom tab bar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 2: STOCK EXPLORER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Header: "Explore 5,500+ Stocks"
Subtext: "NSE + BSE • Updated live"

Filter Bar (horizontal scroll on mobile):
  Pills: All | Large Cap | Mid Cap | Small Cap | 
         Nifty 50 | By Sector | F&O Stocks | High Dividend

Advanced Filter Panel (collapsible drawer):
  Sliders and inputs for:
  - P/E Ratio range
  - Market Cap range (₹ Cr)
  - 52W High/Low proximity %
  - ROE minimum %
  - Debt/Equity maximum
  - Promoter holding minimum %
  - FII activity (increasing/decreasing)
  
  Apply Filters CTA button

Sort Bar:
  Dropdown: Sort by Market Cap | P/E | Gain Today | Volume

Stock List (virtualized, loads 20 at a time):
  Each row:
    Col 1: Rank + Company initial avatar
    Col 2: Stock name (bold) + NSE symbol (muted)
            Sector badge (small pill)
    Col 3: Price (mono, large) + Change % (colored)
    Col 4: Market Cap (formatted: ₹2.4L Cr)
    Col 5: BharatAlpha Score (0-100 gauge, colored)
    Col 6: Signal pill: BUY / HOLD / SELL / WATCH
  
  On mobile: Show Col 1,2,3,6 only
  Row tap → Stock Detail page

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 3: STOCK DETAIL (Deep Dive)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sticky Header:
  Back arrow + Stock name + NSE symbol
  Live price (large, mono) + change % badge
  Watchlist star icon

Hero Section:
  Stock name (DM Serif Display, large)
  Sector + Industry breadcrumb
  Live price (hero size, 42px, mono font)
  Day range: ▬━●━━━▬ (range slider visual, non-interactive)
  52W range same style below
  Volume bar vs average volume

TradingView Chart Integration:
  Embedded TradingView Lightweight Chart
  Timeframe tabs: 1D | 1W | 1M | 3M | 6M | 1Y | 5Y
  Overlay toggles: MA | EMA | Bollinger | VWAP | RSI
  Support/Resistance lines auto-drawn (from backend)
  Price target marker (dashed line, accent-green)
  Stop loss marker (dashed line, accent-red)

AI Analysis Card (most prominent card):
  Title: "BharatAlpha Intelligence"
  Overall Signal: BUY (large, accent-green, with confidence %)
  
  Causal Chain (unique feature):
    Chain visualization:
    [Crude Oil ↓4%] → [Input Cost Drops] → 
    [Margin Expansion] → [EPS Upgrade] → [Price Target ↑]
  
  Three time horizon tabs:
    Short Term (< 1 month): Target + Stop Loss
    Medium Term (3–6 months): Target + Stop Loss  
    Long Term (1+ year): Target + Stop Loss
  
  Risk Meter: Low / Medium / High (visual gauge)
  Disclaimer (small, muted): "Not financial advice. 
    For educational purposes only."

Fundamentals Section (tabbed):
  Tab 1: Overview
    Key metrics in 2-col grid:
    P/E | P/B | EV/EBITDA | Market Cap
    ROE | ROCE | Debt/Equity | Current Ratio
    Each metric: value + vs sector average indicator
    
  Tab 2: Financials
    Revenue trend (bar chart, 8 quarters)
    Net Profit trend (line chart, 8 quarters)
    Margin % trend
    
  Tab 3: Shareholding
    Donut chart: Promoter % | FII % | DII % | Public %
    Quarter-on-quarter change arrows
    
  Tab 4: Peers
    Comparison table: 5 peer stocks
    Same key metrics side by side
    Current stock highlighted

F&O Section (if applicable):
  Option Chain snapshot (ATM ± 5 strikes)
  PCR ratio + interpretation
  Max Pain level (highlighted on chain)
  IV Percentile gauge

Invest Now Section (sticky bottom bar on mobile):
  Input: "I want to invest ₹_____"
  Calls portfolio allocation engine
  Shows: How many shares + at what price
  CTA: "Add to Watchlist" | "Get Full Plan"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 4: MY PORTFOLIO (Invest Planner)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Investment Input Hero:
  Large card, centered
  "How much do you want to invest?"
  Large ₹ input field (prominent, mono font)
  Radio selection: Short Term | Medium Term | Long Term | SIP
  Risk appetite: Conservative | Moderate | Aggressive
  "Build My Portfolio" CTA (full width, accent-blue, 52px)

Results Section (appears after CTA):
  
  Allocation Breakdown:
    Donut chart showing split:
    Direct Equity % | Mutual Funds % | Gold ETF % | Cash %
  
  Recommended Stocks (equity portion):
    3–5 stock cards showing:
    - Stock name + BUY signal
    - Suggested amount to invest (₹)
    - Suggested quantity at current price
    - Expected return range
    - Stop loss level
  
  Recommended MFs (SIP portion):
    3 fund cards:
    - Fund name + AMC logo placeholder
    - Category (Large Cap / Flexi / ELSS)
    - 3Y/5Y returns
    - Suggested SIP amount/month
    - Risk-o-meter (SEBI standard)
  
  Portfolio Risk Score:
    Gauge 0–100
    "Your portfolio risk: Moderate (52/100)"
  
  Disclaimer strip (small, full width):
    "BharatAlpha analysis is for educational purposes.
    Always consult a SEBI registered advisor before investing."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 5: SCREENER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Preset Strategy Cards (horizontal scroll):
  "Value Picks" | "Growth Stocks" | "Dividend Kings" |
  "Momentum Plays" | "Undervalued Giants" | "F&O Favorites"
  Each card: strategy name + # of stocks matching + last updated

Custom Screener Builder:
  Add Parameter button → dropdown of 50+ metrics
  Each parameter row: metric | operator (> < = between) | value
  Logic toggle: AND / OR between conditions
  
Results count: "47 stocks match your criteria"
Export to CSV button

Results table same as Stock Explorer list

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE 6: MUTUAL FUNDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Category tabs: All | Equity | Debt | Hybrid | ELSS | Index

SIP Calculator (top card):
  Monthly SIP amount input
  Duration slider (1–30 years)
  Expected return slider (8–18%)
  Live output:
    "You invest: ₹12,00,000"
    "You receive: ₹32,40,000"
    "Wealth gain: ₹20,40,000"
  Area chart showing growth curve

Fund List:
  Each card:
  - Fund name (bold) + AMC name (muted)
  - Category badge + Risk-o-meter
  - 1Y | 3Y | 5Y returns (colored by performance vs benchmark)
  - AUM + Expense Ratio
  - BharatAlpha Fund Score
  - "Start SIP" CTA button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MOBILE BOTTOM TAB BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5 tabs with icon + label:
  🏠 Home | 🔍 Explore | ⚡ Signals | 💼 Portfolio | 👤 Profile

Active tab: accent-blue underline + colored icon
Height: 60px + safe area inset
Background: bg-secondary with top border (1px, border color)
Center tab (Signals): Elevated pill button, accent-blue bg

═══════════════════════════════════════════
COMPONENT LIBRARY STANDARDS
═══════════════════════════════════════════

Price Display Component:
  Always use JetBrains Mono
  Positive = accent-green with ▲ prefix
  Negative = accent-red with ▼ prefix
  Neutral = text-primary
  Always show 2 decimal places for price
  Always show 2 decimal places + % for change

Signal Badge Component:
  BUY: bg accent-green/15, text accent-green, border accent-green/30
  SELL: bg accent-red/15, text accent-red, border accent-red/30
  HOLD: bg amber/15, text amber, border amber/30
  WATCH: bg blue/15, text accent-blue, border blue/30
  Border radius: radius-sm (6px)
  Font: DM Sans semibold, 11px uppercase

Card Component:
  Background: bg-secondary
  Border: 1px solid border color
  Border radius: radius-lg (16px)
  Padding: 16px mobile, 20px desktop
  Hover (desktop): bg-tertiary, border accent-blue/30
  Transition: 200ms ease

Loading States:
  Skeleton shimmer animation (not spinners)
  Shimmer direction: left to right
  Base color: bg-tertiary
  Highlight color: bg-secondary

Chart Colors:
  Bullish candle: accent-green fill, accent-green border
  Bearish candle: accent-red fill, accent-red border
  Volume bars: muted colors (60% opacity of candle color)
  Moving averages: 
    MA20: #F59E0B (gold)
    MA50: #3B82F6 (blue)
    MA200: #A78BFA (purple)

Empty States:
  Illustration (simple line art, muted colors)
  Heading: clear message
  Subtext: what to do next
  CTA button

Error States:
  Red border on affected component
  Error message below (text-sm, accent-red)
  Retry button where applicable

═══════════════════════════════════════════
PERFORMANCE REQUIREMENTS
═══════════════════════════════════════════

- All list views: virtualized rendering (only render visible rows)
- Images: lazy loaded with blur placeholder
- Charts: canvas-based (not SVG) for performance
- Prices: WebSocket updates only changed values (no full re-render)
- First contentful paint: < 1.5 seconds
- Largest contentful paint: < 2.5 seconds
- All animations: CSS transforms only (no layout-triggering properties)
- Debounce search input: 300ms
- Throttle real-time price updates: max 1 update/second per stock

═══════════════════════════════════════════
BACKEND INTEGRATION CONTRACTS
═══════════════════════════════════════════

All API responses follow this structure:
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "ISO8601",
    "cached": false,
    "latency_ms": 45
  }
}

WebSocket message format for live prices:
{
  "type": "price_update",
  "symbol": "RELIANCE",
  "ltp": 2847.50,
  "change": 34.20,
  "change_pct": 1.22,
  "volume": 2847392,
  "timestamp": 1703123456789
}

Stock detail API response must include:
- fundamentals object (P/E, P/B, ROE, ROCE, D/E, etc.)
- technicals object (RSI, MACD, BB position, trend)
- ai_signal object (signal, confidence, reasoning_chain[], targets)
- price_history array (OHLCV)
- shareholding object
- peers array

Portfolio allocation API:
  Input: { amount, horizon, risk_profile }
  Output: {
    equity_allocation: [{symbol, shares, amount, signal}],
    mf_allocation: [{fund_id, sip_amount, rationale}],
    expected_return_range: {min_pct, max_pct},
    risk_score: number
  }

═══════════════════════════════════════════
TRUST SIGNALS — IMPLEMENT ALL OF THESE
═══════════════════════════════════════════

These make users trust the platform is real:

1. Live data timestamp — always show "Last updated: 2 seconds ago"
2. Data source attribution — "Data: NSE • AMFI • BSE"
3. SEBI disclaimer — visible footer on every page
4. Real company names, real NSE symbols throughout
5. No fake reviews or testimonials
6. Performance claims always show methodology link
7. Confidence % on every AI signal (never 100%)
8. All recommendations show risk level explicitly
9. "Past performance not indicative of future results"
   on all return displays
10. Version number + last model update date visible

═══════════════════════════════════════════
ANIMATIONS — PRECISE SPECIFICATIONS
═══════════════════════════════════════════

Page transitions: fade + slide up (300ms, ease-out)
Card hover: scale(1.01) + shadow-elevated (200ms)
Price updates: 
  Positive flash: bg briefly flashes accent-green/20 (500ms)
  Negative flash: bg briefly flashes accent-red/20 (500ms)
Chart load: draw animation left to right (600ms)
Skeleton to content: fade in (300ms)
Bottom sheet: slide up from bottom (350ms, spring)
Modal: fade + scale from 0.95 to 1 (250ms)
Tab switch: content slides horizontally (250ms)
Number counters: count up animation on first load

═══════════════════════════════════════════
BUILD THIS IN REACT + TYPESCRIPT.
Use TailwindCSS for styling.
Use TradingView Lightweight Charts for all candlestick/line charts.
Use Recharts for all bar/area/donut charts.
Use Framer Motion for all animations.
Use React Query for all API data fetching and caching.
Use Zustand for global state (portfolio, watchlist, preferences).
Use React Virtual for all long lists.

Start by building the Dashboard page first, 
fully functional with mock data that matches 
the exact API contract specified above.
Then build each page in order.
═══════════════════════════════════════════