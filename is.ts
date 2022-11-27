import { Buffer, Buffer as DenoBuffer, NodeBuffer } from "./types.ts";

import type {
  AccessorDescriptor,
  Class,
  DataDescriptor,
  Falsy,
  MapIterator,
  Module,
  NodeJS,
  ObservableLike,
  Predicate,
  Primitive,
  SetIterator,
  TypedArray,
  TypeName,
} from "./types.ts";

import {
  assign,
  deprecate,
  freeze,
  getObjectType,
  isDomElement,
  isObjectOfType,
  isOfType,
  isPrimitiveTypeName,
  isTypedArrayName,
  predicateOnArray,
} from "./_util.ts";

import {
  type Assert,
  type Assertions,
  AssertionTypeDescription,
  type AssertOptions,
} from "./assert.ts";

/**
 * Determine the {@linkcode TypeName} of an arbitrary value of unknown type.
 *
 * @example
 * ```ts
 * import { is } from "https://deno.land/x/dis/mod.ts";
 *
 * is("🦕") // => "string"
 * is(100n) // => "bigint"
 * is({ foo: "bar" }) // => "Object"
 * is(new Uint8Array()) // => "Uint8Array"
 * ```
 */
function is(value: unknown): TypeName {
  if (value === null) {
    return "null";
  }

  switch (typeof value) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return Number.isNaN(value) ? "NaN" : "number";
    case "boolean":
      return "boolean";
    case "function":
      return "Function";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
    default:
  }

  if (is.observable(value)) {
    return "Observable";
  }

  if (is.array(value)) {
    return "Array";
  }

  if (is.nodeBuffer(value)) {
    return "Buffer";
  }

  if (is.denoBuffer(value)) {
    return "Buffer";
  }

  if (is.boxedPrimitive(value)) {
    throw new TypeError("Please don't use object wrappers for primitive types");
  }

  return getObjectType(value) ?? "Object";
}

is.undefined = isOfType<undefined>("undefined");

is.string = isOfType<string>("string");

is.number = (value: unknown): value is number =>
  isOfType<number>("number")(value) && !is.NaN(value);

is.bigint = isOfType<bigint>("bigint");

is.boolean = (value: unknown): value is boolean =>
  value === true || value === false;

is.symbol = isOfType<symbol>("symbol");

is.array = <T = unknown>(
  value: unknown,
  assertion?: (value: T) => value is T,
): value is T[] => {
  if (!Array.isArray(value)) return false;
  if (!is.function(assertion)) return true;
  return value.every(assertion);
};

/** Check if a value is `null`, using strict equality comparison. */
is.null = (value: unknown): value is null => value === null;

is.nullOrUndefined = (value: unknown): value is null | undefined =>
  is.null(value) || is.undefined(value);

type nullish = null | undefined;

/** @see {@linkcode is.nullOrUndefined} */
is.nullish = (value: unknown): value is nullish => is.nullOrUndefined(value);

/**
 * Check if a value is of the generic "object" type, and not null. This will
 * also check true for Function and builtin objects like Map, Set, etc.
 *
 * If you need a higher level of precision, consider using typeguards such as
 * {@linkcode is.plainObject}, {@linkcode is.nonEmptyObject}, {@linkcode is.}
 */
is.object = (value: unknown): value is object =>
  !is.null(value) && (typeof value === "object" || is.function(value));

/**
 * Tests if a value is either null or of a primitive type. Possible values:
 * - `string`
 * - `number`
 * - `bigint`
 * - `boolean`
 * - `symbol`
 * @param value The value to inspect.
 * @returns `boolean`
 */
is.primitive = (value: unknown): value is Primitive =>
  is.null(value) || isPrimitiveTypeName(typeof value);

is.boxedPrimitive = (value: unknown): boolean => {
  if (!is.object(value)) return false;
  const typeName = toString.call(value).slice(8, -1);
  return (
    ((value as any) instanceof String && typeName === "String") ||
    ((value as any) instanceof Number && typeName === "Number") ||
    ((value as any) instanceof BigInt && typeName === "BigInt") ||
    ((value as any) instanceof Symbol && typeName === "Symbol") ||
    ((value as any) instanceof Boolean && typeName === "Boolean")
  );
};

/**
 * Check if a value is truthy, meaning it cannot be falsy (`false`, `0`, `""`,
 * `undefined`, or `null`).
 *
 * @param value The value to inspect.
 * @returns `boolean`
 *
 * @example ```ts
 * is.truthy = (value: unknown): value is (not false | not 0 | not '' | not undefined | not null) => Boolean(value);
 * ```
 */
is.truthy = <T>(value: T | Falsy): value is T => Boolean(value);

/**
 * Check if a value is falsy: `false`, `0`, `""`, `undefined` or `null`.
 *
 * @param value The value to inspect.
 * @returns `boolean`
 *
 * @example ```ts
 * is.falsy = (value: unknown): value is
 * (not true | 0 | '' | undefined | null) => Boolean(value);
 * ```
 */
is.falsy = <T>(value: T | Falsy): value is Falsy => !value;

/**
 * Alias for `is.falsy`.
 * @see {@link is.falsy}
 */
is.falsey = <T>(value: T | Falsy): value is Falsy => !value;

is.function = isOfType<Function>("function");

is.iterable = <T = unknown>(value: unknown): value is Iterable<T> =>
  is.function((value as Iterable<T>)?.[Symbol.iterator]);

is.generator = (value: unknown): value is Generator =>
  is.iterable(value) && is.function((value as Generator)?.next) &&
  is.function((value as Generator)?.throw);

is.generatorFunction = isObjectOfType<GeneratorFunction>("GeneratorFunction");

is.asyncFunction = <T = unknown>(
  value: unknown,
): value is (...args: any[]) => Promise<T> =>
  getObjectType(value) === "AsyncFunction";

