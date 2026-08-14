'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { tracks as catalogue, type Track } from '@/content/work';
import { useLocalStorage } from '@/lib/hooks';
import { PREVIEW_DURATION, renderPreview } from '@/components/player/synth';

/**
 * The global player.
 *
 * One instance lives in the root layout, so playback survives navigation —
 * which is the entire reason to build a player rather than drop an <audio> tag
 * on each page.
 *
 * Audio graph:
 *   source (buffer or media element) → gain → analyser → destination
 *
 * The analyser is after the gain so the visualiser reacts to what the visitor
 * actually hears, including the volume they set.
 */

export type RepeatMode = 'off' | 'all' | 'one';

type PlayerValue = {
  queue: Track[];
  current: Track | null;
  index: number;
  playing: boolean;
  /** Seconds into the current track. */
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  rate: number;
  shuffle: boolean;
  repeat: RepeatMode;
  favourites: string[];
  recent: string[];
  /** True while a preview is being rendered. */
  loading: boolean;
  /** Set when the browser refuses to give us audio at all. */
  error: string | null;
  analyser: AnalyserNode | null;

  play: (track?: Track, queue?: Track[]) => void;
  toggle: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  setRate: (value: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleFavourite: (id: string) => void;
  playById: (id: string) => void;
};

const PlayerContext = createContext<PlayerValue | null>(null);

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Track[]>(catalogue);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(PREVIEW_DURATION);
  const [volume, setVolumeState] = useLocalStorage('pulse-volume', 0.8);
  const [muted, setMuted] = useState(false);
  const [rate, setRateState] = useState(1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('all');
  const [favourites, setFavourites] = useLocalStorage<string[]>('pulse-favourites', []);
  const [recent, setRecent] = useLocalStorage<string[]>('pulse-recent', []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const contextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  /** Rendered previews, keyed by track id — rendering is far too slow to repeat. */
  const cacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  /** context.currentTime at which the current playthrough started. */
  const startedAtRef = useRef(0);
  /** Offset into the buffer that playthrough started from. */
  const offsetRef = useRef(0);
  const frameRef = useRef(0);
  /** Guards against an out-of-order render resolving after a newer one. */
  const loadTokenRef = useRef(0);

  const current = queue[index] ?? null;

  /**
   * Builds the audio graph on first use.
   *
   * Deferred until a play gesture because browsers create an AudioContext in a
   * suspended state without one, and a suspended context reports a frozen
   * currentTime — which would make the progress bar sit at zero forever.
   */
  const ensureContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      setError('This browser cannot play audio.');
      return null;
    }

    const context = new Ctor();
    const gain = context.createGain();
    const node = context.createAnalyser();

    node.fftSize = 2048;
    // Without smoothing the spectrum bars strobe at the frame rate, which is
    // both ugly and a genuine problem for photosensitive visitors.
    node.smoothingTimeConstant = 0.82;

    gain.connect(node).connect(context.destination);
    gain.gain.value = volume;

    contextRef.current = context;
    gainRef.current = gain;
    analyserRef.current = node;
    setAnalyser(node);

    return context;
  }, [volume]);

  const stopSource = useCallback(() => {
    const source = sourceRef.current;
    if (!source) return;

    // The ended handler drives track advance; clear it before stopping or a
    // manual skip immediately advances a second time.
    source.onended = null;
    try {
      source.stop();
    } catch {
      // Already stopped — a source can only be started and stopped once.
    }
    source.disconnect();
    sourceRef.current = null;
  }, []);

  /** Loads a track's audio, from cache when possible. */
  const loadTrack = useCallback(
    async (track: Track): Promise<AudioBuffer | null> => {
      const cached = cacheRef.current.get(track.id);
      if (cached) return cached;

      const context = ensureContext();
      if (!context) return null;

      const token = (loadTokenRef.current += 1);
      setLoading(true);

      try {
        let buffer: AudioBuffer;

        if (track.src) {
          const response = await fetch(track.src);
          if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
          buffer = await context.decodeAudioData(await response.arrayBuffer());
        } else {
          buffer = await renderPreview(track);
        }

        // A newer load started while this one was in flight; its result wins.
        if (token !== loadTokenRef.current) return null;

        cacheRef.current.set(track.id, buffer);
        return buffer;
      } catch {
        if (token === loadTokenRef.current) setError('That track could not be loaded.');
        return null;
      } finally {
        if (token === loadTokenRef.current) setLoading(false);
      }
    },
    [ensureContext],
  );

  /** Starts the current buffer at `offset`, wiring the end-of-track handler. */
  const startPlayback = useCallback(
    (offset: number) => {
      const context = contextRef.current;
      const gain = gainRef.current;
      const buffer = bufferRef.current;
      if (!context || !gain || !buffer) return;

      stopSource();

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = rate;
      source.connect(gain);

      source.onended = () => {
        // A source also fires `ended` when it is stopped for a seek, so only
        // treat it as the end of the track if we actually reached the end.
        const elapsed = (context.currentTime - startedAtRef.current) * rate + offsetRef.current;
        if (elapsed < buffer.duration - 0.25) return;
        advanceRef.current();
      };

      source.start(0, Math.min(offset, buffer.duration - 0.01));

      sourceRef.current = source;
      startedAtRef.current = context.currentTime;
      offsetRef.current = offset;
      setPlaying(true);
    },
    [rate, stopSource],
  );

  /**
   * Advance is called from an audio callback created before `next` exists, so
   * it goes through a ref rather than a closure over a stale value.
   */
  const advanceRef = useRef<() => void>(() => {});

  const playTrackAt = useCallback(
    async (nextIndex: number, list: Track[]) => {
      const track = list[nextIndex];
      if (!track) return;

      const context = ensureContext();
      if (!context) return;
      // Browsers start the context suspended until a gesture resumes it.
      if (context.state === 'suspended') await context.resume();

      setIndex(nextIndex);
      setPosition(0);
      setError(null);

      const buffer = await loadTrack(track);
      if (!buffer) return;

      bufferRef.current = buffer;
      setDuration(buffer.duration);
      startPlayback(0);

      setRecent((previous) => [track.id, ...previous.filter((id) => id !== track.id)].slice(0, 12));
    },
    [ensureContext, loadTrack, setRecent, startPlayback],
  );

  const next = useCallback(() => {
    if (!queue.length) return;

    if (shuffle && queue.length > 1) {
      // Re-rolling until it differs is fine for a playlist of this size and
      // avoids the "shuffle played the same song again" complaint.
      let candidate = index;
      while (candidate === index) candidate = Math.floor(Math.random() * queue.length);
      void playTrackAt(candidate, queue);
      return;
    }

    const last = index >= queue.length - 1;
    if (last && repeat === 'off') {
      setPlaying(false);
      stopSource();
      return;
    }

    void playTrackAt(last ? 0 : index + 1, queue);
  }, [index, playTrackAt, queue, repeat, shuffle, stopSource]);

  // Repeat-one restarts rather than advancing; everything else advances.
  advanceRef.current = () => {
    if (repeat === 'one') {
      setPosition(0);
      startPlayback(0);
      return;
    }
    next();
  };

  const previous = useCallback(() => {
    // Matching every other player: within the first three seconds "previous"
    // means the previous track, after that it means "restart this one".
    if (position > 3) {
      setPosition(0);
      startPlayback(0);
      return;
    }
    void playTrackAt(index === 0 ? queue.length - 1 : index - 1, queue);
  }, [index, playTrackAt, position, queue, startPlayback]);

  const pause = useCallback(() => {
    const context = contextRef.current;
    if (!context || !sourceRef.current) return;

    offsetRef.current += (context.currentTime - startedAtRef.current) * rate;
    stopSource();
    setPlaying(false);
  }, [rate, stopSource]);

  const play = useCallback(
    (track?: Track, list?: Track[]) => {
      const nextQueue = list ?? queue;
      if (list) setQueue(list);

      if (!track) {
        // Resume where we left off, or start the queue from the top.
        if (bufferRef.current && offsetRef.current > 0) {
          void (async () => {
            const context = ensureContext();
            if (context?.state === 'suspended') await context.resume();
            startPlayback(offsetRef.current);
          })();
          return;
        }
        void playTrackAt(index, nextQueue);
        return;
      }

      const target = nextQueue.findIndex((entry) => entry.id === track.id);
      void playTrackAt(target === -1 ? 0 : target, nextQueue);
    },
    [ensureContext, index, playTrackAt, queue, startPlayback],
  );

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [pause, play, playing]);

  const playById = useCallback(
    (id: string) => {
      const track = catalogue.find((entry) => entry.id === id);
      if (track) play(track, catalogue);
    },
    [play],
  );

  const seek = useCallback(
    (seconds: number) => {
      const buffer = bufferRef.current;
      if (!buffer) return;

      const clamped = Math.max(0, Math.min(seconds, buffer.duration - 0.05));
      setPosition(clamped);
      offsetRef.current = clamped;

      if (playing) startPlayback(clamped);
    },
    [playing, startPlayback],
  );

  const setVolume = useCallback(
    (value: number) => {
      const clamped = Math.max(0, Math.min(1, value));
      setVolumeState(clamped);
      if (clamped > 0) setMuted(false);
      if (gainRef.current) gainRef.current.gain.value = clamped;
    },
    [setVolumeState],
  );

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const nextMuted = !current;
      if (gainRef.current) gainRef.current.gain.value = nextMuted ? 0 : volume;
      return nextMuted;
    });
  }, [volume]);

  const setRate = useCallback((value: number) => {
    setRateState(value);
    const context = contextRef.current;
    const source = sourceRef.current;
    if (!context || !source) return;

    // The elapsed time so far was measured at the old rate; bank it before
    // changing the rate or the progress bar jumps.
    offsetRef.current += (context.currentTime - startedAtRef.current) * source.playbackRate.value;
    startedAtRef.current = context.currentTime;
    source.playbackRate.value = value;
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((value) => !value), []);

  const cycleRepeat = useCallback(() => {
    setRepeat((mode) => (mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off'));
  }, []);

  const toggleFavourite = useCallback(
    (id: string) => {
      setFavourites((current) =>
        current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
      );
    },
    [setFavourites],
  );

  /** Drives the progress readout while playing. */
  useEffect(() => {
    if (!playing) return;

    const tick = () => {
      const context = contextRef.current;
      const buffer = bufferRef.current;
      if (context && buffer) {
        const elapsed = offsetRef.current + (context.currentTime - startedAtRef.current) * rate;
        setPosition(Math.min(elapsed, buffer.duration));
      }
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameRef.current);
  }, [playing, rate]);

  /** Keyboard transport, skipped while the visitor is typing. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

      if (event.code === 'Space') {
        event.preventDefault();
        toggle();
      } else if (event.code === 'ArrowRight' && event.shiftKey) {
        event.preventDefault();
        next();
      } else if (event.code === 'ArrowLeft' && event.shiftKey) {
        event.preventDefault();
        previous();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, previous, toggle]);

  /** Lock-screen and headset controls. */
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: 'Pulse Studios',
    });

    navigator.mediaSession.setActionHandler('play', () => play());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('previoustrack', () => previous());
  }, [current, next, pause, play, previous]);

  useEffect(() => {
    // Marks the body so the stylesheet can reserve space for the docked bar.
    document.body.dataset.player = current ? 'docked' : 'hidden';
  }, [current]);

  useEffect(() => {
    return () => {
      stopSource();
      void contextRef.current?.close();
    };
  }, [stopSource]);

  const value = useMemo<PlayerValue>(
    () => ({
      queue,
      current,
      index,
      playing,
      position,
      duration,
      volume,
      muted,
      rate,
      shuffle,
      repeat,
      favourites,
      recent,
      loading,
      error,
      analyser,
      play,
      toggle,
      pause,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      setRate,
      toggleShuffle,
      cycleRepeat,
      toggleFavourite,
      playById,
    }),
    [
      analyser,
      current,
      cycleRepeat,
      duration,
      error,
      favourites,
      index,
      loading,
      muted,
      next,
      pause,
      play,
      playById,
      playing,
      position,
      previous,
      queue,
      rate,
      recent,
      repeat,
      seek,
      setRate,
      setVolume,
      shuffle,
      toggle,
      toggleFavourite,
      toggleMute,
      toggleShuffle,
      volume,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerValue {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return context;
}
