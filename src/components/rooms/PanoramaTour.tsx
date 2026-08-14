'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize2, Move3d, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/hooks';

/**
 * The 360° room tour.
 *
 * Drag, arrow keys or a touch swipe pan around the room; the view auto-rotates
 * gently until the visitor takes hold of it. Hotspots mark the equipment and
 * link to the inventory.
 *
 * Implemented on a 2D canvas rather than with a WebGL library. A cylindrical
 * panorama needs one horizontal mapping and nothing else — bringing in a 3D
 * engine for that would add several hundred kilobytes to the page, which is
 * the wrong trade on a site with a 95+ Lighthouse target. Swapping the
 * generated panorama for a real equirectangular photograph is a matter of
 * drawing an image instead of the gradient; the pan, the hotspots and the
 * controls stay exactly as they are.
 */

export type Hotspot = {
  /** Degrees around the panorama, 0–360. */
  angle: number;
  label: string;
  href?: string;
};

export function PanoramaTour({
  hue,
  hotspots = [],
  label,
  className,
  /** Real panorama image; falls back to the generated one when absent. */
  image,
}: {
  hue: [number, number];
  hotspots?: Hotspot[];
  label: string;
  className?: string;
  image?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const reduced = useReducedMotion();

  const angleRef = useRef(0);
  angleRef.current = angle;

  // Auto-rotation, stopped for good the moment the visitor interacts.
  useEffect(() => {
    if (!autoRotate || dragging || reduced) return;

    let frame = 0;
    const tick = () => {
      setAngle((current) => (current + 0.06) % 360);
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [autoRotate, dragging, reduced]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const { width, height } = rect;
      context.clearRect(0, 0, width, height);

      if (image) {
        // Real panorama: draw it twice, offset by the pan, so the seam wraps.
        const bitmap = imageRef.current;
        if (bitmap) {
          const scale = height / bitmap.height;
          const scaledWidth = bitmap.width * scale;
          const offset = -((angleRef.current / 360) * scaledWidth) % scaledWidth;

          context.drawImage(bitmap, offset, 0, scaledWidth, height);
          context.drawImage(bitmap, offset + scaledWidth, 0, scaledWidth, height);
          return;
        }
      }

      // Generated panorama: bands of colour whose position depends on the pan
      // angle, plus a floor and ceiling gradient. Enough parallax cues that
      // dragging reads as looking around a room.
      const sky = context.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, `hsl(${hue[0]} 40% 12%)`);
      sky.addColorStop(0.45, `hsl(${hue[0]} 30% 8%)`);
      sky.addColorStop(0.55, `hsl(${hue[1]} 25% 7%)`);
      sky.addColorStop(1, `hsl(${hue[1]} 20% 4%)`);
      context.fillStyle = sky;
      context.fillRect(0, 0, width, height);

      // Wall panels. Twelve around the room, so a full turn returns you home.
      const panels = 12;
      for (let i = 0; i < panels; i += 1) {
        const panelAngle = (i / panels) * 360;
        const relative = ((panelAngle - angleRef.current + 540) % 360) - 180;
        // Only draw what is in the ~100° field of view.
        if (Math.abs(relative) > 60) continue;

        const x = width / 2 + (relative / 60) * (width / 2);
        // Panels compress towards the edges, which is the cue that sells the
        // curvature.
        const panelWidth = (width / panels) * 2.4 * Math.cos((relative * Math.PI) / 180);
        // Panels nearest the centre of view are lit most, which is what gives
        // the pan a sense of depth rather than of a flat scrolling texture.
        const shade = 0.72 - Math.abs(relative) / 130;

        context.fillStyle = `hsl(${i % 2 === 0 ? hue[0] : hue[1]} 48% 24% / ${Math.max(0.18, shade)})`;
        context.fillRect(x - panelWidth / 2, height * 0.18, panelWidth, height * 0.62);

        context.strokeStyle = `hsl(${hue[0]} 65% 58% / 0.28)`;
        context.lineWidth = 1;
        context.strokeRect(x - panelWidth / 2, height * 0.18, panelWidth, height * 0.62);
      }

      // A floor line and a horizon glow give the eye something to level against.
      const floor = context.createLinearGradient(0, height * 0.78, 0, height);
      floor.addColorStop(0, `hsl(${hue[1]} 30% 10%)`);
      floor.addColorStop(1, `hsl(${hue[1]} 25% 5%)`);
      context.fillStyle = floor;
      context.fillRect(0, height * 0.78, width, height * 0.22);

      const glow = context.createRadialGradient(
        width / 2,
        height * 0.4,
        0,
        width / 2,
        height * 0.4,
        width * 0.6,
      );
      glow.addColorStop(0, `hsl(${hue[0]} 80% 50% / 0.18)`);
      glow.addColorStop(1, 'transparent');
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    };

    draw();

    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [angle, hue, image]);

  const imageRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!image) return;
    const bitmap = new Image();
    bitmap.crossOrigin = 'anonymous';
    bitmap.src = image;
    bitmap.onload = () => {
      imageRef.current = bitmap;
      setAngle((current) => current + 0.001); // Nudge a redraw once loaded.
    };
  }, [image]);

  const startRef = useRef({ x: 0, angle: 0 });

  return (
    <div
      ref={containerRef}
      className={cn('group relative overflow-hidden rounded-panel border border-line', className)}
    >
      <canvas
        ref={canvasRef}
        className={cn('size-full touch-none select-none', dragging ? 'cursor-grabbing' : 'cursor-grab')}
        role="img"
        aria-label={`360 degree view of ${label}. Use the left and right arrow keys to look around.`}
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          startRef.current = { x: event.clientX, angle };
          setDragging(true);
          setAutoRotate(false);
        }}
        onPointerMove={(event) => {
          if (!dragging) return;
          const delta = event.clientX - startRef.current.x;
          const rect = event.currentTarget.getBoundingClientRect();
          // A full drag across the canvas turns roughly 120°, which feels like
          // looking rather than spinning.
          setAngle((startRef.current.angle - (delta / rect.width) * 120 + 360) % 360);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            setAutoRotate(false);
            setAngle((current) => (current + 6) % 360);
          }
          if (event.key === 'ArrowLeft') {
            setAutoRotate(false);
            setAngle((current) => (current - 6 + 360) % 360);
          }
        }}
      />

      {/* Hotspots track the pan and hide once they rotate out of view. */}
      {hotspots.map((hotspot) => {
        const relative = ((hotspot.angle - angle + 540) % 360) - 180;
        if (Math.abs(relative) > 55) return null;

        const left = 50 + (relative / 55) * 45;

        return (
          <a
            key={hotspot.label}
            href={hotspot.href ?? '#'}
            style={{ left: `${left}%` }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-brand/50 bg-canvas/70 px-3 py-1.5 text-xs backdrop-blur transition-colors hover:bg-brand hover:text-canvas"
          >
            {hotspot.label}
          </a>
        );
      })}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-canvas/80 to-transparent p-4">
        <p className="flex items-center gap-2 text-xs text-ink-muted">
          <Move3d className="size-4" aria-hidden />
          Drag to look around
        </p>

        <div className="pointer-events-auto flex gap-2">
          <button
            type="button"
            onClick={() => {
              setAngle(0);
              setAutoRotate(true);
            }}
            aria-label="Reset the view"
            className="rounded-full bg-canvas/70 p-2 text-ink-muted backdrop-blur transition-colors hover:text-ink"
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => void containerRef.current?.requestFullscreen?.()}
            aria-label="View fullscreen"
            className="rounded-full bg-canvas/70 p-2 text-ink-muted backdrop-blur transition-colors hover:text-ink"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
