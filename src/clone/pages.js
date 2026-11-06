import manifest from '../site/pages/manifest.json';

const heads = import.meta.glob('../site/pages/*/head.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function slugFromKey(key) {
  return key.split('/').slice(-2)[0];
}

const pagesBySlug = {};
for (const [key, value] of Object.entries(heads)) {
  const slug = slugFromKey(key);
  pagesBySlug[slug] = { head: value };
}

const routes = new Map(manifest.map((entry) => [entry.route, entry]));

const ALIASES = {
  '/about/': '/about2/',
};

export function normalizePath(pathname) {
  let path = pathname || '/';
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/{2,}/g, '/');
  if (path.length > 1 && !path.endsWith('/')) path += '/';
  return path;
}

export function getPage(pathname) {
  let route = normalizePath(pathname);
  route = ALIASES[route] || route;

  const entry = routes.get(route) || routes.get('/');
  const data = pagesBySlug[entry.slug] || pagesBySlug.home || {};
  return { ...entry, ...data };
}
