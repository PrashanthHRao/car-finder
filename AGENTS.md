# Car Finder — Agent Context

## Project Goal
Personal project: Find the best used **Hybrid** (SUV/Sedan) in Ireland within **€30k max** (sweet spot €26k), **2021+ model**, **<70k km**, prioritizing Japanese/Korean brands for low repair costs and reliability. Family use (two infant car seats).

## Selection Criteria
- **Budget:** €26k sweet spot, €30k hard max.
- **Type:** HEV or PHEV only (no MHEV, no petrol/diesel).
- **Year:** 2021+ strictly (newer the better).
- **Mileage:** <70,000 km.
- **Brands:** Toyota, Honda, Lexus, Hyundai, Kia, Mitsubishi, Mazda.
- **Excluded:** Suzuki, European premium (BMW, Audi, Mercedes, Volvo, VW, Mini), Ford, MG, Nissan, Renault, Peugeot.
- **Transmission:** e-CVT (Toyota/Honda/Lexus) >> 6-speed HEV (Hyundai/Kia) >> single-speed (Outlander PHEV).
- **Dealer:** Must offer nationwide service + 1-year warranty.
- **Location:** Anywhere in Ireland (most dealers offer delivery).

## Top 5 Picks (current market)

| # | Car | Price | Year | km | Location | Why |
|---|-----|-------|------|----|----------|-----|
| 1 | **Hyundai Tucson Comfort Plus HEV** | €27,750 | 2023 | 41k | Cork | Best family SUV, free delivery, 7yr warranty, wireless CarPlay |
| 2 | **Kia Niro K3 HEV** | €26,950 | 2023 | 51k | Dublin | Heated steering wheel, heated seats, 7yr warranty |
| 3 | **Toyota Corolla Cross Hybrid G** | €29,950 | 2022 | 35k | Dublin | New SUV model, e-CVT, Toyota reliability |
| 4 | **Mitsubishi Outlander Black Edition PHEV** | €27,950 | 2021 | 45k | Dublin | 7 seats, 4WD, PHEV, heated steering wheel |
| 5 | **Toyota Corolla Hybrid G** | €24,950 | 2024 | 22k | Dublin | Best value, nearly new, e-CVT |

## Dashboard
- **URL:** https://prashanthhrao.github.io/car-finder/
- **Deploy:** Push to `main` → GitHub Actions deploys via Pages.
- **Data:** Inline in `index.html` (TRIMS + LISTINGS arrays).

## Scraping
- **Working:** CarsIreland (block Didomi consent script), Carzone (limited results).
- **Blocked:** DoneDeal (Cloudflare), AutoTrader (IP block).
- **Run from:** `node scrape_expanded.js 30000 70000 2021`.

## NI Imports
- Windsor Framework: NI-registered hybrids = 0% customs duty + 0% import VAT. Pay only VRT in ROI.
- Use `usedcarsni.com` to search. Must verify NI ownership history before purchase.
