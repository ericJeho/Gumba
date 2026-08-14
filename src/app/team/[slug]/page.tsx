import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarClock } from 'lucide-react';
import { Badge, Button, Card, GradientPanel, Section } from '@/components/ui';
import { Price } from '@/components/ui/Price';
import { SocialIcon } from '@/components/ui/Logo';
import { breadcrumbSchema, jsonLd, pageMetadata, personSchema } from '@/lib/seo';
import { getTeamMember, team } from '@/content/people';
import { getService } from '@/content/services';
import { projects } from '@/content/work';

export function generateStaticParams() {
  return team.map((member) => ({ slug: member.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = getTeamMember(slug);
  if (!member) return {};

  return pageMetadata({
    title: `${member.name} — ${member.role}`,
    description: member.headline,
    path: `/team/${member.slug}`,
    keywords: [member.name.toLowerCase(), member.role.toLowerCase(), ...member.skills.map((s) => s.toLowerCase())],
  });
}

export default async function TeamMemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = getTeamMember(slug);
  if (!member) notFound();

  const memberServices = member.services.map(getService).filter((service) => service !== undefined);
  const worked = projects.filter((project) => project.team.includes(member.slug));

  return (
    <>
      <script
        {...jsonLd(
          personSchema({
            name: member.name,
            role: member.role,
            bio: member.headline,
            path: `/team/${member.slug}`,
            socials: member.socials.map((social) => social.href),
          }),
        )}
      />
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Team', path: '/team' },
            { name: member.name, path: `/team/${member.slug}` },
          ]),
        )}
      />

      <Section className="pt-36">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-ink-subtle">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/team" className="hover:text-brand">
                Team
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {member.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <GradientPanel hue={[member.hue, (member.hue + 60) % 360]} className="aspect-[4/5]">
              <div className="absolute inset-0 flex items-end p-6">
                <span className="font-display text-6xl font-semibold text-ink/20">
                  {member.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </span>
              </div>
            </GradientPanel>

            <Card className="mt-5 p-6">
              <dl className="space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-muted">Direct rate</dt>
                  <dd className="font-medium">
                    <Price usd={member.rate} /> / hour
                  </dd>
                </div>
              </dl>

              <p className="mt-4 flex items-start gap-2 border-t border-line pt-4 text-sm text-ink-muted">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {member.availability}
              </p>

              <Button href={`/book?engineer=${member.slug}`} className="mt-5 w-full">
                Book {member.name.split(' ')[0]}
              </Button>

              {member.socials.length > 0 ? (
                <ul className="mt-5 flex gap-2 border-t border-line pt-5">
                  {member.socials.map((social) => (
                    <li key={social.href}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} on ${social.label}`}
                        className="flex size-9 items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:border-brand hover:text-brand"
                      >
                        <SocialIcon
                          icon={social.label.toLowerCase() as 'instagram' | 'linkedin'}
                          className="size-4"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          </div>

          <div>
            <p className="text-sm uppercase tracking-widest text-brand">{member.role}</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight md:text-6xl">
              {member.name}
            </h1>
            <p className="mt-5 text-xl leading-relaxed text-ink-muted">{member.headline}</p>

            <div className="mt-8 space-y-5 leading-relaxed text-ink-muted">
              {member.bio.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>

            <h2 className="mt-12 font-display text-2xl font-medium">Skills</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {member.skills.map((skill) => (
                <li key={skill}>
                  <Badge>{skill}</Badge>
                </li>
              ))}
            </ul>

            <h2 className="mt-12 font-display text-2xl font-medium">Selected credits</h2>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {member.credits.map((credit) => (
                <li key={`${credit.artist}-${credit.year}`} className="flex gap-4 py-4">
                  <span className="w-12 shrink-0 text-sm tabular-nums text-ink-subtle">
                    {credit.year}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{credit.artist}</span>
                    <span className="block text-sm text-ink-muted">{credit.work}</span>
                  </span>
                </li>
              ))}
            </ul>

            {memberServices.length > 0 ? (
              <>
                <h2 className="mt-12 font-display text-2xl font-medium">Services led</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {memberServices.map((service) => (
                    <li key={service.slug}>
                      <Link
                        href={`/services/${service.slug}`}
                        className="rounded-full border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:border-brand hover:text-brand"
                      >
                        {service.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {worked.length > 0 ? (
              <>
                <h2 className="mt-12 font-display text-2xl font-medium">Worked on</h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  {worked.slice(0, 6).map((project, index) => (
                    <Link key={project.slug} href={`/work/${project.slug}`} className="group">
                      <GradientPanel hue={project.hue} seed={index} className="aspect-square" />
                      <p className="mt-2.5 text-sm font-medium group-hover:text-brand">
                        {project.title}
                      </p>
                      <p className="text-xs text-ink-subtle">{project.artist}</p>
                    </Link>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </Section>
    </>
  );
}
