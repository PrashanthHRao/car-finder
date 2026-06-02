const { chromium } = require('playwright');
const fs = require('fs');

const BUDGET_MAX = parseInt(process.argv[2]) || 35000;
const MILEAGE_MAX = parseInt(process.argv[3]) || 100000;
const YEAR_MIN = parseInt(process.argv[4]) || 2017;

const MODELS = [
  { make: 'Honda', model: 'CR-V' },
  { make: 'Toyota', model: 'RAV4' },
  { make: 'Nissan', model: 'X-Trail' },
  { make: 'Kia', model: 'Sportage' },
  { make: 'Hyundai', model: 'Tucson' },
  { make: 'Mitsubishi', model: 'Outlander' },
  { make: 'Ford', model: 'Kuga' },
  { make: 'Volvo', model: 'XC40' },
  { make: 'Volvo', model: 'XC60' },
  { make: 'BMW', model: 'X1' },
  { make: 'BMW', model: 'X3' },
  { make: 'Volkswagen', model: 'Tiguan' },
  { make: 'Peugeot', model: '3008' },
  { make: 'Mercedes-Benz', model: 'GLA' },
  { make: 'Audi', model: 'Q3' },
  { make: 'Mazda', model: 'CX-5' },
  { make: 'Suzuki', model: 'Vitara' },
  { make: 'SEAT', model: 'Ateca' },
  { make: 'Skoda', model: 'Karoq' },
  { make: 'Renault', model: 'Kadjar' },
  { make: 'Opel', model: 'Grandland' },
  { make: 'Citroen', model: 'C5 Aircross' },
  { make: 'Lexus', model: 'NX' },
  { make: 'Lexus', model: 'UX' },
  { make: 'Mini', model: 'Countryman' },
];

const HYBRID_KEYWORDS = /hybrid|hev|phev|e:hev|e-power|e-pwer|t5 twin|t6 twin|e-tron|gte|3008 gt|mhev|full hybrid|plug.?in|self.?charging|electric \+ petrol|electric \/ petrol|1.6 t-gdi|2.0 hybrid|2.5 hybrid|1.8 hybrid/i;

