import {
  BedDouble,
  BookOpen,
  Brain,
  Bike,
  Camera,
  Droplets,
  Dumbbell,
  Footprints,
  HeartPulse,
  Languages,
  Leaf,
  Music,
  NotebookPen,
  PenTool,
  Phone,
  PiggyBank,
  Pill,
  Sparkles,
  Sun,
  Sunrise,
  Utensils,
  Waves,
  Wind,
  type LucideIcon,
} from 'lucide-react';

/**
 * A curated icon set rather than the whole Lucide library: a short, scannable
 * grid is faster to pick from, and it keeps the bundle honest.
 *
 * Keys are stored in `habits.icon`; unknown keys fall back to `sparkles`.
 */
export const HABIT_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  footprints: Footprints,
  bike: Bike,
  waves: Waves,
  'heart-pulse': HeartPulse,
  droplets: Droplets,
  utensils: Utensils,
  pill: Pill,
  'bed-double': BedDouble,
  sunrise: Sunrise,
  sun: Sun,
  wind: Wind,
  brain: Brain,
  'book-open': BookOpen,
  languages: Languages,
  'notebook-pen': NotebookPen,
  'pen-tool': PenTool,
  music: Music,
  camera: Camera,
  phone: Phone,
  'piggy-bank': PiggyBank,
  leaf: Leaf,
};

export const HABIT_ICON_KEYS = Object.keys(HABIT_ICONS);

export const DEFAULT_HABIT_ICON = 'sparkles';

export function habitIcon(key: string | null | undefined): LucideIcon {
  return HABIT_ICONS[key ?? ''] ?? HABIT_ICONS[DEFAULT_HABIT_ICON];
}
