import "https://deno.land/x/reflection@0.0.2/mod.ts";

import { ansi } from "./ansi.ts";

export const MetadataKeyDeprecated = "metadata:deprecated";

export interface DeprecateOptions {
  hide?: boolean;
  seal?: boolean;
  since?: string | number;
  until?: string | number;
  substitute?: string;
  message?: false | string | DeprecationMessageFn;
  url?: string | URL;
}

export interface DeprecateInit extends Record<string, unknown> {
  options?: DeprecateOptions;
  parent?: string | object;
  property: string;
}

export type DeprecationMessageFn = (
  ctx: Flatten<
    Omit<DeprecateInit, "options"> & {
      options?: Omit<DeprecateOptions, "message">;
    },
    true
  >,
) => unknown | string;

export const defaultDeprecateInit = {
  options: {
    hide: true,
    seal: true,
  } as DeprecateOptions,
} as DeprecateInit;

/**
 * Deprecation warning message helper. Accepts a parent string/object and a
 * property name, and optionally a "since" version and substitution string.
 * The data provided is used to generate a standardized deprecation message
 * that is logged to the console / stderr.
 *
 * @param parent The parent string or object (eg. class name)
 * @param property The name of the deprecated method/property
 * @param [options.since] The version in which the property was deprecated
 * @param [options.until] The version in which the property will be removed
 * @param [options.substitute] Suggestion for a method/property to use instead
 * @param [options.message] Custom message to display instead of the default, or `false` to disable message, or a function to generate a custom message from the deprecated method context.
 * @param [options.hide] Whether to hide the deprecation message
 * @param [options.seal] Whether to seal the parent object and hide the property from enumeration
 *
 * @example
 * ```ts
 * deprecationWarning("Deno", "readTextFile", { since: "1.0.0" });
 * // => `Deno.readTextFile is deprecated since 1.0.0.`
 * ```
 *
 * @example
 * ```ts
 * deprecationWarning("is", "function_", { since: "0.1.0", substitute: "function" });
 * // => `is.function_ is deprecated since 0.1.0. Please use is.function instead.`
 * ```
 */
export function deprecationWarning(
  parent: string | object,
  property: string,
  options: DeprecateOptions = { ...defaultDeprecateInit.options },
): void {
  const { since, until, substitute, message } = options;

  let output = "", parentName = "";

  if (typeof parent === "object" && parent !== null) {
    parentName = {}.toString.call(parent).slice(8, -1) ||
      (parent as any)?.name || (parent as any)?.constructor?.name || null;
  } else if (typeof parent === "string") {
    parentName = String(parent);
  } else {
    parentName = "";
  }

  let { url = "" } = options;
  try {
    url = new URL(url ?? "");
  } catch {
    url = "";
  }

  // early-exit if message is set to false
  if (message === false) {
    return;
  } // if the message is a function, call it with the context and log the result
  // (this allows custom messages to be generated on the fly!)
  else if (typeof message === "function") {
    const customOutput = message({
      parent,
      parentName: parentName,
      property,
      options,
    });

    if (typeof customOutput === "string") {
      output = customOutput;
    } else if (customOutput === false) {
      return;
    }
  } // otherwise, generate a default message from the context data
  else {
    const name = [parentName, property].filter(Boolean).join(".");

    output = `${
      typeof message === "string"
        ? message
        : `${ansi.bold(ansi.underline("DEPRECATED"))}: ${
          ansi.bold(ansi.strikethrough(name))
        } ${
          since
            ? `was deprecated in ${ansi.underline(String(since))}`
            : "is now deprecated"
        }${
          until
            ? `, and is ${ansi.bold("scheduled to be removed")} by ${
              /^(next)$/i.test(until + "")
                ? "the next major release"
                : ansi.underline(String(until))
            }`
            : ""
        }.${
          typeof substitute === "string"
            ? ` Please use ${
              ansi.bold(ansi.underline(
                [parentName, substitute].filter(Boolean).join("."),
              ))
            } instead.`
            : ""
        }`
    }${
      typeof url === "string" && url.length > 0
        ? `\n\n${ansi.dim(`More info: ${ansi.underline(url)}`)}`
        : ""
    }`;
  }

  try {
    console.warn(output);
  } catch { /* noop */ }
}

export function deprecated<T extends Object, D>(
  options: DeprecateOptions,
): (target: T, propertyKey: string | symbol) => void;

export function deprecated<T extends Object, D>(
  options: DeprecateOptions,
): (
  target: T,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<D>,
) => void | TypedPropertyDescriptor<D>;

export function deprecated(
  options: DeprecateOptions = { ...defaultDeprecateInit.options },
): MethodDecorator | PropertyDecorator {
  return (target: any, propertyKey: string | symbol, descriptor?: any) => {
    const data: DeprecateOptions = {
      ...defaultDeprecateInit.options,
      ...options,
    };

    Reflect.defineMetadata(
      MetadataKeyDeprecated,
      data,
      target,
      propertyKey,
    );

    const DeprecatedSymbol = Symbol.for(MetadataKeyDeprecated);
    const existingMetadata =
      Reflect.getOwnPropertyDescriptor(target, DeprecatedSymbol)?.value ?? {};

    Reflect.defineProperty(target, DeprecatedSymbol, {
      value: {
        ...existingMetadata,
        [propertyKey]: data,
      },
      configurable: true,
      writable: true,
      enumerable: false,
    });

    if (typeof propertyKey === "symbol") return;

    const metadataObject =
      Reflect.getOwnPropertyDescriptor(target, DeprecatedSymbol)?.value ??
        {};

    const deprecatedData = Reflect.getMetadata(
      MetadataKeyDeprecated,
      target,
      propertyKey,
    ) ?? metadataObject[propertyKey];

    const value = function deprecatedMethod(this: any) {
      if (deprecatedData != null) {
        deprecationWarning(target, propertyKey.toString(), deprecatedData);
      }

      if (typeof descriptor.value === "function") {
        return descriptor.value?.apply(this, arguments);
      } else {
        return descriptor.value ?? target[propertyKey];
      }
    };

    // mark it as deprecated
    Object.defineProperties(value, {
      "name": {
        value: `${propertyKey.toString()}_deprecated`,
      },
      [Symbol.toStringTag]: {
        value: `${propertyKey.toString()} (deprecated)`,
      },
    });

    const desc = {
      configurable: !options.seal,
      enumerable: !options.hide,
      writable: !options.seal,
      value,
    };

    return desc;
  };
}

export function isDeprecated(
  target: object | Function | undefined,
  key: string | symbol,
  descriptor?: PropertyDescriptor,
): boolean {
  if (target === undefined) return false;
  if (descriptor?.value === undefined) return false;
  if (typeof descriptor?.value === "function") {
    if (
      String(descriptor?.value?.name).endsWith("_deprecated") ||
      String(descriptor?.value?.[Symbol.toStringTag]).endsWith("_deprecated")
    ) return true;
  }
  const DeprecatedSymbol = Symbol.for(MetadataKeyDeprecated);
  const deprecatedList = (target as any)[DeprecatedSymbol] ?? {};

  const hasDeprecatedMetadata = Reflect.hasMetadata(
    MetadataKeyDeprecated,
    target,
    key,
  );

  return (
    (deprecatedList && (key in deprecatedList)) ||
    (DeprecatedSymbol in (target as any)?.[key] ?? {}) ||
    (!!hasDeprecatedMetadata)
  );
}
