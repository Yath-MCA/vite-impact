import { chromium } from 'playwright';

(async function(){
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('CONSOLE', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR', err.stack || err.message));

  try {
    await page.goto('http://localhost:3002/devboard', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1000);

    // Try clicking fetch button
    try { await page.getByRole('button', { name: 'Fetch' }).click({ timeout: 2000 }); console.log('Clicked Fetch'); } catch(e) { console.log('Fetch click failed', e.message); }

    // Fill query inputs to trigger debounced calls
    const placeholders = ['client','identifier','docid','status','titleinfo.cover','rolename'];
    for (const ph of placeholders) {
      try {
        const sel = `input[placeholder="${ph}"]`;
        await page.fill(sel, 'test');
        console.log('Filled', ph);
        await page.waitForTimeout(600);
      } catch(e) {
        // not all placeholders may exist
      }
    }

    // Click Next
    try { await page.getByRole('button', { name: 'Next' }).click({ timeout: 2000 }); console.log('Clicked Next'); } catch(e){ console.log('Next click failed', e.message); }

    await page.waitForTimeout(1500);

    const last = await page.evaluate(() => window.__LAST_QC_CALLER__ || null);
    console.log('LAST_CALLER_FROM_PAGE:', last);

    const qc = await page.evaluate(() => {
      try { return Boolean(window.__QUERY_CLIENT__); } catch(e) { return 'err'; }
    });
    console.log('HAS_QUERY_CLIENT?:', qc);

  } catch (err) {
    console.log('ERROR in script', err.stack || err.message);
  } finally {
    await browser.close();
  }
})();
