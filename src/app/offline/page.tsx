import { WifiOff } from 'lucide-react';
import { Button, Section } from '@/components/ui';
import { pageMetadata } from '@/lib/seo';
import { brand } from '@/config/brand';

export const metadata = pageMetadata({
  title: 'Offline',
  description: 'You are offline.',
  path: '/offline',
  noIndex: true,
});

export default function OfflinePage() {
  return (
    <Section className="flex min-h-[70vh] items-center pt-36">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-surface-raised text-ink-subtle">
          <WifiOff className="size-8" aria-hidden />
        </span>

        <h1 className="mt-6 font-display text-3xl font-semibold">You are offline.</h1>
        <p className="mt-3 text-ink-muted">
          Pages you have already visited are still available. Booking and contact forms need a
          connection — they will work again as soon as you have one.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/">Back to the home page</Button>
          <Button href={`tel:${brand.contact.phoneRaw}`} variant="outline">
            Call {brand.contact.phone}
          </Button>
        </div>
      </div>
    </Section>
  );
}