is.asyncIterable = <T = unknown>(value: unknown): value is AsyncIterable<T> =>
  is.function((value as AsyncIterable<T>)?.[Symbol.asyncIterator]);

is.asyncGenerator = (value: unknown): value is AsyncGenerator =>
  is.asyncIterable(value) && is.function((value as AsyncGenerator).next) &&
  is.function((value as AsyncGenerator).throw);

is.asyncGeneratorFunction = (
  value: unknown,
): value is (...args: any[]) => Promise<unknown> =>
  getObjectType(value) === "AsyncGeneratorFunction";

is.boundFunction = (value: unknown): value is Function =>
  is.function(value) &&
  !Object.prototype.hasOwnProperty.call(value, "prototype");

/**
 * Check if a Function appears to be a constructable Class.
 */
is.class = <Proto = unknown>(value: unknown): value is Class<Proto> => {
  if (!is.function(value)) return false;
  if (!is.object(value.prototype)) return false;
  return Function.prototype.toString.call(value).startsWith("class ");
};
/**
 * Check if a value is a direct instance of a class.
 * @param instance The value to inspect.
 * @param class_ the class to check against
 * @returns `boolean`
 */
is.directInstanceOf = <T>(instance: unknown, class_: Class<T>): instance is T =>
  Object.getPrototypeOf(instance) === class_.prototype;

is.instanceOf = <T>(instance: unknown, class_: Class<T>): instance is T =>
  (is.directInstanceOf(instance, class_)) || (instance instanceof class_);

is.promise = <T = unknown>(value: unknown): value is Promise<T> =>
  is.nativePromise(value) || hasPromiseApi(value);

is.nativePromise = <T = unknown>(value: unknown): value is Promise<T> =>
  isObjectOfType<Promise<T>>("Promise")(value);

const hasPromiseApi = <T = unknown>(value: unknown): value is Promise<T> =>
  is.function((value as Promise<T>)?.then) &&
  is.function((value as Promise<T>)?.catch);

is.regExp = isObjectOfType<RegExp>("RegExp");
is.regex = isObjectOfType<RegExp>("RegExp");
is.date = isObjectOfType<Date>("Date");
is.error = isObjectOfType<Error>("Error");

is.map = <Key = unknown, Value = unknown>(
  value: unknown,
): value is Map<Key, Value> => isObjectOfType<Map<Key, Value>>("Map")(value);

is.set = <T = unknown>(value: unknown): value is Set<T> =>
  isObjectOfType<Set<T>>("Set")(value);

is.weakMap = <Key extends object = object, Value = unknown>(
  value: unknown,
): value is WeakMap<Key, Value> =>
  isObjectOfType<WeakMap<Key, Value>>("WeakMap")(value);

is.weakSet = (value: unknown): value is WeakSet<object> =>
  isObjectOfType<WeakSet<object>>("WeakSet")(value);

is.weakRef = (value: unknown): value is WeakRef<object> =>
  isObjectOfType<WeakRef<object>>("WeakRef")(value);

is.mapIterator = isObjectOfType<MapIterator>("Map Iterator");

is.setIterator = isObjectOfType<SetIterator>("Set Iterator");

is.namespaceModule = isObjectOfType<Module>("Module");

/**
 * Check if a value is a plain object, with extensive checks to ensure we
 * aren't actually dealing with an array, function, or other object type.
 *
 * @param value The value to inspect.
 * @returns `boolean`
 */
is.plainObject = <Value = unknown>(
  value: unknown,
): value is Record<string, Value> => {
  /**
   * @see https://github.com/sindresorhus/is-plain-obj/blob/main/index.js
   */
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return (prototype === null || prototype === Object.prototype ||
    Object.getPrototypeOf(prototype) === null) &&
    !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
};

// ----------------------------------------------------------------- //
// Properties and Property Descriptors
// ----------------------------------------------------------------- //

/**
 * `PropertyKey` is any value that is valid as an object key. Equivalent to
 * `string | number | symbol`.
 */
is.propertyKey = (value: unknown): value is PropertyKey =>
  is.any([is.string, is.number, is.symbol], value);

/**
 * Checks if a value is a Property Descriptor, without discerning between the
 * subtypes of Accessor Properties or Data Properties.
 * @see {@linkcode is.accessorDescriptor} for the Accessor Descriptor check
 * @see {@linkcode is.dataDescriptor} for the Data Descriptor check
 */
is.propertyDescriptor = <T = any>(
  value: unknown,
): value is TypedPropertyDescriptor<T> => {
  return is.nonEmptyObject<keyof PropertyDescriptor>(value) &&
    (is.accessorDescriptor(value) || is.dataDescriptor(value));
};

/**
 * Checks if a value is a valid Accessor Descriptor, meaning it does not have
 * `value` or `writable` properties, and **does** have a getter (`get`) and/or
 * a setter (`set`) property.
 * @param value The value to inspect.
 * @returns `true` if the value is an accessor descriptor, else `false`
 * @see {@linkcode is.dataDescriptor} for the Data Descriptor check
 * @see {@linkcode is.propertyDescriptor} for the generic Descriptor check
 */
is.accessorDescriptor = <T = any>(
  value: unknown,
): value is AccessorDescriptor<T> => {
  if (is.nonEmptyObject<keyof PropertyDescriptor>(value)) {
    return is.any(is.function, value.get, value.set) &&
      is.all(is.undefined, value.writable, value.value);
  }
  return false;
};

/**
 * Checks if a value is a valid Data Property Descriptor, meaning it does not
 * have a `get` or `set` property, but is defined with a `value` data property.
 * @param value The value to inspect.
 * @returns `true` if the value is a data property descriptor, else `false`
 * @see {@linkcode is.accessorDescriptor} for the Accessor Descriptor check
 * @see {@linkcode is.propertyDescriptor} for the generic Descriptor check
 */
