'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Search, Sliders, Sun, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { brand } from '@/config/brand';
import { useDismissable, useScrollLock, useScrollPosition } from '@/lib/hooks';
import { usePreferences } from '@/components/layout/Preferences';
import { LogoLockup } from '@/components/ui/Logo';
import { Button } from '@/components/ui';
import { SiteSearch } from '@/components/layout/SiteSearch';

/**
 * The site header.
 *
 * Transparent over the hero and glass once scrolled, so the hero video is
 * never boxed in by a solid bar. The mega-menu is hover-opened on pointer
 * devices and click-opened everywhere else, because a hover-only menu is
 * unusable on a touchscreen and invisible to a keyboard.
 */

type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string; description: string }[];
};

const NAV: NavItem[] = [
  { label: 'Studio', href: '/studio' },
  {
    label: 'What it does',
    href: '/services',
    children: [
      { label: 'Making beats', href: '/services/music-production', description: 'Channel rack, piano roll, generators' },
      { label: 'Recording', href: '/services/recording', description: 'Straight from your microphone, in the tab' },
      { label: 'Mixing', href: '/services/mixing', description: 'EQ, compression, filter and sends per channel' },
      { label: 'Mastering', href: '/services/mastering', description: 'Glue, limiter and ceiling on the master strip' },
      { label: 'Everything', href: '/services', description: 'The full list of what the studio covers' },
    ],
  },
  {
    label: 'The building',
    href: '/rooms',
    children: [
      { label: 'Rooms', href: '/rooms', description: 'Nine spaces, with virtual tours' },
      { label: 'Equipment', href: '/equipment', description: 'The gear the instruments were modelled on' },
      { label: 'The team', href: '/team', description: 'Who builds this' },
    ],
  },
  {
    label: 'Work',
    href: '/work',
    children: [
      { label: 'Portfolio', href: '/work', description: 'Records, films, podcasts and campaigns' },
      { label: 'Journal', href: '/blog', description: 'How we work, written down' },
    ],
  },
  { label: 'Contact', href: '/contact' },
];

export function Nav() {
  const pathname = usePathname();
  const scrolled = useScrollPosition() > 24;
  const { theme, toggleTheme } = usePreferences();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useScrollLock(mobileOpen);

  // Any navigation closes everything; without this the menu stays open on top
  // of the page you just navigated to.
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
    setSearchOpen(false);
  }, [pathname]);

  const menuRef = useDismissable<HTMLDivElement>(openMenu !== null, () => setOpenMenu(null));

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled ? 'glass border-b border-line' : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="container-page flex h-[4.5rem] items-center justify-between gap-4">
          <Link href="/" aria-label={`${brand.name} home`}>
            <LogoLockup />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex" ref={menuRef}>
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const expanded = openMenu === item.label;

              if (!item.children) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm transition-colors',
                      active ? 'text-brand' : 'text-ink-muted hover:text-ink',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <div
                  key={item.label}
                  className="relative"
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') setOpenMenu(item.label);
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === 'mouse') setOpenMenu(null);
                  }}
                >
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-haspopup="true"
                    onClick={() => setOpenMenu(expanded ? null : item.label)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm transition-colors',
                      active || expanded ? 'text-brand' : 'text-ink-muted hover:text-ink',
                    )}
                  >
                    {item.label}
                  </button>

                  <AnimatePresence>
                    {expanded ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-1/2 top-full w-[26rem] -translate-x-1/2 pt-3"
                      >
                        <div className="glass rounded-panel p-2 shadow-panel">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block rounded-xl px-4 py-3 transition-colors hover:bg-surface-raised"
                            >
                              <span className="block text-sm font-medium">{child.label}</span>
                              <span className="mt-0.5 block text-xs text-ink-subtle">
                                {child.description}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search the site"
              className="rounded-full p-2.5 text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
            >
              <Search className="size-4" />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              className="rounded-full p-2.5 text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <Button href="/studio" size="sm" className="hidden sm:inline-flex">
              <Sliders className="size-4" />
              Open studio
            </Button>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="rounded-full p-2.5 text-ink lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-canvas lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="container-page flex h-[4.5rem] items-center justify-between">
              <LogoLockup />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-2.5"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav aria-label="Mobile" className="container-page mt-4 overflow-y-auto pb-24">
              {NAV.map((item) => (
                <div key={item.label} className="border-b border-line py-4">
                  <Link href={item.href} className="font-display text-2xl font-medium">
                    {item.label}
                  </Link>
                  {item.children ? (
                    <div className="mt-3 grid gap-2">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href} className="text-sm text-ink-muted">
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              <div className="mt-8 grid gap-3">
                <Button href="/studio" size="lg">
                  <Sliders className="size-4" />
                  Open the studio
                </Button>
                <Button href={`tel:${brand.contact.phoneRaw}`} variant="outline" size="lg">
                  {brand.contact.phone}
                </Button>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <SiteSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
