'use client';

import Link from 'next/link';
import {
  createElement,
  forwardRef,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { ChevronDown, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useInView, useReducedMotion } from '@/lib/hooks';

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */

const buttonVariants = {
  primary:
    'bg-brand text-canvas hover:brightness-110 shadow-[0_10px_40px_-12px_hsl(var(--brand)/0.7)]',
  accent: 'bg-accent text-canvas hover:brightness-110',
  outline: 'border border-line-strong bg-transparent text-ink hover:border-brand hover:text-brand',
  ghost: 'bg-transparent text-ink-muted hover:bg-surface-raised hover:text-ink',
  glass: 'glass text-ink hover:border-brand/50',
} as const;

const buttonSizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-14 px-8 text-base',
} as const;

type ButtonProps = {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  /** Renders as a Next link when set. */
  href?: string;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'className'>;

/**
 * The one button in the system.
 *
 * It renders as an anchor when given `href` — navigation must be a real link so
 * it can be opened in a new tab, previewed on hover and crawled, none of which
 * a button with an onClick handler supports.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', href, children, className, ...props },
  ref,
) {
  const classes = cn(
    'inline-flex select-none items-center justify-center gap-2 rounded-full font-medium',
    'transition-all duration-200 active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-50',
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );

  if (href) {
    const external = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:');
    if (external) {
      return (
        <a href={href} className={classes} rel="noopener noreferrer" target="_blank">
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
});

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  children,
  interactive,
  ...props
}: { interactive?: boolean } & ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface/70 p-6 backdrop-blur-sm',
        interactive &&
          'transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  className,
  children,
  tone = 'default',
}: {
  className?: string;
  children: ReactNode;
  tone?: 'default' | 'brand' | 'success' | 'warning';
}) {
  const tones = {
    default: 'border-line-strong text-ink-muted',
    brand: 'border-brand/40 bg-brand/10 text-brand',
    success: 'border-success/40 bg-success/10 text-success',
    warning: 'border-warning/40 bg-warning/10 text-warning',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

export function Section({
  className,
  children,
  id,
  tight,
}: {
  className?: string;
  children: ReactNode;
  id?: string;
  tight?: boolean;
}) {
  return (
    <section id={id} className={cn(tight ? 'py-16' : 'py-24 md:py-32', className)}>
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'left',
  as = 'h2',
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow ? (
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
      ) : null}
      {createElement(
        as,
        {
          className: cn(
            'font-display font-semibold leading-[1.05]',
            as === 'h1' ? 'text-4xl md:text-6xl' : 'text-3xl md:text-5xl',
          ),
        },
        title,
      )}
      {lead ? <p className="mt-5 text-lg leading-relaxed text-ink-muted">{lead}</p> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reveal                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Fades and lifts its children the first time they scroll into view.
 *
 * Content renders regardless — the animation only ever changes opacity and
 * transform, never `display`, so a visitor with reduced motion or a failed
 * IntersectionObserver still sees everything.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  ...props
}: { children: ReactNode; delay?: number; className?: string } & Omit<
  HTMLMotionProps<'div'>,
  'children' | 'className'
>) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Accordion                                                                   */
/* -------------------------------------------------------------------------- */

export function Accordion({
  items,
  className,
}: {
  items: { question: string; answer: string }[];
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className={cn('divide-y divide-line border-y border-line', className)}>
      {items.map((item, index) => {
        const expanded = open === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : index)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left"
              >
                <span className="font-display text-lg font-medium">{item.question}</span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    'size-5 shrink-0 text-ink-subtle transition-transform duration-300',
                    expanded && 'rotate-180 text-brand',
                  )}
                />
              </button>
            </h3>
            {/* Kept in the DOM and hidden, so the answers are findable with
                the browser's own find-in-page and readable by crawlers. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!expanded}
              className="pb-6 pr-10 text-ink-muted"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small pieces                                                                */
/* -------------------------------------------------------------------------- */

export function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div>
      <div className="font-display text-4xl font-semibold text-gradient md:text-5xl">{value}</div>
      <div className="mt-2 text-sm font-medium">{label}</div>
      {sub ? <div className="mt-1 text-xs text-ink-subtle">{sub}</div> : null}
    </div>
  );
}

export function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden
          className={cn('size-4', star <= value ? 'fill-warning text-warning' : 'text-line-strong')}
        />
      ))}
    </div>
  );
}

/** A gradient panel used wherever real photography would go. */
export function GradientPanel({
  hue,
  className,
  children,
  seed = 0,
}: {
  hue: [number, number];
  className?: string;
  children?: ReactNode;
  seed?: number;
}) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-card', className)}
      style={{
        backgroundImage: `radial-gradient(120% 120% at ${20 + seed * 12}% 0%, hsl(${hue[0]} 80% 45% / 0.55), transparent 60%), radial-gradient(110% 110% at 100% 100%, hsl(${hue[1]} 80% 50% / 0.45), transparent 55%), linear-gradient(160deg, hsl(var(--surface-raised)), hsl(var(--surface)))`,
      }}
    >
      {/* A faint noise wash stops large flat gradients from banding on 8-bit
          displays, which is where they look cheapest. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode;
  required?: boolean;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
        {required ? (
          <span className="ml-1 text-brand" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && !error ? (
        <p id={hintId} className="mt-1.5 text-xs text-ink-subtle">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  'w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-subtle focus:border-brand';
