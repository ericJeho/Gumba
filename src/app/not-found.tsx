import Link from 'next/link';
import { Button, Section } from '@/components/ui';

export default function NotFound() {
  return (
    <Section className="flex min-h-[70vh] items-center pt-36">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-display text-8xl font-semibold text-gradient md:text-9xl">404</p>

        <h1 className="mt-6 font-display text-3xl font-semibold">
          Nothing recorded at this address.
        </h1>
        <p className="mt-3 text-ink-muted">
          The page has moved or never existed. The usual places are below.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/">Home</Button>
          <Button href="/services" variant="outline">
            Services
          </Button>
          <Button href="/book" variant="outline">
            Book a session
          </Button>
        </div>

        <p className="mt-8 text-sm text-ink-subtle">
          Certain something should be here?{' '}
          <Link href="/contact" className="text-brand hover:underline">
            Tell us
          </Link>{' '}
          and we will fix the link.
        </p>
      </div>
    </Section>
  );
}
