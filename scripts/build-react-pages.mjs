import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseFragment } from 'parse5';
import * as prettier from 'prettier';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PAGES_DIR = path.join(ROOT, 'src', 'site', 'pages');
const OUT_ROOT = path.join(ROOT, 'src', 'react-generated');
const OUT_PAGES = path.join(OUT_ROOT, 'pages');
const OUT_COMPONENTS = path.join(OUT_ROOT, 'components');
const manifest = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, 'manifest.json'), 'utf8'));

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

const BOOL = new Set([
  'hidden', 'disabled', 'readonly', 'required', 'selected', 'checked', 'multiple', 'autofocus', 'open', 'loop',
  'muted', 'controls', 'autoplay', 'async', 'defer', 'novalidate', 'formnovalidate', 'reversed', 'playsinline',
  'default', 'ismap', 'allowfullscreen',
]);

const ATTR_MAP = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  maxlength: 'maxLength',
  srcset: 'srcSet',
  fetchpriority: 'fetchPriority',
  autocomplete: 'autoComplete',
  contenteditable: 'contentEditable',
  spellcheck: 'spellCheck',
  datetime: 'dateTime',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  usemap: 'useMap',
  allowfullscreen: 'allowFullScreen',
  frameborder: 'frameBorder',
  readonly: 'readOnly',
  autoplay: 'autoPlay',
  playsinline: 'playsInline',
  novalidate: 'noValidate',
  enctype: 'encType',
  acceptcharset: 'acceptCharset',
  formaction: 'formAction',
  formenctype: 'formEncType',
  formmethod: 'formMethod',
  formnovalidate: 'formNoValidate',
  formtarget: 'formTarget',
  maxlength: 'maxLength',
  minlength: 'minLength',
  readonly: 'readOnly',
  crossorigin: 'crossOrigin',
  referrerpolicy: 'referrerPolicy',
  marginwidth: 'marginWidth',
  marginheight: 'marginHeight',
  framespacing: 'frameSpacing',
};

const SVG_ATTR_MAP = {
  viewbox: 'viewBox',
  preserveaspectratio: 'preserveAspectRatio',
  filterunits: 'filterUnits',
  gradientunits: 'gradientUnits',
  patternunits: 'patternUnits',
  patterncontentunits: 'patternContentUnits',
  patternTransform: 'patternTransform',
  markerwidth: 'markerWidth',
  markerheight: 'markerHeight',
  markerunits: 'markerUnits',
  refx: 'refX',
  refy: 'refY',
  textlength: 'textLength',
  lengthadjust: 'lengthAdjust',
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'stroke-width': 'strokeWidth',
  'stroke-opacity': 'strokeOpacity',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'color-interpolation': 'colorInterpolation',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'text-anchor': 'textAnchor',
  'dominant-baseline': 'dominantBaseline',
  'alignment-baseline': 'alignmentBaseline',
  'baseline-shift': 'baselineShift',
  'mask-type': 'maskType',
  'vector-effect': 'vectorEffect',
  'paint-order': 'paintOrder',
  'shape-rendering': 'shapeRendering',
  'image-rendering': 'imageRendering',
  'color-rendering': 'colorRendering',
  'pointer-events': 'pointerEvents',
  'xlink:href': 'xlinkHref',
  'xmlns:xlink': 'xmlnsXlink',
};

const TAG_MAP = {
  clippath: 'clipPath',
  feblend: 'feBlend',
  fecolormatrix: 'feColorMatrix',
  fecomponenttransfer: 'feComponentTransfer',
  fecomposite: 'feComposite',
  feconvolvematrix: 'feConvolveMatrix',
  fediffuselighting: 'feDiffuseLighting',
  fedisplacementmap: 'feDisplacementMap',
  fedistantlight: 'feDistantLight',
  fedropshadow: 'feDropShadow',
  feflood: 'feFlood',
  fefunca: 'feFuncA',
  fefuncb: 'feFuncB',
  fefuncg: 'feFuncG',
  fefuncr: 'feFuncR',
  fegaussianblur: 'feGaussianBlur',
  feimage: 'feImage',
  femerge: 'feMerge',
  femergenode: 'feMergeNode',
  femorphology: 'feMorphology',
  feoffset: 'feOffset',
  fepointlight: 'fePointLight',
  fespecularlighting: 'feSpecularLighting',
  fespotlight: 'feSpotLight',
  fetile: 'feTile',
  feturbulence: 'feTurbulence',
  foreignobject: 'foreignObject',
  lineargradient: 'linearGradient',
  radialgradient: 'radialGradient',
  textpath: 'textPath',
};

