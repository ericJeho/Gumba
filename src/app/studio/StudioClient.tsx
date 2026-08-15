'use client';

import dynamic from 'next/dynamic';

/**
 * Client boundary for the studio.
 *
 * The studio is loaded with `ssr: false`, which Next 15 only permits inside a
 * Client Component — hence this wrapper rather than a dynamic import in the
 * page itself.
 *
 * Skipping the server render is the right call here: every part of the studio
 * depends on Web Audio, MediaRecorder or localStorage, none of which exist on
 * the server, and there is no meaningful markup to prerender for a workspace
 * whose content comes from a project loaded in the browser. The skeleton below
 * holds the layout so the page never flashes empty.
 */
const Studio = dynamic(() => import('@/components/daw/Studio').then((module) => module.Studio), {
  ssr: false,
  loading: () => (
    <div className="container-page pt-10">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-line/50" />
      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <div className="h-72 animate-pulse rounded-panel bg-line/40" />
          <div className="h-96 animate-pulse rounded-panel bg-line/30" />
        </div>
        <div className="h-96 animate-pulse rounded-panel bg-line/30" />
      </div>
    </div>
  ),
});

export function StudioClient() {
  return <Studio />;
}
