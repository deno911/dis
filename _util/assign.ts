import type { UnionToIntersection } from "./types.d.ts";

/** Type-safe version of Object.assign */
export function assign<T extends {}, U>(
  target: T,
  source: U,
): asserts target is T & U;

/** Type-safe version of Object.assign */
export function assign<T extends {}, U extends {}[]>(
  target: T,
  ...source: U
): asserts target is T & UnionToIntersection<U[number]>;

export function assign(target: object, ...source: object[]) {
  Object.assign(target, ...source);
}
