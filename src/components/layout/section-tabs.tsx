import { NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { transitions } from '@/lib/motion';
import { modulesInSection, type ModuleDefinition } from '@/app/modules';

/**
 * Switches between the modules inside one bottom-navigation section.
 *
 * Text tabs with an underline, deliberately lighter than the filled
 * `SegmentedControl` used for view filters — the two appear together on some
 * screens and need to read as different levels of the hierarchy.
 *
 * Hidden from `md` up, where the sidebar lists every module directly.
 */
export function SectionTabs({ section }: { section: ModuleDefinition['section'] }) {
  const modules = modulesInSection(section);
  const reduceMotion = useReducedMotion();

  if (modules.length < 2) return null;

  return (
    <nav
      aria-label={`${section} modules`}
      className="-mx-1 flex items-center gap-1 overflow-x-auto no-scrollbar md:hidden"
    >
      {modules.map((module) => (
        <NavLink
          key={module.id}
          to={module.path}
          className={({ isActive }) =>
            cn(
              'relative shrink-0 rounded-md px-2.5 py-1.5 text-[0.8125rem] font-medium transition-colors duration-150',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              {module.label}
              {isActive && (
                <motion.span
                  layoutId={reduceMotion ? undefined : `section-tabs-${section}`}
                  className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-accent"
                  transition={transitions.spring}
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
