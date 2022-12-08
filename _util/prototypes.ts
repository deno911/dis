import { mapEntries } from "../deps.ts";
import { isDeprecated } from "./deprecated.decorator.ts";

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
          writable: (descriptor.get ? undefined : !sealed),
        }];
      }

      return [key, {
        ...descriptor,
        configurable: !sealed,
        enumerable: true,
        writable: (descriptor.get ? undefined : !sealed),
      }];
    },
  );

  Object.defineProperties(target, descriptors);
}

export interface Flags extends Record<PropertyKey, unknown> {
  object?: any;
  negate?: boolean;
  message?: string;
}

export const kFlags = Symbol.for("is:flags");
export const kObject = Symbol.for("is:object");
export const kMethods = Symbol.for("is:methods");

export type FlaggedObject<T extends object = Function> = Flatten<
  & {
    [kFlags]: Flags | undefined;
    _obj?: unknown;
  }
  & { [x: PropertyKey]: unknown | undefined }
  & T
>;

export function flag<T extends FlaggedObject>(
  obj: T,
  key: PropertyKey,
  value?: unknown,
) {
  const flags = obj[kFlags] || (obj[kFlags] = Object.create(null));
  if (arguments.length === 3) {
    flags[key] = value;
  } else {
    return flags[key];
  }
}

export function getActual<T extends FlaggedObject>(obj: T, ...args: any[]) {
  return args.length > 4 ? args[4] : obj._obj;
}

const config = {
  includeStack: false,
  showDiff: true,
  truncateThreshold: 40,
  useProxy: true,
  proxyExcludedKeys: ["then", "catch", "inspect", "toJSON"],
};

function inspect<T extends FlaggedObject>(obj: T) {
  const str = Deno.inspect(obj);
  const type2 = Object.prototype.toString.call(obj);

  if (config.truncateThreshold && str.length >= config.truncateThreshold) {
    if (type2 === "[object Function]") {
      return !obj.name || obj.name === ""
        ? "[Function]"
        : `[Function: ${obj.name}]`;
    } else if (type2 === "[object Array]") {
      return `[ Array(${obj.length}) ]`;
    } else if (type2 === "[object Object]") {
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

export function getMessage<T extends FlaggedObject>(obj: T, ...args: any[]) {
  const negate = flag(obj, "negate"),
    val = flag(obj, "object"),
    expected = args[3],
    actual = getActual(obj, args);
  let msg = negate ? args[2] : args[1];
  const flagMsg = flag(obj, "message");

  if (typeof msg === "function") {
    msg = msg();
  }
  msg = msg || "";
  msg = msg.replace(
    /#\{(this|obj(ect)?|target|parent|val(ue)?)\}/ig,
    function () {
      return inspect(val);
    },
  ).replace(/#\{(act(ual)?|received|input)\}/ig, function () {
    return inspect(actual);
  }).replace(/#\{(exp|(expect|allow|accept)(ed)?)\}/ig, function () {
    return inspect(expected);
  });
  return flagMsg ? flagMsg + ": " + msg : msg;
}

function isProxyEnabled() {
  return config?.useProxy && typeof Proxy < "u" && typeof Reflect < "u";
}

const builtins = [kFlags, kMethods, kObject, "assert"];

export function proxify<T extends FlaggedObject>(
  obj: T,
  nonChainableMethodName?: string,
) {
  if (!isProxyEnabled()) return obj;

  return new Proxy(obj, {
    get: function proxyGetter(target, property) {
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

        Reflect.ownKeys(target).forEach(function (prop) {
          if (!Reflect.has(target, prop)) {
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
        flag(target, "ssfi", proxyGetter);
      }
      return Reflect.get(target, property);
    },
  });
}

export function stringDistanceCapped(
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
