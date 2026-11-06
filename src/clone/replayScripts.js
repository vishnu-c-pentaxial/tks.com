const LOCAL_TIMEOUT = 25000;
const EXTERNAL_TIMEOUT = 12000;

function copyAttrs(el, attrs) {
  for (const [key, value] of Object.entries(attrs || {})) {
    if (key === 'src') continue;
    if (key === 'async' || key === 'defer') continue;
    try {
      el.setAttribute(key, value);
    } catch {
      /* ignore invalid attribute names */
    }
  }
}

function loadExternalScript(attrs) {
  return new Promise((resolve) => {
    const el = document.createElement('script');
    copyAttrs(el, attrs);
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const timeout = attrs.src?.startsWith('/site/') ? LOCAL_TIMEOUT : EXTERNAL_TIMEOUT;
    const timer = setTimeout(() => {
      console.warn('[clone] script timed out:', attrs.src);
      finish();
    }, timeout);
    el.onload = () => {
      clearTimeout(timer);
      finish();
    };
    el.onerror = () => {
      clearTimeout(timer);
      console.warn('[clone] script failed:', attrs.src);
      finish();
    };
    el.async = false;
    el.src = attrs.src;
    document.body.appendChild(el);
  });
}

function runInlineScript(attrs, text) {
  const el = document.createElement('script');
  copyAttrs(el, attrs);
  el.text = text;
  document.body.appendChild(el);
}

export function replayScripts(scriptList) {
  let cancelled = false;
  window.__cloneScriptsDone = false;
  const originalWrite = document.write;

  // Some third-party snippets call document.write after load, which would
  // wipe the already-mounted React document. Block that one footgun.
  document.write = (...args) => {
    console.warn('[clone] blocked document.write:', args[0]);
  };

  // Elementor runs its `frontend/element_ready/global` hook exactly once,
  // immediately after it loads. Widget scripts loaded afterwards register on
  // that hook too late (Forminator is one). Record those late callbacks so
  // only they can be replayed, without re-running Elementor's own init.
  let lateGlobalHooks = null;
  const captureLateGlobalHooks = () => {
    const ef = window.elementorFrontend;
    if (lateGlobalHooks || !ef?.hooks?.addAction) return;
    lateGlobalHooks = [];
    const hooks = ef.hooks;
    const addAction = hooks.addAction.bind(hooks);
    hooks.addAction = (name, callback, priority) => {
      if (name === 'frontend/element_ready/global') lateGlobalHooks.push(callback);
      return addAction(name, callback, priority);
    };
  };

  (async () => {
    for (const script of scriptList || []) {
      if (cancelled || !script) break;
      if (typeof script.text === 'string') {
        runInlineScript(script.attrs, script.text);
      } else if (script.attrs?.src) {
        await loadExternalScript(script.attrs);
      }
      if (cancelled) break;
      captureLateGlobalHooks();
      await new Promise((r) => setTimeout(r, 0));
    }

    document.write = originalWrite;
    if (cancelled) return;

    // These scripts normally execute before DOMContentLoaded. Now that the
    // markup and all widget initializers are in place, replay the lifecycle
    // events the originals listen for (Elementor widget init, sliders,
    // counters, preloader removal, etc.).
    try {
      document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
    } catch (err) {
      console.warn('[clone] could not dispatch DOMContentLoaded', err);
    }
    try {
      window.dispatchEvent(new Event('load'));
    } catch (err) {
      console.warn('[clone] could not dispatch load', err);
    }

    // Replay only the global callbacks that registered after Elementor's
    // one-shot hook had already fired.
    try {
      const $ = window.jQuery;
      const scope = $ ? $('body') : document.body;
      for (const callback of lateGlobalHooks || []) {
        try {
          callback(scope);
        } catch (err) {
          console.warn('[clone] late Elementor global hook failed', err);
        }
      }
    } catch (err) {
      console.warn('[clone] could not replay late Elementor hooks', err);
    }

    window.__cloneScriptsDone = true;
    try {
      window.dispatchEvent(new Event('clone:scripts-done'));
    } catch {
      /* ignore */
    }
  })();

  return () => {
    cancelled = true;
    document.write = originalWrite;
  };
}
