'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useCurrency } from '@/components/layout/Preferences';
import { Badge, Button, GradientPanel, Reveal } from '@/components/ui';
import { CartButton, CartProvider, useCart } from '@/components/shop/CartProvider';
import { products, type Product } from '@/content/commerce';

/**
 * Merchandise.
 *
 * Shares the cart with the beat store, so a hoodie and a beat licence check out
 * together. Stock counts are shown honestly, including when something is nearly
 * gone — a store that only ever says "in stock" teaches people to ignore it.
 */
export function MerchStore() {
  return (
    <CartProvider>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <Reveal key={product.slug} delay={Math.min(index, 5) * 0.05}>
            <ProductCard product={product} index={index} />
          </Reveal>
        ))}
      </div>
      <CartButton />
    </CartProvider>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const currency = useCurrency();
  const cart = useCart();
  const [variant, setVariant] = useState(product.variants[0] ?? '');

  const low = product.stock > 0 && product.stock < 25;
  const out = product.stock === 0;

  return (
    <article
      id={product.slug}
      className="flex h-full scroll-mt-28 flex-col rounded-card border border-line bg-surface/60 p-5"
    >
      <GradientPanel hue={product.hue} seed={index} className="aspect-square">
        {low || out ? (
          <div className="absolute right-4 top-4">
            <Badge tone={out ? 'warning' : 'brand'} className="bg-canvas/70 backdrop-blur">
              {out ? 'Sold out' : `${product.stock} left`}
            </Badge>
          </div>
        ) : null}
      </GradientPanel>

      <h2 className="mt-4 font-display text-lg font-medium">{product.name}</h2>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">{product.description}</p>

      {product.variants.length > 0 ? (
        <div className="mt-4">
          <label
            htmlFor={`${product.slug}-variant`}
            className="mb-2 block text-xs uppercase tracking-widest text-ink-subtle"
          >
            {product.category === 'apparel' ? 'Size' : 'Value'}
          </label>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" id={`${product.slug}-variant`}>
            {product.variants.map((entry) => (
              <button
                key={entry}
                type="button"
                role="radio"
                aria-checked={variant === entry}
                onClick={() => setVariant(entry)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                  variant === entry
                    ? 'border-brand bg-brand text-canvas'
                    : 'border-line text-ink-muted hover:border-brand',
                )}
              >
                {entry}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="font-display text-2xl font-semibold">{formatMoney(product.price, currency)}</p>
        <Button
          size="sm"
          disabled={out}
          onClick={() =>
            cart.add({
              id: `product:${product.slug}:${variant || 'one-size'}`,
              name: product.name,
              variant: variant || undefined,
              price: product.price,
              href: `/store#${product.slug}`,
              // Gift cards are delivered by email, so they skip shipping.
              digital: product.category === 'gift',
            })
          }
        >
          <ShoppingBag className="size-4" />
          {out ? 'Sold out' : 'Add'}
        </Button>
      </div>
    </article>
  );
}
