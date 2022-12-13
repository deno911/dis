import "https://deno.land/x/reflection@0.0.2/mod.ts";

export function enumerable(value: boolean) {
  return function <T extends Object | Function, D>(
    target: T,
    prop: string | symbol,
    descriptor?: TypedPropertyDescriptor<D>,
  ): void | any {
    // property decorator
    if (!descriptor) {
      descriptor ||= (
        Object.getOwnPropertyDescriptor(target, prop) || {}
      ) as TypedPropertyDescriptor<D>;
      descriptor.enumerable = value;
      Object.defineProperty(target, prop, descriptor);
      return;
    }
    // method decorator
    descriptor ||= {};
    descriptor.enumerable = value;
    Object.defineProperty(target, prop, descriptor);
    return descriptor;
  };
}
