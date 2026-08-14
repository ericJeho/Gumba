'use client';

import { useState, type FormEvent } from 'react';
import { Check, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, Field, inputClass } from '@/components/ui';
import { services } from '@/content/services';

/**
 * The contact form.
 *
 * Progressive in the ways that matter: real labels, real autocomplete tokens,
 * inline errors tied to their fields by aria-describedby, and a status region
 * that announces the result. The honeypot field is hidden from sight but not
 * from the accessibility tree by `display:none` alone — it carries
 * aria-hidden and tabindex="-1" so a screen-reader user never lands on it.
 */
export function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));

    setState('sending');
    setErrors({});

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const payload = (await response.json()) as {
        message?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        setErrors(payload.errors ?? {});
        setMessage(payload.message ?? 'Something went wrong.');
        setState('idle');
        return;
      }

      setMessage(payload.message ?? 'Thanks — we will be in touch.');
      setState('sent');
    } catch {
      setMessage('We could not reach the studio. Please call us instead.');
      setState('idle');
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-panel border border-success/40 bg-success/10 p-8 text-center" role="status">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/20 text-success">
          <Check className="size-7" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-2xl font-medium">Message sent</h2>
        <p className="mt-2 text-ink-muted">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
      <Field label="Name" required error={errors.name}>
        {(props) => <input {...props} name="name" autoComplete="name" className={inputClass} />}
      </Field>

      <Field label="Email" required error={errors.email}>
        {(props) => (
          <input {...props} name="email" type="email" autoComplete="email" className={inputClass} />
        )}
      </Field>

      <Field label="Phone" hint="Optional — faster for anything time-sensitive.">
        {(props) => <input {...props} name="phone" type="tel" autoComplete="tel" className={inputClass} />}
      </Field>

      <Field label="What is it about?">
        {(props) => (
          <select {...props} name="service" defaultValue="" className={inputClass}>
            <option value="">General enquiry</option>
            {services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {service.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="sm:col-span-2">
        <Field
          label="Your message"
          required
          error={errors.message}
          hint="The more you tell us about the project, the more useful our reply will be."
        >
          {(props) => (
            <textarea {...props} name="message" rows={6} className={cn(inputClass, 'resize-y')} />
          )}
        </Field>
      </div>

      {/* Honeypot. Hidden from sight, from the tab order and from assistive
          technology — only an automated submitter fills it in. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" size="lg" disabled={state === 'sending'}>
          {state === 'sending' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Send message
        </Button>

        {message && state === 'idle' ? (
          <p role="alert" className="text-sm text-danger">
            {message}
          </p>
        ) : (
          <p className="text-sm text-ink-subtle">An engineer replies within one business day.</p>
        )}
      </div>
    </form>
  );
}
