const { chromium } = require('playwright');
const fs = require('fs');

const BUDGET_MAX = 28000;
const MILEAGE_MAX = 70000;
const YEAR_MIN = 2021;

const TARGETS = [
  { make: 'Honda', model: 'CR-V', maxPrice: BUDGET_MAX, maxKm: MILEAGE_MAX, yearMin: YEAR_MIN },
  { make: 'Toyota', model: 'RAV4', maxPrice: BUDGET_MAX, maxKm: MILEAGE_MAX, yearMin: YEAR_MIN },
  { make: 'Nissan', model: 'X-Trail', maxPrice: BUDGET_MAX, maxKm: MILEAGE_MAX, yearMin: YEAR_MIN },
  { make: 'Kia', model: 'Sportage', maxPrice: BUDGET_MAX, maxKm: MILEAGE_MAX, yearMin: YEAR_MIN },
  { make: 'Hyundai', model: 'Tucson', maxPrice: BUDGET_MAX, maxKm: MILEAGE_MAX, yearMin: YEAR_MIN },
];

async function extractListings(page) {
  return await page.evaluate(() => {
    const results = [];
    const links = Array.from(document.querySelectorAll('a'));
    const seen = new Set();
    
    links.forEach(link => {
      const href = link.href || '';
      const text = link.textContent?.trim().replace(/\s+/g, ' ') || '';
      if (text.length < 40) return;
      const key = text.substring(0, 50);
      if (seen.has(key)) return;
      seen.add(key);

      const priceM = text.match(/€\s*([\d,]+(?:\.\d{2})?)/);
      const kmM = text.match(/([\d,]+)\s*km/i);
      const yearM = text.match(/\b(20\d{2})\b/);
      
      const isCar = /honda|toyota|nissan|kia|hyundai|cr-v|rav4|sportage|tucson|xtrail|cru|crossover|suv|hybrid|hev|phev/i.test(text);
      if (priceM && isCar) {
        results.push({
          text: text.substring(0, 300),
          price: priceM[0],
          priceRaw: parseFloat(priceM[1].replace(/,/g, '')),
          km: kmM ? kmM[1] + ' km' : '',
          kmRaw: kmM ? parseInt(kmM[1].replace(/,/g, '')) : 999999,
          year: yearM ? yearM[1] : '',
          link: href
        });
      }
    });
    return results;
  });
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0',
    locale: 'en-IE', viewport: { width: 1920, height: 1080 },
  });

  // Block Didomi consent wall
  await context.route('**/didomi**', route => route.abort());
  await context.route('**/wrapper***', route => route.abort());

  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  await page.goto('https://www.carsireland.ie/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const allGood = [];

  for (const target of TARGETS) {
    console.log(`\n=== ${target.make} ${target.model} ===`);
    const url = `https://www.carsireland.ie/used-cars/${target.make.toLowerCase()}/${target.model.toLowerCase().replace(' ', '-')}`;
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Try clicking any "Apply" or "Search" button to submit filters
    const applyBtn = page.locator('button:has-text("Apply"), button:has-text("Search"), button:has-text("Update"), button:has-text("Filter"), input[value="Apply"], input[value="Search"]').first();
    if (await applyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(3000);
      console.log('Clicked Apply/Search button');
    }

    let listings = await extractListings(page);

    // Post-filter: budget, mileage, year
    const good = listings.filter(l => {
      return l.priceRaw >= 5000 && l.priceRaw <= BUDGET_MAX
        && l.kmRaw <= MILEAGE_MAX
        && (!l.year || parseInt(l.year) >= YEAR_MIN || l.year === '');
    }).sort((a, b) => a.priceRaw - b.priceRaw);

    if (good.length > 0) {
      console.log(`Good matches (${good.length}):`);
      good.slice(0, 10).forEach((c, i) => {
        const p = c.price.padEnd(12);
        const k = (c.km || '').padEnd(12);
        const y = (c.year || '??').padEnd(5);
        const t = c.text.substring(0, 60);
        console.log(`  ${i+1}. ${p} ${k} ${y} ${t}`);
      });
      allGood.push(...good.map(g => ({ ...g, searchTerm: `${target.make} ${target.model}` })));
    } else {
      // Show what we got
      const all = listings.filter(l => l.priceRaw >= 5000 && l.priceRaw <= BUDGET_MAX * 1.1);
      console.log(`No perfect matches. ${all.length} near-budget listings found:`);
      all.slice(0, 5).forEach(c => {
        const p = c.price.padEnd(12);
        const k = (c.km || '').padEnd(12);
        const y = (c.year || '??').padEnd(5);
        console.log(`  ${p} ${k} ${y} ${c.text.substring(0, 70)}`);
      });
    }
  }

  await browser.close();

  // COMPILED RESULTS
  console.log(`\n\n${'='.repeat(70)}`);
  console.log('  BEST MATCHES — ALL SITES');
  console.log(`  Budget: €0–€${BUDGET_MAX} | <${MILEAGE_MAX}km | ${YEAR_MIN}+`);
  console.log(`${'='.repeat(70)}`);

  const seen = new Set();
  const unique = allGood.filter(r => {
    const k = r.text.substring(0, 30);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  unique.sort((a, b) => a.priceRaw - b.priceRaw);

  if (unique.length > 0) {
    unique.forEach((c, i) => {
      const p = c.price.padEnd(12);
      const k = (c.km || '').padEnd(12);
      const y = (c.year || '??').padEnd(5);
      const s = c.searchTerm.padEnd(20);
      const loc = (c.text.match(/Dublin|Cork|Galway|Meath|Kildare|Louth|Donegal|Wexford|Clare/i)?.[0] || 'N/A').padEnd(10);
      const t = c.text.substring(0, 40);
      console.log(`  ${i+1}. ${p} ${k} ${y} ${s} ${loc} ${t}`);
      if (!c.link.startsWith('javascript')) console.log(`      ${c.link}`);
    });
    fs.writeFileSync('carsireland_results.json', JSON.stringify(unique, null, 2));
    console.log(`\nSaved ${unique.length} results.`);
  } else {
    console.log('NO MATCHES found in budget/km/year range.');
  }
})();
