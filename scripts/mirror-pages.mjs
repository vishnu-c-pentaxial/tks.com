import fs from 'node:fs/promises';
import path from 'node:path';

const ORIGIN = 'https://thetksgroup.com';
const ROOT = process.cwd();
const SITE_DIR = path.join(ROOT, 'public', 'site');
const PAGES_DIR = path.join(ROOT, 'src', 'site', 'pages');
const INDEX_HTML = path.join(ROOT, 'index.html');
const HOME_BODY = path.join(ROOT, 'src', 'site', 'body.html');
const HOME_SCRIPTS = path.join(ROOT, 'src', 'site', 'scripts.json');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const PAGES = [
  { route: '/pricing/', slug: 'pricing' },
  { route: '/about2/', slug: 'about2' },
  { route: '/contact/', slug: 'contact' },
  { route: '/booking/', slug: 'booking' },
  { route: '/managed-it-services/', slug: 'managed-it-services' },
  { route: '/service/backup-recovery/', slug: 'service-backup-recovery' },
  { route: '/service/it-consulting/', slug: 'service-it-consulting' },
  { route: '/service/microsoft-365-services/', slug: 'service-microsoft-365-services' },
  { route: '/service/cloud-infrastructure/', slug: 'service-cloud-infrastructure' },
  { route: '/service/web-design-development/', slug: 'service-web-design-development' },
  { route: '/service/managed-cybersecurity/', slug: 'service-managed-cybersecurity' },
  { route: '/service/network-management/', slug: 'service-network-management' },
  { route: '/service/digital-marketing/', slug: 'service-digital-marketing' },
];

// These pages are intentionally kept on the live site.
const EXTERNAL_ROUTES = [
  '/privacy',
  '/acceptable-policy',
  '/service/fully-managed-it-services',
  '/service/microsoft-365-support',
];

// Scripts that must stay in the markup (config / non-executable).
const INERT_TYPES = ['application/ld+json', 'application/json', 'speculationrules'];
// Scripts that are meaningless outside a Partytown worker.
const DROP_TYPES = ['text/partytown'];

const ASSET_EXT = /\.(css|js|png|jpe?g|webp|gif|svg|avif|woff2?|ttf|eot|otf|ico|map|mp4|webm|json)(?:$|[?#])/i;

const queue = [];
const queued = new Set();
const downloaded = new Set();
const failures = [];

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&#0*38;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0*34;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseAttrs(str) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(str))) {
    const name = m[1];
    let value = m[2] ?? m[3] ?? m[4] ?? '';
    attrs[name] = decodeEntities(value);
  }
  return attrs;
}

function normalizeWhitespace(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}

function normalizeUrl(u) {
  if (!u) return '';
  return decodeEntities(u).split('#')[0].split('?')[0].trim();
}

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function styleHash(content) {
  return fnv1a(normalizeWhitespace(content));
}

function signatureOfTag(tag) {
  if (/^<style/i.test(tag)) {
    const m = tag.match(/^<style\b([^>]*)>([\s\S]*?)<\/style>/i);
    const attrs = parseAttrs(m[1]);
    return { kind: 'style', id: attrs.id || '', hash: styleHash(m[2]) };
  }
  const attrs = parseAttrs(tag.replace(/^<link\b/i, '').replace(/\/?>$/, ''));
  return { kind: 'link', id: attrs.id || '', href: normalizeUrl(attrs.href) };
}

