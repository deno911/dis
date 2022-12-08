import "https://deno.land/x/reflection@0.0.2/mod.ts";

// @inspect decorator for functions and getters
export function inspect<T extends object>(
  options: Deno.InspectOptions = {},
) {
  options = {
    colors: true,
    compact: false,
    showHidden: true,
    showProxy: true,
    getters: true,
    strAbbreviateSize: 50,
    iterableLimit: 10,
    depth: 5,
    trailingComma: true,
    ...options,
  };

  return function (
    target: T,
    key: string | symbol,
    descriptor?: PropertyDescriptor,
  ): void | any {
    descriptor ??= Reflect.getOwnPropertyDescriptor(target, key)!;
    const original = descriptor.value;

    const logger = (result: any, args?: any[]) => {
      const name = ((target as any)?.name ?? "is") +
        (typeof key === "symbol" ? `[${String(key)}]` : `.${key}`);

      console.log(
        `[DEBUG][${Deno.inspect(new Date(), { colors: true })}]\n\n${
          name + (typeof original === "function"
            ? `(${
              args?.map((a) => Deno.inspect(a, options)).join()
            }) => `
            : " = ")
        }${Deno.inspect(result, options)}\n`,
      );
    };

    if (typeof descriptor?.value === "function") {
      descriptor.value = new Proxy(original, {
        apply(t, thisArg, args) {
          if (typeof original === "function") {
            try {
              const result = Reflect.apply(t, thisArg, args);
              // if (Deno.env.get("DEBUG"))
              logger(result, args);
              return result;
            } catch (error) {
              logger(error, args);
            }
          }
          return original;
        },
      });
      descriptor.writable = true;
    } else {
      Reflect.deleteProperty(descriptor, "value");
      Reflect.deleteProperty(descriptor, "writable");

      descriptor.get = new Proxy(original, {
        apply(t, thisArg, _a) {
          try {
            const result = original ?? Reflect.apply(t, thisArg, []);
            // if (Deno.env.get("DEBUG"))
            logger(result);
            return result;
          } catch (error) {
            logger(error);
          }
        },
      });
    }

    descriptor.configurable = true;

    Reflect.defineProperty(target, key, descriptor);

    if (arguments.length === 3) {
      return descriptor;
    }
  };
}
