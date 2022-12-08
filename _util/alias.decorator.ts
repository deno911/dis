import "https://deno.land/x/reflection@0.0.2/mod.ts";

export const MetadataKeyAlias = "metadata:alias";

export function alias<A, T extends Object, D>(
  alias: A,
): (target: T, propertyKey: string | symbol) => void;

export function alias<A, T extends Object, D>(alias: A): (
  target: T,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<D>,
) => void | TypedPropertyDescriptor<D>;

export function alias<A, T extends Object, D>(alias: A):
  | ((
    target: T,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<D>,
  ) => void | TypedPropertyDescriptor<D>)
  | ((target: T, propertyKey: string | symbol) => void) {
  return (target: T, propertyKey: string | symbol, descriptor?: any) => {
    if (typeof alias === "string") {
      alias = (target as any)[alias] ?? null;
    } else if (typeof alias === "symbol") {
      alias = (target as any)[alias] ?? null;
    }

    // sanity check
    if (typeof alias !== "function" || alias === null) {
      throw new TypeError(
        `The @alias decorator must be provided with a valid identifier for a class method/property, or a string containing a valid identifier. Received ${typeof alias}: ${alias}`,
      );
    }

    Reflect.defineMetadata(
      MetadataKeyAlias,
      alias,
      target,
      propertyKey,
    );

    const AliasSymbol = Symbol.for(MetadataKeyAlias);
    const existingMetadata =
      Reflect.getOwnPropertyDescriptor(target, AliasSymbol)?.value ?? {};

    Reflect.defineProperty(target, AliasSymbol, {
      value: {
        ...existingMetadata,
        [propertyKey]: alias,
      },
      configurable: true,
      writable: true,
      enumerable: false,
    });

    if (typeof propertyKey === "symbol") {
      return;
    }

    if (typeof descriptor.value === "function") {
      return {
        ...descriptor,
        value: function aliasedMethod() {
          return descriptor.value?.apply(this, arguments);
        },
      };
    } else {
      return {
        ...descriptor,
        get: function aliasedGetter() {
          return descriptor?.get?.() ?? descriptor?.value ?? (
            (target as any)[propertyKey]
          );
        },
      };
    }
  };
}
