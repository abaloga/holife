import type { Transition, Variants } from 'motion/react';

/**
 * One motion vocabulary for the whole app.
 *
 * Screens and components pick from these rather than inventing timings, so
 * everything accelerates and settles the same way. `prefers-reduced-motion` is
 * honoured globally in CSS and, for transform-based motion, via
 * `useReducedMotion()` at the component that would otherwise move things.
 */

export const transitions = {
  /** Default for opacity/colour changes. */
  quick: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] },
  /** Content entering or leaving a layout. */
  soft: { duration: 0.28, ease: [0.22, 0.61, 0.36, 1] },
  /** Anything that should feel physical: sheets, toggles, completion. */
  spring: { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 },
  /** A looser spring for larger surfaces. */
  sheet: { type: 'spring', stiffness: 320, damping: 36, mass: 1 },
  /** Celebratory overshoot, used sparingly. */
  pop: { type: 'spring', stiffness: 600, damping: 18, mass: 0.7 },
} satisfies Record<string, Transition>;

/** Parent of a list whose children should cascade in. */
export const staggerChildren = (stagger = 0.045, delayChildren = 0.02): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
  exit: {},
});

export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: transitions.soft },
  exit: { opacity: 0, height: 0, marginTop: 0, transition: transitions.quick },
};

/** Page-level transition used by the router outlet. */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 0.61, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};
