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

export function sealed<T extends Function>(target: T): T | void;
export function sealed<T extends Function | Object, K extends string | symbol>(
  target: T,
  property: K,
): void;
export function sealed<
  T extends Function | Object,
  K extends string | symbol,
  D = unknown,
>(
  target: T,
  property: K,
  descriptor: TypedPropertyDescriptor<D>,
): TypedPropertyDescriptor<D> | void;
export function sealed(
  target: any,
  property?: string | symbol,
  descriptor?: PropertyDescriptor,
): any {
  try {
    if (typeof target === "function" && arguments.length === 1) {
      Object.seal(target);
      if (typeof target?.prototype < "u") {
        Object.seal(target.prototype);
      }
    } else if (property) {
      // if not descriptor, try to get one
      descriptor ||= Object.getOwnPropertyDescriptor(target, property);

      // still no descriptor? try to make one
      const value = target[property];
      descriptor ??= { value, writable: true, configurable: false };

      // for data properties
      if (descriptor?.value) {
        descriptor.value = Object.seal(descriptor.value);
        descriptor.writable = true;
      }
      // for accessor properties
      if (descriptor?.set) {
        descriptor.set = undefined;
        Reflect.deleteProperty(descriptor, "set");
        Reflect.deleteProperty(descriptor, "writable");
      }

      // Object.seal(descriptor) sets configurable to false
      descriptor.configurable = false;

      // return the property descriptor if it was provided in arguments
      // otherwise return undefined
      if (arguments.length > 2) {
        return descriptor; // method decorator
      }
      return;
    }
  } catch { /* ignore */ }
}
