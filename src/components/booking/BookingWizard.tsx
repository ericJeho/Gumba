'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Loader2,
  Printer,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { brand } from '@/config/brand';
import { formatDate, formatMoney, formatTime, toDateKey } from '@/lib/format';
import { getDayAvailability, isBlockAvailable } from '@/lib/availability';
import { ADD_ONS, buildQuote, findDiscount } from '@/lib/quote';
import { useCurrency } from '@/components/layout/Preferences';
import { Badge, Button, Field, inputClass } from '@/components/ui';
import { ServiceIcon } from '@/components/ui/ServiceIcon';
import { Calendar } from '@/components/booking/Calendar';
import { rooms } from '@/content/studio';
import { services } from '@/content/services';

/**
 * The booking flow.
 *
 * Five steps, with the running quote visible from the second one onwards.
 * Every price shown here is produced by lib/quote, which the API also uses —
 * so the figure a visitor agrees to is the figure the server calculates, and a
 * disagreement between them is impossible rather than merely unlikely.
 */

type Step = 'service' | 'room' | 'when' | 'details' | 'confirm';

const STEPS: { id: Step; label: string }[] = [
  { id: 'service', label: 'Service' },
  { id: 'room', label: 'Room' },
  { id: 'when', label: 'Date & time' },
  { id: 'details', label: 'Your details' },
  { id: 'confirm', label: 'Confirm' },
];

type Result = {
  reference: string;
  message: string;
  quote: ReturnType<typeof buildQuote>;
};

