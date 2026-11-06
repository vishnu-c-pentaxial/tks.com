import { useEffect } from 'react';
import { replayScripts } from './clone/replayScripts.js';

export default function App({ page }) {
  useEffect(() => replayScripts(page.scripts), [page]);

  return <div id="site-shell" dangerouslySetInnerHTML={{ __html: page.body }} />;
}
