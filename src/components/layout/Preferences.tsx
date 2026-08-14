'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '@/lib/hooks';
import type { CurrencyCode } from '@/lib/format';

/**
 * Visitor preferences: theme, currency and language.
 *
 * All three are stored locally rather than on the server — none of them is
 * personal data, and keeping them client-side means the pages stay statically
 * renderable and cacheable at the edge.
 */

export type Theme = 'dark' | 'light';
export type Locale = 'en' | 'es' | 'fr' | 'pt';

export const LOCALES: { code: Locale; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
];

type PreferencesValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** False until localStorage has been read; used to avoid flashing defaults. */
  ready: boolean;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

export const THEME_STORAGE_KEY = 'pulse-theme';

/**
 * Applies the stored theme before the first paint.
 *
 * This has to be a blocking inline script in <head>. Applied in an effect
 * instead, the page would render in the default theme and flash to the
 * visitor's choice a frame later — the single most visible hydration artefact
 * a themed site can have.
 */
export const themeBootstrapScript = `
(function(){
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var theme = stored ? JSON.parse(stored) : null;
    if (theme !== 'light' && theme !== 'dark') {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState, themeReady] = useLocalStorage<Theme>(THEME_STORAGE_KEY, 'dark');
  const [currency, setCurrency] = useLocalStorage<CurrencyCode>('pulse-currency', 'USD');
  const [locale, setLocale] = useLocalStorage<Locale>('pulse-locale', 'en');

  // The bootstrap script already set the attribute for the first paint; this
  // keeps it in step with later changes and with a value restored from storage.
  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme, themeReady]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
    },
    [setThemeState],
  );

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'));
  }, [setThemeState]);

  const value = useMemo<PreferencesValue>(
    () => ({ theme, setTheme, toggleTheme, currency, setCurrency, locale, setLocale, ready: themeReady }),
    [theme, setTheme, toggleTheme, currency, setCurrency, locale, setLocale, themeReady],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return context;
}

/** Just the currency, for the many components that only need to price things. */
export function useCurrency(): CurrencyCode {
  return usePreferences().currency;
}
