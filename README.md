# Car Finder — Personal Hybrid Car Search Dashboard

A personal dashboard for finding used hybrid cars (2021+, Japanese/Korean, <€30k, <70k km) on the Irish market. Lists scraped from CarsIreland, with trim feature data and reliability ratings.

**Personal use only** — not a commercial product.

## Live Dashboard
https://prashanthhrao.github.io/car-finder/

## Criteria
- **Year:** 2021+ only
- **Budget:** up to €30k
- **Mileage:** <70,000 km
- **Fuel:** HEV or PHEV (no MHEV)
- **Brands:** Toyota, Honda, Lexus, Hyundai, Kia, Mitsubishi, Mazda
- **Transmission:** e-CVT preferred, 6-speed HEV acceptable

## Top Picks
1. Hyundai Tucson Comfort Plus HEV 2023 — €27,750 — Cork
2. Kia Niro K3 HEV 2023 — €26,950 — Dublin
3. Toyota Corolla Cross Hybrid G 2022 — €29,950 — Dublin
4. Mitsubishi Outlander Black Edition PHEV 2021 — €27,950 — Dublin
5. Toyota Corolla Hybrid G 2024 — €24,950 — Dublin

## Files
- `index.html` — Full dashboard (Material Design, listings, trim features modal, NI import guide)
- `AGENTS.md` — AI agent context with search history and decisions

## Scrapers
Scrapers run from a local working directory with Playwright. CarsIreland is the primary source (requires blocking Didomi consent script). DoneDeal and AutoTrader are blocked by Cloudflare.

Dashboard data is updated by editing the TRIMS and LISTINGS arrays in `index.html` and pushing to the `main` branch.
