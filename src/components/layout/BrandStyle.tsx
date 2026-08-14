import { brand, paletteToCss } from '@/config/brand';

/**
 * Writes the brand's palettes and font stacks into the document as CSS custom
 * properties.
 *
 * This is what makes config/brand.ts authoritative: globals.css only *names*
 * the tokens, and their values arrive from here. A studio changing its colours
 * edits one TypeScript object and never opens a stylesheet.
 *
 * It renders in <head> before any content, so the first paint already has the
 * right palette — no flash of the default theme.
 */
export function BrandStyle() {
  const css = `
:root, [data-theme='dark'] { ${paletteToCss(brand.palettes.dark)}; color-scheme: dark; }
[data-theme='light'] { ${paletteToCss(brand.palettes.light)}; color-scheme: light; }
:root {
  --font-display-stack: ${brand.fonts.display};
  --font-sans-stack: ${brand.fonts.sans};
  --font-mono-stack: ${brand.fonts.mono};
}
`.trim();

  // The content is generated from a typed config object, not from user input —
  // there is no path by which a visitor can influence this string.
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