function jsString(value) {
  return JSON.stringify(String(value))
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/[\u007f-\uffff]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function elementChildren(node) {
  return (node.childNodes || []).filter((n) => n.tagName);
}

function textContent(node) {
  return (node.childNodes || [])
    .map((n) => (n.nodeName === '#text' ? n.value : ''))
    .join('');
}

function attrValue(node, name) {
  return (node.attrs || []).find((a) => a.name === name && !a.prefix)?.value;
}

function tagName(node) {
  const raw = node.tagName;
  return TAG_MAP[raw] || TAG_MAP[raw.toLowerCase()] || raw;
}

function attrName(attr) {
  if (attr.prefix === 'xlink') return `xlink${attr.name.charAt(0).toUpperCase()}${attr.name.slice(1)}`;
  if (attr.prefix === 'xmlns') return `xmlns${attr.name.charAt(0).toUpperCase()}${attr.name.slice(1)}`;
  const lower = attr.name.toLowerCase();
  return SVG_ATTR_MAP[lower] || ATTR_MAP[lower] || attr.name;
}

function splitTopLevel(input, delimiter) {
  const out = [];
  let current = '';
  let depth = 0;
  let quote = '';
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quote) {
      current += ch;
      if (ch === quote && input[i - 1] !== '\\') quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '(') depth += 1;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === delimiter && depth === 0) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current);
  return out;
}

function findTopLevelColon(input) {
  let depth = 0;
  let quote = '';
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quote) {
      if (ch === quote && input[i - 1] !== '\\') quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '(') depth += 1;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ':' && depth === 0) return i;
  }
  return -1;
}

