# BharatAlpha

BharatAlpha is a premium quantitative market analysis and portfolio advisory platform for the Indian equity market. It features real-time stock screeners, comprehensive thematic investment resources (ETFs, Government Bonds, Mutual Funds), and an engine tailored to generate personalized multi-asset portfolio recommendations.

## Repository Structure

- `src/` — The frontend application built with React, Vite, Tailwind CSS, and Lucide Icons.
- `bharatalpha-backend/` — The backend Python service built with FastAPI and Redis, handling concurrent real-time live data streaming from upstream broker APIs (like IIFL TTBlaze).

## Key Features

- **Live Market Dashboard**: Real-time NIFTY/SENSEX indices tracking and live top movers pipeline.
- **Stock Explorer & Screener**: Filter, search, and analyze market momentum with live price feeds and proprietary quantitative signal scores.
- **Investment Advisor Wizard**: Complete evaluating your financial position (investment size, horizon, risk parameters) to receive a dynamic generated portfolio breakdown covering Stocks, Bonds, ETFs, FDs, and precious metals.
- **Educational Portals**: Detailed interactive pages shedding light on ITR Filing, Mutual Funds, Government Bonds, and ETFs.
- **Dynamic Theming**: Full React context-driven support for Premium Deep Navy (Dark), Crisp Slate (Light), and OS-matched System themes.

## Getting Started

### 1. Frontend Setup
```bash
# Run from the root directory
npm install
npm run dev
```

### 2. Backend Setup
```bash
# Navigate to the backend
cd bharatalpha-backend

# Initialize and activate your virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # (Windows)
# source .venv/bin/activate   # (Mac/Linux)

# Install dependencies
pip install -r requirements.runtime.txt

# Create your local environment file
cp .env.example .env

# Optional: Spin up Redis if caching/fallback flows are enabled
docker compose up -d

# Start the local FastAPI server
uvicorn app.main:app --reload --port 8000
```

## Data Architecture

The real-time price streaming capability employs a defensive "first success wins" concurrent pattern. It races rapid HTTP/Websocket requests to the primary upstream integration (IIFL Securities) alongside NSE web scrapers. The fastest provider response collapses the remaining fetch requests and relays the tick data back to the frontend to ensure zero latency hangs in the user interface.