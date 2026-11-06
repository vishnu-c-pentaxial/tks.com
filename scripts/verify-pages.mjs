import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import manifest from '../src/site/pages/manifest.json' with { type: 'json' };

const EDGE = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = getArg('base', 'http://127.0.0.1:5173');
const outDir = path.resolve(getArg('out', 'verification/current'));
const compareDir = getArg('compare', '');
const only = getArg('only', '');

const routes = [...new Map(manifest.map((e) => [e.route, e])).values()];
const selected = only ? routes.filter((e) => e.route.includes(only)) : routes;
const IGNORED_PAGE_ERRORS = ['monitorErrorLog is not defined', 'e[l] is not a function'];
const meaningfulPageErrors = (list) =>
  (list || []).filter((e) => !IGNORED_PAGE_ERRORS.some((known) => String(e).includes(known)));

function maskRects(data, width, height, rects) {
  for (const rect of rects || []) {
    const x0 = Math.max(0, Math.floor(rect.x));
    const y0 = Math.max(0, Math.floor(rect.y));
    const x1 = Math.min(width, Math.ceil(rect.x + rect.w));
    const y1 = Math.min(height, Math.ceil(rect.y + rect.h));
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const i = (y * width + x) * 4;
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
      }
    }
  }
}

function safeName(route) {
  const n = route.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '_');
  return n || 'home';
}

async function collect(page) {
  return page.evaluate(() => {
    const content = document.querySelector('#content > .content-inner');
    const imgs = [...document.images];
    return {
      title: document.title,
      bodyClass: document.body.className,
      h1: [...document.querySelectorAll('h1')].map((e) => e.textContent.trim()).slice(0, 5),
      h1Count: document.querySelectorAll('h1').length,
      pageCount: document.querySelectorAll('#page').length,
      headerCount: document.querySelectorAll('#page > header').length,
      footerCount: document.querySelectorAll('#page > footer').length,
      contentChildren: content ? content.children.length : 0,
      widgetCount: document.querySelectorAll('.elementor-widget').length,
      sectionCount: document.querySelectorAll('.elementor-section, section').length,
      imgCount: imgs.length,
      brokenImages: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src).slice(0, 20),
      styleCount: document.querySelectorAll('style').length,
      linkCount: document.querySelectorAll('link').length,
      scriptCount: document.querySelectorAll('script').length,
      jsonScriptCount: document.querySelectorAll('script[type="application/json"], script[type="application/ld+json"], script[type="speculationrules"]').length,
      iframeRects: [...document.querySelectorAll('iframe')].map((f) => {
        const r = f.getBoundingClientRect();
        return { x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height };
      }),
      dynamicRects: [
        '.ct-slick-carousel',
        '.rev_slider',
        '.rev_slider_wrapper',
        '.rs-module',
        '.elementor-widget-counter',
        '.elementor-counter',
        '.ct-counter',
        '.elementor-widget-progress',
        '.elementor-progress-wrapper',
        '.ct-progressbar',
        '.ct-testimonial',
      ].flatMap((selector) =>
        [...document.querySelectorAll(selector)].map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height };
        }),
      ),
      scrollHeight: document.documentElement.scrollHeight,
      bodyWidth: document.body.getBoundingClientRect().width,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      rootDisplay: getComputedStyle(document.getElementById('root')).display,
    };
  });
}

async function waitForStableHeight(page, timeout = 8000) {
  try {
    await page.evaluate(async (timeoutMs) => {
      const start = performance.now();
      let last = -1;
      let stableSince = performance.now();
      while (performance.now() - start < timeoutMs) {
        const h = document.documentElement.scrollHeight;
        if (h === last) {
          if (performance.now() - stableSince >= 1000) return;
        } else {
          last = h;
          stableSince = performance.now();
        }
        await new Promise((r) => setTimeout(r, 100));
      }
    }, timeout);
  } catch {
    /* ignore */
  }
}

