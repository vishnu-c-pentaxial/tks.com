import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = path.resolve('shots');
await fs.mkdir(OUT, { recursive: true });

const targets = [
  { name: 'live', url: 'https://thetksgroup.com/' },
  { name: 'react', url: 'http://127.0.0.1:5173/' },
  { name: 'standalone', url: 'http://127.0.0.1:5173/site/index.html' },
];

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--disable-blink-features=AutomationControlled', '--hide-scrollbars'],
});

for (const target of targets) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  const messages = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      messages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => messages.push(`[pageerror] ${err.message}`));

  try {
    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(5000);
    await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await sleep(90);
      }
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(1200);
      window.scrollTo(0, 0);
      await sleep(1200);
    });
    await page.waitForTimeout(2500);

    const info = await page.evaluate(() => ({
      height: document.body.scrollHeight,
      title: document.title,
      hasPreloader:
        !!document.querySelector('.preloader, #preloader, .ct-preloader, .loader-wrapper') &&
        getComputedStyle(
          document.querySelector('.preloader, #preloader, .ct-preloader, .loader-wrapper'),
        ).display !== 'none',
      heroText: (document.querySelector('h1, .rev_slider, .ct-slider')?.textContent || '')
        .replace(/\s+/g, ' ')
        .slice(0, 120),
    }));

    await page.screenshot({ path: path.join(OUT, `${target.name}.png`), fullPage: true });
    await page.screenshot({ path: path.join(OUT, `${target.name}-top.png`) });
    await fs.writeFile(
      path.join(OUT, `${target.name}.json`),
      JSON.stringify({ ...info, messages }, null, 2),
    );
    console.log(target.name, info.height, info.title, 'messages:', messages.length);
  } catch (err) {
    console.error(target.name, 'FAILED', err.message);
    await fs.writeFile(path.join(OUT, `${target.name}.json`), JSON.stringify({ error: err.message }, null, 2));
  }
  await context.close();
}

await browser.close();
