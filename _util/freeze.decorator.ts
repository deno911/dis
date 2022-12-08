import "https://deno.land/x/reflection@0.0.2/mod.ts";

export function freeze<T extends {}>(object: T): T;
export function freeze<T extends unknown[]>(...object: T): T;
export function freeze<T extends unknown[]>(...object: T) {
  const objects = object.map((o) => {
    // freeze prototypes too
    if (typeof o === "function" && o.prototype !== undefined) {
      Object.freeze(o.prototype);
    }
    return Object.freeze(o);
  });

  return objects.length > 1 ? objects : objects[0] as Readonly<T[0]>;
}
