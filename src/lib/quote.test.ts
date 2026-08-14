import { describe, expect, it } from 'vitest';
import { brand } from '@/config/brand';
import { buildQuote, findDiscount, MEMBER_DISCOUNT_PERCENT, PEAK_SURCHARGE_PERCENT } from '@/lib/quote';

const base = {
  roomRate: 200,
  hours: 4,
  startTime: '11:00',
  addOns: [],
};

describe('buildQuote', () => {
  it('charges the room rate for the booked hours', () => {
    const quote = buildQuote(base);
    expect(quote.subtotal).toBe(800);
    expect(quote.lines[0]?.amount).toBe(800);
  });

  it('enforces the minimum session length', () => {
    const quote = buildQuote({ ...base, hours: 1 });
    expect(quote.subtotal).toBe(200 * brand.booking.minimumHours);
  });

  it('adds the surcharge for evening starts but not daytime ones', () => {
    const day = buildQuote({ ...base, startTime: '14:00' });
    const night = buildQuote({ ...base, startTime: '20:00' });

    expect(day.subtotal).toBe(800);
    expect(night.subtotal).toBe(800 + (800 * PEAK_SURCHARGE_PERCENT) / 100);
  });

  it('treats an after-midnight start as peak', () => {
    const quote = buildQuote({ ...base, startTime: '01:00' });
    expect(quote.lines.some((line) => line.label.includes('surcharge'))).toBe(true);
  });

  it('itemises add-ons into the subtotal', () => {
    const quote = buildQuote({
      ...base,
      addOns: [
        { id: 'engineer', label: 'Senior engineer', price: 240 },
        { id: 'stems', label: 'Stem export', price: 60 },
      ],
    });

    expect(quote.subtotal).toBe(800 + 240 + 60);
    expect(quote.lines).toHaveLength(3);
  });

  it('applies a percentage code to the subtotal, before tax', () => {
    const quote = buildQuote({ ...base, discountCode: 'STUDENT' });

    expect(quote.discount).toBe(200);
    expect(quote.tax).toBe(Math.round((600 * brand.booking.taxPercent) / 100));
    expect(quote.total).toBe(600 + quote.tax);
  });

  it('ignores a flat code below its minimum spend', () => {
    const under = buildQuote({ roomRate: 100, hours: 2, startTime: '10:00', addOns: [], discountCode: 'NIGHTOWL' });
    const over = buildQuote({ ...base, discountCode: 'NIGHTOWL' });

    expect(under.discount).toBe(0);
    expect(over.discount).toBe(120);
  });

  it('is case-insensitive about codes and tolerates whitespace', () => {
    expect(findDiscount('  student ')?.code).toBe('STUDENT');
    expect(findDiscount('nope')).toBeUndefined();
  });

  it('stacks the member discount with a promo code', () => {
    const quote = buildQuote({ ...base, member: true, discountCode: 'LABEL10' });
    expect(quote.discount).toBe(80 + 80);
    expect(quote.discountLabel).toBe(`Member ${MEMBER_DISCOUNT_PERCENT}% + LABEL10`);
  });

  it('never discounts below zero', () => {
    const quote = buildQuote({
      roomRate: 60,
      hours: 2,
      startTime: '10:00',
      addOns: [],
      member: true,
      discountCode: 'REFER50',
    });

    expect(quote.discount).toBeLessThanOrEqual(quote.subtotal);
    expect(quote.total).toBeGreaterThanOrEqual(0);
  });

  it('splits the total into a deposit and a balance that add back up', () => {
    const quote = buildQuote(base);

    expect(quote.deposit).toBe(Math.round((quote.total * brand.booking.depositPercent) / 100));
    expect(quote.deposit + quote.balance).toBe(quote.total);
  });

  it('bills members after the session instead of taking a deposit', () => {
    const quote = buildQuote({ ...base, member: true });

    expect(quote.deposit).toBe(0);
    expect(quote.balance).toBe(quote.total);
  });
});
