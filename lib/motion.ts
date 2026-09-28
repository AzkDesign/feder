export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function hasFinePointer() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/** Strong ease-out, matches --ease-out-expo. */
export function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
