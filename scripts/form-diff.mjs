import { chromium } from 'playwright-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({ executablePath: EDGE, headless: true });

async function run(url) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const logs = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(8000);
  const data = await page.evaluate(() => {
    const form = document.querySelector('#forminator-module-12416');
    const placeholder = document.querySelector('[data-form="forminator-module-12416"]');
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        h: Math.round(r.height),
        w: Math.round(r.width),
        styleAttr: el.getAttribute('style'),
        cls: String(el.className || ''),
      };
    };
    let jqData = null;
    try {
      const $ = window.jQuery;
      if ($ && $(form).data('forminatorFront')) {
        jqData = Object.keys($(form).data('forminatorFront'));
      }
    } catch (e) {
      jqData = 'err ' + e.message;
    }
    return {
      hasForm: !!form,
      form: box(form),
      placeholder: box(placeholder),
      placeholderHTML: placeholder ? placeholder.innerHTML.slice(0, 200) : null,
      globals: {
        ForminatorFront: typeof window.ForminatorFront,
        ForminatorFrontConfig: typeof window.ForminatorFrontConfig,
        forminatorFront: typeof window.jQuery?.fn?.forminatorFront,
        forminator: typeof window.Forminator,
        jQuery: typeof window.jQuery,
      },
      jqData,
      forminatorRender: form?.getAttribute('data-forminator-render'),
      readyState: document.readyState,
    };
  });
  await context.close();
  return { data, logs };
}

const live = await run('https://thetksgroup.com/');
const react = await run('http://127.0.0.1:5173/');
console.log('LIVE', JSON.stringify(live, null, 2));
console.log('REACT', JSON.stringify(react, null, 2));
await browser.close();
