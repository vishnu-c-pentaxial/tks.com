import { chromium } from 'playwright-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on('console', (m) => console.log(`[console.${m.type()}]`, m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(8000);
const data = await page.evaluate(() => {
  const $ = window.jQuery;
  const sel = '#forminator-module-12416[data-forminator-render="0"]';
  const el = document.querySelector(sel);
  let init = null;
  try {
    if (el && $.fn.forminatorFront) {
      init = $(el).data('forminatorFront') ? 'already-init' : 'not-init';
    }
  } catch (e) {
    init = 'err ' + e.message;
  }
  return {
    paginations: window.Forminator_Cform_Paginations ? Object.keys(window.Forminator_Cform_Paginations) : null,
    paginationValue: window.Forminator_Cform_Paginations?.[12416] ?? null,
    selCount: $(sel).length,
    hasPlugin: typeof $.fn.forminatorFront,
    init,
    nonce: document.querySelector('#forminator-module-12416 #forminator_nonce')?.value ?? '(no nonce input)',
    scriptTags: [...document.querySelectorAll('script')].map((s) => s.id || (s.src ? 'src:' + s.src.split('/').pop() : 'inline')).filter((x) => x.includes('forminator') || x.includes('front.')),
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
