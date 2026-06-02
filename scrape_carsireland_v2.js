const { chromium } = require('playwright');
const fs = require('fs');

const BUDGET_MAX = 28000;
const MILEAGE_MAX = 70000;
const YEAR_MIN = 2021;

const TARGETS = [
  { make: 'Honda', model: 'CR-V' },
  { make: 'Toyota', model: 'RAV4' },
  { make: 'Nissan', model: 'X-Trail' },
  { make: 'Kia', model: 'Sportage' },
  { make: 'Hyundai', model: 'Tucson' },
];

async function extractFromPage(page, make, model) {
  // Try extracting embedded JSON data
  const embeddedData = await page.evaluate(() => {
    // Look for script tags with JSON data
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const text = script.textContent || '';
      // Look for __NEXT_DATA__ or similar
      if (text.includes('__NEXT_DATA__') || text.includes('__NUXT__') || text.includes('window.__')) {
        return text.substring(0, 5000);
      }
    }
    return null;
  });
  
  if (embeddedData) {
    console.log(`Found embedded data (${embeddedData.length} chars)`);
    console.log(embeddedData.substring(0, 1000));
    return null;
  }

  // Fallback: extract from rendered HTML
  const html = await page.content();
  
  // Look for JSON-like structures in HTML
  const jsonMatches = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/);
  if (jsonMatches) {
    console.log('Found initial state JSON');
    return jsonMatches[1].substring(0, 2000);
  }
  
  // Check for data in attributes
  const stateFromAttrs = await page.evaluate(() => {
    const root = document.getElementById('__NEXT_DATA__') || document.getElementById('__NUXT_DATA__');
    return root?.textContent?.substring(0, 2000) || null;
  });
  if (stateFromAttrs) {
    console.log('Found Next/Nuxt data');
    return stateFromAttrs;
  }

  return null;
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0',
    locale: 'en-IE', viewport: { width: 1920, height: 1080 },
  });
  await context.route('**/didomi**', route => route.abort());
  
  const page = await context.newPage();
  
  for (const target of TARGETS) {
    console.log(`\n=== ${target.make} ${target.model} ===`);
    const url = `https://www.carsireland.ie/used-cars/${target.make.toLowerCase()}/${target.model.toLowerCase().replace(' ', '-')}?maxprice=${BUDGET_MAX}&maxmileage=${MILEAGE_MAX}&yearmin=${YEAR_MIN}`;
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Extract listings from the rendered DOM
    const listings = await page.evaluate(({budget, kmMax, yearMin}) => {
      const results = [];
      const text = document.body?.textContent || '';
      
      // Pattern 1: Match car listing blocks - they follow a pattern
      // The cards have specific structure on CarsIreland
      // Look for: "favorite_border" is in every card footer
      const blocks = document.querySelectorAll('[class*="result"], [class*="listing"], [class*="card"], article, li');
      
      console.log('Blocks found:', blocks.length);
      
      blocks.forEach(block => {
        const bt = block.textContent?.trim().replace(/\s+/g, ' ') || '';
        if (!bt || bt.length < 50) return;
        
        const priceM = bt.match(/€\s*([\d,]+(?:\.\d{2})?)/);
        const kmM = bt.match(/([\d,]+)\s*km/i);
        const yearM = bt.match(/\b(20\d{2})\b/);
        const link = block.querySelector('a[href^="https"]')?.href || '';
        
        if (priceM && (/honda|toyota|nissan|kia|hyundai|cr-v|rav4|sportage|tucson|xtrail/i.test(bt))) {
          const priceRaw = parseFloat(priceM[1].replace(/,/g, ''));
          const kmRaw = kmM ? parseInt(kmM[1].replace(/,/g, '')) : 999999;
          const year = yearM ? yearM[1] : '0';
          
          results.push({
            price: priceM[0],
            priceRaw,
            km: kmM ? kmM[1] + ' km' : '',
            kmRaw,
            year,
            link,
            text: bt.substring(0, 300),
          });
        }
      });
      
      // If card approach failed, try regex on the full text
      if (results.length < 2) {
        // Split by price patterns
        const lines = text.split('\n').filter(l => l.trim());
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i] + ' ' + (lines[i+1] || '') + ' ' + (lines[i+2] || '');
          const priceM = line.match(/€\s*([\d,]+(?:\.\d{2})?)/);
          const kmM = line.match(/([\d,]+)\s*km/i);
          const yearM = line.match(/\b(20\d{2})\b/);
          if (priceM && /honda|toyota|nissan|kia|hyundai|cr-v|rav4|sportage|tucson|xtrail/i.test(line)) {
            const priceRaw = parseFloat(priceM[1].replace(/,/g, ''));
            if (priceRaw >= 3000 && priceRaw <= 100000 && !results.find(r => Math.abs(r.priceRaw - priceRaw) < 100 && r.km === (kmM?.[1] + ' km' || ''))) {
              results.push({
                price: priceM[0],
                priceRaw,
                km: kmM ? kmM[1] + ' km' : '',
                kmRaw: kmM ? parseInt(kmM[1].replace(/,/g, '')) : 999999,
                year: yearM ? yearM[1] : '0',
                text: line.trim().substring(0, 300),
              });
            }
          }
        }
      }
      
      return results;
    }, { budget: BUDGET_MAX, kmMax: MILEAGE_MAX, yearMin: YEAR_MIN });

    if (listings.length > 0) {
      const good = listings.filter(l => l.priceRaw >= 5000 && l.priceRaw <= BUDGET_MAX && l.kmRaw <= MILEAGE_MAX && (parseInt(l.year) >= YEAR_MIN || l.year === '0'));
      good.sort((a, b) => a.priceRaw - b.priceRaw);
      
      console.log(`Total: ${listings.length}, Within budget: ${good.length}`);
      good.slice(0, 10).forEach((c, i) => {
        console.log(`  ${i+1}. ${c.price.padEnd(12)} ${(c.km||'').padEnd(12)} ${c.year.padEnd(5)} ${c.text.substring(0, 60)}`);
        if (c.link) console.log(`      ${c.link}`);
      });
      
      if (good.length > 0) {
        fs.appendFileSync('carsireland_matches.json', JSON.stringify(good.map(g => ({ ...g, searchTerm: `${target.make} ${target.model}` })), null, 2) + '\n');
      }
    } else {
      console.log('No listings found.');
      const text = await page.textContent('body');
      console.log(text.substring(0, 1500).replace(/\n\s*\n/g, '\n'));
    }
  }

  await browser.close();
  console.log('\nDone');
})();
