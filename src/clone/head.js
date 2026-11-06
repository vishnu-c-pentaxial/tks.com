import homeHead from '../site/pages/homeHead.json';

const homeIds = new Set(homeHead.ids);
const homeHrefs = new Set(homeHead.hrefs);
const homeStyleHashes = new Set(homeHead.styleHashes);

function normalizeWhitespace(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}

function normalizeUrl(u) {
  if (!u) return '';
  return String(u).split('#')[0].split('?')[0].trim();
}

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function isHomeManaged(el) {
  if (el.tagName === 'LINK') {
    if (el.id && homeIds.has(el.id)) return true;
    const href = normalizeUrl(el.getAttribute('href'));
    return Boolean(href) && homeHrefs.has(href);
  }
  if (el.tagName === 'STYLE') {
    if (el.id && homeIds.has(el.id)) return true;
    return homeStyleHashes.has(fnv1a(normalizeWhitespace(el.textContent)));
  }
  return false;
}

/**
 * Swap the homepage's static <head> styles for the target page's own set.
 * The body is empty until React mounts, so this happens before anything is
 * visible. Vite's injected dev styles are left alone.
 */
export function applyPageHead(html) {
  for (const el of document.head.querySelectorAll('[data-clone-head]')) el.remove();
  if (!html) return; // homepage: keep the exact hand-tuned static head

  for (const el of [...document.head.querySelectorAll('link, style')]) {
    if (el.hasAttribute('data-vite-dev-id')) continue;
    if (isHomeManaged(el)) el.remove();
  }

  const template = document.createElement('template');
  template.innerHTML = html;
  const fragment = document.createDocumentFragment();
  for (const node of [...template.content.children]) {
    if (node.tagName !== 'LINK' && node.tagName !== 'STYLE') continue;
    node.setAttribute('data-clone-head', '');
    fragment.appendChild(node);
  }
  document.head.appendChild(fragment);
}

export function setBodyClass(className) {
  if (className) document.body.className = className;
}

export function setDocumentTitle(title) {
  if (title) document.title = title;
}
