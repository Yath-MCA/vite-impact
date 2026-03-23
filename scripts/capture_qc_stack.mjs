import { chromium } from 'playwright';

(async function(){
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3002/devboard');
  // wait a bit for scripts to run
  await page.waitForTimeout(2000);
  const last = await page.evaluate(() => window.__LAST_QC_CALLER__ || null);
  console.log('LAST_CALLER:', last);
  await browser.close();
})();
