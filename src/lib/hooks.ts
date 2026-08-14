'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Matches a media query, SSR-safe.
 *
 * Starts false on the server and during the first client render — reading
 * `window.matchMedia` during render would break hydration — then corrects in a
 * layout effect before paint.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * Whether the visitor asked for less motion.
 *
 * Canvas and JS-driven animation cannot be switched off by the stylesheet's
 * reduced-motion block, so every such component reads this and renders a
 * single static frame instead of running its loop.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * State mirrored into localStorage.
 *
 * The initial render always uses `initial` so the server and client markup
 * match; the stored value is applied in an effect immediately afterwards. That
 * is a one-frame flash for persisted preferences, which is the correct trade
 * against a hydration mismatch that blanks the whole tree.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // A private-mode browser or a corrupt entry: keep the default rather
      // than taking the page down over a preference.
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or blocked — the in-memory value still works for this session.
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated] as const;
}

/** Fires once when an element first scrolls into view. Used for reveals. */
export function useInView<T extends Element>(rootMargin = '-12% 0px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Without IntersectionObserver (very old browsers) everything should be
    // visible rather than permanently hidden behind an animation that never runs.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView] as const;
}

/** Current scroll offset, throttled to the frame rate. */
export function useScrollPosition(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let frame = 0;

    const onScroll = () => {
      // Scroll fires far more often than the screen refreshes; without this
      // the header re-renders dozens of times per frame on a trackpad.
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setOffset(window.scrollY);
        frame = 0;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return offset;
}

/** Locks body scroll while a modal or drawer is open. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

/** Calls `onClose` on Escape and on a click outside the returned ref. */
export function useDismissable<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  const handler = useRef(onClose);
  handler.current = onClose;

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handler.current();
    };

    const onPointer = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) handler.current();
    };

    document.addEventListener('keydown', onKey);
    // Deferred a tick: the click that opened the panel is still propagating,
    // and without this the panel closes in the same gesture that opened it.
    const timer = window.setTimeout(() => document.addEventListener('pointerdown', onPointer), 0);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      window.clearTimeout(timer);
    };
  }, [open]);

  return ref;
}

/** Copies text and reports success for two seconds. */
export function useCopy() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { copied, copy };
}
