const { chromium } = require('playwright');
const fs = require('fs');

const BUDGET_MAX = 28000;
const MILEAGE_MAX = 70000;
const YEAR_MIN = 2021;

const TARGETS = [
  'Honda CR-V',
  'Toyota RAV4',
  'Nissan X-Trail',
  'Kia Sportage',
  'Hyundai Tucson',
];

async function scrapeCarsIreland(page, make, model) {
  console.log(`\n--- CarsIreland: ${make} ${model} ---`);
  // Construct search URL - use carsireland's search format
  const url = `https://www.carsireland.ie/used-cars/${make.toLowerCase()}/${model.toLowerCase().replace(' ', '-')}?maxprice=${BUDGET_MAX}&maxmileage=${MILEAGE_MAX}&year=${YEAR_MIN}-2026`;
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);
    
    const body = await page.textContent('body').catch(() => '');
    const title = await page.title().catch(() => '');
    console.log(`URL: ${page.url()}`);
    console.log(`Results text: ${body.substring(0, 200).replace(/\n\s*\n/g, '\n')}`);

    // Extract car listings from the page
    // The site shows cards with prices in format "€XX,XXX"
    const cars = await page.evaluate(() => {
      const results = [];
      const text = document.body?.textContent || '';
      
      // Find all car card blocks - they typically have a price and year
      const cards = document.querySelectorAll('[class*="card"], [class*="listing"], [class*="item"], [class*="result"], article, li');
      
      cards.forEach(card => {
        const html = card.innerHTML || '';
        const cardText = card.textContent?.trim().replace(/\s+/g, ' ') || '';
        if (!cardText) return;
        
        const priceMatch = cardText.match(/€\s*([\d,]+(?:\.\d{2})?)/);
        const yearMatch = cardText.match(/\b(202[1-6])\b/);
        const kmMatch = cardText.match(/([\d,]+)\s*km/i);
        const link = card.querySelector('a')?.href || '';
        
        // Check if it's actually a car listing (has car brand/model)
        const isCar = /honda|toyota|nissan|kia|hyundai|cr-v|rav4|sportage|tucson|xtrail|cru|crossover|suv|hybrid|hev/i.test(cardText);
        
        if (priceMatch && isCar && cardText.length > 30) {
          results.push({
            text: cardText.substring(0, 250),
            price: priceMatch[0],
            priceRaw: parseFloat(priceMatch[1].replace(/,/g, '')),
            year: yearMatch ? yearMatch[1] : '',
            km: kmMatch ? kmMatch[1] + ' km' : '',
            kmRaw: kmMatch ? parseInt(kmMatch[1].replace(/,/g, '')) : 0,
            link: link,
          });
        }
      });
      return results;
    });

    // Also try a broader extraction from the full page text
    const allResults = await page.evaluate(() => {
      const results = [];
      const textBlocks = document.body?.innerText?.split('\n') || [];
      let current = '';
      for (const line of textBlocks) {
        current += line + ' ';
        if (line.match(/€\s*[\d,]+/) && current.length > 50) {
          const priceMatch = current.match(/€\s*([\d,]+(?:\.\d{2})?)/);
          const yearMatch = current.match(/\b(202[1-6])\b/);
          const kmMatch = current.match(/([\d,]+)\s*km/i);
          if (priceMatch) {
            results.push({
              text: current.substring(0, 250).trim(),
              price: priceMatch[0],
              priceRaw: parseFloat(priceMatch[1].replace(/,/g, '')),
              year: yearMatch ? yearMatch[1] : '',
              km: kmMatch ? kmMatch[1] + ' km' : '',
              kmRaw: kmMatch ? parseInt(kmMatch[1].replace(/,/g, '')) : 0,
            });
          }
          current = '';
        }
      }
      return results;
    });

    // Deduplicate and merge results
    const seen = new Set();
    const merged = [...cars, ...allResults].filter(r => {
      const key = r.text.substring(0, 30);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).filter(r => r.priceRaw >= 5000 && r.priceRaw <= BUDGET_MAX * 1.05);

    if (merged.length > 0) {
      merged.sort((a, b) => a.priceRaw - b.priceRaw);
      console.log(`Found ${merged.length} potential listings:`);
      merged.slice(0, 15).forEach((c, i) => {
        const p = c.price.padEnd(12);
        const k = (c.km || '').padEnd(12);
        const y = (c.year || '??').padEnd(5);
        const t = c.text.substring(0, 70);
        console.log(`  ${i+1}. ${p} ${k} ${y} ${t}`);
        if (c.link) console.log(`      ${c.link}`);
      });
      return merged;
    } else {
      console.log('No structured listings extracted.');
      // Check what's on the page
      const bodyText = body.substring(0, 1500);
      console.log(`Raw body: ${bodyText.replace(/\n\s*\n/g, '\n')}`);
      return [];
    }
  } catch (e) {
    console.log(`ERROR: ${e.message.substring(0, 100)}`);
    return [];
  }
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0',
    locale: 'en-IE', viewport: { width: 1920, height: 1080 },
  });

  // Block Didomi cookie wall
  await context.route('**/didomi**', route => route.abort());
  await context.route('**/wrapper***', route => route.abort());

  const page = await context.newPage();
  const allResults = [];

  // First hit homepage to establish session
  await page.goto('https://www.carsireland.ie/', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(2000);

  // Search each target
  for (const target of TARGETS) {
    const parts = target.split(' ');
    const make = parts[0];
    const model = parts.slice(1).join(' ');
    const results = await scrapeCarsIreland(page, make, model);
    allResults.push(...results.map(r => ({ ...r, searchTerm: target, source: 'carsireland.ie' })));
  }

  await browser.close();

  // Print summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('  CARSIRELAND.IE - COMPLETE RESULTS');
  console.log(`${'='.repeat(70)}`);

  if (allResults.length > 0) {
    const seen = new Set();
    const unique = allResults.filter(r => {
      const k = r.text.substring(0, 30);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    unique.sort((a, b) => a.priceRaw - b.priceRaw);

    console.log(`Total: ${unique.length} listings\n`);
    unique.slice(0, 20).forEach((c, i) => {
      const p = c.price.padEnd(12);
      const k = (c.km || '').padEnd(12);
      const y = (c.year || '??').padEnd(5);
      const s = c.searchTerm.padEnd(20);
      const t = c.text.substring(0, 50);
      console.log(`  ${i+1}. ${p} ${k} ${y} ${s} ${t}`);
      if (c.link && !c.link.startsWith('javascript')) console.log(`      ${c.link}`);
    });

    fs.writeFileSync('carsireland_results.json', JSON.stringify(unique, null, 2));
    console.log(`\nSaved to carsireland_results.json`);
  } else {
    console.log('No results found from any search.');
  }
})();