export function BookingWizard({ initialService, initialRoom }: { initialService?: string; initialRoom?: string }) {
  const currency = useCurrency();

  const [step, setStep] = useState<Step>(initialService ? 'room' : 'service');
  const [serviceSlug, setServiceSlug] = useState(initialService ?? '');
  const [roomSlug, setRoomSlug] = useState(initialRoom ?? '');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [hours, setHours] = useState(4);
  const [addOns, setAddOns] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [member, setMember] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const service = services.find((entry) => entry.slug === serviceSlug);
  const room = rooms.find((entry) => entry.slug === roomSlug);

  /**
   * Rooms this service is actually delivered in.
   *
   * A service with no room list (distribution, marketing) has no room step at
   * all — offering a studio room for a distribution job is a way to take
   * someone's money for something they cannot use.
   */
  const eligibleRooms = useMemo(() => {
    if (!service) return rooms;
    if (service.rooms.length === 0) return [];
    return rooms.filter((entry) => service.rooms.includes(entry.slug));
  }, [service]);

  // If the chosen service does not run in the chosen room, drop the room
  // rather than quietly quoting for a room that cannot host the session.
  useEffect(() => {
    if (roomSlug && eligibleRooms.length > 0 && !eligibleRooms.some((entry) => entry.slug === roomSlug)) {
      setRoomSlug('');
    }
  }, [eligibleRooms, roomSlug]);

  const day = useMemo(
    () => (roomSlug && date ? getDayAvailability(roomSlug, date) : null),
    [roomSlug, date],
  );

  const selectedAddOns = ADD_ONS.filter((addOn) => addOns.includes(addOn.id));

  const quote = useMemo(
    () =>
      room && time
        ? buildQuote({
            roomRate: room.hourlyRate,
            hours,
            startTime: time,
            addOns: selectedAddOns,
            discountCode: code,
            member,
          })
        : null,
    // selectedAddOns is derived from addOns each render; depending on the id
    // list keeps the memo stable instead of recomputing on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [room, time, hours, addOns, code, member],
  );

  const stepIndex = STEPS.findIndex((entry) => entry.id === step);

  const canContinue = {
    service: Boolean(serviceSlug),
    room: eligibleRooms.length === 0 || Boolean(roomSlug),
    when: Boolean(date && time && room && isBlockAvailable(room.slug, date, time, hours)),
    details: form.name.trim().length >= 2 && /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(form.email.trim()),
    confirm: true,
  }[step];

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.id);
  };

  const goBack = () => {
    const previous = STEPS[stepIndex - 1];
    if (previous) setStep(previous.id);
  };

  async function submit() {
    setSubmitting(true);
    setFailure(null);
    setErrors({});

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: roomSlug,
          service: serviceSlug,
          date,
          time,
          hours,
          addOns: selectedAddOns,
          discountCode: code,
          member,
          ...form,
        }),
      });

      const payload = (await response.json()) as Partial<Result> & {
        message?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        setErrors(payload.errors ?? {});
        setFailure(payload.message ?? 'Something went wrong.');
        // A taken slot has to send the visitor back to pick another one —
        // leaving them on the confirm step with an error they cannot act on is
        // the worst version of this failure.
        if (response.status === 409) {
          setTime(null);
          setStep('when');
        }
        return;
      }

      setResult(payload as Result);
    } catch {
      setFailure('We could not reach the studio. Please try again, or call us.');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return <Confirmation result={result} room={room?.name ?? ''} date={date} time={time} hours={hours} />;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div>
        {/* Progress. An ordered list, so the position is announced rather than
            merely coloured. */}
        <ol className="flex flex-wrap gap-x-2 gap-y-3">
          {STEPS.map((entry, index) => {
            const done = index < stepIndex;
            const active = index === stepIndex;

            return (
              <li key={entry.id} className="flex items-center gap-2">
                <button
                  type="button"
                  // Only completed steps are re-enterable; jumping ahead would
                  // skip the validation the later steps depend on.
                  disabled={index > stepIndex}
                  onClick={() => setStep(entry.id)}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors',
                    active && 'bg-brand/12 text-brand',
                    done && 'text-ink-muted hover:text-ink',
                    !active && !done && 'text-ink-subtle',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full text-[0.65rem]',
                      done ? 'bg-success text-canvas' : active ? 'bg-brand text-canvas' : 'bg-line',
                    )}
                  >
                    {done ? <Check className="size-3" /> : index + 1}
                  </span>
                  <span className="hidden sm:inline">{entry.label}</span>
                </button>
                {index < STEPS.length - 1 ? (
                  <span aria-hidden className="hidden h-px w-4 bg-line sm:block" />
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {step === 'service' ? (
                <fieldset>
                  <legend className="font-display text-2xl font-medium">What do you need?</legend>
                  <p className="mt-2 text-sm text-ink-muted">
                    Not sure? <Link href="/#quiz" className="text-brand hover:underline">Take the two-minute quiz</Link>.
                  </p>

                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    {services.map((entry) => (
                      <label
                        key={entry.slug}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all',
                          serviceSlug === entry.slug
                            ? 'border-brand bg-brand/8'
                            : 'border-line hover:border-line-strong',
                        )}
                      >
                        <input
                          type="radio"
                          name="service"
                          value={entry.slug}
                          checked={serviceSlug === entry.slug}
                          onChange={() => setServiceSlug(entry.slug)}
                          className="sr-only"
                        />
                        <span className="mt-0.5 text-brand">
                          <ServiceIcon name={entry.icon} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{entry.name}</span>
                          <span className="block text-xs text-ink-subtle">
                            from {formatMoney(entry.price, currency)} / {entry.priceUnit}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {step === 'room' ? (
                <fieldset>
                  <legend className="font-display text-2xl font-medium">Which room?</legend>

                  {eligibleRooms.length === 0 ? (
                    <p className="mt-4 rounded-xl border border-line bg-surface p-5 text-sm text-ink-muted">
                      {service?.name} is delivered remotely — there is no room to book. Carry on and
                      we will schedule the kick-off call instead.
                    </p>
                  ) : (
                    <div className="mt-6 grid gap-3">
                      {eligibleRooms.map((entry) => (
                        <label
                          key={entry.slug}
                          className={cn(
                            'flex cursor-pointer items-start gap-4 rounded-xl border p-5 transition-all',
                            roomSlug === entry.slug
                              ? 'border-brand bg-brand/8'
                              : 'border-line hover:border-line-strong',
                          )}
                        >
                          <input
                            type="radio"
                            name="room"
                            value={entry.slug}
                            checked={roomSlug === entry.slug}
                            onChange={() => setRoomSlug(entry.slug)}
                            className="sr-only"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{entry.name}</span>
                              <Badge>{entry.kind}</Badge>
                            </span>
                            <span className="mt-1 block text-sm text-ink-muted">{entry.summary}</span>
                            <span className="mt-2 block text-xs text-ink-subtle">
                              Up to {entry.capacity} people · {entry.size} sq ft
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block font-medium">
                              {formatMoney(entry.hourlyRate, currency)}
                            </span>
                            <span className="block text-xs text-ink-subtle">per hour</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>
              ) : null}

              {step === 'when' ? (
                <div>
                  <h2 className="font-display text-2xl font-medium">When?</h2>

                  <div className="mt-6 grid gap-8 md:grid-cols-2">
                    {room ? (
                      <Calendar
                        roomSlug={room.slug}
                        month={month}
                        onMonthChange={setMonth}
                        selected={date}
                        onSelect={(next) => {
                          setDate(next);
                          setTime(null);
                        }}
                      />
                    ) : (
                      <p className="text-sm text-ink-muted">Choose a room first.</p>
                    )}

                    <div>
                      <div>
                        <label htmlFor="session-length" className="mb-2 block text-sm font-medium">
                          Session length
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            id="session-length"
                            type="range"
                            min={brand.booking.minimumHours}
                            max={12}
                            step={1}
                            value={hours}
                            onChange={(event) => setHours(Number(event.target.value))}
                            className="h-1 flex-1 accent-[hsl(var(--brand))]"
                          />
                          <span className="w-16 shrink-0 text-right text-sm tabular-nums">
                            {hours} hrs
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-ink-subtle">
                          Minimum {brand.booking.minimumHours} hours. Longer blocks get the day rate
                          automatically at 10 hours.
                        </p>
                      </div>

                      <div className="mt-8">
                        <h3 className="mb-3 text-sm font-medium">
                          {date ? `Start time — ${formatDate(date)}` : 'Pick a date first'}
                        </h3>

                        {day && day.slots.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {day.slots.map((slot) => {
                              // A slot is only offerable if the whole block fits.
                              const fits =
                                slot.available && isBlockAvailable(room!.slug, date!, slot.time, hours);

                              return (
                                <button
                                  key={slot.time}
                                  type="button"
                                  disabled={!fits}
                                  onClick={() => setTime(slot.time)}
                                  className={cn(
                                    'relative rounded-lg border px-2 py-2.5 text-sm tabular-nums transition-all',
                                    time === slot.time
                                      ? 'border-brand bg-brand text-canvas'
                                      : fits
                                        ? 'border-line hover:border-brand'
                                        : 'cursor-not-allowed border-line/50 text-ink-subtle/40 line-through',
                                  )}
                                >
                                  {formatTime(slot.time)}
                                  {slot.peak && fits ? (
                                    <span
                                      aria-label="Evening rate"
                                      className="absolute right-1 top-1 size-1.5 rounded-full bg-warning"
                                    />
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-ink-subtle">
                            {date ? 'Nothing free that day — try another.' : 'No date selected.'}
                          </p>
                        )}

                        {day?.slots.some((slot) => slot.peak) ? (
                          <p className="mt-3 flex items-center gap-2 text-xs text-ink-subtle">
                            <span className="size-1.5 rounded-full bg-warning" aria-hidden />
                            Evening sessions carry a 20% surcharge, shown in the quote.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <fieldset className="mt-10">
                    <legend className="text-sm font-medium">Add to the session</legend>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {ADD_ONS.map((addOn) => (
                        <label
                          key={addOn.id}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm transition-colors',
                            addOns.includes(addOn.id)
                              ? 'border-brand bg-brand/8'
                              : 'border-line hover:border-line-strong',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={addOns.includes(addOn.id)}
                            onChange={() =>
                              setAddOns((current) =>
                                current.includes(addOn.id)
                                  ? current.filter((id) => id !== addOn.id)
                                  : [...current, addOn.id],
                              )
                            }
                            className="size-4 accent-[hsl(var(--brand))]"
                          />
                          <span className="min-w-0 flex-1">{addOn.label}</span>
                          <span className="shrink-0 text-ink-subtle">
                            +{formatMoney(addOn.price, currency)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              ) : null}

              {step === 'details' ? (
                <div>
                  <h2 className="font-display text-2xl font-medium">Your details</h2>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field label="Name" required error={errors.name}>
                      {(props) => (
                        <input
                          {...props}
                          value={form.name}
                          onChange={(event) => setForm({ ...form, name: event.target.value })}
                          autoComplete="name"
                          className={inputClass}
                        />
                      )}
                    </Field>

                    <Field label="Email" required error={errors.email} hint="Where the confirmation goes.">
                      {(props) => (
                        <input
                          {...props}
                          type="email"
                          value={form.email}
                          onChange={(event) => setForm({ ...form, email: event.target.value })}
                          autoComplete="email"
                          className={inputClass}
                        />
                      )}
                    </Field>

                    <Field label="Phone" hint="For SMS confirmation and session-day contact.">
                      {(props) => (
                        <input
                          {...props}
                          type="tel"
                          value={form.phone}
                          onChange={(event) => setForm({ ...form, phone: event.target.value })}
                          autoComplete="tel"
                          className={inputClass}
                        />
                      )}
                    </Field>

                    <div className="sm:col-span-2">
                      <Field
                        label="Anything we should know?"
                        hint="Headcount, gear list, references, access needs — anything that helps us set the room."
                      >
                        {(props) => (
                          <textarea
                            {...props}
                            rows={4}
                            value={form.notes}
                            onChange={(event) => setForm({ ...form, notes: event.target.value })}
                            className={cn(inputClass, 'resize-y')}
                          />
                        )}
                      </Field>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Field label="Promo or referral code">
                      {(props) => (
                        <div className="relative">
                          <input
                            {...props}
                            value={code}
                            onChange={(event) => setCode(event.target.value.toUpperCase())}
                            placeholder="FIRSTSESSION"
                            className={cn(inputClass, 'pr-10 uppercase')}
                          />
                          {code && findDiscount(code) ? (
                            <Check className="absolute right-3 top-3.5 size-4 text-success" aria-hidden />
                          ) : null}
                        </div>
                      )}
                    </Field>

                    <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-line p-3.5 text-sm">
                      <input
                        type="checkbox"
                        checked={member}
                        onChange={(event) => setMember(event.target.checked)}
                        className="size-4 accent-[hsl(var(--brand))]"
                      />
                      I am a studio member
                    </label>
                  </div>

                  {code && !findDiscount(code) ? (
                    <p className="mt-2 text-xs text-warning">
                      We do not recognise that code — the booking will go through without it.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step === 'confirm' ? (
                <div>
                  <h2 className="font-display text-2xl font-medium">Confirm and pay the deposit</h2>

                  <dl className="mt-6 divide-y divide-line rounded-panel border border-line">
                    {[
                      { label: 'Service', value: service?.name ?? '—' },
                      { label: 'Room', value: room?.name ?? 'Remote' },
                      { label: 'Date', value: date ? formatDate(date) : '—' },
                      {
                        label: 'Time',
                        value: time ? `${formatTime(time)} · ${hours} hours` : '—',
                      },
                      { label: 'Name', value: form.name },
                      { label: 'Email', value: form.email },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between gap-6 px-5 py-3.5 text-sm">
                        <dt className="text-ink-muted">{row.label}</dt>
                        <dd className="text-right font-medium">{row.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-6 rounded-panel border border-line bg-surface/60 p-5">
                    <h3 className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="size-4 text-brand" aria-hidden />
                      Payment
                    </h3>
                    <p className="mt-2 text-sm text-ink-muted">
                      {quote?.deposit
                        ? `A ${brand.booking.depositPercent}% deposit of ${formatMoney(quote.deposit, currency)} holds the room. The balance is due on the day.`
                        : 'As a member you pay nothing now — the session is billed afterwards.'}
                    </p>

                    <ul className="mt-4 flex flex-wrap gap-2">
                      {['Card', 'Apple Pay', 'Google Pay', 'PayPal', 'Bank transfer'].map((method) => (
                        <li
                          key={method}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-muted"
                        >
                          {method}
                        </li>
                      ))}
                    </ul>

                    <p className="mt-4 flex items-start gap-2 text-xs text-ink-subtle">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      Card details are handled by our payment provider and never touch this site.
                      Free cancellation up to {brand.booking.cancellationHours} hours before the
                      session.
                    </p>
                  </div>

                  {failure ? (
                    <p role="alert" className="mt-5 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
                      {failure}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
          <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0}>
            <ArrowLeft className="size-4" />
            Back
          </Button>

          {step === 'confirm' ? (
            <Button onClick={() => void submit()} disabled={submitting} size="lg">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
              {quote?.deposit
                ? `Pay ${formatMoney(quote.deposit, currency)} deposit`
                : 'Confirm booking'}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canContinue}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-panel border border-line bg-surface/70 p-6">
          <h2 className="font-display text-lg font-medium">Your quote</h2>

          {quote ? (
            <>
              <dl className="mt-5 space-y-2.5 text-sm">
                {quote.lines.map((line) => (
                  <div key={line.label} className="flex justify-between gap-4">
                    <dt className="min-w-0 text-ink-muted">
                      {line.label}
                      {line.note ? (
                        <span className="block text-xs text-ink-subtle">{line.note}</span>
                      ) : null}
                    </dt>
                    <dd className="shrink-0 tabular-nums">{formatMoney(line.amount, currency)}</dd>
                  </div>
                ))}

                {quote.discount > 0 ? (
                  <div className="flex justify-between gap-4 text-success">
                    <dt className="flex items-center gap-1.5">
                      <Ticket className="size-3.5" aria-hidden />
                      {quote.discountLabel}
                    </dt>
                    <dd className="tabular-nums">−{formatMoney(quote.discount, currency)}</dd>
                  </div>
                ) : null}

                <div className="flex justify-between gap-4 border-t border-line pt-2.5 text-ink-muted">
                  <dt>Tax ({brand.booking.taxPercent}%)</dt>
                  <dd className="tabular-nums">{formatMoney(quote.tax, currency)}</dd>
                </div>

                <div className="flex justify-between gap-4 border-t border-line pt-2.5 text-base font-medium">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatMoney(quote.total, currency)}</dd>
                </div>

                <div className="flex justify-between gap-4 text-brand">
                  <dt>Due now</dt>
                  <dd className="tabular-nums">{formatMoney(quote.deposit, currency)}</dd>
                </div>

                {quote.balance > 0 ? (
                  <div className="flex justify-between gap-4 text-xs text-ink-subtle">
                    <dt>Balance on the day</dt>
                    <dd className="tabular-nums">{formatMoney(quote.balance, currency)}</dd>
                  </div>
                ) : null}
              </dl>

              {currency !== 'USD' ? (
                <p className="mt-4 text-xs text-ink-subtle">
                  Converted from USD at an indicative rate. You will be charged in USD.
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-4 text-sm text-ink-subtle">
              Pick a room and a start time and the quote appears here — itemised, before you pay
              anything.
            </p>
          )}

          <div className="mt-6 border-t border-line pt-5 text-xs text-ink-subtle">
            <p>Questions before you book?</p>
            <a href={`tel:${brand.contact.phoneRaw}`} className="mt-1 block text-brand hover:underline">
              {brand.contact.phone}
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Confirmation({
  result,
  room,
  date,
  time,
  hours,
}: {
  result: Result;
  room: string;
  date: string | null;
  time: string | null;
  hours: number;
}) {
  const currency = useCurrency();

  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
        <Check className="size-8" aria-hidden />
      </span>

      <h2 className="mt-6 font-display text-3xl font-semibold">You are booked.</h2>
      <p className="mt-3 text-ink-muted" role="status">
        {result.message}
      </p>

      <div className="mt-8 rounded-panel border border-line bg-surface/70 p-6 text-left">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-subtle">Reference</p>
            <p className="font-display text-2xl font-semibold tracking-wider">{result.reference}</p>
          </div>
          {/* Doubles as the studio-door check-in code. */}
          <QrPlaceholder value={result.reference} />
        </div>

        <dl className="mt-4 space-y-2.5 text-sm">
          {[
            { label: 'Room', value: room || 'Remote' },
            { label: 'Date', value: date ? formatDate(date) : '—' },
            { label: 'Time', value: time ? `${formatTime(time)} · ${hours} hours` : '—' },
            { label: 'Paid now', value: formatMoney(result.quote.deposit, currency) },
            { label: 'Balance on the day', value: formatMoney(result.quote.balance, currency) },
          ].map((row) => (
            <div key={row.label} className="flex justify-between gap-6">
              <dt className="text-ink-muted">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3" data-print="hide">
        <Button href="/dashboard">Go to your dashboard</Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print confirmation
        </Button>
      </div>

      <p className="mt-6 text-xs text-ink-subtle">
        Free cancellation or reschedule up to {brand.booking.cancellationHours} hours before the
        session. Show the code above at the door.
      </p>
    </div>
  );
}

/**
 * A QR-styled block generated from the reference.
 *
 * Not a scannable QR code — encoding one properly needs a generator library,
 * and shipping one for a decorative element on a confirmation screen is not a
 * trade worth making. The check-in flow reads the printed reference; swap this
 * for a real encoder when the door scanner exists.
 */
function QrPlaceholder({ value }: { value: string }) {
  const cells = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;

    return Array.from({ length: 49 }, (_, index) => {
      hash = (hash * 1103515245 + 12345) >>> 0;
      return ((hash >> (index % 16)) & 1) === 1;
    });
  }, [value]);

  return (
    <div
      aria-hidden
      className="grid size-20 grid-cols-7 gap-px rounded-lg bg-ink/5 p-1.5"
      title={`Check-in code ${value}`}
    >
      {cells.map((filled, index) => (
        <span
          key={index}
          className={cn('rounded-[1px]', filled ? 'bg-ink' : 'bg-transparent')}
        />
      ))}
    </div>
  );
}
