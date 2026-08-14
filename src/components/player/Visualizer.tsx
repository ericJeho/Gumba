'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/hooks';
import { usePlayer } from '@/components/player/PlayerProvider';

/**
 * Canvas visualisers driven by the player's analyser node.
 *
 * All three read the same live audio, so they agree with each other and with
 * what is actually coming out of the speakers. Each draws a single static
 * frame and stops when the visitor has asked for reduced motion — a spectrum
 * analyser is decoration, and decoration must be switchable off.
 */

/** Sets the backing store to device pixels so the canvas is not soft on HiDPI. */
function fitCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const context = canvas.getContext('2d');
  if (!context) return null;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();

  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  return context;
}

/** Reads a theme token as a real colour, so the canvas follows the palette. */
function token(name: string, alpha = 1): string {
  if (typeof window === 'undefined') return `hsl(0 0% 50% / ${alpha})`;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return `hsl(${value || '0 0% 50%'} / ${alpha})`;
}

/* -------------------------------------------------------------------------- */
/* Spectrum                                                                    */
/* -------------------------------------------------------------------------- */

export function Spectrum({ className, bars = 48 }: { className?: string; bars?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyser, playing } = usePlayer();
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Assigned via a checked local so the type stays non-nullable across the
    // resize handler's reassignment.
    const initial = fitCanvas(canvas);
    if (!initial) return;
    let context = initial;

    let frame = 0;
    const data = new Uint8Array(analyser?.frequencyBinCount ?? 1024);
    // Smoothed heights, so a bar falls rather than snapping to zero between frames.
    const heights = new Float32Array(bars);

    const onResize = () => {
      const next = fitCanvas(canvas);
      if (next) context = next;
    };
    window.addEventListener('resize', onResize);

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      context.clearRect(0, 0, width, height);

      if (analyser && playing) analyser.getByteFrequencyData(data);

      const gap = 2;
      const barWidth = (width - gap * (bars - 1)) / bars;

      for (let i = 0; i < bars; i += 1) {
        let magnitude: number;

        if (analyser && playing) {
          // The useful musical content sits in the lower third of the bins;
          // sampling linearly across all of them would leave most bars dead.
          const start = Math.floor((i / bars) ** 1.6 * (data.length * 0.55));
          const end = Math.max(start + 1, Math.floor(((i + 1) / bars) ** 1.6 * (data.length * 0.55)));

          let sum = 0;
          for (let bin = start; bin < end; bin += 1) sum += data[bin] ?? 0;
          magnitude = sum / (end - start) / 255;
        } else {
          // Idle: a still, gently curved silhouette rather than a flat line.
          magnitude = 0.12 + Math.sin((i / bars) * Math.PI) * 0.1;
        }

        const target = Math.max(0.04, magnitude);
        const previous = heights[i] ?? 0;
        heights[i] = target > previous ? target : previous * 0.86 + target * 0.14;

        const barHeight = (heights[i] ?? 0) * height;
        const x = i * (barWidth + gap);

        const gradient = context.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, token('--brand', 0.95));
        gradient.addColorStop(1, token('--accent', 0.75));
        context.fillStyle = gradient;

        const radius = Math.min(barWidth / 2, 3);
        context.beginPath();
        context.roundRect(x, height - barHeight, barWidth, barHeight, [radius, radius, 0, 0]);
        context.fill();
      }

      frame = window.requestAnimationFrame(draw);
    };

    if (reduced) {
      draw();
      window.cancelAnimationFrame(frame);
    } else {
      draw();
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, [analyser, bars, playing, reduced]);

  return <canvas ref={canvasRef} className={cn('h-full w-full', className)} aria-hidden />;
}

/* -------------------------------------------------------------------------- */
/* Waveform                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A scrubbable waveform.
 *
 * The shape is generated from the track id rather than measured from the
 * buffer: an accurate peak map would need the whole file decoded before the
 * bar could be drawn, and the bar's job is to be a seek target. Progress is
 * real, which is the part that has to be honest.
 */
