import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  FolderOpen,
  MessageSquare,
  Upload,
} from 'lucide-react';
import { Badge, Button, Card, Section, SectionHeading } from '@/components/ui';
import { Price } from '@/components/ui/Price';
import { pageMetadata } from '@/lib/seo';
import { formatDate } from '@/lib/format';

export const metadata = pageMetadata({
  title: 'Client dashboard',
  description: 'Track your projects, upload and download files, review invoices and manage bookings.',
  path: '/dashboard',
  // Behind a login in a real deployment; there is nothing here for a crawler.
  noIndex: true,
});

/**
 * The client dashboard.
 *
 * Rendered from fixture data. Authentication, file storage and the project
 * database are the three integrations this page waits on — the layout, the
 * states and the copy are what a design review needs, and none of them change
 * when the data becomes real.
 */

const PROJECTS = [
  {
    name: 'Paper Cathedral — Mixing',
    stage: 'Revision 1',
    progress: 72,
    due: '2026-08-28',
    engineer: 'Dana Okoye',
    steps: ['Stems received', 'Static balance', 'First mix delivered', 'Revision 1', 'Master'],
    completed: 3,
  },
  {
    name: 'Single — "Undertow"',
    stage: 'Tracking',
    progress: 35,
    due: '2026-09-14',
    engineer: 'Marcus Vale',
    steps: ['Pre-production', 'Tracking', 'Overdubs', 'Mix', 'Master'],
    completed: 1,
  },
];

const FILES = [
  { name: 'paper-cathedral_mix-v3.wav', size: '218 MB', when: '2026-08-11', kind: 'Mix' },
  { name: 'paper-cathedral_stems.zip', size: '3.4 GB', when: '2026-08-04', kind: 'Stems' },
  { name: 'undertow_rough-01.mp3', size: '9 MB', when: '2026-08-02', kind: 'Rough' },
];

const INVOICES = [
  { ref: 'INV-2481', amount: 750, status: 'Paid', date: '2026-08-04' },
  { ref: 'INV-2503', amount: 440, status: 'Due 28 Aug', date: '2026-08-14' },
];

export default function DashboardPage() {
  return (
    <Section className="pt-36">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          as="h1"
          eyebrow="Your account"
          title="Everything in one place."
          lead="Projects, files, invoices and bookings — and a direct line to the engineer working on your record."
        />
        <Button href="/book">Book another session</Button>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active projects', value: '2', icon: FolderOpen },
          { label: 'Next session', value: '22 Aug', icon: CalendarDays },
          { label: 'Files stored', value: '18', icon: FileText },
          { label: 'Unread messages', value: '1', icon: MessageSquare },
        ].map((stat) => (
          <Card key={stat.label} className="p-6">
            <stat.icon className="size-5 text-brand" aria-hidden />
            <p className="mt-4 font-display text-3xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-sm text-ink-subtle">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h2 className="font-display text-2xl font-medium">Projects</h2>

          <div className="mt-5 space-y-5">
            {PROJECTS.map((project) => (
              <Card key={project.name} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="mt-1 text-sm text-ink-subtle">
                      {project.engineer} · due {formatDate(project.due)}
                    </p>
                  </div>
                  <Badge tone="brand">{project.stage}</Badge>
                </div>

                <div className="mt-5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>

                  {/* The milestone strip. A percentage alone tells a client
                      nothing about what happens next. */}
                  <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                    {project.steps.map((step, stepIndex) => (
                      <li
                        key={step}
                        className={
                          stepIndex < project.completed
                            ? 'text-success'
                            : stepIndex === project.completed
                              ? 'font-medium text-brand'
                              : 'text-ink-subtle'
                        }
                      >
                        {stepIndex < project.completed ? '✓ ' : ''}
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Button size="sm" variant="outline">
                    Leave feedback
                  </Button>
                  <Button size="sm" variant="ghost">
                    Request a revision
                  </Button>
                  <Button size="sm" variant="ghost">
                    Message {project.engineer.split(' ')[0]}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <h2 className="mt-12 font-display text-2xl font-medium">Files</h2>

          <Card className="mt-5 border-dashed p-8 text-center">
            <Upload className="mx-auto size-8 text-ink-subtle" aria-hidden />
            <p className="mt-3 font-medium">Drop files here</p>
            <p className="mt-1 text-sm text-ink-subtle">
              Up to 100 GB per file, resumable, versioned. Or connect Drive, Dropbox or OneDrive.
            </p>
            <Button size="sm" variant="outline" className="mt-4">
              Choose files
            </Button>
          </Card>

          <ul className="mt-5 divide-y divide-line border-y border-line">
            {FILES.map((file) => (
              <li key={file.name} className="flex items-center gap-4 py-3.5">
                <FileText className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{file.name}</span>
                  <span className="block text-xs text-ink-subtle">
                    {file.kind} · {file.size} · {formatDate(file.when)}
                  </span>
                </span>
                <Button size="sm" variant="ghost">
                  Download
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-medium">Invoices</h2>
            <ul className="mt-4 divide-y divide-line">
              {INVOICES.map((invoice) => (
                <li key={invoice.ref} className="flex items-center justify-between gap-4 py-3">
                  <span>
                    <span className="block font-mono text-sm">{invoice.ref}</span>
                    <span className="block text-xs text-ink-subtle">{formatDate(invoice.date)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-medium">
                      <Price usd={invoice.amount} />
                    </span>
                    <span
                      className={
                        invoice.status === 'Paid'
                          ? 'block text-xs text-success'
                          : 'block text-xs text-warning'
                      }
                    >
                      {invoice.status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-medium">Contracts</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="text-ink-muted">Mixing agreement</span>
                <Badge tone="success">Signed</Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-ink-muted">Split sheet — Undertow</span>
                <Badge tone="warning">Awaiting you</Badge>
              </li>
            </ul>
            <Button size="sm" variant="outline" className="mt-4 w-full">
              Sign digitally
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-medium">Release tracking</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                { label: 'Streams this month', value: '184,203' },
                { label: 'Royalties pending', value: '$1,247' },
                { label: 'Platforms live', value: '31' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{row.label}</dt>
                  <dd className="font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
            >
              Full report
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </Card>
        </aside>
      </div>
    </Section>
  );
}
