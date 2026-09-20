import {
  Apple,
  CalendarCheck,
  CircleCheckBig,
  Flag,
  Scale,
  Settings as SettingsIcon,
  Sun,
  type LucideIcon,
} from 'lucide-react';

/**
 * The module registry.
 *
 * Every screen that isn't the shell itself is a module. Navigation, the "More"
 * screen and the desktop sidebar all read from this list, so adding a future
 * module (workouts, sleep, journal…) means adding one entry plus a route —
 * not editing four navigation components.
 */
export interface ModuleDefinition {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  /** One line describing what the module is for; shown on the More screen. */
  description: string;
  /** Which bottom-navigation section the module lives under. */
  section: 'today' | 'track' | 'plan' | 'system';
}

export const MODULES: ModuleDefinition[] = [
  {
    id: 'today',
    label: 'Today',
    path: '/',
    icon: Sun,
    description: 'Everything that matters right now, in one place.',
    section: 'today',
  },
  {
    id: 'weight',
    label: 'Weight',
    path: '/track/weight',
    icon: Scale,
    description: 'Log your weight and follow the trend, not the noise.',
    section: 'track',
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    path: '/track/nutrition',
    icon: Apple,
    description: 'Meals, calories and macros against your daily targets.',
    section: 'track',
  },
  {
    id: 'habits',
    label: 'Habits',
    path: '/plan/habits',
    icon: CalendarCheck,
    description: 'The things you want to do consistently.',
    section: 'plan',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    path: '/plan/tasks',
    icon: CircleCheckBig,
    description: 'A short list of what actually needs doing.',
    section: 'plan',
  },
  {
    id: 'goals',
    label: 'Goals',
    path: '/plan/goals',
    icon: Flag,
    description: 'Longer-term outcomes you are working towards.',
    section: 'plan',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: SettingsIcon,
    description: 'Units, timezone, appearance and your account.',
    section: 'system',
  },
];

export function modulesInSection(section: ModuleDefinition['section']) {
  return MODULES.filter((module) => module.section === section);
}

export function moduleById(id: string) {
  return MODULES.find((module) => module.id === id);
}
