import {
  type ObjectTypeName,
  objectTypeNames,
  type PrimitiveTypeName,
  primitiveTypeNames,
  type TypedArrayTypeName,
  typedArrayTypeNames,
  type TypeName,
  type TypeNameMap,
} from "./typenames.ts";

import type { ArrayMethod, Predicate, Primitive } from "./types.d.ts";

export type { TypeName, TypeNameMap };

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
  "style",
];

const SVG_PROPERTIES_TO_CHECK: Array<(keyof SVGElement)> = [
  "style",
  "ownerSVGElement",
];

const GENERIC_PROPERTIES_TO_CHECK: Array<(keyof Element)> = [
  "innerHTML",
  "ownerDocument",
  "attributes",
  "nodeValue",
];

export const isElement = (
  value: unknown,
  properties = GENERIC_PROPERTIES_TO_CHECK,
): value is Element => {
  const objectTypeName = toString.call(value).slice(8, -1);
  return (
    (typeof value === "object" && value !== null) &&
    (value as Element).nodeType === NODE_TYPE_ELEMENT &&
    typeof ((value as Element).nodeName) === "string" &&
    (objectTypeName !== "Object") &&
    /Element/.test(objectTypeName) &&
    properties.every((property) => property in value)
  );
};

export const isDomElement = (
  value: unknown,
  properties = DOM_PROPERTIES_TO_CHECK,
): value is HTMLElement => {
  const objectTypeName = toString.call(value).slice(8, -1);
  return (
    isElement(value) &&
    properties.every((property) => property in value) &&
    /HTML\w*Element/.test(objectTypeName)
  );
};

export const isSvgElement = (
  value: unknown,
  properties = SVG_PROPERTIES_TO_CHECK,
): value is HTMLElement => {
  const objectTypeName = toString.call(value).slice(8, -1);
  return (
    isElement(value) &&
    properties.every((property) => property in value) &&
    /SVG\w*Element/.test(objectTypeName)
  );
};

export const getObjectType = (
  value: unknown,
): keyof TypeNameMap | undefined => {
  if (typeof value !== "object") return undefined;

  const objectTypeName = toString.call(value).slice(8, -1);

  if (isDomElement(value)) {
    return "HTMLElement";
  } else if (isSvgElement(value)) {
    return "SVGElement";
  } else if (isElement(value)) {
    return "Element";
  }

  if (isObjectTypeName(objectTypeName)) {
    return objectTypeName;
  }

  return "Object";
};

export const isObjectOfType = <
  T extends TypeNameMap[K extends keyof TypeNameMap ? K : "unknown"],
  K extends keyof TypeNameMap = keyof TypeNameMap,
>(type: K) =>
  function (value: unknown): value is T {
    return getObjectType(value) === type;
  };
