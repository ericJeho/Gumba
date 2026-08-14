import {
  Activity,
  AudioLines,
  BookOpen,
  Box,
  Camera,
  Clapperboard,
  Drum,
  Film,
  Gamepad2,
  Gauge,
  Globe,
  Megaphone,
  Mic,
  Music4,
  Palette,
  Pen,
  Radio,
  RadioTower,
  Scissors,
  Signal,
  Sliders,
  TrendingUp,
  Users,
  UsersRound,
  Video,
  Wand,
  Waves,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Resolves the icon name stored on a service to a component.
 *
 * The content file stores a string so it stays serialisable — a CMS or a JSON
 * API can supply the catalogue without needing to hand back React components.
 * An unknown name falls back rather than crashing the page.
 */
const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  'audio-lines': AudioLines,
  'book-open': BookOpen,
  box: Box,
  camera: Camera,
  clapperboard: Clapperboard,
  drum: Drum,
  film: Film,
  'gamepad-2': Gamepad2,
  gauge: Gauge,
  globe: Globe,
  megaphone: Megaphone,
  mic: Mic,
  'music-4': Music4,
  palette: Palette,
  pen: Pen,
  radio: Radio,
  'radio-tower': RadioTower,
  scissors: Scissors,
  signal: Signal,
  sliders: Sliders,
  'trending-up': TrendingUp,
  users: Users,
  'users-round': UsersRound,
  video: Video,
  wand: Wand,
  waves: Waves,
  wrench: Wrench,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? AudioLines;
  return <Icon className={cn('size-5', className)} aria-hidden />;
}
