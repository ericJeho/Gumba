import { ImageResponse } from 'next/og';
import { brand } from '@/config/brand';

/**
 * The social card, generated at build time.
 *
 * Drawing it rather than committing a PNG means the card always matches the
 * brand config — rename the studio or change its colours and the card follows,
 * with no designer in the loop and no stale image in /public.
 *
 * The runtime has no access to the stylesheet, so the colours here are resolved
 * from the same palette object the CSS variables come from.
 */
export const alt = `${brand.name} — ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  const palette = brand.palettes.dark;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: `linear-gradient(135deg, hsl(${palette.canvas}) 0%, hsl(${palette.surface}) 55%, hsl(${palette.brandSoft}) 100%)`,
          color: `hsl(${palette.ink})`,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* The waveform mark, redrawn as flex boxes — the OG runtime supports
              a subset of CSS and does not render inline SVG reliably. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 56 }}>
            {[20, 38, 56, 38, 20].map((height, index) => (
              <div
                key={index}
                style={{
                  width: 10,
                  height,
                  borderRadius: 5,
                  background: `hsl(${index % 2 === 0 ? palette.brand : palette.accent})`,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>{brand.name}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 82,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -3,
              maxWidth: 900,
            }}
          >
            Crafting hits that move the world.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              color: `hsl(${palette.inkMuted})`,
              maxWidth: 820,
            }}
          >
            {brand.tagline}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 24,
            color: `hsl(${palette.inkSubtle})`,
            borderTop: `1px solid hsl(${palette.line})`,
            paddingTop: 28,
          }}
        >
          <div style={{ display: 'flex' }}>
            Recording · Mixing · Mastering · Dolby Atmos · Podcasts
          </div>
          <div style={{ display: 'flex', color: `hsl(${palette.brand})` }}>
            {brand.contact.address.city}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
