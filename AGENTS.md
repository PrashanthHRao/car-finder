# Car Finder — Agent Context

## Project Goal
Find the best used **Hybrid SUV** in Ireland (Dublin) within a **€25k–€28k budget** (2021+ models) that prioritizes reliability, smooth automatic shifting, excellent fuel economy, and family usability (two infant car seats).

## Constraints & Preferences
- **Budget:** €25k–€28k max.
- **Type:** Hybrid, Automatic, SUV.
- **Year:** 2021 or newer.
- **Key Features:** Wireless CarPlay, heated steering wheel, heated seats, low mileage (`<70k km`), smooth gear shifts.
- **Family Needs:** Must comfortably fit two infant car seats side-by-side.
- **Location:** Dublin area; open to imports via local dealers.
- **Running Costs:** Low repair/service costs critical.

## Candidates (priority order)
| Priority | Make | Model | Transmission | Notes |
|----------|------|-------|-------------|-------|
| 1 | **Honda** | **CR-V Hybrid** | e-CVT | Smoothest, best rear seat width, reliable, but over budget usually |
| 2 | **Toyota** | **RAV4 Hybrid** | e-CVT | Excellent MPG, reliable, but center console may impede driver legroom |
| 3 | **Nissan** | **X-Trail e-Power** | e-Power (EV drive) | Great space but lower MPG, less proven long-term |
| 4 | **Kia** | **Sportage Hybrid** | 6-speed auto | Good value but transmission less smooth; PHEV variants common |
| 5 | **Hyundai** | **Tucson Hybrid** | 6-speed auto | Similar to Sportage; HEV variant is smoother than standard 6-speed |

## Transmission Decisions
- **Preferred:** e-CVT (Toyota/Honda) and e-Power (Nissan) — infinitely smooth, no gear shifts.
- **Acceptable:** Hyundai/Kia 6-speed auto in HEV — electric motor fills torque gaps, smoother than standard.
- **Eliminated:** DSG/DCT (VW/Skoda) — low-speed jerkiness; 6-speed auto in MHEV — not smooth enough.

## Scraping Status

### carzone.ie ✅ Working
Direct URL navigation works (`/used-cars/{make}/{model}?fuel-type=HYBRID&transmission=AUTOMATIC&price=0-{max}&mileage=0-{max}`). Filters apply via URL params.

### carsireland.ie ✅ Working (requires Didomi block)
- Block Didomi consent script: `context.route('**/didomi**', route => route.abort())`
- URL format: `https://www.carsireland.ie/used-cars/{make}/{model}?maxprice={max}&maxmileage={max}&yearmin={min}`
- URL params pre-populate filter UI but don't auto-submit — need to post-filter results in JS
- API endpoint discovered: `https://privateapi.carsireland.ie` and `rest/1.0/ci/filters`

### donedeal.ie ❌ Cloudflare blocked
Donedeal uses Cloudflare managed challenge. Cannot bypass via Playwright. User must open link manually.

### autotrader.ie ❌ Network blocked
`ERR_CONNECTION_REFUSED` — IP/network level block.

## Carzone Results (within €28k, <70k km, 2021+)
| Model | Match? | Details |
|-------|--------|---------|
| Honda CR-V Hybrid | ❌ | Cheapest: €25,995 with 114k km (over mileage) |
| Toyota RAV4 Hybrid | ❌ | Cheapest: €29,950 with 83k km (over budget) |
| Nissan X-Trail Hybrid | ❌ | Cheapest: €28,950 with 89k km |
| Kia Sportage Hybrid | ❌ | Cheapest: €23,450 with 74k km (MHEV, not full hybrid) |
| Hyundai Tucson Hybrid | ❌ | Cheapest: €33,950 |

## CarsIreland Results (within €28k, <70k km, 2021+)
| Model | Match? | Details |
|-------|--------|---------|
| Honda CR-V Hybrid | ❌ | None in range |
| Toyota RAV4 Hybrid | ❌ | None in range |
| Nissan X-Trail Hybrid | ❌ | None in range |
| Kia Sportage Hybrid | ❌ | 2019 K3 at €19,950 (too old) |
| Hyundai Tucson HEV | ✅ **€27,750** — 41k km — 2023 — Cork | Only solid match across all sites |

## How to Run
```powershell
npm install
npx playwright install chromium
npm run scrape:carsireland    # Scrapes CarsIreland only
npm run scrape:carzone        # Would need scrape_carzone.js (not yet written for this repo)
npm run scrape:all            # Runs all scrapers
```

## Current Best Lead
**Hyundai Tucson Comfort Plus HEV** — €27,750 — 41,000 km — 2023 (231 reg) — Cork
- Full hybrid (self-charging), 1.6 T-GDI + 44kW electric motor
- 6-speed auto with hybrid-specific tuning (smoother than standard 6-speed)
- Link: https://www.carsireland.ie/used-cars/hyundai/tucson

## Next Steps for Agent
1. Re-run scrapers to check for new listings (markets change daily)
2. If DoneDeal link yields results, parse and compare
3. Consider relaxing budget to €30k or mileage to 80k km for more options
4. Search UK import dealers (Webgotocar, Continental Cars) for CR-V Hybrids