is.dataDescriptor = <T = any>(
  value: unknown,
): value is DataDescriptor<T> => {
  if (is.nonEmptyObject<keyof PropertyDescriptor>(value)) {
    return !is.undefined(value.value) &&
      is.none(is.function, value.get, value.set);
  }
  return false;
};

/**
 * Checks if a key is included in those defined on a target object or array..
 * @param value The value to inspect.
 * @param target The object or array to check against.
 * @returns `true` if the value is included in the target's keys, else `false`.
 */
is.key = <T extends readonly unknown[] | Record<PropertyKey, unknown> = {}>(
  value: unknown,
  target: T,
): value is keyof T => Object.keys(target).includes(value as string);

/**
 * Checks if a value is included in a target object or array.
 * @param value The value to inspect.
 * @param target The object or array to check against.
 * @returns `true` if the value is included in the target values, else `false`.
 */
is.value = <T extends readonly unknown[] | Record<PropertyKey, unknown> = {}>(
  value: unknown,
  target: T,
): value is T[keyof T] => Object.values(target).includes(value as string);

/**
 * Checks if a key is included in a target enum's keys.
 * @param value The value to inspect.
 * @param targetEnum The enum to check against.
 * @returns `true` if the key exists in the enum, else `false`.
 */
is.enumKey = <T = unknown>(
  value: unknown,
  targetEnum: T,
): value is keyof T =>
  Object.keys(targetEnum as object).includes(String(value));

/**
 * Checks if a value is included in a target enum.
 * @param value The value to inspect.
 * @param targetEnum The enum to check against.
 * @returns `true` if the value is included in the enum, else `false`.
 */
is.enumCase = <T = unknown>(
  value: unknown,
  targetEnum: T,
): value is T[keyof T] => Object.values(targetEnum as object).includes(value);

/**
 * Checks if a value is `ArrayLike<T>`. An "array-like" object is simply an
 * object that has a numeric length property and 0-indexed numeric keys.
 *
 * @param value The value to inspect.
 * @returns `boolean`
 */
is.arrayLike = <T = unknown>(value: unknown): value is ArrayLike<T> =>
  !is.nullOrUndefined(value) && !is.function(value) &&
  isValidLength((value as ArrayLike<T>).length);

/**
 * Checks if a value is a valid `[key, value]` entry in the form of a
 * tuple pair with a fixed-length of 2.
 * @see {@linkcode is.entries}
 */
is.entry = <K = unknown, V = unknown>(value: unknown): value is [K, V] =>
  is.nonEmptyArray(value) && value.length === 2;

/**
 * Checks if a value is a collection of valid `[key, value]` entries, each of
 * which has the form of a tuple pair with a fixed-length of 2.
 * @see {@linkcode is.entry}
 */
is.entries = <K = unknown, V = unknown>(value: unknown): value is [K, V][] =>
  is.nonEmptyArray(value) && is.array(value, is.entry);

is.sparseArray = (value: unknown): value is unknown[] =>
  is.array(value) && (value.length !== value.filter((v) => v).length);

/**
 * Check if a value is a TypedArray.
 *
 * @param value The value to inspect.
 * @returns `boolean`
 */
is.typedArray = (value: unknown): value is TypedArray =>
  isTypedArrayName(getObjectType(value));

is.int8Array = isObjectOfType<Int8Array>("Int8Array");
is.uint8Array = isObjectOfType<Uint8Array>("Uint8Array");
is.uint8ClampedArray = isObjectOfType<Uint8ClampedArray>("Uint8ClampedArray");
is.int16Array = isObjectOfType<Int16Array>("Int16Array");
is.uint16Array = isObjectOfType<Uint16Array>("Uint16Array");
is.int32Array = isObjectOfType<Int32Array>("Int32Array");
is.uint32Array = isObjectOfType<Uint32Array>("Uint32Array");
is.float32Array = isObjectOfType<Float32Array>("Float32Array");
is.float64Array = isObjectOfType<Float64Array>("Float64Array");
is.bigInt64Array = isObjectOfType<BigInt64Array>("BigInt64Array");
is.bigUint64Array = isObjectOfType<BigUint64Array>("BigUint64Array");
is.arrayBuffer = isObjectOfType<ArrayBuffer>("ArrayBuffer");

/**
 * Checks if the given value is a valid `SharedArrayBuffer`.
 * @param value The value to inspect.
 * @returns `true` if the value is a valid `SharedArrayBuffer`, else `false`.
 * @example ```ts
 * import { is } from "is";
 * if (is.sharedArrayBuffer(new SharedArrayBuffer(1))) {
 *  console.log("SharedArrayBuffer");
 * }
 */
is.sharedArrayBuffer = isObjectOfType<SharedArrayBuffer>("SharedArrayBuffer");

/**
 * Checks if the given value is an instance of `DataView` or `ArrayBufferView`.
 * @param value The value to inspect.
 * @returns `true` if the value is an instance of `DataView` or `ArrayBufferView`, else `false`.
 * @example ```ts
 * import { is } from "is";
 * if (is.arrayBufferView(new DataView(new ArrayBuffer(1)))) {
 *   console.log("DataView");
 * }
 */
is.dataView = isObjectOfType<DataView>("DataView");

/**
 * Checks if a given value is a valid Node.js Buffer, using the `.isBuffer()`
 * method (static) from the Buffer constructor. This does not perform any other
 * checks, and should not be relied upon for matching potential `ArrayBuffer` or
 * `Deno.Buffer` instances.
 */
is.nodeBuffer = (value: unknown): value is NodeBuffer =>
  ((value as any)?.constructor as typeof NodeBuffer)?.isBuffer?.(value) ??
    false;

