import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Award } from 'lucide-react';
import { Badge, Button, GradientPanel, Section } from '@/components/ui';
import { ProjectTracks } from '@/app/work/[slug]/ProjectTracks';
import { breadcrumbSchema, jsonLd, pageMetadata } from '@/lib/seo';
import { getProject, projects, tracksForProject } from '@/content/work';
import { getService } from '@/content/services';
import { getTeamMember } from '@/content/people';

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return pageMetadata({
    title: `${project.title} — ${project.artist}`,
    description: project.summary,
    path: `/work/${project.slug}`,
    keywords: [project.title.toLowerCase(), project.artist.toLowerCase(), project.kind],
  });
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const projectTracks = tracksForProject(project.slug);
  const credits = project.team.map(getTeamMember).filter((member) => member !== undefined);
  const delivered = project.services.map(getService).filter((service) => service !== undefined);

  return (
    <>
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Work', path: '/work' },
            { name: project.title, path: `/work/${project.slug}` },
          ]),
        )}
      />

      <Section className="pt-36">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-ink-subtle">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/work" className="hover:text-brand">
                Work
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {project.title}
            </li>
          </ol>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <GradientPanel hue={project.hue} className="aspect-square" />

            {projectTracks.length > 0 ? <ProjectTracks tracks={projectTracks} /> : null}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand" className="capitalize">
                {project.kind}
              </Badge>
              <Badge>{project.year}</Badge>
            </div>

            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-6xl">
              {project.title}
            </h1>
            <p className="mt-2 text-xl text-brand">{project.artist}</p>

            <div className="mt-8 space-y-5 leading-relaxed text-ink-muted">
              {project.description.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>

            {project.accolades.length > 0 ? (
              <ul className="mt-8 space-y-2">
                {project.accolades.map((accolade) => (
                  <li key={accolade} className="flex items-center gap-2.5 text-sm">
                    <Award className="size-4 shrink-0 text-brand" aria-hidden />
                    {accolade}
                  </li>
                ))}
              </ul>
            ) : null}

            {project.embeds.length > 0 ? (
              <div className="mt-10 space-y-4">
                <h2 className="text-xs uppercase tracking-widest text-ink-subtle">Listen and watch</h2>
                {project.embeds.map((embed) => (
                  <iframe
                    key={embed.url}
                    src={embed.url}
                    title={`${project.title} on ${embed.platform}`}
                    // Lazy: a page with three embeds would otherwise load three
                    // third-party players before the visitor scrolls to them.
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    className={
                      embed.platform === 'youtube'
                        ? 'aspect-video w-full rounded-xl border border-line'
                        : 'h-[152px] w-full rounded-xl border border-line'
                    }
                  />
                ))}
              </div>
            ) : null}

            <div className="mt-12 grid gap-8 border-t border-line pt-8 sm:grid-cols-2">
              {delivered.length > 0 ? (
                <div>
                  <h2 className="text-xs uppercase tracking-widest text-ink-subtle">
                    What we delivered
                  </h2>
                  <ul className="mt-3 space-y-1.5">
                    {delivered.map((service) => (
                      <li key={service.slug}>
                        <Link
                          href={`/services/${service.slug}`}
                          className="text-sm text-ink-muted hover:text-brand"
                        >
                          {service.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {credits.length > 0 ? (
                <div>
                  <h2 className="text-xs uppercase tracking-widest text-ink-subtle">Credits</h2>
                  <ul className="mt-3 space-y-1.5">
                    {credits.map((member) => (
                      <li key={member.slug}>
                        <Link
                          href={`/team/${member.slug}`}
                          className="text-sm text-ink-muted hover:text-brand"
                        >
                          {member.name}
                          <span className="text-ink-subtle"> — {member.role}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="/studio">Make something like this</Button>
              <Button href="/work" variant="outline">
                More work
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
