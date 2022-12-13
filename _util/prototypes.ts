import { mapEntries } from "../deps.ts";
import { isDeprecated } from "./decorators/deprecated.decorator.ts";
import type { Class } from "./types.d.ts";

/**
 * Walk up the prototype chain and find the property descriptor for the
 * given property
 *
 * @param target The parent object to search for the property on
 * @param property The name of the property to search for
 * @return The associated property descriptor, or `undefined` if none exists
 */
export function getPropertyDescriptor<
  T extends object,
  P extends PropertyKey,
  D = unknown,
>(target: T | null, property: P): TypedPropertyDescriptor<D> | undefined {
  if (target === undefined || target === null) return;

  return (
    Reflect.getOwnPropertyDescriptor(target, property) ||
    getPropertyDescriptor(Reflect.getPrototypeOf(target), property)
  );
}

export function isExtensionOf<Proto = unknown>(
  childClass: Class<Proto>,
  parentClass: Class<Proto>,
) {
  return (childClass.prototype instanceof parentClass) ||
    (parentClass.prototype instanceof childClass);
}

export function formatPropertyDescriptors(
  target: object | Function | undefined,
  { sealed = false, hideDeprecated = true, parent }: {
    parent?: object | Function | undefined;
    sealed?: boolean;
    hideDeprecated?: boolean;
  } = {},
) {
  if (target === undefined) {
    return;
  }

  parent ??= target;
  const ignoredProperties = [
    "prototype",
    "length",
    "name",
    "caller",
    "arguments",
  ];

  const descriptors = mapEntries(
    Object.getOwnPropertyDescriptors(target),
    ([key, descriptor]) => {
      if (ignoredProperties.includes(key)) {
        return [key, descriptor];
      }

      if (
        isDeprecated(target, key, descriptor) ||
        isDeprecated(parent, key, descriptor)
      ) {
        return [key, {
          ...descriptor,
          configurable: !sealed,
          enumerable: !hideDeprecated,
          ...(descriptor.value ? { writable: !sealed } : {}),
        }];
      }

      return [key, {
        ...descriptor,
        configurable: !sealed,
        enumerable: true,
        ...(descriptor.value ? { writable: !sealed } : {}),
      }];
    },
  );

  Object.defineProperties(target, descriptors);
}

export interface Flags extends Record<string | symbol, unknown> {
  object?: any;
  negate?: boolean;
  message?: string;
  // custom
  [key: string | symbol]: unknown;
}

export const kFlags = Symbol("is:flags");
export const kObject = Symbol("is:object");
export const kMethods = Symbol("is:methods");

export type Flagged<T extends {} = object> = {
  [kFlags]?: Flags | undefined;
} & T;

export function flag<V = unknown, T extends {} = object>(
  obj: Flagged<T>,
  key: keyof Flags,
  value?: V,
): V | void {
  const flags: Flags = obj[kFlags] || (obj[kFlags] = Object.create(null));
  if (value) {
    flags[key] = value as V;
  } else {
    return flags[key] as V;
  }
}

export function getActual<T extends Flagged>(obj: T, ...args: any[]) {
  return args.length > 4
    ? args[4]
    : (Reflect.has(obj, kObject))
    ? Reflect.get(obj, kObject, obj)
    : undefined;
}

const config = {
  includeStack: false,
  showDiff: true,
  truncateThreshold: 40,
  useProxy: true,
  proxyExcludedKeys: ["then", "catch", "inspect", "toJSON"],
};

function inspect<T extends {}>(obj: Flagged<T>) {
  const str = Deno.inspect(obj);
  const type2 = Object.prototype.toString.call(obj);

  if (config.truncateThreshold && str.length >= config.truncateThreshold) {
    if (typeof obj === "function" || obj instanceof Function) {
      return !obj.name || obj.name === ""
        ? "[Function]"
        : `[Function: ${obj.name}]`;
    } else if (Array.isArray(obj)) {
      return `[ Array(${obj.length}) ]`;
    } else if (
      typeof obj === "object" && obj !== null && type2 === "[object Object]"
    ) {
      const keys = Object.keys(obj);
      const kstr = keys.length > 2
        ? keys.splice(0, 2).join(", ") + ", ..."
        : keys.join(", ");
      return `{ Object (${kstr}) }`;
    } else {
      return str;
    }
  } else {
    return str;
  }
}

export function getMessage<T extends {}>(
  obj: Flagged<T>,
  message: string | (() => string),
  negatedMessage: string | (() => string),
  expected: any,
): string;

