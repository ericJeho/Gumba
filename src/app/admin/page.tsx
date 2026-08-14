import { Badge, Card, Section, SectionHeading } from '@/components/ui';
import { Price } from '@/components/ui/Price';
import { pageMetadata } from '@/lib/seo';
import { rooms } from '@/content/studio';
import { services } from '@/content/services';
import { team } from '@/content/people';

export const metadata = pageMetadata({
  title: 'Admin',
  description: 'Studio operations overview.',
  path: '/admin',
  noIndex: true,
});

/**
 * Studio operations overview.
 *
 * Figures are fixtures — this page exists to define the shape of the reporting
 * the studio actually needs, so the queries behind it have a target. It is
 * excluded from the sitemap and marked noindex; a real deployment puts it
 * behind role-based access before it sees live data.
 */

const REVENUE = [
  { month: 'Mar', value: 42 },
  { month: 'Apr', value: 51 },
  { month: 'May', value: 48 },
  { month: 'Jun', value: 63 },
  { month: 'Jul', value: 71 },
  { month: 'Aug', value: 58 },
];

const RECENT = [
  { ref: 'PS-K4M2QX', client: 'Ilse Marín', room: 'Control Room A', hours: 6, total: 1872, status: 'Confirmed' },
  { ref: 'PS-J8T5RD', client: 'Blue Arcade', room: 'The Live Room', hours: 10, total: 2394, status: 'Deposit paid' },
  { ref: 'PS-P3W9HN', client: 'Priya Raman', room: 'Podcast Room', hours: 3, total: 718, status: 'Confirmed' },
  { ref: 'PS-C7Y2LK', client: 'Ade Falana', room: 'Dolby Atmos Suite', hours: 4, total: 1632, status: 'Awaiting deposit' },
];

export default function AdminPage() {
  const peak = Math.max(...REVENUE.map((entry) => entry.value));

  return (
    <Section className="pt-36">
      <SectionHeading
        as="h1"
        eyebrow="Operations"
        title="Studio overview."
        lead="Bookings, revenue, utilisation and the queue — the numbers the studio is actually run on."
      />

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Revenue this month', value: '$58,400', delta: '+12% vs July' },
          { label: 'Bookings', value: '164', delta: '+9%' },
          { label: 'Room utilisation', value: '73%', delta: '+4 pts' },
          { label: 'Conversion', value: '31%', delta: 'quote → booking' },
        ].map((stat) => (
          <Card key={stat.label} className="p-6">
            <p className="text-sm text-ink-subtle">{stat.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-xs text-success">{stat.delta}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-7">
          <h2 className="font-display text-lg font-medium">Revenue, last six months</h2>

          {/* A CSS bar chart. The dataset is six points — reaching for a
              charting library here would cost more bytes than the whole page. */}
          <div className="mt-8 flex h-52 items-end gap-3" role="img" aria-label="Revenue by month">
            {REVENUE.map((entry) => (
              <div key={entry.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs tabular-nums text-ink-subtle">${entry.value}k</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand/40 to-brand"
                  style={{ height: `${(entry.value / peak) * 100}%` }}
                />
                <span className="text-xs text-ink-subtle">{entry.month}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-7">
          <h2 className="font-display text-lg font-medium">Room utilisation</h2>
          <ul className="mt-6 space-y-4">
            {rooms.slice(0, 6).map((room, index) => {
              // Fixture: derived from the room order so the bars are stable.
              const utilisation = 88 - index * 9;

              return (
                <li key={room.slug}>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="truncate text-ink-muted">{room.name}</span>
                    <span className="shrink-0 tabular-nums">{utilisation}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className={utilisation > 70 ? 'h-full bg-success' : 'h-full bg-warning'}
                      style={{ width: `${utilisation}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-2xl font-medium">Recent bookings</h2>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-ink-subtle">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Reference
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Client
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Room
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Hours
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Total
                </th>
                <th scope="col" className="py-3 pl-4 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {RECENT.map((booking) => (
                <tr key={booking.ref}>
                  <th scope="row" className="py-3.5 pr-4 text-left font-mono font-normal">
                    {booking.ref}
                  </th>
                  <td className="px-4 py-3.5 font-medium">{booking.client}</td>
                  <td className="px-4 py-3.5 text-ink-muted">{booking.room}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums">{booking.hours}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    <Price usd={booking.total} />
                  </td>
                  <td className="py-3.5 pl-4">
                    <Badge tone={booking.status === 'Awaiting deposit' ? 'warning' : 'success'}>
                      {booking.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h2 className="font-display text-lg font-medium">Most booked services</h2>
          <ol className="mt-4 space-y-2 text-sm">
            {services
              .filter((service) => service.popular)
              .map((service, index) => (
                <li key={service.slug} className="flex justify-between gap-4">
                  <span className="text-ink-muted">
                    {index + 1}. {service.name}
                  </span>
                  <span className="tabular-nums">{42 - index * 7}</span>
                </li>
              ))}
          </ol>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-medium">Engineer load</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {team.slice(0, 4).map((member, index) => (
              <li key={member.slug} className="flex justify-between gap-4">
                <span className="truncate text-ink-muted">{member.name}</span>
                <span className="tabular-nums">{34 - index * 5} hrs</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-medium">Needs attention</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
            <li>1 booking awaiting deposit past 48 hours</li>
            <li>2 invoices overdue</li>
            <li>Atmos workshop sold out — waitlist at 7</li>
            <li>Control Room B free 14 hours next week</li>
          </ul>
        </Card>
      </div>
    </Section>
  );
}
