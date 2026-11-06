import { chromium } from 'playwright-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on('console', (m) => {
  if (!m.text().includes('[vite]')) console.log(`[console.${m.type()}]`, m.text());
});
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(8000);
const result = await page.evaluate(async () => {
  const $ = window.jQuery;
  const sel = '#forminator-module-12416[data-forminator-render="0"]';
  const el = document.querySelector(sel);
  const before = {
    data: !!$(el).data('forminatorFront'),
    display: getComputedStyle(el).display,
    h: el.getBoundingClientRect().height,
  };
  let error = null;
  try {
    $(sel).forminatorFront({ form_type: 'custom-form' });
  } catch (e) {
    error = e && (e.stack || e.message || String(e));
  }
  await new Promise((r) => setTimeout(r, 1500));
  const after = {
    data: !!$(el).data('forminatorFront'),
    display: getComputedStyle(el).display,
    styleAttr: el.getAttribute('style'),
    h: el.getBoundingClientRect().height,
    placeholder: !!document.querySelector('#forminator-module-12416 ~ [data-form="forminator-module-12416"], [data-form="forminator-module-12416"]'),
  };
  return { before, error, after };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