export function getMessage(...args: any[]) {
  const [obj, ...rest] = args;
  let [msg, negatedMsg, expected = true] = rest;

  const negated = flag(obj, "negate");
  const valueOf = flag(obj, "object") as any;
  const flagMsg = flag(obj, "message");

  const actual = getActual(obj, rest);

  const message =
    ((msg = negated ? negatedMsg : msg),
      String((typeof msg === "function" ? msg() : msg) || ""))
      .replace(/[#\$]?\{(this|obj(ect)?|target|val(ue)?)\}/ig, inspect(valueOf))
      .replace(/[#\$]?\{(act(ual)?|received|input)\}/ig, inspect(actual))
      .replace(/[#\$]?\{(exp(ect)?|allow|accept)(ed)?\}/ig, inspect(expected));

  return [flagMsg, message].filter(Boolean).join(": ");
}

function isProxyEnabled() {
  return config?.useProxy && typeof Proxy < "u" && typeof Reflect < "u";
}

const builtins = [kFlags, kMethods, kObject, "assert"];

export function proxify<T extends Flagged>(
  obj: T,
  nonChainableMethodName?: string,
) {
  if (!isProxyEnabled()) return obj;

  return new Proxy(obj, {
    get: function $getter(target, property) {
      if (
        typeof property === "string" &&
        config.proxyExcludedKeys.indexOf(property) === -1 &&
        !Reflect.has(target, property)
      ) {
        if (nonChainableMethodName || builtins.indexOf(property) > -1) {
          throw Error(
            `Invalid property: "${nonChainableMethodName}.${property}". See docs for proper usage of "${nonChainableMethodName}".`,
          );
        }
        let suggestion = null;
        let suggestionDistance = 4;

        Reflect.ownKeys(target).forEach((prop) => {
          if (typeof prop === "string" && !Reflect.has(target, prop)) {
            const dist = stringDistanceCapped(
              String(property),
              String(prop),
              +suggestionDistance,
            );
            if (dist < suggestionDistance) {
              suggestion = prop;
              suggestionDistance = dist;
            }
          }
        });
        throw TypeError(
          `Invalid property: "${property}".${
            suggestion ? ` Did you mean "${suggestion}"?` : ""
          }`,
        );
      }
      if (!flag(target, "lockSsfi") && builtins.indexOf(property) === -1) {
        flag(target, "ssfi", $getter);
      }
      return Reflect.get(target, property);
    },
  });
}

function stringDistanceCapped(
  strA: string,
  strB: string,
  cap: number,
): number {
  if (Math.abs(strA.length - strB.length) >= cap) {
    return cap;
  }

  const memo = [];

  for (let i = 0; i <= strA.length; i++) {
    memo[i] = Array(strB.length + 1).fill(0);
    memo[i][0] = i;
  }
  for (let j = 0; j < strB.length; j++) {
    memo[0][j] = j;
  }

  for (let i = 1; i <= strA.length; i++) {
    const ch = strA.charCodeAt(i - 1);
    for (let j = 1; j <= strB.length; j++) {
      if (Math.abs(i - j) >= cap) {
        memo[i][j] = cap;
        continue;
      }
      memo[i][j] = Math.min(
        memo[i - 1][j] + 1,
        memo[i][j - 1] + 1,
        memo[i - 1][j - 1] +
          (ch === strB.charCodeAt(j - 1) ? 0 : 1),
      );
    }
  }

  return memo[strA.length][strB.length];
}

/** Attempt to rename a function by changing the object's `name` property. */
export function renameFunction(fn: Function, value: string | symbol) {
  if (typeof value === "symbol" && value.description) {
    value = value.description;
  }
  if (typeof value === "string") {
    if (typeof fn === "function") {
      const desc = getPropertyDescriptor(fn, "name") ?? {
        configurable: true,
        writable: false,
        enumerable: false,
      };
      // remove the old name descriptor
      Reflect.deleteProperty(fn, "name");
      // define the new name descriptor
      Reflect.defineProperty(fn, "name", { ...desc, value });
    }
  }
  return fn;
}

// export function isDeprecated(
//   target: object | Function | undefined,
//   key: string | symbol,
//   descriptor?: PropertyDescriptor,
// ): boolean {
//   if (target === undefined) return false;
//   if (descriptor?.value === undefined) return false;
//   if (typeof descriptor?.value === "function") {
//     if (
//       String(descriptor?.value?.name).endsWith("_deprecated") ||
//       String(descriptor?.value?.[Symbol.toStringTag]).endsWith("_deprecated")
//     ) return true;
//   }
//   const DeprecatedSymbol = Symbol.for(MetadataKeyDeprecated);
//   const deprecatedList = (target as any)[DeprecatedSymbol] ?? {};

//   const hasDeprecatedMetadata = Reflect.hasMetadata(
//     MetadataKeyDeprecated,
//     target,
//     key,
//   );

//   return (
//     (deprecatedList && (key in deprecatedList)) ||
//     (DeprecatedSymbol in (target as any)?.[key] ?? {}) ||
//     (!!hasDeprecatedMetadata)
//   );
// }