export function Waveform({
  className,
  bars = 96,
  seed,
  progress,
  onSeek,
}: {
  className?: string;
  bars?: number;
  seed: string;
  /** 0–1. */
  progress: number;
  onSeek?: (ratio: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Assigned via a checked local so the type stays non-nullable across the
    // resize handler's reassignment.
    const initial = fitCanvas(canvas);
    if (!initial) return;
    let context = initial;

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      context.clearRect(0, 0, width, height);

      const gap = 2;
      const barWidth = Math.max(1, (width - gap * (bars - 1)) / bars);

      // A cheap deterministic hash of the id — the same track always draws the
      // same waveform, on the server and on every client.
      let hash = 0;
      for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;

      for (let i = 0; i < bars; i += 1) {
        const noise = Math.sin((i + hash % 97) * 0.7) * 0.5 + Math.sin((i + (hash % 31)) * 0.23) * 0.5;
        // An envelope that rises and falls across the track, so it reads as a
        // song rather than as a block of noise.
        const envelope = 0.35 + 0.65 * Math.sin((i / bars) * Math.PI) ** 0.6;
        const magnitude = Math.max(0.08, Math.abs(noise) * envelope);

        const barHeight = magnitude * height * 0.9;
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        context.fillStyle = i / bars <= progress ? token('--brand') : token('--line-strong');
        context.beginPath();
        context.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        context.fill();
      }
    };

    draw();

    const onResize = () => {
      const next = fitCanvas(canvas);
      if (next) {
        context = next;
        draw();
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [bars, progress, seed]);

  if (!onSeek) {
    return <canvas ref={canvasRef} className={cn('h-full w-full', className)} aria-hidden />;
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-valuetext={`${Math.round(progress * 100)} per cent`}
      className={cn('relative h-full w-full cursor-pointer', className)}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        onSeek(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)));
      }}
      onKeyDown={(event) => {
        // A canvas is not keyboard-operable on its own; these give the seek bar
        // the same arrow-key behaviour as a native range input.
        if (event.key === 'ArrowRight') onSeek(Math.min(1, progress + 0.02));
        if (event.key === 'ArrowLeft') onSeek(Math.max(0, progress - 0.02));
        if (event.key === 'Home') onSeek(0);
        if (event.key === 'End') onSeek(0.99);
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero wave                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The slow sine field behind the hero.
 *
 * Independent of playback — it animates whether or not anything is playing,
 * because the hero has to look alive before a visitor presses anything. When
 * audio *is* playing it takes its amplitude from the analyser.
 */
export function HeroWave({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyser, playing } = usePlayer();
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Assigned via a checked local so the type stays non-nullable across the
    // resize handler's reassignment.
    const initial = fitCanvas(canvas);
    if (!initial) return;
    let context = initial;

    let frame = 0;
    let time = 0;
    const data = new Uint8Array(analyser?.frequencyBinCount ?? 1024);

    const onResize = () => {
      const next = fitCanvas(canvas);
      if (next) context = next;
    };
    window.addEventListener('resize', onResize);

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      context.clearRect(0, 0, width, height);

      let energy = 0.35;
      if (analyser && playing) {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        // Only the low half — the high bins are mostly noise floor and make
        // the amplitude jitter without adding anything visible.
        const limit = Math.floor(data.length / 2);
        for (let i = 0; i < limit; i += 1) sum += data[i] ?? 0;
        energy = 0.25 + (sum / limit / 255) * 1.4;
      }

      const lines = 5;
      for (let line = 0; line < lines; line += 1) {
        const depth = line / lines;
        context.beginPath();
        context.lineWidth = 1.5 - depth * 0.8;
        context.strokeStyle = token(line % 2 === 0 ? '--brand' : '--accent', 0.4 - depth * 0.26);

        for (let x = 0; x <= width; x += 6) {
          const phase = x * 0.006 + time + line * 0.9;
          const amplitude = height * 0.16 * energy * (1 - depth * 0.45);
          const y =
            height / 2 +
            Math.sin(phase) * amplitude +
            Math.sin(phase * 2.3 + line) * amplitude * 0.35;

          if (x === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }

        context.stroke();
      }

      time += 0.014;
      frame = window.requestAnimationFrame(draw);
    };

    draw();
    if (reduced) window.cancelAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, [analyser, playing, reduced]);

  return <canvas ref={canvasRef} className={cn('h-full w-full', className)} aria-hidden />;
}
