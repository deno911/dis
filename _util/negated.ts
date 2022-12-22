import { renameFunction } from "./prototypes.ts";
import { DenoCustomInspect, IsDeprecated } from "./constants.ts";

export interface NegatedOptions {
  /** Names/Symbols of properties to exclude from the proxied object. */
  excluded?: (string | symbol)[];

  /**
   * Custom value to use for the `Symbol.toStringTag` property.
   * @default "is.not"
   */
  toStringTag?: string;

  /**
   * Create a revocable negated object using `Proxy.revocable`. This returns an
   * additional property alongside `proxy` (named `revoke`), which will destroy
   * the proxy instance and free it for garbage collection once it is invoked.
   *
   * **Note**: Proxy revocation is a one-way operation. It cannot be undone.
   * @see https://mdn.io/Proxy.revocable
   * @default false
   */
  revocable?: boolean;

  /**
   * Rename proxied functions for methods and getters/setters. Helps the final
   * object appear slightly more indistinguishable from the original target.
   * @default true
   */
  maskMethodNames?: boolean;

  /**
   * Sort the proxied method names in ascending alphabetic order.
   */
  sorted?: boolean;
}

export interface RevocableOptions extends NegatedOptions {
  revocable: true;
}

// deno-fmt-ignore
const isPromiseLike = <T = any>(value: unknown): value is PromiseLike<T> => (
    (typeof value === "function" || (typeof value === "object" && value !== null)) && (typeof (value as Promise<T>)?.then === "function"));

const isPromise = <T = unknown>(value: unknown): value is Promise<T> =>
  (value instanceof Promise) || (typeof value === "function" ||
      (typeof value === "object" && value !== null)) && (
        typeof (value as Promise<T>)?.then === "function" &&
        typeof (value as Promise<T>)?.catch === "function" &&
        typeof (value as Promise<T>)?.finally === "function"
      );

const isPromisable = <T = unknown>(
  value: unknown,
): value is Promise<T> | PromiseLike<T> =>
  isPromise<T>(value) || isPromiseLike<T>(value);

const isString = (value: unknown): value is string => (
  typeof value === "string" || value instanceof String
);

/**
 * Handle the results of one of the typecheck / assertion methods, applying
 * the negation modifier whenever it seems appropriate.
 */
function handleResult(
  this: any,
  target: any,
  args: unknown[],
  result: unknown,
) {
  const maybeNegated = <T = unknown>(result: T): T | boolean => {
    if (typeof result === "boolean" && !!this.$options.negated) {
      this.$options.negated = false;
      return !result;
    }
    return result;
  };

  if (typeof result === "function" && !isPromisable(result)) {
    result = result.apply(target, args);
  }
  if (isPromisable(result)) {
    return result.then(maybeNegated);
  }
  return maybeNegated(result);
}

export function createNegated<T extends object, U extends object>(
  obj: T,
): { proxy: U };
export function createNegated<T extends object, U extends object>(
  obj: T,
  options: RevocableOptions,
): { proxy: U; revoke(): void };
export function createNegated<T extends object, U extends object>(
  obj: T,
  options?: NegatedOptions,
): { proxy: U };
export function createNegated<T extends object, U extends object>(
  obj: T,
  options: NegatedOptions = {
    revocable: false,
    maskMethodNames: true,
  },
): any {
  options.sorted ??= true;
  options.maskMethodNames ??= true;
  options.toStringTag ??= "is.not";
  options.excluded ??= [
    // "assert",
    // "assertType",
    "typeName",
    "negated",
    "namespaceModule",
  ];

  // properties to exclude from the returned object
  const deprecatedMetadata = obj[IsDeprecated] ?? {};
  const deprecatedProperties = Reflect.ownKeys(deprecatedMetadata).filter(
    isString,
  );

  const excluded = Array.from(
    new Set([
      "not",
      "$options",
      "assertType",
      ...options?.excluded,
      IsDeprecated,
      DenoCustomInspect,
      ...deprecatedProperties,
    ]),
  );

  /** Check if a property is marked for exclusion from the proxy. */
  const isExcluded = (property: string | symbol): boolean => {
    if (typeof property === "symbol") {
      return excluded.includes(property);
    }

    return excluded.some((pattern) =>
      typeof pattern !== "symbol" && new RegExp(pattern).test(property)
    );
  };

  // return (revocable ? Proxy.revocable : new Proxy)(this as unknown as U,
  const handler: ProxyHandler<U> = {
    get(target, p, receiver) {
      if (isExcluded(p)) {
        return undefined;
      }

      if (p === Symbol.toStringTag) {
        return options.toStringTag ?? "is.not";
      }

      // equivalent to `value = target[p];`
      let value = Reflect.get(target, p, target);
      value ??= Reflect.get(target, p, receiver);
      value ??= Reflect.getOwnPropertyDescriptor(target, p)?.value!;

      if (typeof value === "function") {
        const proxiedMethod = function proxiedMethod(
          this: any,
          ...args: any[]
        ) {
          const result = (value as Function).apply(
            this === receiver ? target : this,
            args,
          );
          return handleResult.call(
            this === receiver ? target : this,
            target,
            args,
            result,
          );
        };

        if (options?.maskMethodNames) {
          renameFunction(proxiedMethod, p);
        }
        return proxiedMethod;
      }
      // otherwise...
      return value;
    },
    ownKeys(target) {
      const keys = Array.from(
        new Set(Reflect.ownKeys(target)).add(Symbol.toStringTag),
      ).filter((key) => !excluded.includes(key));

      return options?.sorted
        ? keys.toSorted((a, b) =>
          String(typeof a === "symbol" ? a?.description ?? a : a).localeCompare(
            String(typeof b === "symbol" ? b?.description ?? b : b),
          )
        )
        : keys;
    },
  };

  return options?.revocable
    ? Proxy.revocable(obj as unknown as U, handler)
    : { proxy: new Proxy(obj as unknown as U, handler) };
}
