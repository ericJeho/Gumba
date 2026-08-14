'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Award } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GradientPanel, Reveal } from '@/components/ui';
import { PlayTrigger } from '@/components/player/PlayerBar';
import { WORK_KINDS, projects, tracks, type WorkKind } from '@/content/work';

/** Filterable portfolio grid. */
export function WorkGallery() {
  const [kind, setKind] = useState<WorkKind | 'all'>('all');

  const filtered = useMemo(
    () => (kind === 'all' ? projects : projects.filter((project) => project.kind === kind)),
    [kind],
  );

  return (
    <>
      <div role="tablist" aria-label="Filter by type" className="flex flex-wrap gap-2 border-y border-line py-6">
        <Chip active={kind === 'all'} onClick={() => setKind('all')}>
          Everything
        </Chip>
        {WORK_KINDS.map((entry) => {
          const count = projects.filter((project) => project.kind === entry.id).length;
          if (count === 0) return null;

          return (
            <Chip key={entry.id} active={kind === entry.id} onClick={() => setKind(entry.id)}>
              {entry.label}
              <span className="ml-1.5 text-xs opacity-60">{count}</span>
            </Chip>
          );
        })}
      </div>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project, index) => {
          const track = tracks.find((entry) => entry.project === project.slug);

          return (
            <Reveal key={project.slug} delay={Math.min(index, 5) * 0.05}>
              <article className="group relative">
                <GradientPanel hue={project.hue} seed={index} className="aspect-square">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
                    {track ? <PlayTrigger trackId={track.id} label={project.title} /> : null}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                    <span className="rounded-full bg-canvas/60 px-3 py-1 text-xs capitalize backdrop-blur">
                      {project.kind}
                    </span>
                    <span className="text-xs text-ink-muted">{project.year}</span>
                  </div>
                </GradientPanel>

                <h2 className="mt-4 font-display text-lg font-medium">
                  <Link href={`/work/${project.slug}`} className="hover:text-brand">
                    <span className="absolute inset-0" aria-hidden />
                    {project.title}
                  </Link>
                </h2>
                <p className="text-sm text-ink-subtle">{project.artist}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{project.summary}</p>

                {project.accolades[0] ? (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-brand">
                    <Award className="size-3.5" aria-hidden />
                    {project.accolades[0]}
                  </p>
                ) : null}
              </article>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-sm transition-colors',
        active ? 'bg-brand text-canvas' : 'border border-line text-ink-muted hover:border-brand hover:text-brand',
      )}
    >
      {children}
    </button>
  );
}