function extractListings(page) {
  return page.evaluate(() => {
    const results = [];
    const links = Array.from(document.querySelectorAll('a'));
    const seen = new Set();
    links.forEach(link => {
      const href = link.href || '';
      let text = link.textContent?.trim().replace(/\s+/g, ' ') || '';
      if (text.length < 40) return;
      const key = text.substring(0, 50);
      if (seen.has(key)) return;
      seen.add(key);
      const priceM = text.match(/€\s*([\d,]+(?:\.\d{2})?)/);
      const kmM = text.match(/([\d,]+)\s*km/i);
      const yearM = text.match(/\b(20\d{2})\b/);
      if (priceM) {
        results.push({
          text: text.substring(0, 300),
          price: priceM[0],
          priceRaw: parseFloat(priceM[1].replace(/,/g, '')),
          km: kmM ? kmM[1] + ' km' : '',
          kmRaw: kmM ? parseFloat(kmM[1].replace(/,/g, '')) : 999999,
          year: yearM ? yearM[1] : '',
          link: href,
        });
      }
    });
    return results;
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    locale: 'en-IE',
  });
  await context.route('**/didomi**', route => route.abort());
  const page = await context.newPage();

  const allGood = [];

  for (const m of MODELS) {
    const url = `https://www.carsireland.ie/used-cars/${m.make.toLowerCase()}/${m.model.toLowerCase()}`;
    console.log(`\n[${m.make} ${m.model}]`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);

      // Click Apply button if present
      const applyBtn = await page.$('button:has-text("Apply"), button:has-text("Search"), button:has-text("Show")');
      if (applyBtn) {
        await applyBtn.click();
        await page.waitForTimeout(2000);
      }

      const listings = await extractListings(page);
      const good = listings.filter(l =>
        l.priceRaw >= 5000 && l.priceRaw <= BUDGET_MAX
        && l.kmRaw <= MILEAGE_MAX
        && (!l.year || parseInt(l.year) >= YEAR_MIN || l.year === '')
      );

      if (good.length > 0) {
        console.log(`  Found ${good.length} in budget/km/year range`);
        // Check which ones have hybrid keywords in text
        const hybrids = good.filter(l => HYBRID_KEYWORDS.test(l.text));
        if (hybrids.length > 0) console.log(`  ⚡ ${hybrids.length} are hybrids`);
        allGood.push(...good.map(g => ({ ...g, searchTerm: `${m.make} ${m.model}` })));
      } else {
        console.log(`  No matches`);
      }
    } catch (e) {
      console.log(`  Error: ${e.message.substring(0, 60)}`);
    }
  }

  await browser.close();

  // Deduplicate and sort
  const seen = new Set();
  const unique = allGood.filter(r => {
    const k = r.text.substring(0, 25) + r.priceRaw;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  unique.sort((a, b) => a.priceRaw - b.priceRaw);

  // Separate hybrids from non-hybrids
  const hybrids = unique.filter(l => HYBRID_KEYWORDS.test(l.text));
  const others = unique.filter(l => !HYBRID_KEYWORDS.test(l.text));

  console.log(`\n\n${'='.repeat(70)}`);
  console.log(`  EXPANDED SEARCH RESULTS`);
  console.log(`  Budget: €0–€${BUDGET_MAX} | <${MILEAGE_MAX}km | ${YEAR_MIN}+`);
  console.log(`  Models: ${MODELS.length}`);
  console.log(`  Total matches: ${unique.length}`);
  console.log(`  Hybrids: ${hybrids.length} | Non-hybrids: ${others.length}`);
  console.log(`${'='.repeat(70)}`);

  if (hybrids.length > 0) {
    console.log(`\n${'='.repeat(70)}`);
    console.log('  ⚡ HYBRIDS / PHEVs');
    console.log(`${'='.repeat(70)}`);
    hybrids.forEach((c, i) => {
      const p = c.price.padEnd(12);
      const k = (c.km || '').padEnd(12);
      const y = (c.year || '??').padEnd(5);
      const s = c.searchTerm.padEnd(20);
      const loc = (c.text.match(/Dublin|Cork|Galway|Meath|Kildare|Louth|Donegal|Wexford|Clare|Limerick|Kilkenny|Waterford|Mayo|Wicklow/i)?.[0] || 'N/A').padEnd(10);
      const fuel = HYBRID_KEYWORDS.test(c.text) ? 'HYBRID' : '';
      const modelInfo = c.text.substring(0, 60);
      console.log(`  ${(i+1).toString().padStart(2)}. ${p} ${k} ${y} ${s} ${loc} ${modelInfo}`);
      if (c.link && !c.link.startsWith('javascript')) console.log(`      ${c.link}`);
    });
  }

  if (others.length > 0) {
    console.log(`\n${'='.repeat(70)}`);
    console.log('  OTHERS (petrol/diesel/unknown)');
    console.log(`${'='.repeat(70)}`);
    others.forEach((c, i) => {
      const p = c.price.padEnd(12);
      const k = (c.km || '').padEnd(12);
      const y = (c.year || '??').padEnd(5);
      const s = c.searchTerm.padEnd(20);
      const loc = (c.text.match(/Dublin|Cork|Galway|Meath|Kildare|Louth|Donegal|Wexford|Clare|Limerick|Kilkenny|Waterford|Mayo|Wicklow/i)?.[0] || 'N/A').padEnd(10);
      const modelInfo = c.text.substring(0, 60);
      console.log(`  ${(i+1).toString().padStart(2)}. ${p} ${k} ${y} ${s} ${loc} ${modelInfo}`);
      if (c.link && !c.link.startsWith('javascript')) console.log(`      ${c.link}`);
    });
  }

  // Save all
  fs.writeFileSync('expanded_results.json', JSON.stringify(unique, null, 2));
  fs.writeFileSync('expanded_hybrids.json', JSON.stringify(hybrids, null, 2));
  fs.writeFileSync('expanded_others.json', JSON.stringify(others, null, 2));

  console.log(`\nSaved ${unique.length} total, ${hybrids.length} hybrids, ${others.length} others.`);
})();
