import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.error(`[BROWSER ERROR]:`, err.message);
    console.error(err.stack);
  });

  try {
    console.log("Navigating to http://localhost:5173...");
    await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 10000 });
    // Wait a bit for React to render and crash
    await page.waitForTimeout(2000);
  } catch (err) {
    console.error("Navigation failed or timed out:", err);
  } finally {
    await browser.close();
  }
}

test();