function stylePropName(prop) {
  if (prop.startsWith('--')) return prop;
  if (prop.startsWith('-ms-')) return `ms${prop.slice(4).replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())}`;
  if (prop.startsWith('-')) {
    const vendor = prop.slice(1).split('-')[0];
    const rest = prop.slice(2 + vendor.length);
    return `${vendor.charAt(0).toUpperCase()}${vendor.slice(1)}${rest.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())}`;
  }
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function styleObject(css) {
  const declarations = splitTopLevel(css, ';');
  const entries = [];
  for (const declaration of declarations) {
    const idx = findTopLevelColon(declaration);
    if (idx < 0) continue;
    const rawProp = declaration.slice(0, idx).trim();
    if (!rawProp) continue;
    const rawValue = declaration.slice(idx + 1).replace(/!important\s*$/i, '').trim();
    if (!rawValue) continue;
    const prop = stylePropName(rawProp);
    const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(prop) ? prop : jsString(prop);
    entries.push(`${key}: ${jsString(rawValue)}`);
  }
  if (!entries.length) return '{}';
  return `{\n${entries.map((e) => `  ${e},`).join('\n')}\n}`;
}

function selectedOptionValue(select) {
  const stack = [...(select.childNodes || [])];
  while (stack.length) {
    const node = stack.shift();
    if (node.tagName === 'option' && (node.attrs || []).some((a) => a.name === 'selected')) {
      return attrValue(node, 'value') ?? textContent(node);
    }
    if (node.childNodes) stack.unshift(...node.childNodes);
  }
  return null;
}

function buildProps(node, ctx) {
  const parts = [];
  const isSelect = node.tagName === 'select';
  const defaultSelectValue = isSelect ? selectedOptionValue(node) : null;

  for (const attr of node.attrs || []) {
    let key = attrName(attr);
    let value = attr.value;

    if (attr.prefix === 'xmlns' && attr.name === 'xlink') {
      parts.push(`xmlnsXlink={${jsString(value)}}`);
      continue;
    }
    if (key === 'style') {
      parts.push(`style={${styleObject(value)}}`);
      continue;
    }
    if (key === 'selected') continue;
    if (node.tagName === 'input' && key === 'value') key = 'defaultValue';
    if (node.tagName === 'input' && key === 'checked') key = 'defaultChecked';
    if (BOOL.has(key) && (value === '' || value.toLowerCase() === key.toLowerCase() || value.toLowerCase() === 'true')) {
      parts.push(key);
      continue;
    }
    parts.push(`${key}={${jsString(value)}}`);
  }

  if (isSelect && defaultSelectValue !== null) {
    parts.push(`defaultValue={${jsString(defaultSelectValue)}}`);
  }

  return parts.length ? ` ${parts.join(' ')}` : '';
}

function serializeNode(node, indent, ctx) {
  if (node.nodeName === '#text') return `${indent}{${jsString(node.value)}}`;
  if (node.nodeName === '#comment') return '';

  const tag = tagName(node);

  if (tag === 'script') {
    if (attrValue(node, 'src')) {
      throw new Error(`Executable script leaked into generated JSX: ${attrValue(node, 'src')}`);
    }
    ctx.usesJsonScript = true;
    return `${indent}<JsonScript${buildProps(node, ctx)} text={${jsString(textContent(node))}} />`;
  }

  if (tag === 'style') {
    return `${indent}<style${buildProps(node, ctx)}>{${jsString(textContent(node))}}</style>`;
  }

  if (tag === 'textarea') {
    return `${indent}<textarea${buildProps(node, ctx)} defaultValue={${jsString(textContent(node))}} />`;
  }

  const props = buildProps(node, ctx);
  if (VOID.has(tag)) return `${indent}<${tag}${props} />`;

  const children = serializeChildren(node, `${indent}  `, ctx);
  if (!children.length) return `${indent}<${tag}${props} />`;
  return `${indent}<${tag}${props}>\n${children.join('\n')}\n${indent}</${tag}>`;
}

function serializeChildren(node, indent, ctx) {
  const out = [];
  let buffer = '';
  for (const child of node.childNodes || []) {
    if (child.nodeName === '#comment') continue;
    if (child.nodeName === '#text') {
      buffer += child.value;
      continue;
    }
    if (buffer) {
      out.push(`${indent}{${jsString(buffer)}}`);
      buffer = '';
    }
    out.push(serializeNode(child, indent, ctx));
  }
  if (buffer) out.push(`${indent}{${jsString(buffer)}}`);
  return out;
}

function serializeFragment(nodes, indent, ctx) {
  const out = [];
  let buffer = '';
  for (const child of nodes) {
    if (child.nodeName === '#comment') continue;
    if (child.nodeName === '#text') {
      if (child.value.trim()) buffer += child.value;
      continue;
    }
    if (buffer) {
      out.push(`${indent}{${jsString(buffer)}}`);
      buffer = '';
    }
    out.push(serializeNode(child, indent, ctx));
  }
  if (buffer) out.push(`${indent}{${jsString(buffer)}}`);
  return out;
}

function hashJsx(jsx) {
  return crypto.createHash('sha1').update(jsx).digest('hex').slice(0, 8);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function importsFor(ctx, fromDir) {
  const imports = [];
  if (ctx.usesJsonScript) {
    const rel = path.relative(fromDir, path.join(ROOT, 'src', 'components', 'JsonScript.jsx')).replace(/\\/g, '/');
    imports.push(`import JsonScript from '${rel.startsWith('.') ? rel : `./${rel}`}';`);
  }
  return imports;
}

async function writeJsx(file, imports, body) {
  ensureDir(path.dirname(file));
  const source = `${imports.join('\n')}${imports.length ? '\n\n' : ''}${body}\n`;
  let formatted = source;
  try {
    formatted = await prettier.format(source, { parser: 'babel', printWidth: 120 });
  } catch (err) {
    console.warn(`[jsx] prettier failed for ${path.relative(ROOT, file)}: ${err.message}`);
  }
  fs.writeFileSync(file, formatted);
}

function findNode(node, predicate, out = []) {
  if (predicate(node)) out.push(node);
  for (const child of node.childNodes || []) findNode(child, predicate, out);
  return out;
}

function buildContentPage(slug, contentNode, contentDir) {
  const inner = findNode(contentNode, (n) => n.tagName === 'div' && attrValue(n, 'class') === 'content-inner')[0];
  if (!inner) return null;

  const wrappers = [inner];
  let host = inner;
  while (elementChildren(host).length === 1) {
    host = elementChildren(host)[0];
    wrappers.push(host);
  }

  const sections = elementChildren(host);
  const sectionImports = [];
  const sectionNames = [];

  for (let i = 0; i < sections.length; i += 1) {
    const name = `Section${String(i + 1).padStart(2, '0')}`;
    sectionNames.push(name);
    sectionImports.push(`import ${name} from './sections/${name}.jsx';`);
    const ctx = { usesJsonScript: false };
    const jsx = serializeNode(sections[i], '', ctx);
    const imports = importsFor(ctx, path.join(contentDir, 'sections'));
    const body = `export default function ${name}() {\n  return (\n${indentBlock(jsx, 4)}\n  );\n}`;
    writeJsxSync(path.join(contentDir, 'sections', `${name}.jsx`), imports, body);
  }

  const opening = [];
  for (const node of wrappers) {
    const tag = tagName(node);
    opening.push({ tag, line: `<${tag}${buildProps(node, { usesJsonScript: false })}>` });
  }

  const innerJsx = [
    ...opening.map(({ line }, i) => `${'  '.repeat(i + 3)}${line}`),
    ...sectionNames.map((name, i) => `${'  '.repeat(wrappers.length + 3)}<${name} />`),
    ...[...opening].reverse().map(({ tag }, i) => {
      return `${'  '.repeat(wrappers.length + 2 - i)}</${tag}>`;
    }),
  ].join('\n');

  const contentTag = tagName(contentNode);
  const contentOpen = `<${contentTag}${buildProps(contentNode, { usesJsonScript: false })}>`;
  const contentClose = `</${contentTag}>`;

  const body = `export default function Content() {\n  return (\n    ${contentOpen}\n${indentBlock(innerJsx, 6)}\n    ${contentClose}\n  );\n}`;
  writeJsxSync(path.join(contentDir, 'Content.jsx'), sectionImports, body);
  return true;
}

function indentBlock(text, spaces) {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.trim() ? `${pad}${line}` : line))
    .join('\n');
}

