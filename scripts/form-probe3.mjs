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
const before = await page.evaluate(() => ({
  h: document.documentElement.scrollHeight,
  w: document.documentElement.scrollWidth,
  form: getComputedStyle(document.querySelector('#forminator-module-12416')).display,
}));
const result = await page.evaluate(() => {
  const out = { hasEF: !!window.elementorFrontend, hasHooks: !!window.elementorFrontend?.hooks };
  try {
    window.elementorFrontend.hooks.doAction('frontend/element_ready/global', window.jQuery('body'));
    out.called = true;
  } catch (e) {
    out.error = e && (e.stack || e.message || String(e));
  }
  return out;
});
await page.waitForTimeout(2500);
const after = await page.evaluate(() => {
  const form = document.querySelector('#forminator-module-12416');
  return {
    h: document.documentElement.scrollHeight,
    w: document.documentElement.scrollWidth,
    form: getComputedStyle(form).display,
    formH: Math.round(form.getBoundingClientRect().height),
    formData: !!window.jQuery(form).data('forminatorFront'),
    placeholder: !!document.querySelector('[data-form="forminator-module-12416"]'),
  };
});
console.log(JSON.stringify({ before, result, after }, null, 2));
await browser.close();
