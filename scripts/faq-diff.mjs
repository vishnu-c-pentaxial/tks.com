import { chromium } from 'playwright-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({ executablePath: EDGE, headless: true });

async function run(url) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(6000);
  const data = await page.evaluate(() => {
    const sec = document.querySelector('section[data-id="57fd31e5"]');
    if (!sec) return { error: 'section not found' };
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        cls: String(el.className || '').slice(0, 100),
        h: Math.round(r.height),
        w: Math.round(r.width),
        top: Math.round(r.top + scrollY),
      };
    };
    const cols = [...sec.querySelectorAll(':scope > .elementor-container > .elementor-column')].map((col) => ({
      ...box(col),
      widgets: [...col.querySelectorAll('.elementor-widget')].map(box),
    }));
    const items = [...sec.querySelectorAll('.ct-accordion-item')].map((item) => {
      const content = item.querySelector('.ct-ac-content');
      const title = item.querySelector('.ct-ac-title');
      const cs = content ? getComputedStyle(content) : null;
      return {
        ...box(item),
        titleCls: String(title?.className || ''),
        content: content
          ? { h: Math.round(content.getBoundingClientRect().height), display: cs.display, height: cs.height, overflow: cs.overflow }
          : null,
      };
    });
    return {
      section: box(sec),
      container: box(sec.querySelector('.elementor-container')),
      cols,
      items,
      accordion: box(sec.querySelector('.ct-accordion')),
    };
  });
  await context.close();
  return data;
}

const live = await run('https://thetksgroup.com/');
const react = await run('http://127.0.0.1:5173/');
console.log('LIVE', JSON.stringify(live, null, 2));
console.log('REACT', JSON.stringify(react, null, 2));
await browser.close();