function writeJsxSync(file, imports, body) {
  ensureDir(path.dirname(file));
  const source = `${imports.join('\n')}${imports.length ? '\n\n' : ''}${body}\n`;
  fs.writeFileSync(file, source);
}

async function formatAll(files) {
  for (const file of files) {
    try {
      const source = fs.readFileSync(file, 'utf8');
      const formatted = await prettier.format(source, { parser: 'babel', printWidth: 120 });
      fs.writeFileSync(file, formatted);
    } catch (err) {
      console.warn(`[jsx] prettier failed for ${path.relative(ROOT, file)}: ${err.message}`);
    }
  }
}

async function main() {
  if (process.env.JSX_CLEAN === '1') {
    const uniqueSlugs = [...new Set(manifest.map((e) => e.slug))];
    for (const slug of uniqueSlugs) {
      try {
        fs.rmSync(path.join(OUT_PAGES, slug), { recursive: true, force: true, maxRetries: 20, retryDelay: 150 });
      } catch (err) {
        console.warn(`[jsx] could not clean ${slug}: ${err.message}`);
      }
    }
    try {
      fs.rmSync(path.join(OUT_PAGES, 'routes.js'), { force: true, maxRetries: 20, retryDelay: 150 });
    } catch {}
    try {
      fs.rmSync(OUT_COMPONENTS, { recursive: true, force: true, maxRetries: 20, retryDelay: 150 });
    } catch (err) {
      console.warn(`[jsx] could not clean components: ${err.message}`);
    }
  }
  ensureDir(OUT_PAGES);
  ensureDir(OUT_COMPONENTS);

  const headers = new Map();
  const footers = new Map();
  const generated = [];
  const componentFiles = [];

  const parsed = [];
  for (const entry of manifest) {
    if (parsed.some((p) => p.slug === entry.slug)) continue;
    const bodyPath = path.join(PAGES_DIR, entry.slug, 'body.html');
    const body = fs.readFileSync(bodyPath, 'utf8');
    const fragment = parseFragment(body);
    const pageNode = findNode(fragment, (n) => n.tagName === 'div' && attrValue(n, 'id') === 'page')[0];
    if (!pageNode) throw new Error(`No #page in ${entry.slug}`);
    parsed.push({ entry, fragment, pageNode });
  }

  for (const { entry, fragment, pageNode } of parsed) {
    const pageChildren = elementChildren(pageNode);
    const header = pageChildren.find((n) => n.tagName === 'header');
    const footer = pageChildren.find((n) => n.tagName === 'footer');
    const content = pageChildren.find((n) => n.tagName === 'div' && attrValue(n, 'id') === 'content');
    if (!header || !footer || !content) throw new Error(`Missing header/footer/content in ${entry.slug}`);

    const headerCtx = { usesJsonScript: false };
    const headerJsx = serializeNode(header, '', headerCtx);
    const headerHash = hashJsx(headerJsx);
    if (!headers.has(headerHash)) headers.set(headerHash, { jsx: headerJsx, usesJsonScript: headerCtx.usesJsonScript });

    const footerCtx = { usesJsonScript: false };
    const footerJsx = serializeNode(footer, '', footerCtx);
    const footerHash = hashJsx(footerJsx);
    if (!footers.has(footerHash)) footers.set(footerHash, { jsx: footerJsx, usesJsonScript: footerCtx.usesJsonScript });

    let outSlug = entry.slug;
    const primaryDir = path.join(OUT_PAGES, outSlug);
    try {
      ensureDir(primaryDir);
      fs.readdirSync(primaryDir);
    } catch {
      outSlug = `${entry.slug}-page`;
    }
    const pageDir = path.join(OUT_PAGES, outSlug);
    ensureDir(pageDir);

    const contentOk = buildContentPage(entry.slug, content, pageDir);
    if (!contentOk) throw new Error(`Could not split content for ${entry.slug}`);

    const extras = pageChildren.filter((n) => n !== header && n !== content && n !== footer);
    const extrasCtx = { usesJsonScript: false };
    const extrasJsx = serializeFragment(extras, '', extrasCtx);
    if (extrasJsx.length) {
      const imports = importsFor(extrasCtx, pageDir);
      const body = `export default function PageExtras() {\n  return (\n    <>\n${indentBlock(extrasJsx.join('\n'), 6)}\n    </>\n  );\n}`;
      writeJsxSync(path.join(pageDir, 'PageExtras.jsx'), imports, body);
    }

    const before = [];
    const after = [];
    let seenPage = false;
    for (const child of fragment.childNodes || []) {
      if (child === pageNode) {
        seenPage = true;
        continue;
      }
      if (child.nodeName === '#comment') continue;
      if (child.nodeName === '#text' && !child.value.trim()) continue;
      (seenPage ? after : before).push(child);
    }

    for (const [name, nodes] of [
      ['Before', before],
      ['After', after],
    ]) {
      if (!nodes.length) continue;
      const ctx = { usesJsonScript: false };
      const jsx = serializeFragment(nodes, '', ctx);
      const imports = importsFor(ctx, pageDir);
      const body = `export default function ${name}() {\n  return (\n    <>\n${indentBlock(jsx.join('\n'), 6)}\n    </>\n  );\n}`;
      writeJsxSync(path.join(pageDir, `${name}.jsx`), imports, body);
    }

    const imports = [
      `import PageRuntime from '../../../components/PageRuntime.jsx';`,
      `import Header from '../../components/headers/Header_${headerHash}.jsx';`,
      `import Footer from '../../components/footers/Footer_${footerHash}.jsx';`,
      `import Content from './Content.jsx';`,
      `import scripts from '../../../site/pages/${entry.slug}/scripts.json';`,
    ];
    if (extrasJsx.length) imports.push(`import PageExtras from './PageExtras.jsx';`);
    if (before.length) imports.push(`import Before from './Before.jsx';`);
    if (after.length) imports.push(`import After from './After.jsx';`);

    const lines = [
      `export default function Page() {`,
      `  return (`,
      `    <PageRuntime scripts={scripts}>`,
    ];
    if (before.length) lines.push(`      <Before />`);
    lines.push(`      <div id="page" className="site">`);
    lines.push(`        <Header />`);
    lines.push(`        <Content />`);
    lines.push(`        <Footer />`);
    if (extrasJsx.length) lines.push(`        <PageExtras />`);
    lines.push(`      </div>`);
    if (after.length) lines.push(`      <After />`);
    lines.push(`    </PageRuntime>`);
    lines.push(`  );`);
    lines.push(`}`);

    writeJsxSync(path.join(pageDir, 'Page.jsx'), imports, lines.join('\n'));
    generated.push({ entry, pageDir, outSlug });
  }

  const headerImportLines = [];
  const headerMapLines = [];
  for (const [hash, data] of headers) {
    const file = path.join(OUT_COMPONENTS, 'headers', `Header_${hash}.jsx`);
    componentFiles.push(file);
    const ctx = { usesJsonScript: data.usesJsonScript };
    const imports = importsFor(ctx, path.dirname(file));
    const body = `export default function Header_${hash}() {\n  return (\n${indentBlock(data.jsx, 4)}\n  );\n}`;
    writeJsxSync(file, imports, body);
    headerImportLines.push(`import Header_${hash} from './headers/Header_${hash}.jsx';`);
    headerMapLines.push(`  '${hash}': Header_${hash},`);
  }

  const footerImportLines = [];
  for (const [hash, data] of footers) {
    const file = path.join(OUT_COMPONENTS, 'footers', `Footer_${hash}.jsx`);
    componentFiles.push(file);
    const ctx = { usesJsonScript: data.usesJsonScript };
    const imports = importsFor(ctx, path.dirname(file));
    const body = `export default function Footer_${hash}() {\n  return (\n${indentBlock(data.jsx, 4)}\n  );\n}`;
    writeJsxSync(file, imports, body);
    footerImportLines.push(`import Footer_${hash} from './footers/Footer_${hash}.jsx';`);
  }

  const pageImportLines = [];
  const componentMapLines = [];
  const seenSlugs = new Set();
  for (const { entry, outSlug } of generated) {
    if (seenSlugs.has(entry.slug)) continue;
    seenSlugs.add(entry.slug);
    let name = entry.slug
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    if (name === 'Home') name = 'HomePage';
    pageImportLines.push(`const ${name} = lazy(() => import('./${outSlug}/Page.jsx'));`);
    componentMapLines.push(`  '${entry.slug}': ${name},`);
  }

  const routesBody = [
    `import { lazy } from 'react';`,
    `import manifest from '../../site/pages/manifest.json';`,
    '',
    ...pageImportLines,
    '',
    'const COMPONENTS = {',
    ...componentMapLines,
    '};',
    '',
    'export const ROUTES = manifest.map((entry) => ({',
    '  ...entry,',
    '  Component: COMPONENTS[entry.slug],',
    '}));',
    '',
    'export const Home = COMPONENTS.home;',
  ].join('\n');
  fs.writeFileSync(path.join(OUT_PAGES, 'routes.js'), `${routesBody}\n`);

  const allFiles = [
    ...componentFiles,
    ...generated.flatMap(({ pageDir }) => [
      path.join(pageDir, 'Page.jsx'),
      path.join(pageDir, 'Content.jsx'),
      ...fs.readdirSync(path.join(pageDir, 'sections')).map((f) => path.join(pageDir, 'sections', f)),
      ...['PageExtras.jsx', 'Before.jsx', 'After.jsx']
        .map((f) => path.join(pageDir, f))
        .filter((f) => fs.existsSync(f)),
    ]),
  ];
  await formatAll(allFiles);

  console.log(`[jsx] generated ${generated.length} pages, ${headers.size} headers, ${footers.size} footers`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
