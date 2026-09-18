/**
 * Windows 11 / Fluent motion tokens - taken straight from Microsoft's
 * "Timing and easing" and "Motion in Windows" design docs so transitions feel
 * native rather than web-generic.
 *
 *   Durations  faster 83 · fast 167 · normal 250 · entrance 333 (ms)
 *   Easings    decel  cubic-bezier(0,0,0,1)     - entering / spawning UI
 *              accel  cubic-bezier(1,0,1,1)     - exiting (always + fade)
 *              standard cubic-bezier(0.55,0.55,0,1) - moving existing elements
 *
 * The matching @keyframes live in index.html so they're available to every
 * window (settings, popup, onboarding) and are disabled under
 * prefers-reduced-motion.
 */
export const DUR = {
  faster: 83,
  fast: 167,
  normal: 250,
  entrance: 333,
  slow: 420
} as const

export const EASE = {
  decel: 'cubic-bezier(0, 0, 0, 1)',
  accel: 'cubic-bezier(1, 0, 1, 1)',
  standard: 'cubic-bezier(0.55, 0.55, 0, 1)'
} as const

/** Shorthand for a decelerated entrance animation using a named keyframe. */
export function entrance(
  name: string,
  { duration = DUR.normal, delay = 0, ease = EASE.decel }: { duration?: number; delay?: number; ease?: string } = {}
): string {
  return `${name} ${duration}ms ${ease} ${delay}ms both`
}

/** Stagger helper - returns the delay (ms) for the nth item in a list. */
export function stagger(index: number, step = 45, base = 60): number {
  return base + index * step
}
