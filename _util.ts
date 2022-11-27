import {
  objectTypeNames,
  primitiveTypeNames,
  typedArrayTypeNames,
} from "./types.ts";

import type {
  ArrayMethod,
  ObjectTypeName,
  Predicate,
  PrimitiveTypeName,
  TypedArrayTypeName,
  TypeName,
} from "./types.ts";

export { objectTypeNames, primitiveTypeNames, typedArrayTypeNames };

export type { ObjectTypeName, PrimitiveTypeName, TypedArrayTypeName, TypeName };

export const predicateOnArray = (
  method: ArrayMethod,
  predicate: Predicate,
  values: unknown[],
) => {
  if (typeof predicate !== "function") {
    throw new TypeError(`Invalid predicate: ${JSON.stringify(predicate)}`);
  }

  if (values.length === 0) {
    throw new TypeError("Invalid number of values");
  }

  return method.call(values, predicate);
};

export function isTypedArrayName(name: unknown): name is TypedArrayTypeName {
  return typedArrayTypeNames.includes(name as TypedArrayTypeName);
}

export function isPrimitiveTypeName(name: unknown): name is PrimitiveTypeName {
  return primitiveTypeNames.includes(name as PrimitiveTypeName);
}

export function isOfType<T extends Primitive | Function>(
  type: PrimitiveTypeName | "function",
) {
  // deno-lint-ignore valid-typeof
  return (value: unknown): value is T => typeof value === type;
}

/**
 * Objects
 */
export function isObjectTypeName(name: unknown): name is ObjectTypeName {
  return objectTypeNames.includes(name as ObjectTypeName);
}

export const { toString } = Object.prototype;

const NODE_TYPE_ELEMENT = 1;

const DOM_PROPERTIES_TO_CHECK: Array<(keyof HTMLElement)> = [
  "innerHTML",
  "ownerDocument",
  "style",
  "attributes",
  "nodeValue",
];

export const isDomElement = (value: unknown): value is HTMLElement => {
  return (typeof value === "object" && value !== null) &&
    (value as HTMLElement).nodeType === NODE_TYPE_ELEMENT &&
    typeof ((value as HTMLElement).nodeName) === "string" &&
    !(toString.call(value).slice(8, -1) !== "Object") &&
    DOM_PROPERTIES_TO_CHECK.every((property) => property in value);
};

export const getObjectType = (value: unknown): ObjectTypeName | undefined => {
  if (typeof value !== "object") return undefined;

  const objectTypeName = toString.call(value).slice(8, -1);

  if (/(HTML|SVG)\w+Element/.test(objectTypeName) && isDomElement(value)) {
    return "HTMLElement";
  }

  if (isObjectTypeName(objectTypeName)) {
    return objectTypeName;
  }

  return "Object";
};

export const isObjectOfType = <T>(type: ObjectTypeName) =>
  function (value: unknown): value is T {
    return getObjectType(value) === type;
  };

/**
 * Some few keywords are reserved, but we'll populate them for Node.js users.
 * @see https://github.com/Microsoft/TypeScript/issues/2536
 */
type union = Record<never, never>;
// for (const prop of ["class_", "function_", "null_"] as const) {

interface DeprecateOptions {
  hide?: boolean;
  seal?: boolean;
}

export function deprecate<T extends {}, K extends keyof T>(
  target: T,
  key: (keyof T) | Array<keyof T>,
  options: DeprecateOptions,
): void;

export function deprecate<T extends {}>(
  target: T,
  ...arg: Array<keyof T | (keyof T)[] | DeprecateOptions>
): void;

export function deprecate<T extends {}>(target: T, ...rest: unknown[]): void {
  const options: DeprecateOptions = {};
  const _keys: string[] = [];
  if (Array.isArray(rest) && rest.length > 0) {
    _keys.push(
      ...(rest.filter((a) => typeof a === "string" || Array.isArray(a))),
    );
    Object.assign(
      options,
      ...(
        rest.filter((a) => typeof a === "object" && !Array.isArray(a))
      ),
    );
  }

  const keyExists = Object.hasOwn.bind(target, target);
  // assemble the list of keys to deprecate, ensure they exist
  const keys = [_keys].flat(2).filter(keyExists);
  // get all property descriptors for the target object
  const descriptorMap = Object.getOwnPropertyDescriptors(target);
  // only include the descriptors that we are concerned with deprecating
  const descriptors = Object.entries(descriptorMap).filter(
    ([key]) => keys.includes(key),
  );

  const { hide = true, seal = true } = (options || {});

  for (const [key, desc] of descriptors) {
    const descriptor: PropertyDescriptor = {
      enumerable: !hide,
      configurable: !seal,
    };

    if (
      ("value" in desc && typeof desc.value !== "undefined") ||
      ("writable" in desc && typeof desc.writable === "boolean")
    ) {
      const { value, writable = !seal } = desc;
      descriptor.writable = seal ? false : writable;
      Reflect.defineProperty(target, key, { ...descriptor, value });
    } else if (
      ("get" in desc && typeof desc.get === "function") ||
      ("set" in desc && typeof desc.set === "function")
    ) {
      const { get, set = undefined } = desc;
      Reflect.defineProperty(target, key, { ...descriptor, get, set });
    }
  }
}

export function freeze<T extends {}>(object: T): void;
export function freeze<T extends unknown[]>(...object: T): void;
export function freeze(...objects: unknown[]): void {
  for (const o of objects) {
    Object.freeze(o);
    // freeze prototypes too
    if (typeof o === "function" && o.prototype !== undefined) {
      Object.freeze(o.prototype);
    }
  }
}

/** Type-safe version of Object.assign */
export function assign<T extends {}, U>(
  target: T,
  source: U,
): asserts target is T & U;
/** Type-safe version of Object.assign */
export function assign<T extends {}, U, V>(
  to: T,
  s_0: U,
  s_1: V,
): asserts to is T & U & V;
export function assign<T extends {}, U, V, W>(
  to: T,
  s0: U,
  s1: V,
  s2: W,
): asserts to is T & U & V & W;
export function assign<T extends {}, U, V, W, X>(
  to: T,
  s0: U,
  s1: V,
  s2: W,
  s3: X,
): asserts to is T & U & V & W & X;
export function assign<T extends {}, U, V, W, X, Y>(
  to: T,
  s0: U,
  s1: V,
  s2: W,
  s3: X,
  s4: Y,
): asserts to is T & U & V & W & X & Y;

export function assign(target: object, ...source: object[]) {
  Object.assign(target, ...source);
}
