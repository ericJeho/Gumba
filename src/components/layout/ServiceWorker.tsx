'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker that provides offline support.
 *
 * Registration is deferred until after `load` so it never competes with the
 * first paint for bandwidth — a service worker that slows down the first visit
 * to speed up the second is a bad trade for a site most people see once.
 *
 * Development is skipped deliberately: a cached shell in dev makes changes
 * appear not to take effect, which costs more time than the feature saves.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      // The build id in the query string is what makes a deploy replace the
      // worker: /sw.js is byte-identical between builds, so without a changing
      // URL the browser keeps the old worker and its old caches alive.
      const version = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev';
      navigator.serviceWorker.register(`/sw.js?v=${version}`).catch(() => {
        // A failed registration costs offline support and nothing else, so it
        // must never surface as an error to the visitor.
      });
    };

    if (document.readyState === 'complete') {
      register();
      return;
    }

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
