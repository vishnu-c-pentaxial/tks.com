import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = path.resolve('shots');
const BASE = process.env.CLONE_BASE || 'http://127.0.0.1:5173';
await fs.mkdir(OUT, { recursive: true });

const targets = [
  { name: 'live', url: 'https://thetksgroup.com/' },
  { name: 'react', url: `${BASE}/` },
  { name: 'standalone', url: `${BASE}/site/index.html` },
];

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--disable-blink-features=AutomationControlled', '--hide-scrollbars'],
});

async function collect(page) {
  return page.evaluate(() => {
    const describe = (el) => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        id: el.id || '',
        cls: String(el.className || '').slice(0, 160),
        top: Math.round(r.top + window.scrollY),
        height: Math.round(r.height),
      };
    };
    const pageEl = document.querySelector('#page');
    const children = pageEl ? [...pageEl.children].map(describe) : [];
    const sections = [...document.querySelectorAll('section.elementor-section')].map(describe);
    const images = [...document.images].map((img) => ({
      src: img.currentSrc || img.src,
      w: img.naturalWidth,
      h: img.naturalHeight,
    }));
    const broken = images.filter((i) => !i.w || !i.h);
    const fonts = [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`);
    return {
      height: document.body.scrollHeight,
      width: document.body.scrollWidth,
      children,
      sections,
      imageCount: images.length,
      brokenCount: broken.length,
      broken: broken.slice(0, 40),
      fontCount: fonts.length,
      loadedFontCount: fonts.filter((f) => f.endsWith('loaded')).length,
    };
  });
}

async function load(target) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(5000);
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await sleep(70);
    }
    window.scrollTo(0, 0);
    await sleep(1200);
  });
  await page.waitForTimeout(1500);
  const data = await collect(page);
  await context.close();
  return data;
}

const results = {};
for (const target of targets) {
  results[target.name] = await load(target);
  const r = results[target.name];
  console.log(target.name, 'height', r.height, 'width', r.width, 'images', r.imageCount, 'broken', r.brokenCount, 'fonts', r.loadedFontCount + '/' + r.fontCount);
}

function diff(label, a, b) {
  console.log(`\n--- ${label}: live vs react ---`);
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    const x = a[i];
    const y = b[i];
    if (!x || !y) {
      console.log(`#${i} MISSING`, x, y);
      continue;
    }
    const dh = y.height - x.height;
    const dt = y.top - x.top;
    if (Math.abs(dh) > 2 || Math.abs(dt) > 2) {
      console.log(`#${i} height ${x.height}->${y.height} (${dh >= 0 ? '+' : ''}${dh}) top ${x.top}->${y.top} (${dt >= 0 ? '+' : ''}${dt})`);
      console.log(`   live: ${x.tag} ${x.id} ${x.cls}`);
      console.log(`   react: ${y.tag} ${y.id} ${y.cls}`);
    }
  }
}

diff('page children', results.live.children, results.react.children);
diff('all .elementor-section', results.live.sections, results.react.sections);
diff('page children (live vs standalone)', results.live.children, results.standalone.children);

console.log('\nbroken images react:', JSON.stringify(results.react.broken, null, 2));
console.log('broken images live:', JSON.stringify(results.live.broken, null, 2));

await fs.writeFile(path.join(OUT, 'compare.json'), JSON.stringify(results, null, 2));
await browser.close();
