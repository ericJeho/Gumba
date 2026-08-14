'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useLocalStorage, useScrollLock } from '@/lib/hooks';
import { useCurrency } from '@/components/layout/Preferences';
import { Button } from '@/components/ui';

/**
 * The shopping cart, shared by the beat store and the merch store.
 *
 * One cart rather than two: a visitor buying a hoodie and a beat licence in the
 * same visit should check out once. Contents persist in localStorage so a
 * closed tab does not lose the basket.
 */

export type CartItem = {
  /** Unique per variant: "beat:undertow:premium" or "product:studio-tee:L". */
  id: string;
  name: string;
  /** Sub-label — licence tier, size. */
  variant?: string;
  /** USD each. */
  price: number;
  quantity: number;
  href: string;
  /** Digital goods do not get shipping applied. */
  digital: boolean;
};

type CartValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

/** Flat rate, waived over this threshold. */
const SHIPPING = 12;
const FREE_SHIPPING_OVER = 120;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>('pulse-cart', []);
  const [open, setOpen] = useState(false);

  const add = useCallback(
    (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
      setItems((current) => {
        const existing = current.find((entry) => entry.id === item.id);
        // Adding the same licence tier twice is almost always a double click,
        // not an intent to buy two — but merch genuinely can be, so both
        // increment and the visitor adjusts in the drawer.
        if (existing) {
          return current.map((entry) =>
            entry.id === item.id ? { ...entry, quantity: entry.quantity + quantity } : entry,
          );
        }
        return [...current, { ...item, quantity }];
      });
      setOpen(true);
    },
    [setItems],
  );

  const remove = useCallback(
    (id: string) => setItems((current) => current.filter((entry) => entry.id !== id)),
    [setItems],
  );

  const setQuantity = useCallback(
    (id: string, quantity: number) => {
      setItems((current) =>
        quantity <= 0
          ? current.filter((entry) => entry.id !== id)
          : current.map((entry) => (entry.id === id ? { ...entry, quantity } : entry)),
      );
    },
    [setItems],
  );

  const clear = useCallback(() => setItems([]), [setItems]);

  const value = useMemo<CartValue>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const needsShipping = items.some((item) => !item.digital);
    const shipping = needsShipping && subtotal < FREE_SHIPPING_OVER ? SHIPPING : 0;

    return {
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
      open,
      setOpen,
      add,
      remove,
      setQuantity,
      clear,
    };
  }, [add, clear, items, open, remove, setQuantity]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart(): CartValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}

/** The floating cart button — only visible once something is in the basket. */
export function CartButton() {
  const cart = useCart();
  if (cart.count === 0) return null;

  return (
    <button
      type="button"
      onClick={() => cart.setOpen(true)}
      className="fixed bottom-[6.5rem] left-5 z-40 flex items-center gap-2 rounded-full bg-brand px-5 py-3.5 text-sm font-medium text-canvas shadow-lift transition-transform hover:scale-105"
    >
      <ShoppingBag className="size-4" aria-hidden />
      {cart.count} {cart.count === 1 ? 'item' : 'items'}
    </button>
  );
}

function CartDrawer() {
  const cart = useCart();
  const currency = useCurrency();
  useScrollLock(cart.open);

  return (
    <AnimatePresence>
      {cart.open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => cart.setOpen(false)}
            className="fixed inset-0 z-[65] bg-canvas/70 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="fixed inset-y-0 right-0 z-[66] flex w-[min(26rem,100vw)] flex-col border-l border-line bg-surface"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-medium">Your cart</h2>
              <button
                type="button"
                onClick={() => cart.setOpen(false)}
                aria-label="Close cart"
                className="rounded-full p-2 text-ink-subtle hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>

            {cart.items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <ShoppingBag className="size-10 text-ink-subtle" aria-hidden />
                <p className="text-sm text-ink-muted">Nothing here yet.</p>
                <Button href="/beats" variant="outline" onClick={() => cart.setOpen(false)}>
                  Browse beats
                </Button>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                  {cart.items.map((item) => (
                    <li key={item.id} className="flex gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={item.href}
                          onClick={() => cart.setOpen(false)}
                          className="block truncate text-sm font-medium hover:text-brand"
                        >
                          {item.name}
                        </Link>
                        {item.variant ? (
                          <p className="mt-0.5 text-xs text-ink-subtle">{item.variant}</p>
                        ) : null}

                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="flex items-center rounded-lg border border-line">
                            <button
                              type="button"
                              onClick={() => cart.setQuantity(item.id, item.quantity - 1)}
                              aria-label={`Decrease quantity of ${item.name}`}
                              className="p-1.5 text-ink-subtle hover:text-ink"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-7 text-center text-xs tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => cart.setQuantity(item.id, item.quantity + 1)}
                              aria-label={`Increase quantity of ${item.name}`}
                              className="p-1.5 text-ink-subtle hover:text-ink"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => cart.remove(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="p-1.5 text-ink-subtle transition-colors hover:text-danger"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="shrink-0 text-sm tabular-nums">
                        {formatMoney(item.price * item.quantity, currency)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-line p-5">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Subtotal</dt>
                      <dd className="tabular-nums">{formatMoney(cart.subtotal, currency)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Shipping</dt>
                      <dd className="tabular-nums">
                        {cart.shipping === 0 ? 'Free' : formatMoney(cart.shipping, currency)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-line pt-2 text-base font-medium">
                      <dt>Total</dt>
                      <dd className="tabular-nums">{formatMoney(cart.total, currency)}</dd>
                    </div>
                  </dl>

                  {cart.shipping > 0 ? (
                    <p className="mt-3 text-xs text-ink-subtle">
                      Free shipping over {formatMoney(FREE_SHIPPING_OVER, currency)} — you are{' '}
                      {formatMoney(FREE_SHIPPING_OVER - cart.subtotal, currency)} away.
                    </p>
                  ) : null}

                  <Button className="mt-5 w-full" size="lg">
                    Checkout
                  </Button>

                  <button
                    type="button"
                    onClick={cart.clear}
                    className={cn(
                      'mt-3 w-full text-center text-xs text-ink-subtle transition-colors hover:text-danger',
                    )}
                  >
                    Empty cart
                  </button>

                  <p className="mt-3 text-center text-xs text-ink-subtle">
                    Checkout is handled by our payment provider. Card details never reach this site.
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
