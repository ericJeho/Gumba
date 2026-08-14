import { Check, Clock, GraduationCap } from 'lucide-react';
import { Badge, Button, Card, GradientPanel, Reveal, Section, SectionHeading } from '@/components/ui';
import { Price } from '@/components/ui/Price';
import { pageMetadata } from '@/lib/seo';
import { courses } from '@/content/commerce';
import { team } from '@/content/people';

export const metadata = pageMetadata({
  title: 'Academy',
  description:
    'Courses in recording, mixing, mastering, beat making and podcast production — taught by the engineers who work the sessions, not by career instructors.',
  path: '/academy',
  keywords: ['music production course', 'mixing course', 'mastering course', 'audio engineering training'],
});

export default function AcademyPage() {
  return (
    <>
      <Section className="pt-36">
        <SectionHeading
          as="h1"
          eyebrow="Academy"
          title="Taught by people who still take sessions."
          lead="We started teaching because the industry stopped training engineers. Every course is taught by someone who does the job on Monday morning."
        />

        <div className="mt-14 space-y-8">
          {courses.map((course, index) => {
            const instructor = team.find((member) => member.name === course.instructor);

            return (
              <Reveal key={course.slug} delay={Math.min(index, 4) * 0.06}>
                <article
                  id={course.slug}
                  className="grid scroll-mt-28 gap-8 rounded-panel border border-line bg-surface/50 p-7 md:p-9 lg:grid-cols-[1.6fr_1fr]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">{course.level}</Badge>
                      {course.featured ? <Badge>Most popular</Badge> : null}
                      <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
                        <Clock className="size-3.5" aria-hidden />
                        {course.hours} hours of video
                      </span>
                    </div>

                    <h2 className="mt-4 font-display text-2xl font-medium md:text-3xl">
                      {course.title}
                    </h2>
                    <p className="mt-3 leading-relaxed text-ink-muted">{course.summary}</p>

                    <h3 className="mt-8 text-xs uppercase tracking-widest text-ink-subtle">
                      By the end you can
                    </h3>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {course.outcomes.map((outcome) => (
                        <li key={outcome} className="flex items-start gap-2.5 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                          <span className="text-ink-muted">{outcome}</span>
                        </li>
                      ))}
                    </ul>

                    <h3 className="mt-8 text-xs uppercase tracking-widest text-ink-subtle">
                      Curriculum
                    </h3>
                    <ol className="mt-3 divide-y divide-line border-y border-line">
                      {course.modules.map((module, moduleIndex) => (
                        <li key={module.title} className="py-4">
                          <p className="font-medium">
                            <span className="mr-2 text-brand">{moduleIndex + 1}.</span>
                            {module.title}
                          </p>
                          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            {module.lessons.map((lesson) => (
                              <li key={lesson} className="text-sm text-ink-subtle">
                                {lesson}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <aside>
                    <GradientPanel hue={course.hue} seed={index} className="aspect-video" />

                    <Card className="mt-5 p-6">
                      <p className="font-display text-3xl font-semibold">
                        <Price usd={course.price} />
                      </p>
                      <p className="mt-1 text-xs text-ink-subtle">
                        One payment, lifetime access. Members get 20% off.
                      </p>

                      {instructor ? (
                        <div className="mt-5 flex items-center gap-3 border-t border-line pt-5">
                          <GradientPanel
                            hue={[instructor.hue, (instructor.hue + 60) % 360]}
                            className="size-10 shrink-0 rounded-full"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{instructor.name}</p>
                            <p className="truncate text-xs text-ink-subtle">{instructor.role}</p>
                          </div>
                        </div>
                      ) : null}

                      <Button href="/contact" className="mt-5 w-full">
                        Enrol
                      </Button>

                      <ul className="mt-5 space-y-2 border-t border-line pt-5 text-xs text-ink-subtle">
                        <li>Downloadable session files and stems</li>
                        <li>Assignments marked by the instructor</li>
                        <li>Certificate on completion</li>
                        <li>Monthly live Q&amp;A in the control room</li>
                      </ul>
                    </Card>
                  </aside>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Section>

      <Section className="border-t border-line" tight>
        <div className="rounded-panel border border-line bg-surface/50 p-8 text-center md:p-12">
          <GraduationCap className="mx-auto size-10 text-brand" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-medium md:text-3xl">
            Prefer to learn in the room?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">
            Masterclasses and workshops run monthly with fewer than a dozen places, on the real
            console with a real multitrack.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/events">See upcoming events</Button>
            <Button href="/contact" variant="outline">
              Ask about group training
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