is.denoBuffer = (value: unknown): value is DenoBuffer =>
  DenoBuffer?.[Symbol.hasInstance]?.(value) || is.instanceOf(value, DenoBuffer);

is.buffer = (value: unknown): value is Buffer =>
  is.arrayBuffer(value) || is.denoBuffer(value) || is.nodeBuffer(value);

// ----------------------------------------------------------------- //
// Browser / Web API Related Objects
// ----------------------------------------------------------------- //

is.blob = (value: unknown): value is Blob =>
  isObjectOfType<Blob>("Blob")(value);

is.formData = (value: unknown): value is FormData =>
  isObjectOfType<FormData>("FormData")(value);

is.headers = (value: unknown): value is Headers =>
  isObjectOfType<Headers>("Headers")(value);

is.request = (value: unknown): value is Request =>
  isObjectOfType<Request>("Request")(value);

is.response = (value: unknown): value is Response =>
  isObjectOfType<Response>("Response")(value);

is.urlSearchParams = (value: unknown): value is URLSearchParams =>
  isObjectOfType<URLSearchParams>("URLSearchParams")(value);

/**
 * Check if an value is a valid instance of the `URL` class.
 * @param value The value to inspect.
 * @returns `boolean`
 * @see https://mdn.io/URL
 */
is.urlInstance = (value: unknown): value is URL =>
  isObjectOfType<URL>("URL")(value);

/**
 * Check if an arbitrary string is a valid URL.
 * @param value The value to inspect.
 * @returns `boolean`
 */
is.urlString = (value: unknown): value is string => {
  if (!is.string(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

is.url = (value: unknown): value is string | URL =>
  is.urlString(value) || is.urlInstance(value);

/**
 * Check if a value is a DOM element.
 *
 * @param value The value to inspect.
 * @returns `true` if the value is a DOM node.
 *
 * @example ```ts
 * const div = document.createElement("div");
 * is.domElement(div); // true
 * ```
 * @example ```ts
 * const myElement = document.querySelector("#my-element");
 * is.domElement(myElement); // true
 * ```
 *
 * @example ```ts
 * const astNode = { tagName: "div", id: "my-element" };
 * is.domElement(astNode); // false
 * ```
 */
is.domElement = (value: unknown): value is HTMLElement =>
  is.object(value) && !is.plainObject(value) && isDomElement(value);

/**
 * Check if a value is `Observable` or `ObservableLike`.
 *
 * @note An "observable" is an object that has a `subscribe` method, and a `Symbol.observable` property (sometimes referred to as "@@observable").
 *
 * @param value The value to inspect.
 * @returns `true` if the value is an `Observable` or `ObservableLike`.
 */
is.observable = (value: unknown): value is ObservableLike => {
  if (!value) {
    return false;
  }

  if (value === (value as any)[Symbol.observable]?.()) {
    return true;
  }

  if (value === (value as any)["@@observable"]?.()) {
    return true;
  }

  return false;
};

is.nodeStream = (value: unknown): value is NodeJS.Stream =>
  is.object(value) && is.function((value as NodeJS.Stream).pipe) &&
  !is.observable(value);

// ----------------------------------------------------------------- //
//  Numbers / Numerics
// ----------------------------------------------------------------- //

is.numericString = (value: unknown): value is string =>
  is.string(value) &&
  !is.emptyStringOrWhitespace(value) &&
  !Number.isNaN(Number(value));

/**
 * Equivalent to the JavaScript builtin `Number.isNaN`.
 *
 * @param value The value to inspect.
 * @returns `boolean`
 */
is.NaN = (value: unknown) => Number.isNaN(value as number);

/**
 * Alias for `is.NaN`.
 * @see {@linkcode is.NaN}
 */
is.nan = (value: unknown) => Number.isNaN(value as number);

/**
 * Strong typed alias for the builtin `Number.isInteger`.
 *
 * @param value The value to inspect.
 * @returns `boolean`
 */
is.integer = (value: unknown): value is number =>
  Number.isInteger(value as number);

/**
 * Strong-typed alias for the builtin `Number.isSafeInteger`.
 * @param value The value to inspect.
 * @returns `boolean`
 */
is.safeInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value as number);

/**
 * Check if a value is of the valid length for its given type.
 * @param value
 * @returns `boolean`
 */
const isValidLength = (value: unknown): value is number =>
  is.safeInteger(value) && value >= 0;

is.infinite = (value: unknown): value is number =>
  value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY;

const isAbsoluteMod2 =
  (remainder: number) => (value: number): value is number =>
    is.integer(value) && Math.abs(value % 2) === remainder;

is.evenInteger = isAbsoluteMod2.apply(this, [0]);

is.oddInteger = isAbsoluteMod2(1);

/**
 * Check if a numeric value conforms to a given range.
 * @param value The value to inspect.
 * @param range - the range to check against.
 * @returns `true` if the value is within the legal bounds of the range.
 * Otherwise, throws a `TypeError` similar to a `RangeError`.
 *
 * @example ```ts
 * is.inRange = (value: number, range: [number, number]): boolean => {
 *  return value >= range[0] && value <= range[1];
 * }
 * ```
 */
is.inRange = (value: number, range: number | number[]): value is number => {
  if (is.number(range)) {
    return value >= Math.min(0, range) && value <= Math.max(range, 0);
  }

  if (is.array(range) && range.length === 2) {
    return value >= Math.min(...range) && value <= Math.max(...range);
  }

  throw new TypeError(`Invalid range: ${JSON.stringify(range)}`);
};

// ----------------------------------------------------------------- //
//  Emptiness Checks
// ----------------------------------------------------------------- //
is.emptyArray = (value: unknown): value is never[] =>
  is.array(value) && value.length === 0;

is.emptySet = (value: unknown): value is Set<never> =>
  is.set(value) && value.size === 0;

is.emptyMap = (value: unknown): value is Map<never, never> =>
  is.map(value) && value.size === 0;

is.emptyObject = <Key extends keyof any = string>(
  value: unknown,
): value is Record<Key, never> =>
  is.object(value) && !is.map(value) && !is.set(value) &&
  Object.keys(value).length === 0;

is.emptyString = (value: unknown): value is "" =>
  is.string(value) && value.length === 0;

is.whitespace = (value: unknown): value is string =>
  is.string(value) && !/\S/.test(value);

is.emptyStringOrWhitespace = (value: unknown): value is string =>
  is.emptyString(value) || is.whitespace(value);

// ----------------------------------------------------------------- //
//  Non-Emptiness Checks
// ----------------------------------------------------------------- //

is.nonEmptyArray = (value: unknown): value is [unknown, ...unknown[]] =>
  is.array(value) && value.length > 0;

is.nonEmptySet = <T = unknown>(value: unknown): value is Set<T> =>
  is.set(value) && value.size > 0;

is.nonEmptyMap = <Key = unknown, Value = unknown>(
  value: unknown,
): value is Map<Key, Value> => is.map(value) && value.size > 0;

/**
 * TODO: Use `not` operator here to remove `Map` and `Set` from type guard:
 * https://github.com/Microsoft/TypeScript/pull/29317
 */
is.nonEmptyObject = <Key extends keyof any = string, Value = unknown>(
  value: unknown,
): value is Record<Key, Value> =>
  is.object(value) && !is.map(value) && !is.set(value) &&
  Object.keys(value).length > 0;

// TODO: Use `not ''` when the `not` operator is available.
is.nonEmptyString = (value: unknown): value is string =>
  is.string(value) && value.length > 0;

// TODO: Use `not ''` when the `not` operator is available.
is.nonEmptyStringAndNotWhitespace = (value: unknown): value is string =>
  is.string(value) && !is.emptyStringOrWhitespace(value);

is.any = (
  predicate: Predicate | Predicate[],
  ...values: unknown[]
): boolean => {
  const predicates = is.array(predicate) ? predicate : [predicate];
  return predicates.some((singlePredicate) =>
    predicateOnArray(Array.prototype.some, singlePredicate, values)
  );
};

is.some = (
  predicate: Predicate | Predicate[],
  ...values: unknown[]
): boolean => {
  return is.any(predicate, ...values);
};

is.all = (
  predicate: Predicate | Predicate[],
  ...values: unknown[]
): boolean => {
  const predicates = is.array(predicate) ? predicate : [predicate];
  return predicates.every((singlePredicate) =>
    predicateOnArray(Array.prototype.every, singlePredicate, values)
  );
};

is.every = (
  predicate: Predicate | Predicate[],
  ...values: unknown[]
): boolean => {
  return is.all(predicate, ...values);
};

is.none = (
  predicate: Predicate | Predicate[],
  ...values: unknown[]
): boolean => {
  const predicates = is.array(predicate) ? predicate : [predicate];
  return predicates.some((singlePredicate) =>
    predicateOnArray(Array.prototype.some, singlePredicate, values)
  );
};

/** @deprecated use {@linkcode is.function} instead */
is.function_ = isOfType<Function>("function");

/** @deprecated use {@linkcode is.class} instead */
is.class_ = <T>(value: unknown): value is Class<T> => is.class(value);

/**
 * @deprecated use {@linkcode is.null} instead
 */
is.null_ = (value: unknown): value is null => value === null;

/* Type Assertions */
const assertType = (
  condition: boolean,
  description: string,
  value: unknown,
  options: { multipleValues?: boolean } = {},
): asserts condition => {
  if (!condition) {
    const { multipleValues } = options;
    const valuesMessage = multipleValues
      ? `received values of types ${
        [
          ...new Set(
            (value as any[]).map((singleValue) => `\`${is(singleValue)}\``),
          ),
        ].join(", ")
      }`
      : `received value of type \`${is(value)}\``;

    throw new TypeError(
      `Expected value which is \`${description}\`, ${valuesMessage}.`,
    );
  }
};