function absolutizeExternalRoutes(html) {
  let out = html;
  for (const route of EXTERNAL_ROUTES) {
    const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(href\\s*=\\s*["'])${escaped}/?(["'])`, 'gi');
    out = out.replace(re, `$1${ORIGIN}${route}/$2`);
  }
  return out;
}

function prefixLocalPaths(text) {
  return String(text).replace(
    /(?<!\/site)(?<!thetksgroup\.com)(\/wp-(?:content|includes)\/[^"'\s\\]*)/gi,
    (full) => (full.includes('*') ? full : `/site${full}`),
  );
}

function stripMirrorParam(text) {
  return String(text).replace(/[?&]__mirror=\d+/g, '');
}

function rewriteMarkup(html) {
  let s = String(html);
  s = stripMirrorParam(s);
  // Formidable's dynamic stylesheet endpoint is mirrored as a static file.
  s = s.replace(
    /(?:https?:)?\/\/(?:www\.)?thetksgroup\.com\/wp-admin\/admin-ajax\.php\?action=frmpro_css[^"'\s>]*/gi,
    '/site/wp-admin/admin-ajax.css',
  );
  // Strip the live host so internal links become origin-relative.
  s = s.replace(/https?:\/\/(?:www\.)?thetksgroup\.com/gi, '');
  s = s.replace(/\/\/(?:www\.)?thetksgroup\.com/gi, '');
  // Point WordPress assets at the mirrored tree.
  s = s.replace(/(?<!\/site)(\/wp-(?:content|includes)\/[^"'\s>]*)/gi, (full) =>
    full.includes('*') ? full : `/site${full}`,
  );
  // Drop cache busters on mirrored assets.
  s = s.replace(/(\/site\/[^"'\s>?#]+)\?[^"'\s>#]*/gi, '$1');
  s = absolutizeExternalRoutes(s);
  return s;
}

function rewriteAssetUrl(raw) {
  if (!raw) return raw;
  let s = decodeEntities(String(raw).trim());
  if (/^(data:|blob:|#)/i.test(s)) return s;
  if (/\/wp-admin\/admin-ajax\.php\?action=frmpro_css/i.test(s)) {
    return '/site/wp-admin/admin-ajax.css';
  }
  if (/^(https?:)?\/\//i.test(s)) {
    let parsed;
    try {
      parsed = new URL(s, ORIGIN);
    } catch {
      return s;
    }
    if (!/^(www\.)?thetksgroup\.com$/i.test(parsed.hostname)) return s;
    s = parsed.pathname;
  }
  if (s.startsWith('/site/')) return s.split('#')[0].split('?')[0];
  if (s.startsWith('/wp-')) return `/site${s}`.split('#')[0].split('?')[0];
  return s;
}

function rewriteInlineScript(text) {
  return stripMirrorParam(prefixLocalPaths(text));
}

// Inline scripts that stay in the markup (config JSON / speculation rules).
// Their asset URLs must point at the mirrored tree, but API endpoints and any
// wildcard match patterns must stay untouched.
function rewriteInertScript(text) {
  let s = String(text);
  s = s.replace(
    /https?:\/\/(?:www\.)?thetksgroup\.com(\/wp-(?:content|includes)\/[^"'\s\\<>]*)/gi,
    (full, p) => {
      if (p.includes('*')) return full;
      return `/site${p.split('#')[0].split('?')[0]}`;
    },
  );
  s = s.replace(/(?<!\/site)(\/wp-(?:content|includes)\/[^"'\s\\<>]*)/gi, (full) =>
    full.includes('*') ? full : `/site${full}`,
  );
  return stripMirrorParam(s);
}

function rewriteMarkupPreservingScripts(html) {
  const store = [];
  const withoutScripts = String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (full) => {
    const token = `@@CLONE_SCRIPT_${store.length}@@`;
    store.push(full);
    return token;
  });
  const rewritten = rewriteMarkup(withoutScripts);
  return rewritten.replace(/@@CLONE_SCRIPT_(\d+)@@/g, (_, i) => rewriteInertScript(store[Number(i)]));
}

function extractScripts(html) {
  const scripts = [];
  const kept = String(html).replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrStr, text) => {
    const attrs = parseAttrs(attrStr);
    const type = String(attrs.type || '').trim().toLowerCase();
    if (INERT_TYPES.some((t) => type.includes(t))) return full;
    if (DROP_TYPES.some((t) => type.includes(t))) return '';
    if (attrs.src) {
      attrs.src = rewriteAssetUrl(attrs.src);
      scripts.push({ attrs });
    } else {
      scripts.push({ attrs, text: rewriteInlineScript(text) });
    }
    return '';
  });
  return { kept, scripts };
}

function extractHeadTags(head) {
  const tags = [];
  const re = /<link\b[^>]*>|<style\b[^>]*>[\s\S]*?<\/style>/gi;
  let m;
  while ((m = re.exec(head))) tags.push(m[0]);
  return tags.join('\n');
}

function collectAssets(strings) {
  const found = new Set();
  for (const str of strings) {
    const re = /\/site\/[^\s"'<>()\\,]+/g;
    let m;
    while ((m = re.exec(str))) {
      let u = decodeEntities(m[0]);
      u = u.split('#')[0].split('?')[0];
      u = u.replace(/[.;:]+$/, '');
      if (!ASSET_EXT.test(u)) continue;
      found.add(u);
    }
  }
  return found;
}

function enqueue(localUrl) {
  if (!localUrl) return;
  const clean = localUrl.split('#')[0].split('?')[0];
  if (!clean.startsWith('/site/')) return;
  if (queued.has(clean)) return;
  queued.add(clean);
  queue.push(clean);
}

function resolveCssRef(ref, cssRel) {
  const raw = decodeEntities(String(ref).trim());
  if (!raw || /^(data:|blob:|#|about:)/i.test(raw)) return null;
  let abs;
  try {
    abs = new URL(raw, `${ORIGIN}/${cssRel}`);
  } catch {
    return null;
  }
  if (!/^(www\.)?thetksgroup\.com$/i.test(abs.hostname)) return null;
  let pathname = abs.pathname;
  if (pathname.startsWith('/site/')) pathname = pathname.slice('/site'.length);
  return { local: `/site${pathname}`, pathname };
}

function rewriteCss(css, cssRel) {
  let out = css.replace(
    /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"]*))\s*\)/gi,
    (full, a, b, c) => {
      const ref = a ?? b ?? c ?? '';
      const resolved = resolveCssRef(ref, cssRel);
      if (!resolved) return full;
      enqueue(resolved.local);
      return `url("${resolved.local}")`;
    },
  );
  out = out.replace(/@import\s+(?:"([^"]*)"|'([^']*)')/gi, (full, a, b) => {
    const ref = a ?? b;
    const resolved = resolveCssRef(ref, cssRel);
    if (!resolved) return full;
    enqueue(resolved.local);
    return `@import url("${resolved.local}")`;
  });
  return out;
}

async function fetchWithRetry(url, tries = 3) {
  let lastError;
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, accept: '*/*' },
        redirect: 'follow',
      });
      if (res.ok) return res;
      lastError = new Error(`${res.status} ${res.statusText}`);
      if (res.status === 404) return res;
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }
  throw lastError;
}

async function downloadAsset(localUrl) {
  const clean = localUrl.split('#')[0].split('?')[0];
  if (downloaded.has(clean)) return;
  downloaded.add(clean);

  const rel = clean.replace(/^\/site\//, '');
  const dest = path.join(SITE_DIR, rel);
  const live = `${ORIGIN}/${rel}`;

  let exists = false;
  try {
    const stat = await fs.stat(dest);
    exists = stat.isFile() && stat.size > 0;
  } catch {
    exists = false;
  }

  if (exists) return;

  try {
    const res = await fetchWithRetry(live);
    if (!res.ok) {
      failures.push(`${clean} (${res.status})`);
      return;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) {
      failures.push(`${clean} (empty)`);
      return;
    }
    await fs.mkdir(path.dirname(dest), { recursive: true });
    if (clean.endsWith('.css')) {
      const css = rewriteCss(buf.toString('utf8'), rel);
      await fs.writeFile(dest, css, 'utf8');
    } else {
      await fs.writeFile(dest, buf);
    }
  } catch (err) {
    failures.push(`${clean} (${err.message})`);
  }
}

async function drainQueue() {
  while (queue.length) {
    const batch = queue.splice(0, queue.length);
    await Promise.all(batch.map((u) => downloadAsset(u)));
  }
}

async function fetchPage(route) {
  const url = `${ORIGIN}${route}${route.includes('?') ? '&' : '?'}__mirror=${Date.now()}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`${route} -> ${res.status}`);
  return res.text();
}

async function mirrorPage({ route, slug }) {
  process.stdout.write(`fetch ${route} ... `);
  const html = await fetchPage(route);
  const head = (html.match(/<head[^>]*>([\s\S]*?)<\/head>/i) || [, ''])[1];
  const body = (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || [, ''])[1];
  const bodyOpen = html.match(/<body([^>]*)>/i);
  const bodyAttrs = parseAttrs(bodyOpen ? bodyOpen[1] : '');
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  const { kept: headWithoutScripts, scripts: headScripts } = extractScripts(head);
  const { kept: bodyWithoutScripts, scripts: bodyScripts } = extractScripts(body);

  const headHtml = extractHeadTags(rewriteMarkup(headWithoutScripts));
  const bodyHtml = rewriteMarkupPreservingScripts(bodyWithoutScripts);
  const scripts = [...headScripts, ...bodyScripts];

  const dir = path.join(PAGES_DIR, slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'head.html'), headHtml, 'utf8');
  await fs.writeFile(path.join(dir, 'body.html'), bodyHtml, 'utf8');
  await fs.writeFile(path.join(dir, 'scripts.json'), `${JSON.stringify(scripts, null, 2)}\n`, 'utf8');

  const assets = collectAssets([headHtml, bodyHtml, JSON.stringify(scripts)]);
  for (const asset of assets) enqueue(asset);
  await drainQueue();

  process.stdout.write(
    `ok (body ${(bodyHtml.length / 1024).toFixed(0)}kb, scripts ${scripts.length}, assets ${assets.size})\n`,
  );

  return {
    route,
    slug,
    title: decodeEntities(titleMatch ? normalizeWhitespace(titleMatch[1]) : slug),
    bodyClass: bodyAttrs.class || '',
    head: headHtml,
  };
}

async function mirrorHome() {
  process.stdout.write('home ... ');
  const indexHtml = await fs.readFile(INDEX_HTML, 'utf8');
  const bodyOpen = indexHtml.match(/<body([^>]*)>/i);
  const bodyAttrs = parseAttrs(bodyOpen ? bodyOpen[1] : '');
  const titleMatch = indexHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  let body = await fs.readFile(HOME_BODY, 'utf8');
  body = body.replace(/href="https:\/\/thetksgroup\.com\/"/g, 'href="/"');
  body = body.replace(/href="https:\/\/thetksgroup\.com"/g, 'href="/"');
  body = absolutizeExternalRoutes(body);

  const scripts = JSON.parse(await fs.readFile(HOME_SCRIPTS, 'utf8'));

  const dir = path.join(PAGES_DIR, 'home');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'head.html'), '', 'utf8');
  await fs.writeFile(path.join(dir, 'body.html'), body, 'utf8');
  await fs.writeFile(path.join(dir, 'scripts.json'), `${JSON.stringify(scripts, null, 2)}\n`, 'utf8');

  process.stdout.write('ok (kept existing exact copy)\n');

  return {
    route: '/',
    slug: 'home',
    title: decodeEntities(titleMatch ? normalizeWhitespace(titleMatch[1]) : 'The TKS Group'),
    bodyClass: bodyAttrs.class || '',
    head: '',
  };
}

function homeHeadSignatures(indexHtml) {
  const head = (indexHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i) || [, ''])[1];
  const ids = new Set();
  const hrefs = new Set();
  const styleHashes = new Set();
  const re = /<link\b[^>]*>|<style\b[^>]*>[\s\S]*?<\/style>/gi;
  let m;
  while ((m = re.exec(head))) {
    const sig = signatureOfTag(m[0]);
    if (sig.kind === 'link') {
      if (sig.id) ids.add(sig.id);
      else if (sig.href) hrefs.add(sig.href);
    } else if (sig.id) {
      ids.add(sig.id);
    } else {
      styleHashes.add(sig.hash);
    }
  }
  return { ids: [...ids], hrefs: [...hrefs], styleHashes: [...styleHashes] };
}

async function main() {
  await fs.mkdir(PAGES_DIR, { recursive: true });

  const indexHtml = await fs.readFile(INDEX_HTML, 'utf8');
  await fs.writeFile(
    path.join(PAGES_DIR, 'homeHead.json'),
    `${JSON.stringify(homeHeadSignatures(indexHtml), null, 2)}\n`,
    'utf8',
  );

  const manifest = [];
  manifest.push(await mirrorHome());

  for (const page of PAGES) {
    try {
      manifest.push(await mirrorPage(page));
    } catch (err) {
      failures.push(`PAGE ${page.route} (${err.message})`);
      console.error(`\nfailed ${page.route}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const about = manifest.find((p) => p.route === '/about2/');
  if (about) manifest.push({ ...about, route: '/about/' });

  await fs.writeFile(
    path.join(PAGES_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  console.log(`\nwrote ${manifest.length} routes to ${path.relative(ROOT, PAGES_DIR)}`);
  if (failures.length) {
    console.log(`\n${failures.length} failures:`);
    failures.forEach((f) => console.log('  -', f));
    process.exitCode = 1;
  }
}

await main();
