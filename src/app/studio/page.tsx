import { pageMetadata } from '@/lib/seo';
import { StudioClient } from '@/app/studio/StudioClient';

export const metadata = pageMetadata({
  title: 'Studio — free browser DAW',
  description:
    'Make beats, write melodies, record vocals, mix and master — free, in your browser, with no account and no download. Export a WAV you own.',
  path: '/studio',
  keywords: [
    'free daw',
    'online music studio',
    'browser beat maker',
    'free beat maker',
    'online mixing',
    'free mastering',
  ],
});

export default function StudioPage() {
  // Clears the fixed header; the studio's own transport docks directly beneath it.
  return (
    <div className="pt-[4.5rem]">
      <StudioClient />
    </div>
  );
}
