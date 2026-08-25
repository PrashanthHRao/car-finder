# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## Project overview

A personal dashboard for finding a used hybrid car (SUV/sedan) in Ireland: 2021+, <70k km, up to €30k, Japanese/Korean brands preferred. Not a commercial product — see `AGENTS.md` for the full search criteria, current top picks, and decision history.

## Architecture

- **`index.html`** — the entire dashboard (Material Design, light theme, mobile-first). Listings and trim data are inline JS arrays (`TRIMS`, `LISTINGS`) in the same file — there is no backend or build step.
- **`scrape_*.js`** — standalone Playwright scripts that scrape listing sites and are run manually/locally; their output is hand-copied into the `LISTINGS`/`TRIMS` arrays in `index.html`. They are not part of the deployed site.
  - `scrape_carsireland.js` / `scrape_carsireland_v2.js` — CarsIreland (primary working source; must block the Didomi consent script)
  - `scrape_expanded.js`, `scrape_relaxed.js`, `scrape_all.js` — broader/looser variants of the same scrape
  - `debug_carsireland.js`, `find_api.js` — throwaway debugging helpers
  - DoneDeal (Cloudflare) and AutoTrader (IP block) are not scrapable; see `AGENTS.md`.

## Commands

```bash
npm run scrape:carsireland   # node scrape_carsireland.js
npm run scrape:all           # node scrape_all.js
node scrape_expanded.js 30000 70000 2021   # min, max price, min year
```

There is no test suite, linter, or build step — `index.html` is served as-is.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`, which publishes the repo root to GitHub Pages via `actions/deploy-pages`. The workflow only fires on changes to `index.html`. Live at https://prashanthhrao.github.io/car-finder/.

## Updating the dashboard

Edit the `TRIMS` and `LISTINGS` arrays directly inside `index.html`, then push to `main`. When updating the car search itself (criteria, picks, brand list), keep `AGENTS.md` and `README.md` in sync with `index.html`.
