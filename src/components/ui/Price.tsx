'use client';

import { formatMoney } from '@/lib/format';
import { useCurrency } from '@/components/layout/Preferences';

/**
 * A price in the visitor's chosen currency.
 *
 * Exists so server-rendered pages can show converted prices without becoming
 * client components themselves: only this leaf hydrates, and the surrounding
 * page stays static. The base amount is always USD.
 */
export function Price({ usd, className }: { usd: number; className?: string }) {
  const currency = useCurrency();
  return <span className={className}>{formatMoney(usd, currency)}</span>;
}
