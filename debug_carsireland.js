const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0',
    locale: 'en-IE', viewport: { width: 1920, height: 1080 },
  });
  await context.route('**/didomi**', route => route.abort());

  const page = await context.newPage();

  // Monitor API requests
  const apiCalls = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('api') || url.includes('search') || url.includes('filter') || url.includes('graphql')) {
      apiCalls.push({ url: url.substring(0, 200), method: req.method() });
    }
  });
  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('api') || url.includes('search') || url.includes('filter') || url.includes('privateapi')) {
      try {
        const body = await resp.text().catch(() => '');
        console.log(`\nAPI RESPONSE: ${url.substring(0, 150)}`);
        console.log(`  Status: ${resp.status()}, Body: ${body.substring(0, 500)}`);
      } catch {}
    }
  });

  console.log('Opening carsireland.ie with search...');
  await page.goto('https://www.carsireland.ie/used-cars/honda/cr-v?maxprice=28000&maxmileage=70000', 
    { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  // Log all API calls
  console.log('\n\n=== All API calls detected ===');
  apiCalls.forEach(c => console.log(`  ${c.method} ${c.url}`));

  // Dump page state
  const html = await page.content();
  console.log(`\n\n=== Script tags (URLs with api/search) ===`);
  const scripts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script[src]'))
      .map(s => s.src)
      .filter(s => s.includes('api') || s.includes('search') || s.includes('filter'));
  });
  scripts.forEach(s => console.log(`  ${s}`));

  // Check for form/button to submit filters
  console.log('\n=== Filter form elements ===');
  const filterElements = await page.evaluate(() => {
    const results = [];
    // Find filter-related elements
    document.querySelectorAll('button').forEach(b => {
      const text = b.textContent?.trim();
      if (text && text.length < 30 && text.length > 2) {
        results.push({ tag: 'BUTTON', text, class: b.className.substring(0, 50) });
      }
    });
    document.querySelectorAll('a').forEach(a => {
      const text = a.textContent?.trim();
      if (text && (text.match(/apply|search|filter|update|submit/i) || a.href?.includes('search'))) {
        results.push({ tag: 'A', text: text?.substring(0, 30), href: a.href?.substring(0, 100) });
      }
    });
    document.querySelectorAll('input[type="submit"], input[type="button"]').forEach(i => {
      results.push({ tag: 'INPUT', value: i.value, id: i.id, class: i.className.substring(0, 30) });
    });
    return results;
  });
  filterElements.forEach(e => console.log(`  <${e.tag}> text="${e.text || e.value}" class="${e.class || ''}" ${e.href ? 'href="'+e.href+'"' : ''}`));

  console.log('\nBrowser open...');
  await page.waitForTimeout(20000);
  await browser.close();
})();
