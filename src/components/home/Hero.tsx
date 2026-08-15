'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Sliders, Video } from 'lucide-react';

import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/hooks';
import { Button } from '@/components/ui';
import { HeroWave } from '@/components/player/Visualizer';
import { usePlayer } from '@/components/player/PlayerProvider';
import { tracks } from '@/content/work';

/**
 * The hero.
 *
 * Layered back to front: an animated gradient aurora, a particle field, the
 * audio-reactive wave, a rotating light sweep, and finally the copy. Everything
 * behind the copy is decorative and marked aria-hidden — a screen reader gets
 * the headline and the buttons and nothing else.
 *
 * A cinematic background video slots in where marked; the gradient stack is the
 * poster state, which is also what a visitor on a slow connection or with
 * reduced motion sees. Autoplaying a multi-megabyte video is the single most
 * common reason a studio site fails its Lighthouse budget, so the video is
 * opt-in rather than default.
 */
export function Hero() {
  const player = usePlayer();
  const reduced = useReducedMotion();

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden pt-24">
      <div aria-hidden className="absolute inset-0 -z-10">
        {/*
          Cinematic video goes here:
          <video autoPlay muted loop playsInline poster="/hero-poster.jpg"
                 className="size-full object-cover opacity-40">
            <source src="/studio-loop.webm" type="video/webm" />
          </video>
        */}
        <div className="absolute inset-0 bg-canvas" />

        {/* Aurora — two large blurred gradients drifting against each other. */}
        <div
          className={cn(
            'absolute -left-1/4 top-[-20%] size-[70vw] rounded-full blur-[120px]',
            !reduced && 'animate-aurora',
          )}
          style={{ background: 'radial-gradient(circle, hsl(var(--brand)/0.5), transparent 65%)' }}
        />
        <div
          className={cn(
            'absolute -right-1/4 bottom-[-25%] size-[65vw] rounded-full blur-[130px]',
            !reduced && 'animate-aurora',
          )}
          style={{
            animationDelay: '-8s',
            background: 'radial-gradient(circle, hsl(var(--accent)/0.42), transparent 65%)',
          }}
        />

        <ParticleField />

        {/* The rotating light sweep — a studio's moving head, abstracted. */}
        {!reduced ? (
          <div
            className="absolute left-1/2 top-1/2 h-[140vh] w-[60vw] origin-center -translate-x-1/2 -translate-y-1/2 animate-spin-slow opacity-[0.07]"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, hsl(var(--brand)) 12deg, transparent 26deg, transparent 180deg, hsl(var(--accent)) 194deg, transparent 208deg)',
            }}
          />
        ) : null}

        <div className="absolute inset-x-0 bottom-0 h-72 opacity-70">
          <HeroWave />
        </div>

        {/* Grounds the copy against the busy backdrop without a solid box. */}
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/80 via-canvas/30 to-canvas" />
      </div>

      <div className="container-page relative py-20">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/50 px-4 py-1.5 text-xs font-medium backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            Free forever · No account · Runs in your browser
          </span>

          {/* Capped at 7xl: at 8xl the first line no longer fits the measure and
              the deliberate two-line break turns into a ragged three. */}
          <h1 className="mt-7 font-display text-5xl font-semibold leading-[0.98] sm:text-6xl lg:text-7xl">
            A whole studio.
            <br />
            <span className="text-gradient">In your browser. Free.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-muted md:text-xl">
            Make beats, write melodies, record vocals, mix and master — then export a WAV you
            own. No download, no account, no watermark, no trial that runs out. And when a record
            needs a real room, our engineers are here too.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button href="/studio" size="lg">
              <Sliders className="size-4" />
              Open the studio
            </Button>
            <Button href="/services" variant="outline" size="lg">
              Work with our engineers
            </Button>
            <Button
              variant="glass"
              size="lg"
              onClick={() => player.play(tracks[0], tracks)}
            >
              <PlayCircle className="size-4" />
              Listen to our work
            </Button>
            <Button href="/rooms" variant="ghost" size="lg">
              <Video className="size-4" />
              Watch studio tour
            </Button>
          </div>

          <dl className="mt-16 grid max-w-2xl grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: '14', label: 'Instruments' },
              { value: '$0', label: 'Forever' },
              { value: 'WAV', label: 'Export' },
              { value: '0', label: 'Sign-ups' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-semibold md:text-4xl">
                    {stat.value}
                  </span>
                  <span className="mt-1 block text-xs uppercase tracking-widest text-ink-subtle">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>

    </section>
  );
}

/**
 * Drifting particles.
 *
 * Canvas rather than DOM nodes: a hundred absolutely-positioned divs each with
 * their own animation is a reliable way to drop a page below sixty frames on a
 * mid-range phone. Density scales with viewport width for the same reason.
 */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let frame = 0;

    type Particle = { x: number; y: number; z: number; vx: number; vy: number };
    let particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = Math.min(120, Math.floor(width / 12));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        // Depth drives size, brightness and speed together, which is what
        // makes a flat field read as three-dimensional.
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.16,
        vy: -0.06 - Math.random() * 0.16,
      }));
    };

    const palette = getComputedStyle(document.documentElement);
    const brandHue = palette.getPropertyValue('--brand').trim() || '28 96% 56%';

    const draw = () => {
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap rather than respawn, so the field never visibly thins out.
        if (particle.y < -10) {
          particle.y = height + 10;
          particle.x = Math.random() * width;
        }
        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;

        const size = 0.6 + particle.z * 1.8;
        context.fillStyle = `hsl(${brandHue} / ${0.12 + particle.z * 0.4})`;
        context.beginPath();
        context.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        context.fill();
      }

      frame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    // A single frame is drawn above; cancelling here leaves the field static.
    if (reduced) window.cancelAnimationFrame(frame);

    window.addEventListener('resize', resize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden />;
}
