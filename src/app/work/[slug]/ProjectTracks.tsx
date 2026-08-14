'use client';

import { Heart, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatClock } from '@/lib/format';
import { usePlayer } from '@/components/player/PlayerProvider';
import type { Track } from '@/content/work';

/**
 * The project's track list, wired to the global player.
 *
 * Plays into the project's own queue rather than the site catalogue, so
 * pressing play on an album plays that album through rather than wandering off
 * into another artist's record.
 */
export function ProjectTracks({ tracks }: { tracks: Track[] }) {
  const player = usePlayer();

  return (
    <ul className="mt-6 divide-y divide-line border-y border-line">
      {tracks.map((track, index) => {
        const isCurrent = player.current?.id === track.id;
        const isPlaying = isCurrent && player.playing;
        const isFavourite = player.favourites.includes(track.id);

        return (
          <li key={track.id} className="flex items-center gap-3 py-3">
            <button
              type="button"
              onClick={() => (isCurrent ? player.toggle() : player.play(track, tracks))}
              aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors',
                isCurrent ? 'bg-brand text-canvas' : 'border border-line text-ink-muted hover:text-brand',
              )}
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 translate-x-0.5" />}
            </button>

            <span className="w-5 shrink-0 text-xs tabular-nums text-ink-subtle">{index + 1}</span>

            <span className="min-w-0 flex-1">
              <span className={cn('block truncate text-sm', isCurrent && 'text-brand')}>
                {track.title}
              </span>
              <span className="block truncate text-xs text-ink-subtle">{track.artist}</span>
            </span>

            <button
              type="button"
              onClick={() => player.toggleFavourite(track.id)}
              aria-pressed={isFavourite}
              aria-label={isFavourite ? `Remove ${track.title} from favourites` : `Add ${track.title} to favourites`}
              className="shrink-0 p-1.5 text-ink-subtle transition-colors hover:text-accent"
            >
              <Heart className={cn('size-4', isFavourite && 'fill-accent text-accent')} />
            </button>

            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ink-subtle">
              {formatClock(track.duration)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
