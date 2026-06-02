# 🚗 Irish Hybrid SUV Finder

Automated scraper that searches Irish car classifieds (Carzone, CarsIreland, DoneDeal) for used hybrid SUVs within budget.

## Target Vehicles

| Model | Type | Transmission | Priority |
|-------|------|-------------|----------|
| Honda CR-V Hybrid | Full Hybrid (e:HEV) | e-CVT (smooth) | ⭐ #1 |
| Toyota RAV4 Hybrid | Full Hybrid | e-CVT (smooth) | ⭐ #2 |
| Nissan X-Trail e-Power | Series Hybrid | EV drive (smooth) | #3 |
| Kia Sportage Hybrid | Full/Mild Hybrid | 6-speed auto | #4 |
| Hyundai Tucson HEV | Full Hybrid | 6-speed auto (hybrid-tuned) | #5 |

## Search Criteria
- **Budget:** €0–€28,000
- **Mileage:** Under 70,000 km
- **Year:** 2021 or newer
- **Fuel:** Hybrid / Petrol Hybrid
- **Transmission:** Automatic

## Setup

```powershell
npm install
npx playwright install chromium
```

## Usage

```powershell
# Scrape CarsIreland.ie (works ✅)
node scrape_carsireland.js

# Scrape all sites
node scrape_all.js

# Find the CarsIreland API endpoints
node find_api.js
```

## Site Status

| Site | Status | Issue |
|------|--------|-------|
| **Carzone.ie** | ✅ Works | URL-based filtering |
| **CarsIreland.ie** | ✅ Works | Must block Didomi consent wall |
| **DoneDeal.ie** | ❌ Blocked | Cloudflare managed challenge |
| **AutoTrader.ie** | ❌ Blocked | Network-level block |

## Known Working URLs (open in browser)

**DoneDeal** (Cloudflare, open manually):
```
https://www.donedeal.ie/cars/SUV-4x4-and-Pick-up/?mileageTo=70000&fuel=Hybrid&priceFrom=20000&priceTo=28000&registeredAfter=2021&sort=Price%20-%20low%20to%20high
```

## Results Summary (June 2026)

| Model | Found? | Best Match |
|-------|--------|-----------|
| Honda CR-V Hybrid | ❌ | None within budget/km/year |
| Toyota RAV4 Hybrid | ❌ | None within budget/km/year |
| Nissan X-Trail e-Power | ❌ | None within budget |
| Kia Sportage Hybrid | ❌ | 2019 K3 €19,950 (too old) |
| **Hyundai Tucson HEV** | **✅** | **€27,750 · 41k km · 2023 · Cork** |

## Project Structure
```
car-finder/
├── AGENT.md              # Agent task context (for AI agents)
├── AGENTS.md             # Detailed search history & decisions
├── README.md             # This file
├── index.html            # GitHub Pages output
├── package.json
├── scrape_carsireland.js # CarsIreland scraper
├── scrape_carsireland_v2.js # Improved version with post-filtering
├── scrape_all.js         # Multi-target scraper
├── find_api.js           # API discovery tool
└── .gitignore
```
