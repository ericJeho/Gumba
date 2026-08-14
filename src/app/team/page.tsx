import Link from 'next/link';
import { Badge, Card, GradientPanel, Reveal, Section, SectionHeading } from '@/components/ui';
import { Price } from '@/components/ui/Price';
import { pageMetadata } from '@/lib/seo';
import { ClosingCta } from '@/components/home/Sections';
import { team } from '@/content/people';

export const metadata = pageMetadata({
  title: 'The team',
  description:
    'The engineers, producers, writers and directors who work the sessions — with their credits, their rates and their availability.',
  path: '/team',
  keywords: ['recording engineer', 'mix engineer', 'mastering engineer', 'music producer'],
});

const DEPARTMENTS = [
  { id: 'leadership', label: 'Leadership' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'production', label: 'Production' },
  { id: 'visual', label: 'Visual' },
  { id: 'business', label: 'Artist development' },
] as const;

export default function TeamPage() {
  return (
    <>
      <Section className="pt-36">
        <SectionHeading
          as="h1"
          eyebrow="Who we are"
          title="No juniors on your session."
          lead="You book a person, not a room with somebody in it. Everyone here has their own credits, their own rate and their own calendar — and you can book them directly."
        />

        <div className="mt-16 space-y-16">
          {DEPARTMENTS.map((department) => {
            const members = team.filter((member) => member.department === department.id);
            if (members.length === 0) return null;

            return (
              <section key={department.id}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
                  {department.label}
                </h2>

                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((member, index) => (
                    <Reveal key={member.slug} delay={index * 0.06}>
                      <Link href={`/team/${member.slug}`} className="group block h-full">
                        <Card interactive className="flex h-full flex-col p-5">
                          <GradientPanel
                            hue={[member.hue, (member.hue + 60) % 360]}
                            seed={index}
                            className="aspect-[4/5]"
                          >
                            <div className="absolute inset-0 flex items-end p-5">
                              <span className="font-display text-5xl font-semibold text-ink/25">
                                {member.name
                                  .split(' ')
                                  .map((part) => part[0])
                                  .join('')}
                              </span>
                            </div>
                          </GradientPanel>

                          <h3 className="mt-5 font-display text-lg font-medium group-hover:text-brand">
                            {member.name}
                          </h3>
                          <p className="text-sm text-brand">{member.role}</p>
                          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                            {member.headline}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {member.skills.slice(0, 3).map((skill) => (
                              <Badge key={skill}>{skill}</Badge>
                            ))}
                          </div>

                          <p className="mt-4 border-t border-line pt-3 text-sm">
                            <span className="font-medium">
                              <Price usd={member.rate} />
                            </span>
                            <span className="text-ink-subtle"> / hour direct</span>
                          </p>
                        </Card>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Section>

      <ClosingCta className="border-t border-line" />
    </>
  );
}
