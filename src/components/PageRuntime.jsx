import { useEffect } from 'react';
import { replayScripts } from '../clone/replayScripts.js';

export default function PageRuntime({ scripts, children }) {
  useEffect(() => replayScripts(scripts), [scripts]);

  useEffect(() => {
    const blockSubmit = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    };
    document.addEventListener('submit', blockSubmit, true);
    return () => document.removeEventListener('submit', blockSubmit, true);
  }, []);

  return <>{children}</>;
}