/**
 * Type Assertions. If conditions are not as expected, throws a TypeError.
 */
const assert: Assert = Object.assign(
  function assert(
    condition: boolean,
    value: unknown,
    message?: unknown,
    options?: AssertOptions,
  ): asserts condition {
    if (!condition) {
      if (is.undefined(message) && is.undefined(options)) {
        if (is.string(value)) {
          throw new TypeError(`Assertion Failure: ${String(value)}`);
        }
      }
      const { multipleValues = false } = (options || {});
      const values = [...new Set([value as any].flat())];
      const msg = multipleValues
        ? `values of types ${
          values.map((v, i) =>
            `${i === values.length - 1 ? "and " : ""}\`${is(v)}\``
          ).join(", ")
        }`
        : `value of type \`${is(value)}\``;

      throw new TypeError(
        `Assertion Failure: Expected value of \`${message}\` but received ${msg}.`,
      );
    }
  },
  {
    // Unknowns.
    undefined: (value: unknown): asserts value is undefined =>
      assertType(is.undefined(value), "undefined", value),
    null: (value: unknown): asserts value is null =>
      assertType(is.null(value), "null", value),
    nullOrUndefined: (value: unknown): asserts value is null | undefined =>
      assertType(
        is.nullOrUndefined(value),
        AssertionTypeDescription.nullOrUndefined,
        value,
      ),
    string: (value: unknown): asserts value is string =>
      assertType(is.string(value), "string", value),
    number: (value: unknown): asserts value is number =>
      assertType(is.number(value), "number", value),
    bigint: (value: unknown): asserts value is bigint =>
      assertType(is.bigint(value), "bigint", value),
    function: (value: unknown): asserts value is Function =>
      assertType(is.function(value), "Function", value),
    class: <P = unknown>(value: unknown): asserts value is Class<P> =>
      assertType(is.class<P>(value), AssertionTypeDescription.class_, value),
    nullish: (value: unknown): asserts value is null | undefined =>
      assertType(
        is.nullOrUndefined(value),
        AssertionTypeDescription.nullOrUndefined,
        value,
      ),
    object: (value: unknown): asserts value is object =>
      assertType(is.object(value), "Object", value),
    boolean: (value: unknown): asserts value is boolean =>
      assertType(is.boolean(value), "boolean", value),
    symbol: (value: unknown): asserts value is symbol =>
      assertType(is.symbol(value), "symbol", value),
    truthy: (value: unknown): asserts value is unknown =>
      assertType(is.truthy(value), AssertionTypeDescription.truthy, value),
    falsy: (value: unknown): asserts value is unknown =>
      assertType(is.falsy(value), AssertionTypeDescription.falsy, value),
    primitive: (value: unknown): asserts value is Primitive =>
      assertType(
        is.primitive(value),
        AssertionTypeDescription.primitive,
        value,
      ),

    array: <T = unknown>(
      value: unknown,
      assertion?: (element: unknown) => asserts element is T,
    ): asserts value is T[] => {
      const assert: (
        condition: boolean,
        description: string,
        value: unknown,
      ) => asserts condition = assertType;

      assert(is.array(value), "Array", value);

      if (assertion) {
        value.forEach(assertion);
      }
    },

    iterable: <T = unknown>(value: unknown): asserts value is Iterable<T> =>
      assertType(is.iterable(value), AssertionTypeDescription.iterable, value),
    asyncIterable: <T = unknown>(
      value: unknown,
    ): asserts value is AsyncIterable<T> =>
      assertType(
        is.asyncIterable(value),
        AssertionTypeDescription.asyncIterable,
        value,
      ),
    generator: (value: unknown): asserts value is Generator =>
      assertType(is.generator(value), "Generator", value),
    asyncGenerator: (value: unknown): asserts value is AsyncGenerator =>
      assertType(is.asyncGenerator(value), "AsyncGenerator", value),
    nativePromise: <T = unknown>(value: unknown): asserts value is Promise<T> =>
      assertType(
        is.nativePromise(value),
        AssertionTypeDescription.nativePromise,
        value,
      ),
    promise: <T = unknown>(value: unknown): asserts value is Promise<T> =>
      assertType(is.promise(value), "Promise", value),
    generatorFunction: (value: unknown): asserts value is GeneratorFunction =>
      assertType(is.generatorFunction(value), "GeneratorFunction", value),
    asyncGeneratorFunction: (
      value: unknown,
    ): asserts value is AsyncGeneratorFunction =>
      assertType(
        is.asyncGeneratorFunction(value),
        "AsyncGeneratorFunction",
        value,
      ),

    asyncFunction: (value: unknown): asserts value is Function =>
      assertType(is.asyncFunction(value), "AsyncFunction", value),
    boundFunction: (value: unknown): asserts value is Function =>
      assertType(is.boundFunction(value), "Function", value),
    directInstanceOf: <T>(
      instance: unknown,
      class_: Class<T>,
    ): asserts instance is T =>
      assertType(
        is.directInstanceOf(instance, class_),
        AssertionTypeDescription.directInstanceOf,
        instance,
      ),
    instanceOf: <T>(
      instance: unknown,
      class_: Class<T>,
    ): asserts instance is T =>
      assertType(
        is.instanceOf(instance, class_),
        AssertionTypeDescription.directInstanceOf,
        instance,
      ),

    regExp: (value: unknown): asserts value is RegExp =>
      assertType(is.regExp(value), "RegExp", value),
    regex: (value: unknown): asserts value is RegExp =>
      assertType(is.regExp(value), "RegExp", value),
    date: (value: unknown): asserts value is Date =>
      assertType(is.date(value), "Date", value),
    error: (value: unknown): asserts value is Error =>
      assertType(is.error(value), "Error", value),

    map: <Key = unknown, Value = unknown>(
      value: unknown,
    ): asserts value is Map<Key, Value> =>
      assertType(is.map(value), "Map", value),
    set: <T = unknown>(value: unknown): asserts value is Set<T> =>
      assertType(is.set(value), "Set", value),
    weakMap: <Key extends object = object, Value = unknown>(
      value: unknown,
    ): asserts value is WeakMap<Key, Value> =>
      assertType(is.weakMap(value), "WeakMap", value),
    weakSet: <T extends object = object>(
      value: unknown,
    ): asserts value is WeakSet<T> =>
      assertType(is.weakSet(value), "WeakSet", value),
    weakRef: <T extends object = object>(
      value: unknown,
    ): asserts value is WeakRef<T> =>
      assertType(is.weakRef(value), "WeakRef", value),

    arrayLike: <T = unknown>(value: unknown): asserts value is ArrayLike<T> =>
      assertType(
        is.arrayLike(value),
        AssertionTypeDescription.arrayLike,
        value,
      ),
    namespaceModule: (value: unknown): asserts value is Module =>
      assertType(is.namespaceModule(value), "Module", value),
    plainObject: <Value = unknown>(
      value: unknown,
    ): asserts value is Record<string, Value> =>
      assertType(
        is.plainObject(value),
        AssertionTypeDescription.plainObject,
        value,
      ),
    propertyKey: (value: unknown): asserts value is number =>
      assertType(is.propertyKey(value), "PropertyKey", value),
    propertyDescriptor: <T = unknown>(
      value: unknown,
    ): asserts value is TypedPropertyDescriptor<T> =>
      assertType(
        is.propertyDescriptor(value),
        "PropertyDescriptor",
        value,
      ),
    accessorDescriptor: <T = unknown>(
      value: unknown,
    ): asserts value is AccessorDescriptor<T> =>
      assertType(is.accessorDescriptor(value), "AccessorDescriptor", value),
    dataDescriptor: <T = unknown>(
      value: unknown,
    ): asserts value is DataDescriptor<T> =>
      assertType(is.dataDescriptor(value), "DataDescriptor", value),
    key: <T extends readonly unknown[] | Record<PropertyKey, unknown> = {}>(
      value: unknown,
      target: T,
    ): asserts value is keyof T =>
      assertType(is.key(value, target), "Key", value),
    value: <T extends readonly unknown[] | Record<PropertyKey, unknown> = {}>(
      value: unknown,
      target: T,
    ): asserts value is T[keyof T] =>
      assertType(is.value(value, target), "Value", value),

    enumKey: <T = unknown>(
      value: unknown,
      targetEnum: T,
    ): asserts value is keyof T =>
      assertType(is.enumKey(value, targetEnum), "EnumKey", value),
    enumCase: <T = unknown>(
      value: unknown,
      targetEnum: T,
    ): asserts value is T[keyof T] =>
      assertType(is.enumCase(value, targetEnum), "EnumCase", value),

    entry: <K = unknown, V = unknown>(
      value: unknown,
    ): asserts value is readonly [K, V] =>
      assertType(
        is.entry(value),
        AssertionTypeDescription.entry,
        value,
      ),
    entries: <K = unknown, V = unknown>(
      value: unknown,
    ): asserts value is readonly (readonly [K, V])[] =>
      assertType(
        is.entries(value),
        AssertionTypeDescription.entries,
        value,
      ),
    sparseArray: (value: unknown): asserts value is unknown[] =>
      assertType(
        is.sparseArray(value),
        AssertionTypeDescription.sparseArray,
        value,
      ),
    typedArray: (value: unknown): asserts value is TypedArray =>
      assertType(
        is.typedArray(value),
        AssertionTypeDescription.typedArray,
        value,
      ),
    int8Array: (value: unknown): asserts value is Int8Array =>
      assertType(is.int8Array(value), "Int8Array", value),
    uint8Array: (value: unknown): asserts value is Uint8Array =>
      assertType(is.uint8Array(value), "Uint8Array", value),
    uint8ClampedArray: (value: unknown): asserts value is Uint8ClampedArray =>
      assertType(is.uint8ClampedArray(value), "Uint8ClampedArray", value),
    int16Array: (value: unknown): asserts value is Int16Array =>
      assertType(is.int16Array(value), "Int16Array", value),
    uint16Array: (value: unknown): asserts value is Uint16Array =>
      assertType(is.uint16Array(value), "Uint16Array", value),
    int32Array: (value: unknown): asserts value is Int32Array =>
      assertType(is.int32Array(value), "Int32Array", value),
    uint32Array: (value: unknown): asserts value is Uint32Array =>
      assertType(is.uint32Array(value), "Uint32Array", value),
    float32Array: (value: unknown): asserts value is Float32Array =>
      assertType(is.float32Array(value), "Float32Array", value),
    float64Array: (value: unknown): asserts value is Float64Array =>
      assertType(is.float64Array(value), "Float64Array", value),
    bigInt64Array: (value: unknown): asserts value is BigInt64Array =>
      assertType(is.bigInt64Array(value), "BigInt64Array", value),
    bigUint64Array: (value: unknown): asserts value is BigUint64Array =>
      assertType(is.bigUint64Array(value), "BigUint64Array", value),
    arrayBuffer: (value: unknown): asserts value is ArrayBuffer =>
      assertType(is.arrayBuffer(value), "ArrayBuffer", value),
    sharedArrayBuffer: (value: unknown): asserts value is SharedArrayBuffer =>
      assertType(is.sharedArrayBuffer(value), "SharedArrayBuffer", value),
    dataView: (value: unknown): asserts value is DataView =>
      assertType(is.dataView(value), "DataView", value),

    domElement: (value: unknown): asserts value is HTMLElement =>
      assertType(
        is.domElement(value),
        AssertionTypeDescription.domElement,
        value,
      ),
    observable: (value: unknown): asserts value is ObservableLike =>
      assertType(is.observable(value), "Observable", value),
    nodeStream: (value: unknown): asserts value is NodeJS.Stream =>
      assertType(
        is.nodeStream(value),
        AssertionTypeDescription.nodeStream,
        value,
      ),
    buffer: (value: unknown): asserts value is Buffer =>
      assertType(is.buffer(value), "Buffer", value),
    blob: (value: unknown): asserts value is Blob =>
      assertType(is.blob(value), "Blob", value),

    formData: (value: unknown): asserts value is FormData =>
      assertType(is.formData(value), "FormData", value),
    headers: (value: unknown): asserts value is Headers =>
      assertType(is.headers(value), "Headers", value),
    request: (value: unknown): asserts value is Request =>
      assertType(is.request(value), "Request", value),
    response: (value: unknown): asserts value is Response =>
      assertType(is.response(value), "Response", value),
    urlSearchParams: (value: unknown): asserts value is URLSearchParams =>
      assertType(is.urlSearchParams(value), "URLSearchParams", value),
    urlInstance: (value: unknown): asserts value is URL =>
      assertType(is.urlInstance(value), "URL", value),
    urlString: (value: unknown): asserts value is string =>
      assertType(
        is.urlString(value),
        AssertionTypeDescription.urlString,
        value,
      ),
    url: (value: unknown): asserts value is string | URL =>
      assertType(is.url(value), AssertionTypeDescription.url, value),

    // Numbers.
    nan: (value: unknown): asserts value is unknown =>
      assertType(is.nan(value), AssertionTypeDescription.nan, value),
    integer: (value: unknown): asserts value is number =>
      assertType(is.integer(value), AssertionTypeDescription.integer, value),
    safeInteger: (value: unknown): asserts value is number =>
      assertType(
        is.safeInteger(value),
        AssertionTypeDescription.safeInteger,
        value,
      ),
    evenInteger: (value: number): asserts value is number =>
      assertType(
        is.evenInteger(value),
        AssertionTypeDescription.evenInteger,
        value,
      ),
    oddInteger: (value: number): asserts value is number =>
      assertType(
        is.oddInteger(value),
        AssertionTypeDescription.oddInteger,
        value,
      ),
    infinite: (value: unknown): asserts value is number =>
      assertType(is.infinite(value), AssertionTypeDescription.infinite, value),
    numericString: (value: unknown): asserts value is string =>
      assertType(
        is.numericString(value),
        AssertionTypeDescription.numericString,
        value,
      ),
    inRange: (
      value: number,
      range: number | number[],
    ): asserts value is number =>
      assertType(
        is.inRange(value, range),
        AssertionTypeDescription.inRange,
        value,
      ),

    emptyArray: (value: unknown): asserts value is never[] =>
      assertType(
        is.emptyArray(value),
        AssertionTypeDescription.emptyArray,
        value,
      ),
    emptySet: (value: unknown): asserts value is Set<never> =>
      assertType(is.emptySet(value), AssertionTypeDescription.emptySet, value),
    emptyMap: (value: unknown): asserts value is Map<never, never> =>
      assertType(is.emptyMap(value), AssertionTypeDescription.emptyMap, value),
    emptyObject: <Key extends keyof any = string>(
      value: unknown,
    ): asserts value is Record<Key, never> =>
      assertType(
        is.emptyObject(value),
        AssertionTypeDescription.emptyObject,
        value,
      ),
    emptyString: (value: unknown): asserts value is "" =>
      assertType(
        is.emptyString(value),
        AssertionTypeDescription.emptyString,
        value,
      ),
    whitespace: (value: unknown): asserts value is string =>
      assertType(
        is.whitespace(value),
        AssertionTypeDescription.whitespace,
        value,
      ),
    emptyStringOrWhitespace: (value: unknown): asserts value is string =>
      assertType(
        is.emptyStringOrWhitespace(value),
        AssertionTypeDescription.emptyStringOrWhitespace,
        value,
      ),

    nonEmptyArray: (value: unknown): asserts value is [unknown, ...unknown[]] =>
      assertType(
        is.nonEmptyArray(value),
        AssertionTypeDescription.nonEmptyArray,
        value,
      ),
    nonEmptySet: <T = unknown>(value: unknown): asserts value is Set<T> =>
      assertType(
        is.nonEmptySet(value),
        AssertionTypeDescription.nonEmptySet,
        value,
      ),
    nonEmptyMap: <Key = unknown, Value = unknown>(
      value: unknown,
    ): asserts value is Map<Key, Value> =>
      assertType(
        is.nonEmptyMap(value),
        AssertionTypeDescription.nonEmptyMap,
        value,
      ),
    nonEmptyObject: <Key extends keyof any = string, Value = unknown>(
      value: unknown,
    ): asserts value is Record<Key, Value> =>
      assertType(
        is.nonEmptyObject(value),
        AssertionTypeDescription.nonEmptyObject,
        value,
      ),
    nonEmptyString: (value: unknown): asserts value is string =>
      assertType(
        is.nonEmptyString(value),
        AssertionTypeDescription.nonEmptyString,
        value,
      ),
    nonEmptyStringAndNotWhitespace: (value: unknown): asserts value is string =>
      assertType(
        is.nonEmptyStringAndNotWhitespace(value),
        AssertionTypeDescription.nonEmptyStringAndNotWhitespace,
        value,
      ),

    // Variadic functions.
    any: (
      predicate: Predicate | Predicate[],
      ...values: unknown[]
    ): void | never =>
      assertType(
        is.any(predicate, ...values),
        AssertionTypeDescription.any,
        values,
        { multipleValues: true },
      ),
    all: (
      predicate: Predicate | Predicate[],
      ...values: unknown[]
    ): void | never =>
      assertType(
        is.all(predicate, ...values),
        AssertionTypeDescription.all,
        values,
        { multipleValues: true },
      ),
    every: (
      predicate: Predicate | Predicate[],
      ...values: unknown[]
    ): void | never =>
      assertType(
        is.every(predicate, ...values),
        AssertionTypeDescription.every,
        values,
        { multipleValues: true },
      ),
    some: (
      predicate: Predicate | Predicate[],
      ...values: unknown[]
    ): void | never =>
      assertType(
        is.some(predicate, ...values),
        AssertionTypeDescription.some,
        values,
        { multipleValues: true },
      ),
    none: (
      predicate: Predicate | Predicate[],
      ...values: unknown[]
    ): void | never =>
      assertType(
        is.none(predicate, ...values),
        AssertionTypeDescription.none,
        values,
        { multipleValues: true },
      ),
    // deprecated
    function_: (value: unknown): asserts value is Function =>
      assertType(is.function(value), "Function", value),
    class_: <P = unknown>(value: unknown): asserts value is Class<P> =>
      assertType(is.class<P>(value), AssertionTypeDescription.class_, value),
    null_: (value: unknown): asserts value is null =>
      assertType(is.null(value), "null", value),
  } as Assertions,
) as Assert;

// is.assert = assert as Assert;

declare namespace is {
  // deno-lint-ignore no-empty-interface
  interface assert extends Assert {}
  const assert: assert;
}

deprecate(assert, "function_", "null_", "class_", { seal: true });
deprecate(is, "function_", "null_", "class_", "falsey", "NaN", { seal: true });

assign(is, { assert: assert as is.assert });
freeze(assert, is.assert, is);

export { assert, is, is as default };
export type { Assert, Assertions, TypeName };
