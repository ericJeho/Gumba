'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Heart,
  ListMusic,
  Loader2,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatClock } from '@/lib/format';
import { useCopy } from '@/lib/hooks';
import { PLAYBACK_RATES, usePlayer } from '@/components/player/PlayerProvider';
import { Spectrum, Waveform } from '@/components/player/Visualizer';
import { GradientPanel } from '@/components/ui';
import { brand } from '@/config/brand';

/**
 * The docked player.
 *
 * Rendered once in the root layout, so playback survives navigation — the whole
 * reason to build a player rather than drop an <audio> tag on each page. It
 * docks with the first track cued rather than appearing only after a play, so
 * a visitor can see there is something to listen to without hunting for it.
 *
 * Expanding reveals the playlist, lyrics and quality controls in place rather
 * than navigating away, because leaving the page to change track is the fastest
 * way to lose a listener.
 */
export function PlayerBar() {
  const player = usePlayer();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [panel, setPanel] = useState<'queue' | 'lyrics'>('queue');
  const { copied, copy } = useCopy();

  const { current } = player;
  if (!current) return null;

  // The studio has its own transport, its own meters and its own Space
  // binding. Two players on one screen is a bug, not a feature.
  if (pathname.startsWith('/studio')) return null;

  const progress = player.duration > 0 ? player.position / player.duration : 0;
  const isFavourite = player.favourites.includes(current.id);

  /** The lyric line for the current position, for the lyrics panel. */
  const activeLyric = current.lyrics?.reduce<number>(
    (active, line, lineIndex) => (player.position >= line.at ? lineIndex : active),
    -1,
  );

  return (
    <>
      <AnimatePresence>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-[5.5rem] z-40 mx-auto max-w-5xl px-3"
          >
            <div className="glass max-h-[52vh] overflow-hidden rounded-panel shadow-panel">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2">
                <PanelTab active={panel === 'queue'} onClick={() => setPanel('queue')} icon={<ListMusic className="size-4" />}>
                  Queue
                </PanelTab>
                <PanelTab
                  active={panel === 'lyrics'}
                  onClick={() => setPanel('lyrics')}
                  icon={<Mic2 className="size-4" />}
                  disabled={!current.lyrics}
                >
                  Lyrics
                </PanelTab>

                <div className="ml-auto flex items-center gap-2">
                  <label className="sr-only" htmlFor="player-rate">
                    Playback speed
                  </label>
                  <select
                    id="player-rate"
                    value={player.rate}
                    onChange={(event) => player.setRate(Number(event.target.value))}
                    className="rounded-lg border border-line bg-surface px-2 py-1 text-xs"
                  >
                    {PLAYBACK_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}×
                      </option>
                    ))}
                  </select>

                  <label className="sr-only" htmlFor="player-quality">
                    Streaming quality
                  </label>
                  <select
                    id="player-quality"
                    defaultValue="high"
                    className="rounded-lg border border-line bg-surface px-2 py-1 text-xs"
                  >
                    <option value="normal">Normal · 128k</option>
                    <option value="high">High · 320k</option>
                    <option value="lossless">Lossless · FLAC</option>
                  </select>
                </div>
              </div>

              <div className="max-h-[42vh] overflow-y-auto p-2">
                {panel === 'queue' ? (
                  <ul className="space-y-1">
                    {player.queue.map((track, trackIndex) => {
                      const active = trackIndex === player.index;
                      return (
                        <li key={track.id}>
                          <button
                            type="button"
                            onClick={() => player.play(track)}
                            aria-current={active ? 'true' : undefined}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                              active ? 'bg-brand/12 text-ink' : 'hover:bg-surface-raised',
                            )}
                          >
                            <GradientPanel hue={track.hue} seed={trackIndex} className="size-10 shrink-0" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{track.title}</span>
                              <span className="block truncate text-xs text-ink-subtle">{track.artist}</span>
                            </span>
                            {active && player.playing ? (
                              <span className="h-6 w-10 shrink-0">
                                <Spectrum bars={6} />
                              </span>
                            ) : (
                              <span className="shrink-0 text-xs tabular-nums text-ink-subtle">
                                {formatClock(track.duration)}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-4 py-3">
                    {current.lyrics?.length ? (
                      <ol className="space-y-3">
                        {current.lyrics.map((line, lineIndex) => (
                          <li
                            key={line.at}
                            className={cn(
                              'font-display text-lg transition-colors duration-300',
                              lineIndex === activeLyric ? 'text-brand' : 'text-ink-subtle',
                            )}
                          >
                            {line.line}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-ink-subtle">No lyrics for this track.</p>
                    )}

                    <div className="mt-6 border-t border-line pt-4">
                      <p className="text-xs uppercase tracking-widest text-ink-subtle">Credits</p>
                      <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                        {current.credits.map((credit) => (
                          <li key={credit}>{credit}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div
        className="glass fixed inset-x-0 bottom-0 z-50 border-t border-line"
        role="region"
        aria-label="Audio player"
      >
        {/* A thin progress line across the very bottom, readable at a glance
            even when the transport is scrolled past on a phone. */}
        <div className="h-0.5 w-full bg-line" aria-hidden>
          <div
            className="h-full bg-brand transition-[width] duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="container-page flex h-[5.4rem] items-center gap-3 md:gap-5">
          <Link
            href={`/work/${current.project}`}
            className="group flex min-w-0 shrink-0 items-center gap-3"
            aria-label={`${current.title} by ${current.artist} — view project`}
          >
            <GradientPanel hue={current.hue} className="size-12 shrink-0 md:size-14" />
            <span className="hidden min-w-0 md:block">
              <span className="block truncate text-sm font-medium group-hover:text-brand">
                {current.title}
              </span>
              <span className="block truncate text-xs text-ink-subtle">{current.artist}</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => player.toggleFavourite(current.id)}
            aria-pressed={isFavourite}
            aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            className="hidden shrink-0 rounded-full p-2 text-ink-subtle transition-colors hover:text-accent md:block"
          >
            <Heart className={cn('size-4', isFavourite && 'fill-accent text-accent')} />
          </button>

          <div className="flex shrink-0 items-center gap-1">
            <TransportButton
              onClick={player.toggleShuffle}
              active={player.shuffle}
              label={player.shuffle ? 'Shuffle on' : 'Shuffle off'}
              pressed={player.shuffle}
              className="hidden sm:inline-flex"
            >
              <Shuffle className="size-4" />
            </TransportButton>

            <TransportButton onClick={player.previous} label="Previous track">
              <SkipBack className="size-5" />
            </TransportButton>

            <button
              type="button"
              onClick={player.toggle}
              aria-label={player.playing ? 'Pause' : 'Play'}
              className="neu flex size-11 items-center justify-center rounded-full text-brand transition-transform active:scale-95"
            >
              {player.loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : player.playing ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5 translate-x-0.5" />
              )}
            </button>

            <TransportButton onClick={player.next} label="Next track">
              <SkipForward className="size-5" />
            </TransportButton>

            <TransportButton
              onClick={player.cycleRepeat}
              active={player.repeat !== 'off'}
              label={`Repeat ${player.repeat}`}
              className="hidden sm:inline-flex"
            >
              {player.repeat === 'one' ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
            </TransportButton>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="hidden w-11 shrink-0 text-right text-xs tabular-nums text-ink-subtle sm:block">
              {formatClock(player.position)}
            </span>
            <div className="h-9 min-w-0 flex-1">
              <Waveform
                seed={current.id}
                progress={progress}
                onSeek={(ratio) => player.seek(ratio * player.duration)}
              />
            </div>
            <span className="hidden w-11 shrink-0 text-xs tabular-nums text-ink-subtle sm:block">
              {formatClock(player.duration)}
            </span>
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={player.toggleMute}
              aria-label={player.muted ? 'Unmute' : 'Mute'}
              className="rounded-full p-2 text-ink-subtle transition-colors hover:text-ink"
            >
              {player.muted || player.volume === 0 ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={player.muted ? 0 : player.volume}
              onChange={(event) => player.setVolume(Number(event.target.value))}
              aria-label="Volume"
              className="h-1 w-20 accent-[hsl(var(--brand))]"
            />
          </div>

          <button
            type="button"
            onClick={() => void copy(`${brand.url}/work/${current.project}`)}
            aria-label={copied ? 'Link copied' : 'Copy link to this track'}
            className="hidden shrink-0 rounded-full p-2 text-ink-subtle transition-colors hover:text-ink md:block"
          >
            <Share2 className={cn('size-4', copied && 'text-success')} />
          </button>

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse player' : 'Expand player'}
            className="shrink-0 rounded-full p-2 text-ink-subtle transition-colors hover:text-ink"
          >
            {expanded ? <ChevronDown className="size-5" /> : <ChevronUp className="size-5" />}
          </button>
        </div>

        {player.error ? (
          <p role="status" className="border-t border-danger/30 bg-danger/10 px-4 py-1.5 text-center text-xs text-danger">
            {player.error}
          </p>
        ) : null}
      </div>
    </>
  );
}

function TransportButton({
  children,
  onClick,
  label,
  active,
  pressed,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  pressed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        'rounded-full p-2 transition-colors',
        active ? 'text-brand' : 'text-ink-subtle hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}

function PanelTab({
  children,
  icon,
  active,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-selected={active}
      role="tab"
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors',
        active ? 'bg-brand/12 text-brand' : 'text-ink-subtle hover:text-ink',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * A play button for track lists and cards.
 *
 * Anything that starts audio anywhere on the site goes through this so the
 * play/pause state of every button stays consistent with the one player.
 */
export function PlayTrigger({
  trackId,
  className,
  label,
}: {
  trackId: string;
  className?: string;
  label?: string;
}) {
  const player = usePlayer();
  const isCurrent = player.current?.id === trackId;
  const isPlaying = isCurrent && player.playing;

  return (
    <button
      type="button"
      onClick={() => (isCurrent ? player.toggle() : player.playById(trackId))}
      aria-label={isPlaying ? `Pause ${label ?? 'track'}` : `Play ${label ?? 'track'}`}
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-full bg-brand text-canvas transition-transform hover:scale-105 active:scale-95',
        className,
      )}
    >
      {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 translate-x-0.5" />}
    </button>
  );
}
