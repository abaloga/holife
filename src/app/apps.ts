import {
  Apple,
  CalendarCheck,
  CircleCheckBig,
  Disc3,
  Flag,
  Scale,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';

/**
 * The app registry.
 *
 * This product is a launcher with apps inside it, not one program about one
 * subject. Everything the user can open is an entry here: the launcher grid,
 * the desktop sidebar and the Today dashboard all read from this list, so a new
 * app (a sketchpad, a dice roller, a reading log) is one entry plus a route.
 *
 * Categories are deliberately broad. They describe a part of life, not a
 * feature area, so an app never has to be bent to fit one.
 */
export type AppCategory = 'health' | 'productivity' | 'creative' | 'play' | 'system';

export interface AppDefinition {
  id: string;
  name: string;
  path: string;
  icon: LucideIcon;
  /** One line describing what the app is for; shown on tiles and in lists. */
  description: string;
  category: AppCategory;
  /** Tailwind text colour for the tile icon, so the grid isn't monotone. */
  tone: string;
}

export const CATEGORY_LABELS: Record<AppCategory, string> = {
  health: 'Health',
  productivity: 'Productivity',
  creative: 'Creative',
  play: 'Play',
  system: 'System',
};

/** Launcher and sidebar order. Categories with no apps are skipped. */
export const CATEGORY_ORDER: AppCategory[] = [
  'health',
  'productivity',
  'creative',
  'play',
  'system',
];

export const APPS: AppDefinition[] = [
  {
    id: 'weight',
    name: 'Weight',
    path: '/weight',
    icon: Scale,
    description: 'Log your weight and follow the trend, not the noise.',
    category: 'health',
    tone: 'text-chart-2',
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    path: '/nutrition',
    icon: Apple,
    description: 'Meals, calories and macros against your daily targets.',
    category: 'health',
    tone: 'text-chart-1',
  },
  {
    id: 'habits',
    name: 'Habits',
    path: '/habits',
    icon: CalendarCheck,
    description: 'The things you want to do consistently.',
    category: 'productivity',
    tone: 'text-chart-3',
  },
  {
    id: 'tasks',
    name: 'Tasks',
    path: '/tasks',
    icon: CircleCheckBig,
    description: 'A short list of what actually needs doing.',
    category: 'productivity',
    tone: 'text-chart-4',
  },
  {
    id: 'goals',
    name: 'Goals',
    path: '/goals',
    icon: Flag,
    description: 'Longer-term outcomes you are working towards.',
    category: 'productivity',
    tone: 'text-chart-5',
  },
  {
    id: 'music',
    name: 'Music',
    path: '/music',
    icon: Disc3,
    description: 'The CDs and cassettes you own.',
    category: 'creative',
    tone: 'text-accent',
  },
  {
    id: 'settings',
    name: 'Settings',
    path: '/settings',
    icon: SettingsIcon,
    description: 'Units, timezone, appearance and your account.',
    category: 'system',
    tone: 'text-muted-foreground',
  },
];

export function appsInCategory(category: AppCategory) {
  return APPS.filter((app) => app.category === category);
}

/** Categories that actually have apps, in display order. */
export function populatedCategories() {
  return CATEGORY_ORDER.filter((category) => appsInCategory(category).length > 0);
}

export function appById(id: string) {
  return APPS.find((app) => app.id === id);
}
