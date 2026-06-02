const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0',
    locale: 'en-IE', viewport: { width: 1920, height: 1080 },
  });
  await context.route('**/didomi**', route => route.abort());

  const page = await context.newPage();

  // Capture ALL XHR/fetch responses
  const responses = [];
  page.on('response', async resp => {
    const url = resp.url();
    const ct = resp.headers()['content-type'] || '';
    if (ct.includes('json') && !url.includes('google') && !url.includes('gtag')) {
      try {
        const body = await resp.text().catch(() => '');
        responses.push({ url: url.substring(0, 200), status: resp.status(), size: body.length, body: body.substring(0, 800) });
      } catch {}
    }
  });

  await page.goto('https://www.carsireland.ie/used-cars/honda/cr-v?maxprice=28000&maxmileage=70000', 
    { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(6000);

  console.log('=== All JSON API responses ===');
  responses.forEach(r => {
    console.log(`\n[${r.status}] ${r.url}`);
    console.log(`  Size: ${r.size}`);
    // Try to show first line of JSON
    const firstLine = r.body.substring(0, 600);
    console.log(`  Data: ${firstLine}`);
  });

  console.log('\nBrowser open...');
  await page.waitForTimeout(15000);
  await browser.close();
})();
