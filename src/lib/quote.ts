import { brand } from '@/config/brand';
import { isPeakHour } from '@/lib/availability';

/**
 * Booking arithmetic.
 *
 * Kept out of the wizard component so the price a visitor sees while choosing
 * and the price the API charges come from the same function. Every amount is
 * in whole USD units and rounded once, at the end of each line — money summed
 * from unrounded floats produces totals that are a cent off the displayed
 * lines, which is the classic way an invoice loses a customer's trust.
 */

export type QuoteInput = {
  /** Room hourly rate in USD. */
  roomRate: number;
  hours: number;
  /** Start hour in 24h form, e.g. "19:00" — decides the peak surcharge. */
  startTime: string;
  /** Flat-price extras: engineer time, mixing, stems, catering. */
  addOns: { id: string; label: string; price: number }[];
  /** Uppercase code as typed by the visitor. */
  discountCode?: string;
  /** Members skip the deposit and get a standing discount. */
  member?: boolean;
};

export type QuoteLine = {
  label: string;
  amount: number;
  /** Renders in the muted colour and does not read as a charge. */
  note?: string;
};

export type Quote = {
  lines: QuoteLine[];
  subtotal: number;
  discount: number;
  discountLabel?: string;
  tax: number;
  total: number;
  /** Charged now to hold the room; the balance is due on the session date. */
  deposit: number;
  balance: number;
};

export type DiscountCode = {
  code: string;
  label: string;
  /** Percentage off the subtotal. */
  percent?: number;
  /** Flat USD off the subtotal. Applied after any percentage. */
  flat?: number;
  /** Subtotal the booking must reach before the code applies. */
  minimum?: number;
};

export const DISCOUNT_CODES: DiscountCode[] = [
  { code: 'FIRSTSESSION', label: 'First session — 15% off', percent: 15 },
  { code: 'STUDENT', label: 'Student rate — 25% off', percent: 25 },
  { code: 'NIGHTOWL', label: 'Overnight block — $120 off', flat: 120, minimum: 400 },
  { code: 'REFER50', label: 'Referral credit — $50 off', flat: 50 },
  { code: 'LABEL10', label: 'Label partner — 10% off', percent: 10 },
];

/**
 * The bookable extras.
 *
 * One definition, read by both the wizard and the booking API — so a price
 * shown to a visitor can never be a price the server rejects.
 */
export const ADD_ONS: { id: string; label: string; price: number }[] = [
  { id: 'engineer', label: 'Senior engineer for the session', price: 240 },
  { id: 'assistant', label: 'Assistant engineer', price: 120 },
  { id: 'tape', label: 'Two-inch tape (stock at cost)', price: 320 },
  { id: 'stems', label: 'Stem export and archive', price: 60 },
  { id: 'roughmix', label: 'Same-day rough mix', price: 90 },
  { id: 'photography', label: 'Session photographer (2 hours)', price: 220 },
  { id: 'catering', label: 'Catering for the room', price: 85 },
];

/** Evening and overnight sessions carry a surcharge on the room rate. */
export const PEAK_SURCHARGE_PERCENT = 20;

/** Standing discount for members, applied before any promo code. */
export const MEMBER_DISCOUNT_PERCENT = 10;

export function findDiscount(code: string | undefined): DiscountCode | undefined {
  if (!code) return undefined;
  const normalised = code.trim().toUpperCase();
  return DISCOUNT_CODES.find((entry) => entry.code === normalised);
}

/**
 * Builds the itemised quote shown in the booking summary.
 *
 * Order matters and is the conventional one: room time, then extras, then
 * discounts off the subtotal, then tax on what remains. Applying tax before
 * the discount would overcharge; applying the discount to the taxed figure
 * would understate the tax owed.
 */
export function buildQuote(input: QuoteInput): Quote {
  const hours = Math.max(brand.booking.minimumHours, Math.floor(input.hours));
  const startHour = Number(input.startTime.split(':')[0] ?? 0);

  const baseRoom = Math.round(input.roomRate * hours);
  const lines: QuoteLine[] = [
    {
      label: `Studio time — ${hours} ${hours === 1 ? 'hour' : 'hours'}`,
      amount: baseRoom,
      note: `${input.roomRate}/hr`,
    },
  ];

  let peakCharge = 0;
  if (isPeakHour(startHour)) {
    peakCharge = Math.round((baseRoom * PEAK_SURCHARGE_PERCENT) / 100);
    lines.push({
      label: 'Evening session surcharge',
      amount: peakCharge,
      note: `+${PEAK_SURCHARGE_PERCENT}% after 18:00`,
    });
  }

  for (const addOn of input.addOns) {
    lines.push({ label: addOn.label, amount: addOn.price });
  }

  const subtotal = baseRoom + peakCharge + input.addOns.reduce((sum, a) => sum + a.price, 0);

  let discount = 0;
  const labels: string[] = [];

  if (input.member) {
    discount += Math.round((subtotal * MEMBER_DISCOUNT_PERCENT) / 100);
    labels.push(`Member ${MEMBER_DISCOUNT_PERCENT}%`);
  }

  const promo = findDiscount(input.discountCode);
  if (promo && subtotal >= (promo.minimum ?? 0)) {
    if (promo.percent) discount += Math.round((subtotal * promo.percent) / 100);
    if (promo.flat) discount += promo.flat;
    labels.push(promo.code);
  }

  // A stacked member discount plus a generous promo code must never invert the
  // total; cap the combined discount at the subtotal.
  discount = Math.min(discount, subtotal);

  const taxable = subtotal - discount;
  const tax = Math.round((taxable * brand.booking.taxPercent) / 100);
  const total = taxable + tax;

  // Members have a card on file and a standing agreement, so they are billed
  // after the session rather than holding the room with a deposit.
  const deposit = input.member
    ? 0
    : Math.round((total * brand.booking.depositPercent) / 100);

  return {
    lines,
    subtotal,
    discount,
    discountLabel: labels.length ? labels.join(' + ') : undefined,
    tax,
    total,
    deposit,
    balance: total - deposit,
  };
}