async function run() {
  if (!fs.existsSync(EDGE)) throw new Error(`Edge not found at ${EDGE}`);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const results = {};

  for (const entry of selected) {
    const name = safeName(entry.route);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedLocal = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));
    page.on('requestfailed', (req) => {
      if (req.url().startsWith(base)) failedLocal.push(`${req.url()} :: ${req.failure()?.errorText}`);
    });
    page.on('response', (res) => {
      if (res.url().startsWith(base) && res.status() >= 400) failedLocal.push(`${res.status()} ${res.url()}`);
    });

    const url = `${base}${entry.route}`;
    console.log(`[verify] ${entry.route}`);
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 90000 });
      await page.waitForSelector('#page', { timeout: 30000 });
    } catch (err) {
      console.log(`  navigation failed: ${err.message}`);
    }
    await page
      .waitForFunction(() => window.__cloneScriptsDone === true, null, { timeout: 45000 })
      .catch(() => console.log('  scripts did not finish before timeout'));
    await page
      .waitForFunction(
        () => {
          const sliders = [...document.querySelectorAll('.ct-slick-carousel')];
          return sliders.length === 0 || sliders.every((s) => s.classList.contains('slick-initialized'));
        },
        null,
        { timeout: 15000 },
      )
      .catch(() => console.log('  sliders did not finish before timeout'));
    await page.waitForTimeout(6000);
    await waitForStableHeight(page);
    try {
      await page.evaluate(async () => {
        const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await waitForStableHeight(page);
      await page.waitForTimeout(300);
    } catch {
      /* ignore */
    }

    const metrics = await collect(page);
    results[entry.route] = {
      name,
      metrics,
      consoleErrors,
      pageErrors,
      failedLocal,
    };

    let hideBadge = !compareDir;
    if (compareDir) {
      const baselinePng = path.join(path.resolve(compareDir), `${name}.png`);
      if (fs.existsSync(baselinePng)) {
        try {
          hideBadge = PNG.sync.read(fs.readFileSync(baselinePng)).width < 1500;
        } catch {
          /* ignore */
        }
      }
    }
    await page.addStyleTag({
      content:
        '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important;}' +
        '.wow{opacity:1!important;transform:none!important;visibility:visible!important;}' +
        (hideBadge ? '.grecaptcha-badge{display:none!important;}' : ''),
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true, timeout: 120000 });
    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(outDir, 'metrics.json'), JSON.stringify(results, null, 2));

  console.log('\n=== summary ===');
  for (const [route, r] of Object.entries(results)) {
    const m = r.metrics;
    console.log(
      `${route.padEnd(40)} h1=${String(m.h1Count).padStart(2)} content=${String(m.contentChildren).padStart(2)} widgets=${String(m.widgetCount).padStart(3)} imgs=${String(m.imgCount).padStart(2)} broken=${m.brokenImages.length} styles=${m.styleCount} links=${m.linkCount} scripts=${m.scriptCount} json=${m.jsonScriptCount} height=${m.scrollHeight} console=${r.consoleErrors.length} pageErr=${r.pageErrors.length} failed=${r.failedLocal.length}`,
    );
  }

  if (compareDir) {
    const baselinePath = path.resolve(compareDir, 'metrics.json');
    if (!fs.existsSync(baselinePath)) throw new Error(`No baseline metrics at ${baselinePath}`);
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    console.log('\n=== compare ===');
    let problems = 0;
    const exactKeys = [
      'title',
      'bodyClass',
      'h1Count',
      'pageCount',
      'headerCount',
      'footerCount',
      'contentChildren',
      'widgetCount',
      'imgCount',
      'styleCount',
      'linkCount',
      'jsonScriptCount',
      'bodyBg',
    ];
    for (const [route, r] of Object.entries(results)) {
      const b = baseline[route];
      if (!b) {
        console.log(`${route}: MISSING BASELINE`);
        problems += 1;
        continue;
      }
      const diffs = [];
      for (const key of exactKeys) {
        if (JSON.stringify(b.metrics[key]) !== JSON.stringify(r.metrics[key])) {
          diffs.push(`${key}: ${JSON.stringify(b.metrics[key])} -> ${JSON.stringify(r.metrics[key])}`);
        }
      }
      const dh = Math.abs(b.metrics.scrollHeight - r.metrics.scrollHeight);
      if (dh > 2) diffs.push(`scrollHeight: ${b.metrics.scrollHeight} -> ${r.metrics.scrollHeight}`);
      if (b.metrics.brokenImages.length !== r.metrics.brokenImages.length) {
        diffs.push(`brokenImages: ${b.metrics.brokenImages.length} -> ${r.metrics.brokenImages.length}`);
      }
      if (r.failedLocal.length) diffs.push(`failedLocal: ${r.failedLocal.length}`);
      const currentPageErrors = meaningfulPageErrors(r.pageErrors);
      const baselinePageErrors = meaningfulPageErrors(b.pageErrors);
      if (currentPageErrors.length > baselinePageErrors.length) {
        diffs.push(`pageErrors: ${baselinePageErrors.length} -> ${currentPageErrors.length}`);
      }

      const baselinePng = path.join(path.resolve(compareDir), `${r.name}.png`);
      const currentPng = path.join(outDir, `${r.name}.png`);
      if (fs.existsSync(baselinePng) && fs.existsSync(currentPng)) {
        try {
          const a = PNG.sync.read(fs.readFileSync(baselinePng));
          const c = PNG.sync.read(fs.readFileSync(currentPng));
          if (a.width === c.width && a.height === c.height) {
            const ad = Buffer.from(a.data);
            const cd = Buffer.from(c.data);
            const masked = [...(r.metrics.iframeRects || []), ...(r.metrics.dynamicRects || [])];
            maskRects(ad, a.width, a.height, masked);
            maskRects(cd, c.width, c.height, masked);
            const diff = new PNG({ width: a.width, height: a.height });
            const changed = pixelmatch(ad, cd, diff.data, a.width, a.height, { threshold: 0.1 });
            const pct = (changed / (a.width * a.height)) * 100;
            if (pct > 0.5) {
              diffs.push(`pixels: ${pct.toFixed(2)}%`);
              fs.writeFileSync(path.join(outDir, `${r.name}.diff.png`), PNG.sync.write(diff));
            }
          } else {
            diffs.push(`size: ${a.width}x${a.height} -> ${c.width}x${c.height}`);
          }
        } catch (err) {
          diffs.push(`pixel diff failed: ${err.message}`);
        }
      }

      if (diffs.length) {
        problems += 1;
        console.log(`\n${route}`);
        diffs.forEach((d) => console.log(`  - ${d}`));
      }
    }
    console.log(`\n${problems ? `${problems} route(s) differ` : 'all routes match'}`);
    if (problems) process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
