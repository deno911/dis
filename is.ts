/// <reference lib="dom" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.window" />

import { Buffer, Buffer as DenoBuffer, NodeBuffer } from "~/deps.ts";

import type {
  AccessorDescriptor,
  ArrayAssertion,
  AsyncFunction,
  Class,
  ConditionalExcept,
  DataDescriptor,
  ExactShapeOf,
  Except,
  Falsy,
  Filter,
  Flatten,
  GetTypeName,
  Infinity,
  IsAny,
  MapIterator,
  Module,
  NodeJS,
  NotAny,
  Numeric,
  ObservableLike,
  Predicate,
  Primitive,
  RGB,
  SetIterator,
  SubsetOf,
  SupersetOf,
  TypedArray,
  TypeName,
} from "./types.ts";

import {
  deprecated,
  enumerable,
  getObjectType,
  isAbsoluteMod2,
  isDeprecated,
  isDomElement,
  isElement,
  isObjectOfType,
  isOfType,
  isPrimitiveTypeName,
  isSvgElement,
  isTypedArrayName,
  isValidLength,
  MetadataKey,
  predicateOnArray,
  renameFunction,
} from "./_util.ts";

import { type Assert, AssertionTypeDescription } from "./assert.ts";

const IsNegated = Symbol.for(MetadataKey.Negated);
const IsDeprecated = Symbol.for(MetadataKey.Deprecated);
const DenoCustomInspect = Symbol.for("Deno.customInspect");

/**
 * Check if a value is a given type, or retrieve its {@linkcode TypeName}.
 * @param value The value to check
 */
class is {
  static get [IsNegated](): boolean {
    return Reflect.getOwnPropertyDescriptor(this, "__negated")?.value ?? false;
  }

  static set [IsNegated](value: boolean) {
    Reflect.defineProperty(this, "__negated", {
      configurable: true,
      enumerable: false,
      writable: false,
      value,
    });
  }

  @enumerable(true)
  static get not() {
    return createNegated.call(this as unknown as is, {
      revocable: false,
      sorted: true,
      maskMethodNames: true,
      toStringTag: "is.not",
      excluded: ["__negated"],
    }).proxy as unknown as isnt;
  }

  @enumerable(false)
  static assertType<
    Negated extends boolean = false,
    Expected extends boolean = (Negated extends true ? false : true),
  >(
    condition: boolean,
    description: string,
    value: unknown,
    options: {
      multipleValues?: boolean;
      negated?: Negated;
    } = {
      multipleValues: false,
      negated: is[IsNegated] as Negated,
    },
  ): asserts condition is Negated extends true ? false : true {
    const { multipleValues, negated } = options;

    if (negated === true) {
      description = `not ${description}`;
      condition = !condition;
      is[IsNegated] = false;
    }

    if (!condition) {
      const values = [...new Set([value as any].flat())];
      const msg = multipleValues
        ? `values of types ${
          values.map((v, i) =>
            `${i === values.length - 1 ? "and " : ""}\`${is.typeName(v)}\``
          ).join(", ")
        }`
        : `value of type \`${is.typeName(value)}\``;

      throw new TypeError(
        `Assertion Failure: Expected value \`${description}\`${
          negated ? " (negated)" : ""
        }. Received ${msg}.`,
      );
    }
  }

  static get assert(): Assert {
    return assert as Assert;
  }

  // --------- //

  static string = function string(value: unknown): value is string {
    return isOfType<string>("string")(value);
  };

  static number = function number(value: unknown): value is number {
    return isOfType<number>("number")(value) && !is.NaN(value);
  };

  static bigint = function bigint(value: unknown): value is bigint {
    return isOfType<bigint>("bigint")(value);
  };

  static boolean = function boolean(value: unknown): value is boolean {
    return value === true || value === false;
  };

  static symbol = function symbol(value: unknown): value is symbol {
    return isOfType<symbol>("symbol")(value);
  };

  public static array = <T = unknown>(
    value: unknown,
    assertion?: (value: T) => value is T,
  ): value is T[] => {
    if (!Array.isArray(value)) return false;
    if (!is.function(assertion)) return true;
    return value.every(assertion);
  };

  /** Check if a value is `null`, using strict equality comparison. */
  public static null = (value: unknown): value is null => value === null;

  static undefined = function (value: unknown): value is undefined {
    return isOfType<undefined>("undefined")(value);
  };

  /** @see {@linkcode is.nullOrUndefined} */
  static nullish = function nullish(value: unknown): value is null | undefined {
    return is.nullOrUndefined(value);
  };

  static nullOrUndefined = function nullOrUndefined(
    value: unknown,
  ): value is null | undefined {
    return is.null(value) || is.undefined(value);
  };

  /**
   * Check if a value is of the generic "object" type, and not null. This will
   * also check true for Function and builtin objects like Map, Set, etc.
   *
   * If you need a higher level of precision, consider using typeguards such as
   * {@linkcode is.plainObject}, {@linkcode is.nonEmptyObject}, {@linkcode is.}
   */
  static object = function object(value: unknown): value is object {
    return !is.null(value) && (typeof value === "object" || is.function(value));
  };

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
  static primitive = function primitive(value: unknown): value is Primitive {
    return is.null(value) || isPrimitiveTypeName(typeof value);
  };

  public static boxedPrimitive = (value: unknown): boolean => {
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
  static truthy = function truthy<T>(value: T | Falsy): value is T {
    return Boolean(value);
  };

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
  static falsy = function falsy<T>(value: T | Falsy): value is Falsy {
    return !value;
  };

  /**
   * Alias for `is.falsy`.
   * @see {@link is.falsy}
   */
  static falsey = function falsey<T>(value: T | Falsy): value is Falsy {
    return !value;
  };

  static function = function (value: unknown): value is Function {
    return isOfType<Function>("function")(value);
  };

  static fn = function fn(value: unknown): value is Function {
    return isOfType<Function>("function")(value);
  };

  static iterable = function iterable<T = unknown>(
    value: unknown,
  ): value is Iterable<T> {
    return is.function((value as Iterable<T>)?.[Symbol.iterator]);
  };

  static generator = function generator(value: unknown): value is Generator {
    return is.iterable(value) && is.function((value as Generator)?.next) &&
      is.function((value as Generator)?.throw);
  };

  static generatorFunction = function generatorFunction(
    value: unknown,
  ): value is GeneratorFunction {
    return isObjectOfType<GeneratorFunction>("GeneratorFunction")(value);
  };

  static asyncFunction = function asyncFunction<T = unknown>(
    value: unknown,
  ): value is (...args: any[]) => Promise<T> {
    return getObjectType(value) === "AsyncFunction";
  };

  static asyncIterable = function asyncIterable<T = unknown>(
    value: unknown,
  ): value is AsyncIterable<T> {
    return is.function((value as AsyncIterable<T>)?.[Symbol.asyncIterator]);
  };

  static asyncGenerator = function asyncGenerator(
    value: unknown,
  ): value is AsyncGenerator {
    return is.asyncIterable(value) &&
      is.function((value as AsyncGenerator).next) &&
      is.function((value as AsyncGenerator).throw);
  };

  static asyncGeneratorFunction = function asyncGeneratorFunction(
    value: unknown,
  ): value is (...args: any[]) => Promise<unknown> {
    return getObjectType(value) === "AsyncGeneratorFunction";
  };

  static boundFunction = function boundFunction(
    value: unknown,
  ): value is Function {
    return is.function(value) &&
      !Object.prototype.hasOwnProperty.call(value, "prototype");
  };

  /**
   * Check if a Function appears to be a constructable Class.
   */
  static class = function <Proto = unknown>(
    value: unknown,
  ): value is Class<Proto> {
    if (!is.function(value)) return false;
    if (!is.object(value.prototype)) return false;
    return Function.prototype.toString.call(value).startsWith("class ");
  };

  static instanceOf = function instanceOf<T>(
    instance: unknown,
    class_: Class<T>,
  ): instance is T {
    return (is.directInstanceOf(instance, class_)) ||
      (instance instanceof class_);
  };

  /**
   * Check if a value is a direct instance of a class.
   * @param instance The value to inspect.
   * @param class_ the class to check against
   * @returns `boolean`
   */
  static directInstanceOf = function directInstanceOf<T>(
    instance: unknown,
    class_: Class<T>,
  ): instance is T {
    return Object.getPrototypeOf(instance) === class_.prototype;
  };

  static promise = function promise<T = unknown>(
    value: unknown,
  ): value is Promise<T> {
    const hasPromiseApi = <T = unknown>(value: unknown): value is Promise<T> =>
      is.function((value as Promise<T>)?.then) &&
      is.function((value as Promise<T>)?.catch);

    return is.nativePromise(value) || hasPromiseApi(value);
  };

  static nativePromise = function nativePromise<T = unknown>(
    value: unknown,
  ): value is Promise<T> {
    return isObjectOfType<Promise<T>>("Promise")(value);
  };

  static regExp = function regExp(value: unknown): value is RegExp {
    return isObjectOfType<RegExp>("RegExp")(value);
  };

  static regex = function regex(value: unknown): value is RegExp {
    return isObjectOfType<RegExp>("RegExp")(value);
  };

  static date = function date(value: unknown): value is Date {
    return isObjectOfType<Date>("Date")(value);
  };

  static error = function error(value: unknown): value is Error {
    return isObjectOfType<Error>("Error")(value);
  };

  static map = function map<Key = unknown, Value = unknown>(
    value: unknown,
  ): value is Map<Key, Value> {
    return isObjectOfType<Map<Key, Value>>("Map")(value);
  };

  static set = function set<T = unknown>(value: unknown): value is Set<T> {
    return isObjectOfType<Set<T>>("Set")(value);
  };

  static mapIterator = function mapIterator(
    value: unknown,
  ): value is MapIterator {
    return isObjectOfType<MapIterator>("Map Iterator")(value);
  };

  static setIterator = function setIterator(
    value: unknown,
  ): value is SetIterator {
    return isObjectOfType<SetIterator>("Set Iterator")(value);
  };

  static weakMap = function weakMap<
    Key extends object = object,
    Value = unknown,
  >(
    value: unknown,
  ): value is WeakMap<Key, Value> {
    return isObjectOfType<WeakMap<Key, Value>>("WeakMap")(value);
  };

  static weakSet = function weakSet(value: unknown): value is WeakSet<object> {
    return isObjectOfType<WeakSet<object>>("WeakSet")(value);
  };

  static weakRef = function weakRef(value: unknown): value is WeakRef<object> {
    return isObjectOfType<WeakRef<object>>("WeakRef")(value);
  };

  static module = function module(value: unknown): value is Module {
    return isObjectOfType<Module>("Module")(value);
  };

  static namespaceModule = function namespaceModule(
    value: unknown,
  ): value is Module {
    return isObjectOfType<Module>("Module")(value);
  };

  /**
   * Check if a value is a plain object, with extensive checks to ensure we
   * aren't actually dealing with an array, function, or other object type.
   *
   * @param value The value to inspect.
   * @returns `boolean`
   */
  static plainObject = function plainObject<Value = unknown>(
    value: unknown,
  ): value is Record<string, Value> {
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
  static propertyKey = function propertyKey(
    value: unknown,
  ): value is PropertyKey {
    return is.any([is.string, is.number, is.symbol], value);
  };

  /**
   * Checks if a value is a Property Descriptor, without discerning between the
   * subtypes of Accessor Properties or Data Properties.
   * @see {@linkcode is.accessorDescriptor} for the Accessor Descriptor check
   * @see {@linkcode is.dataDescriptor} for the Data Descriptor check
   */
  static propertyDescriptor = function propertyDescriptor<T = any>(
    value: unknown,
  ): value is TypedPropertyDescriptor<T> {
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
  static accessorDescriptor = function accessorDescriptor<T = any>(
    value: unknown,
  ): value is AccessorDescriptor<T> {
    if (is.nonEmptyObject(value)) {
      if (is.undefined(value.writable) && is.undefined(value.value)) {
        if (is.any(is.function, value.get, value.set)) {
          return true;
        }
      }
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
  static dataDescriptor = function dataDescriptor<T = any>(
    value: unknown,
  ): value is DataDescriptor<T> {
    if (is.nonEmptyObject(value)) {
      if (is.undefined(value.get) && is.undefined(value.set)) {
        if (is.boolean(value.writable) || !is.undefined(value.value)) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * Checks if a key is included in those defined on a target object or array..
   * @param value The value to inspect.
   * @param target The object or array to check against.
   * @returns `true` if the value is included in the target's keys, else `false`.
   */
  static key = function key<
    T extends readonly unknown[] | Record<PropertyKey, unknown> = {},
  >(value: unknown, target: T): value is keyof T {
    return Object.keys(target).includes(value as string);
  };

  /**
   * Checks if a value is included in a target object or array.
   * @param value The value to inspect.
   * @param target The object or array to check against.
   * @returns `true` if the value is included in the target values, else `false`.
   */
  static value = function value<
    T extends readonly unknown[] | Record<PropertyKey, unknown> = {},
  >(value: unknown, target: T): value is T[keyof T] {
    return Object.values(target).includes(value as string);
  };

  /**
   * Checks if a key is included in a target enum's keys.
   * @param value The value to inspect.
   * @param targetEnum The enum to check against.
   * @returns `true` if the key exists in the enum, else `false`.
   */
  static enumKey = function enumKey<T = unknown>(
    value: unknown,
    targetEnum: T,
  ): value is keyof T {
    return Object.keys(targetEnum as object).includes(String(value));
  };

  /**
   * Checks if a value is included in a target enum.
   * @param value The value to inspect.
   * @param targetEnum The enum to check against.
   * @returns `true` if the value is included in the enum, else `false`.
   */
  static enumCase = function enumCase<T = unknown>(
    value: unknown,
    targetEnum: T,
  ): value is T[keyof T] {
    return Object.values(targetEnum as object).includes(value);
  };

  static exact = function exact<T>(
    shape: T,
    value: unknown,
  ): value is T {
    // in case we try to compare something other than an object
    if (!is.object(value) || !is.object(shape)) {
      return value === shape;
    }
    // just to save time
    if (Object.is(shape, value)) {
      return true;
    }
    // forward comparison
    if (is.subset(shape, value) && is.subset(value, shape)) {
      if (
        Object.entries(shape).every(([key, val]) =>
          is.enumKey(key, value) && is.enumCase(val, value)
        ) &&
        Object.entries(value).every(([key, val]) =>
          is.enumKey(key, shape) && is.enumCase(val, shape)
        )
      ) {
        return true;
      }
      // strict value type comparison
      return (Object.entries(value).every(([key, val]) => {
        if (is.object(val) && is.object(shape[key as keyof T])) {
          // both values are objects, recurse their properties
          return is.exact(val, shape[key as keyof T]);
        }
        // otherwise just check equality of types using getTypeName()
        return getTypeName(val) === getTypeName(shape[key as keyof T]);
      }));
    }

    return false;
  };

  /**
   * Determines if an object is a **subset** of another (the "shape" object).
   * The target object may not have any keys that are not also in the shape,
   * but it's okay if it only has _some_ of the shape's keys.
   * Think of the **_shape_ as an _extension_ of the _target_**.
   *
   * @template T
   * @param shape The object used as a schema shape to compare against
   * @param value The target object to inspect
   * @returns `true` if the target is a subset of the shape, `false` otherwise
   *
   * @see {@linkcode is.superset} for a typecheck that is the opposite of this.
   *
   * For example, consider the following shape and valid/invalid subsets:
   *
   * @example
   * ```ts
   * const shape = { name: "", age: 0, email: "" };
   *
   * const valid = { name: "Nick", age: 29 };
   * is.subset(shape, valid) // => true
   *
   * const wrong = { name: "Nick", city: "Las Vegas" };
   * is.subset(shape, wrong) // => false
   * ```
   *
   * @example
   * ```ts
   * is.subset(
   *   { a: 0, b: 0 }, // the schema/shape object
   *   { a: 1, b: 2, c: 3 }, // the target object
   * ) // => FALSE - target has keys not defined in shape!
   * ```
   *
   * @example
   * ```ts
   * is.subset(
   *   { a: 1, b: 2, c: 3 }, // shape
   *   { a: 1, c: 3 }, // target
   * ) // => TRUE - target is missing `b`, but all other keys are in the shape!
   * ```
   */
  static subset = function subset<T extends {}>(
    shape: T,
    value: unknown,
  ): value is {
    [K in keyof T as (typeof value)[K] extends never ? never : K]: unknown;
  } {
    if (is.nonEmptyObject(shape) && is.nonEmptyObject(value)) {
      if (Object.keys(value).every((key) => key in shape)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Determines if an object is a **superset** of a given "shape". The object,
   * unlike the {@link is.subset} typecheck, must have **all** of the keys in
   * the shape. However, it **_can_ have keys that _are not_ in the shape**.
   *
   * Think of the **_target_ as an _extension_ of the _shape_**.
   *
   * @template T
   * @param shape The object used as a "schema" to compare against
   * @param value The target object to inspect
   * @returns `true` if the value is a superset of the shape, `false` otherwise
   *
   * @see {@linkcode is.subset} for a typecheck that is the opposite of this.
   *
   * @example
   * ```ts
   * is.superset(
   *   { a: 0, b: 0 }, // the schema/shape object
   *   { a: 1, b: 2, c: 3 }, // the target object
   * ) // => TRUE - target has all keys required by the shape
   * ```
   *
   * @example
   * ```ts
   * is.superset(
   *   { a: 1, b: 2, c: 3 }, // shape
   *   { a: 1, c: 3, d: 4 }, // target
   * ) // => FALSE - target is missing `b` from the shape
   * ```
   */
  static superset = function superset<T extends object>(
    shape: T,
    value: unknown,
  ): value is { [K in keyof T]-?: any } & object {
    if (is.nonEmptyObject(shape) && is.nonEmptyObject(value)) {
      if (Object.keys(shape).every((key) => key in value)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Checks if a value is `ArrayLike<T>`. An "array-like" object is simply an
   * object that has a numeric length property and 0-indexed numeric keys.
   *
   * @param value The value to inspect.
   * @returns `boolean`
   */
  static arrayLike = function arrayLike<T = unknown>(
    value: unknown,
  ): value is ArrayLike<T> {
    return !is.nullOrUndefined(value) && !is.function(value) &&
      isValidLength((value as ArrayLike<T>).length);
  };

  /**
   * Checks if a value is a valid `[key, value]` entry in the form of a
   * tuple pair with a fixed-length of 2.
   * @see {@linkcode is.entries}
   */
  static entry = function entry<K = unknown, V = unknown>(
    value: unknown,
  ): value is [K, V] {
    return is.nonEmptyArray(value) && value.length === 2;
  };

  /**
   * Checks if a value is a collection of valid `[key, value]` entries, each of
   * which has the form of a tuple pair with a fixed-length of 2.
   * @see {@linkcode is.entry}
   */
  static entries = function entries<K = unknown, V = unknown>(
    value: unknown,
  ): value is [K, V][] {
    return is.nonEmptyArray(value) && is.array(value, is.entry);
  };

  static sparseArray = function sparseArray(
    value: unknown,
  ): value is unknown[] {
    return is.array(value) && (value.length !== value.filter((v) => v).length);
  };

  /**
   * Check if a value is a TypedArray.
   *
   * @param value The value to inspect.
   * @returns `boolean`
   */
  static typedArray = function typedArray(value: unknown): value is TypedArray {
    return isTypedArrayName(getObjectType(value));
  };

  static int8Array = function int8Array(value: unknown): value is Int8Array {
    return isObjectOfType<Int8Array>("Int8Array")(value);
  };

  static uint8Array = function uint8Array(value: unknown): value is Uint8Array {
    return isObjectOfType<Uint8Array>("Uint8Array")(value);
  };

  static uint8ClampedArray = function uint8ClampedArray(
    value: unknown,
  ): value is Uint8ClampedArray {
    return isObjectOfType<Uint8ClampedArray>("Uint8ClampedArray")(value);
  };

  static int16Array = function int16Array(value: unknown): value is Int16Array {
    return isObjectOfType<Int16Array>("Int16Array")(value);
  };

  static uint16Array = function uint16Array(
    value: unknown,
  ): value is Uint16Array {
    return isObjectOfType<Uint16Array>("Uint16Array")(value);
  };

  static int32Array = function int32Array(value: unknown): value is Int32Array {
    return isObjectOfType<Int32Array>("Int32Array")(value);
  };

  static uint32Array = function uint32Array(
    value: unknown,
  ): value is Uint32Array {
    return isObjectOfType<Uint32Array>("Uint32Array")(value);
  };

  static float32Array = function float32Array(
    value: unknown,
  ): value is Float32Array {
    return isObjectOfType<Float32Array>("Float32Array")(value);
  };

  static float64Array = function float64Array(
    value: unknown,
  ): value is Float64Array {
    return isObjectOfType<Float64Array>("Float64Array")(value);
  };

  static bigInt64Array = function bigInt64Array(
    value: unknown,
  ): value is BigInt64Array {
    return isObjectOfType<BigInt64Array>("BigInt64Array")(value);
  };

  static bigUint64Array = function bigUint64Array(
    value: unknown,
  ): value is BigUint64Array {
    return isObjectOfType<BigUint64Array>("BigUint64Array")(value);
  };

  static arrayBuffer = function arrayBuffer(
    value: unknown,
  ): value is ArrayBuffer {
    return isObjectOfType<ArrayBuffer>("ArrayBuffer")(value);
  };

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
  static dataView = function dataView(value: unknown): value is DataView {
    return isObjectOfType<DataView>("DataView")(value);
  };

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
  static sharedArrayBuffer = function sharedArrayBuffer(
    value: unknown,
  ): value is SharedArrayBuffer {
    return isObjectOfType<SharedArrayBuffer>("SharedArrayBuffer")(value);
  };

  /**
   * Checks if a given value is a valid Node.js Buffer, using the `.isBuffer()`
   * method (static) from the Buffer constructor. This does not perform any other
   * checks, and should not be relied upon for matching potential `ArrayBuffer` or
   * `Deno.Buffer` instances.
   */
  static nodeBuffer = function nodeBuffer(value: unknown): value is NodeBuffer {
    return ((value as any)?.constructor as typeof NodeBuffer)?.isBuffer?.(
      value,
    ) ?? false;
  };

  static denoBuffer = function denoBuffer(value: unknown): value is DenoBuffer {
    return DenoBuffer?.[Symbol.hasInstance]?.(value) ||
      is.instanceOf(value, DenoBuffer);
  };

  static buffer = function buffer(value: unknown): value is Buffer {
    return is.arrayBuffer(value) || is.denoBuffer(value) ||
      is.nodeBuffer(value);
  };

  // ----------------------------------------------------------------- //
  // Browser / Web API Related Objects
  // ----------------------------------------------------------------- //

  static blob = function blob(value: unknown): value is Blob {
    return isObjectOfType<Blob>("Blob")(value);
  };

  static formData = function formData(value: unknown): value is FormData {
    return isObjectOfType<FormData>("FormData")(value);
  };
  static headers = function headers(value: unknown): value is Headers {
    return isObjectOfType<Headers>("Headers")(value);
  };

  static request = function request(value: unknown): value is Request {
    return isObjectOfType<Request>("Request")(value);
  };

  static response = function response(value: unknown): value is Response {
    return isObjectOfType<Response>("Response")(value);
  };

  static urlSearchParams = function urlSearchParams(
    value: unknown,
  ): value is URLSearchParams {
    return isObjectOfType<URLSearchParams>("URLSearchParams")(value);
  };

  /**
   * Check if an value is a valid instance of the `URL` class.
   * @param value The value to inspect.
   * @returns `boolean`
   * @see https://mdn.io/URL
   */
  static urlInstance = function urlInstance(value: unknown): value is URL {
    return isObjectOfType<URL>("URL")(value);
  };

  /**
   * Check if an arbitrary string is a valid URL.
   * @param value The value to inspect.
   * @returns `boolean`
   */
  public static urlString = (value: unknown): value is string => {
    if (!is.string(value)) return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  static url = function url(value: unknown): value is string | URL {
    return is.urlString(value) || is.urlInstance(value);
  };

  /**
   * Check if a value is a DOM element.
   *
   * @param value The value to inspect.
   * @returns `true` if the value is a DOM node.
   *
   * @example ```ts
   * const div = document.createElement("div");
   * is.element(div); // true
   * ```
   * @example ```ts
   * const myElement = document.querySelector("#my-element");
   * is.element(myElement); // true
   * ```
   *
   * @example ```ts
   * const astNode = { tagName: "div", id: "my-element" };
   * is.element(astNode); // false
   * ```
   */
  static element = function element(value: unknown): value is Element {
    return is.object(value) && !is.plainObject(value) && isElement(value);
  };

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
  static domElement = function domElement(
    value: unknown,
  ): value is HTMLElement {
    return is.object(value) && !is.plainObject(value) && isDomElement(value);
  };

  /**
   * Check if a value is a DOM element.
   *
   * @param value The value to inspect.
   * @returns `true` if the value is a DOM node.
   *
   * @example
   * ```ts
   * const div = document.createElement("div");
   * is.svgElement(div); // false
   * ```
   * @example
   * ```ts
   * const svg = document.createElement("svg");
   * svg.id = "my-element";
   * is.svgElement(svg); // true
   *
   * const myElement = document.querySelector("#my-element");
   * is.svgElement(myElement); // true
   *
   * const astNode = { tagName: "svg", id: "my-element" };
   * is.svgElement(astNode); // false
   * ```
   */
  static svgElement = function svgElement(value: unknown): value is SVGElement {
    return is.object(value) && !is.plainObject(value) && isSvgElement(value);
  };

  /**
   * Check if a value is `Observable` or `ObservableLike`.
   *
   * @note An "observable" is an object that has a `subscribe` method, and a `Symbol.observable` property (sometimes referred to as "@@observable").
   *
   * @param value The value to inspect.
   * @returns `true` if the value is an `Observable` or `ObservableLike`.
   */
  static observable = function observable(
    value: unknown,
  ): value is ObservableLike {
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

  static nodeStream = function nodeStream(
    value: unknown,
  ): value is NodeJS.Stream {
    return is.object(value) && is.function((value as NodeJS.Stream).pipe) &&
      !is.observable(value);
  };

  // ----------------------------------------------------------------- //
  //  Numbers / Numerics
  // ----------------------------------------------------------------- //

  static infinite = function infinite(value: unknown): value is number {
    return value === Number.POSITIVE_INFINITY ||
      value === Number.NEGATIVE_INFINITY;
  };

  /**
   * Strong typed alias for the builtin `Number.isInteger`.
   *
   * @param value The value to inspect.
   * @returns `boolean`
   */
  static integer = function integer(value: unknown): value is number {
    return Number.isInteger(value as number);
  };

  static evenInteger = function evenInteger(value: unknown): value is number {
    return is.integer(value) && isAbsoluteMod2(0)(value);
  };

  static oddInteger = function oddInteger(value: unknown): value is number {
    return is.integer(value) && isAbsoluteMod2(1)(value);
  };

  /**
   * Strong-typed alias for the builtin `Number.isSafeInteger`.
   * @param value The value to inspect.
   * @returns `boolean`
   */
  static safeInteger = function safeInteger(value: unknown): value is number {
    return Number.isSafeInteger(value as number);
  };

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
  static inRange = function inRange(
    value: number,
    range: number | number[],
  ): value is number {
    if (is.number(range)) {
      return value >= Math.min(0, range) && value <= Math.max(range, 0);
    }

    if (is.array(range) && range.length === 2) {
      return value >= Math.min(...range) && value <= Math.max(...range);
    }

    throw new TypeError(`Invalid range: ${JSON.stringify(range)}`);
  };

  /**
   * Equivalent to the JavaScript builtin `Number.isNaN`.
   *
   * @param value The value to inspect.
   * @returns `boolean`
   */
  static NaN = function (value: unknown): value is unknown {
    return Number.isNaN(value as number);
  };

  /**
   * Alias for `is.NaN`.
   * @see {@linkcode is.NaN}
   */
  static nan = function nan(value: unknown): value is unknown {
    return Number.isNaN(value as number);
  };

  static numeric = function numeric(
    value: unknown,
  ): value is bigint | number | `${number}` {
    return is.any([is.number, is.numericString, is.bigint], value);
  };

  static numericString = function numericString(
    value: unknown,
  ): value is `${number}` {
    return is.string(value) && !is.emptyStringOrWhitespace(value) &&
      !Number.isNaN(Number(value));
  };

  // ----------------------------------------------------------------- //
  //  Emptiness Checks
  // ----------------------------------------------------------------- //
  static emptyArray = function emptyArray(value: unknown): value is never[] {
    return is.array(value) && value.length === 0;
  };

  static emptySet = function emptySet(value: unknown): value is Set<never> {
    return is.set(value) && value.size === 0;
  };

  static emptyMap = function emptyMap(
    value: unknown,
  ): value is Map<never, never> {
    return is.map(value) && value.size === 0;
  };

  static emptyObject = function emptyObject<Key extends keyof any = string>(
    value: unknown,
  ): value is Record<Key, never> {
    return is.object(value) && !is.map(value) && !is.set(value) &&
      Object.keys(value).length === 0;
  };

  static emptyString = function emptyString(value: unknown): value is "" {
    return is.string(value) && value.length === 0;
  };

  static whitespace = function whitespace(value: unknown): value is string {
    return is.string(value) && !/\S/.test(value);
  };

  static emptyStringOrWhitespace = function emptyStringOrWhitespace(
    value: unknown,
  ): value is string {
    return is.emptyString(value) || is.whitespace(value);
  };

  // ----------------------------------------------------------------- //
  //  Non-Emptiness Checks
  // ----------------------------------------------------------------- //

  static nonEmptyArray = function nonEmptyArray(
    value: unknown,
  ): value is [unknown, ...unknown[]] {
    return is.array(value) && value.length > 0;
  };

  static nonEmptySet = function nonEmptySet<T = unknown>(
    value: unknown,
  ): value is Set<T> {
    return is.set(value) && value.size > 0;
  };

  static nonEmptyMap = function nonEmptyMap<Key = unknown, Value = unknown>(
    value: unknown,
  ): value is Map<Key, Value> {
    return is.map(value) && value.size > 0;
  };

  /**
   * TODO: Use `not` operator here to remove `Map` and `Set` from type guard:
   * https://github.com/Microsoft/TypeScript/pull/29317
   */
  static nonEmptyObject = function nonEmptyObject<
    Key extends keyof any = string,
    Value = unknown,
  >(
    value: unknown,
  ): value is Record<Key, Value> {
    return is.object(value) && !is.map(value) && !is.set(value) &&
      Object.keys(value).length > 0;
  };

  // TODO: Use `not ''` when the `not` operator is available.
  static nonEmptyString = function nonEmptyString(
    value: unknown,
  ): value is string {
    return is.string(value) && value.length > 0;
  };

  static nonEmptyStringAndNotWhitespace =
    function nonEmptyStringAndNotWhitespace(
      value: unknown,
    ): value is string {
      return is.string(value) && !is.emptyStringOrWhitespace(value);
    };

  static any = function any(
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): boolean {
    const predicates = is.array(predicate) ? predicate : [predicate];
    return predicates.some((singlePredicate) =>
      predicateOnArray(Array.prototype.some, singlePredicate, values)
    );
  };

  static some = function some(
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): boolean {
    return is.any(predicate, ...values);
  };

  static all = function all(
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): boolean {
    const predicates = is.array(predicate) ? predicate : [predicate];
    return predicates.every((singlePredicate) =>
      predicateOnArray(Array.prototype.every, singlePredicate, values)
    );
  };

  static every = function every(
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): boolean {
    return is.all(predicate, ...values);
  };

  static none = function none(
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): boolean {
    const predicates = is.array(predicate) ? predicate : [predicate];
    return predicates.some((singlePredicate) =>
      predicateOnArray(Array.prototype.some, singlePredicate, values)
    );
  };

  static typeName(value: unknown) {
    return getTypeName(value) as TypeName;
  }

  /** @deprecated use {@linkcode is.function} instead */
  @deprecated({ since: "0.1.0", substitute: is.function })
  static function_(value: unknown): value is Function {
    return isOfType<Function>("function")(value);
  }

  /** @deprecated use {@linkcode is.class} instead */
  @deprecated({ since: "0.1.0", substitute: is.class })
  static class_<T>(value: unknown): value is Class<T> {
    return is.class(value);
  }

  /** @deprecated use {@linkcode is.null} instead */
  @deprecated({ since: "0.1.0", substitute: "is.null" })
  static null_(value: unknown): value is null {
    return value === null;
  }

  static [Symbol.for("Deno.customInspect")](inspect: typeof Deno.inspect) {
    const options: Deno.InspectOptions = {
      colors: true,
      compact: true,
      depth: 2,
      getters: true,
      showHidden: false,
      showProxy: false,
      sorted: false,
      trailingComma: true,
    };

    return `is ${inspect({ ...this }, options)}`;
  }
}

/* Type Assertions */

class Assertions {
  // Unknowns.
  static undefined = function (
    value: unknown,
  ): asserts value is undefined {
    return is.assertType(is.undefined(value), "undefined", value);
  };

  static null = function (value: unknown): asserts value is null {
    return is.assertType(is.null(value), "null", value);
  };

  static nullOrUndefined = function nullOrUndefined(
    value: unknown,
  ): asserts value is null | undefined {
    return is.assertType(
      is.nullOrUndefined(value),
      AssertionTypeDescription.nullOrUndefined,
      value,
    );
  };

  static string = function string(value: unknown): asserts value is string {
    return is.assertType(is.string(value), "string", value);
  };

  static number = function number(value: unknown): asserts value is number {
    return is.assertType(is.number(value), "number", value);
  };

  static bigint = function bigint(value: unknown): asserts value is bigint {
    return is.assertType(is.bigint(value), "bigint", value);
  };

  static function = function (value: unknown): asserts value is Function {
    return is.assertType(is.function(value), "Function", value);
  };

  static class = function <P = unknown>(
    value: unknown,
  ): asserts value is Class<P> {
    return is.assertType(
      is.class<P>(value),
      AssertionTypeDescription.class_,
      value,
    );
  };

  static nullish = function nullish(
    value: unknown,
  ): asserts value is null | undefined {
    return is.assertType(
      is.nullish(value),
      AssertionTypeDescription.nullish,
      value,
    );
  };

  static object = function object(value: unknown): asserts value is object {
    return is.assertType(is.object(value), "Object", value);
  };

  static boolean = function boolean(value: unknown): asserts value is boolean {
    return is.assertType(is.boolean(value), "boolean", value);
  };

  static symbol = function symbol(value: unknown): asserts value is symbol {
    return is.assertType(is.symbol(value), "symbol", value);
  };

  static truthy = function truthy(value: unknown): asserts value is unknown {
    return is.assertType(
      is.truthy(value),
      AssertionTypeDescription.truthy,
      value,
    );
  };

  static falsy = function falsy(value: unknown): asserts value is unknown {
    return is.assertType(
      is.falsy(value),
      AssertionTypeDescription.falsy,
      value,
    );
  };

  static primitive = function primitive(
    value: unknown,
  ): asserts value is Primitive {
    return is.assertType(
      is.primitive(value),
      AssertionTypeDescription.primitive,
      value,
    );
  };

  static boxedPrimitive = function boxedPrimitive(
    value: unknown,
  ): asserts value is object {
    return is.assertType(is.boxedPrimitive(value), "BoxedPrimitive", value);
  };

  static array = function array<T = unknown>(
    value: unknown,
    assertion?: ArrayAssertion<T>,
  ): asserts value is T[] {
    const assert: (
      condition: boolean,
      description: string,
      value: unknown,
    ) => asserts condition = is.assertType;

    assert(is.array(value), "Array", value);

    if (assertion) {
      value.forEach(assertion);
    }
  };

  static iterable = function iterable<T = unknown>(
    value: unknown,
  ): asserts value is Iterable<T> {
    return is.assertType(
      is.iterable(value),
      AssertionTypeDescription.iterable,
      value,
    );
  };

  static asyncIterable = function asyncIterable<T = unknown>(
    value: unknown,
  ): asserts value is AsyncIterable<T> {
    return is.assertType(
      is.asyncIterable(value),
      AssertionTypeDescription.asyncIterable,
      value,
    );
  };

  static generator = function generator(
    value: unknown,
  ): asserts value is Generator {
    return is.assertType(is.generator(value), "Generator", value);
  };

  static asyncGenerator = function asyncGenerator(
    value: unknown,
  ): asserts value is AsyncGenerator {
    return is.assertType(is.asyncGenerator(value), "AsyncGenerator", value);
  };

  static nativePromise = function nativePromise<T = unknown>(
    value: unknown,
  ): asserts value is Promise<T> {
    return is.assertType(
      is.nativePromise(value),
      AssertionTypeDescription.nativePromise,
      value,
    );
  };

  static promise = function promise<T = unknown>(
    value: unknown,
  ): asserts value is Promise<T> {
    return is.assertType(is.promise(value), "Promise", value);
  };

  static generatorFunction = function generatorFunction(
    value: unknown,
  ): asserts value is GeneratorFunction {
    return is.assertType(
      is.generatorFunction(value),
      "GeneratorFunction",
      value,
    );
  };

  static asyncGeneratorFunction = function asyncGeneratorFunction(
    value: unknown,
  ): asserts value is AsyncGeneratorFunction {
    return is.assertType(
      is.asyncGeneratorFunction(value),
      "AsyncGeneratorFunction",
      value,
    );
  };

  static asyncFunction = function asyncFunction(
    value: unknown,
  ): asserts value is Function {
    return is.assertType(is.asyncFunction(value), "AsyncFunction", value);
  };

  static boundFunction = function boundFunction(
    value: unknown,
  ): asserts value is Function {
    return is.assertType(is.boundFunction(value), "Function", value);
  };

  static directInstanceOf = function directInstanceOf<T>(
    instance: unknown,
    class_: Class<T>,
  ): asserts instance is T {
    return is.assertType(
      is.directInstanceOf(instance, class_),
      AssertionTypeDescription.directInstanceOf,
      instance,
    );
  };

  static instanceOf = function instanceOf<T>(
    instance: unknown,
    class_: Class<T>,
  ): asserts instance is T {
    return is.assertType(
      is.instanceOf(instance, class_),
      AssertionTypeDescription.directInstanceOf,
      instance,
    );
  };

  static regExp = function regExp(value: unknown): asserts value is RegExp {
    return is.assertType(is.regExp(value), "RegExp", value);
  };

  static date = function date(value: unknown): asserts value is Date {
    return is.assertType(is.date(value), "Date", value);
  };

  static error = function error(value: unknown): asserts value is Error {
    return is.assertType(is.error(value), "Error", value);
  };

  static map = function map<Key = unknown, Value = unknown>(
    value: unknown,
  ): asserts value is Map<Key, Value> {
    return is.assertType(is.map(value), "Map", value);
  };

  static set = function set<T = unknown>(
    value: unknown,
  ): asserts value is Set<T> {
    return is.assertType(is.set(value), "Set", value);
  };

  static weakMap = function weakMap<
    Key extends object = object,
    Value = unknown,
  >(
    value: unknown,
  ): asserts value is WeakMap<Key, Value> {
    return is.assertType(is.weakMap(value), "WeakMap", value);
  };

  static weakSet = function weakSet<T extends object = object>(
    value: unknown,
  ): asserts value is WeakSet<T> {
    return is.assertType(is.weakSet(value), "WeakSet", value);
  };

  static weakRef = function weakRef<T extends object = object>(
    value: unknown,
  ): asserts value is WeakRef<T> {
    return is.assertType(is.weakRef(value), "WeakRef", value);
  };

  static arrayLike = function arrayLike<T = unknown>(
    value: unknown,
  ): asserts value is ArrayLike<T> {
    return is.assertType(
      is.arrayLike(value),
      AssertionTypeDescription.arrayLike,
      value,
    );
  };

  static mapIterator = function mapIterator<T = unknown>(
    value: unknown,
  ): asserts value is MapIterator {
    return is.assertType(is.mapIterator(value), "Map Iterator", value);
  };

  static setIterator = function setIterator<T = unknown>(
    value: unknown,
  ): asserts value is SetIterator {
    return is.assertType(is.setIterator(value), "Set Iterator", value);
  };

  static namespaceModule = function namespaceModule(
    value: unknown,
  ): asserts value is Module {
    return is.assertType(is.namespaceModule(value), "Module", value);
  };

  static plainObject = <Value = unknown>(
    value: unknown,
  ): asserts value is Record<string, Value> =>
    is.assertType(
      is.plainObject(value),
      AssertionTypeDescription.plainObject,
      value,
    );

  static propertyKey = function propertyKey(
    value: unknown,
  ): asserts value is number {
    return is.assertType(is.propertyKey(value), "PropertyKey", value);
  };

  static propertyDescriptor = <T = unknown>(
    value: unknown,
  ): asserts value is TypedPropertyDescriptor<T> =>
    is.assertType(
      is.propertyDescriptor(value),
      "PropertyDescriptor",
      value,
    );

  static accessorDescriptor = <T = unknown>(
    value: unknown,
  ): asserts value is AccessorDescriptor<T> =>
    is.assertType(is.accessorDescriptor(value), "AccessorDescriptor", value);

  static dataDescriptor = <T = unknown>(
    value: unknown,
  ): asserts value is DataDescriptor<T> =>
    is.assertType(is.dataDescriptor(value), "DataDescriptor", value);

  static key = <
    T extends readonly unknown[] | Record<PropertyKey, unknown> = {},
  >(
    value: unknown,
    target: T,
  ): asserts value is keyof T =>
    is.assertType(is.key(value, target), "Key", value);

  static value = <
    T extends readonly unknown[] | Record<PropertyKey, unknown> = {},
  >(
    value: unknown,
    target: T,
  ): asserts value is T[keyof T] =>
    is.assertType(is.value(value, target), "Value", value);

  static enumKey = <T = unknown>(
    value: unknown,
    targetEnum: T,
  ): asserts value is keyof T =>
    is.assertType(is.enumKey(value, targetEnum), "EnumKey", value);

  static enumCase = <T = unknown>(
    value: unknown,
    targetEnum: T,
  ): asserts value is T[keyof T] =>
    is.assertType(is.enumCase(value, targetEnum), "EnumCase", value);

  static entry = <K = unknown, V = unknown>(
    value: unknown,
  ): asserts value is readonly [K, V] =>
    is.assertType(
      is.entry(value),
      AssertionTypeDescription.entry,
      value,
    );

  static entries = <K = unknown, V = unknown>(
    value: unknown,
  ): asserts value is readonly (readonly [K, V])[] =>
    is.assertType(
      is.entries(value),
      AssertionTypeDescription.entries,
      value,
    );

  static sparseArray = (value: unknown): asserts value is unknown[] =>
    is.assertType(
      is.sparseArray(value),
      AssertionTypeDescription.sparseArray,
      value,
    );

  static typedArray = (value: unknown): asserts value is TypedArray =>
    is.assertType(
      is.typedArray(value),
      AssertionTypeDescription.typedArray,
      value,
    );

  static int8Array = function int8Array(
    value: unknown,
  ): asserts value is Int8Array {
    return is.assertType(is.int8Array(value), "Int8Array", value);
  };

  static uint8Array = function uint8Array(
    value: unknown,
  ): asserts value is Uint8Array {
    return is.assertType(is.uint8Array(value), "Uint8Array", value);
  };

  static uint8ClampedArray = (
    value: unknown,
  ): asserts value is Uint8ClampedArray =>
    is.assertType(is.uint8ClampedArray(value), "Uint8ClampedArray", value);

  static int16Array = function int16Array(
    value: unknown,
  ): asserts value is Int16Array {
    return is.assertType(is.int16Array(value), "Int16Array", value);
  };

  static uint16Array = function uint16Array(
    value: unknown,
  ): asserts value is Uint16Array {
    return is.assertType(is.uint16Array(value), "Uint16Array", value);
  };

  static int32Array = function int32Array(
    value: unknown,
  ): asserts value is Int32Array {
    return is.assertType(is.int32Array(value), "Int32Array", value);
  };

  static uint32Array = function uint32Array(
    value: unknown,
  ): asserts value is Uint32Array {
    return is.assertType(is.uint32Array(value), "Uint32Array", value);
  };

  static float32Array = function float32Array(
    value: unknown,
  ): asserts value is Float32Array {
    return is.assertType(is.float32Array(value), "Float32Array", value);
  };

  static float64Array = function float64Array(
    value: unknown,
  ): asserts value is Float64Array {
    return is.assertType(is.float64Array(value), "Float64Array", value);
  };

  static bigInt64Array = function bigInt64Array(
    value: unknown,
  ): asserts value is BigInt64Array {
    return is.assertType(is.bigInt64Array(value), "BigInt64Array", value);
  };

  static bigUint64Array = function bigUint64Array(
    value: unknown,
  ): asserts value is BigUint64Array {
    return is.assertType(is.bigUint64Array(value), "BigUint64Array", value);
  };

  static arrayBuffer = function arrayBuffer(
    value: unknown,
  ): asserts value is ArrayBuffer {
    return is.assertType(is.arrayBuffer(value), "ArrayBuffer", value);
  };

  static dataView = function dataView(
    value: unknown,
  ): asserts value is DataView {
    return is.assertType(is.dataView(value), "DataView", value);
  };

  static sharedArrayBuffer = (
    value: unknown,
  ): asserts value is SharedArrayBuffer =>
    is.assertType(is.sharedArrayBuffer(value), "SharedArrayBuffer", value);

  static domElement = (value: unknown): asserts value is HTMLElement =>
    is.assertType(
      is.domElement(value),
      AssertionTypeDescription.domElement,
      value,
    );

  static element = (value: unknown): asserts value is Element =>
    is.assertType(
      is.element(value),
      AssertionTypeDescription.domElement,
      value,
    );

  static svgElement = (value: unknown): asserts value is SVGElement =>
    is.assertType(
      is.svgElement(value),
      AssertionTypeDescription.svgElement,
      value,
    );

  static observable = function observable(
    value: unknown,
  ): asserts value is ObservableLike {
    return is.assertType(is.observable(value), "Observable", value);
  };

  static nodeStream = (value: unknown): asserts value is NodeJS.Stream =>
    is.assertType(
      is.nodeStream(value),
      AssertionTypeDescription.nodeStream,
      value,
    );

  static buffer = function buffer(value: unknown): asserts value is Buffer {
    return is.assertType(is.buffer(value), "Buffer", value);
  };

  static blob = function blob(value: unknown): asserts value is Blob {
    return is.assertType(is.blob(value), "Blob", value);
  };

  static formData = function formData(
    value: unknown,
  ): asserts value is FormData {
    return is.assertType(is.formData(value), "FormData", value);
  };

  static headers = function headers(value: unknown): asserts value is Headers {
    return is.assertType(is.headers(value), "Headers", value);
  };

  static request = function request(value: unknown): asserts value is Request {
    return is.assertType(is.request(value), "Request", value);
  };

  static response = function response(
    value: unknown,
  ): asserts value is Response {
    return is.assertType(is.response(value), "Response", value);
  };

  static urlSearchParams = (
    value: unknown,
  ): asserts value is URLSearchParams =>
    is.assertType(is.urlSearchParams(value), "URLSearchParams", value);

  static urlInstance = function urlInstance(
    value: unknown,
  ): asserts value is URL {
    return is.assertType(is.urlInstance(value), "URL", value);
  };

  static urlString = (value: unknown): asserts value is string =>
    is.assertType(
      is.urlString(value),
      AssertionTypeDescription.urlString,
      value,
    );

  static url = function url(value: unknown): asserts value is string | URL {
    return is.assertType(is.url(value), AssertionTypeDescription.url, value);
  };

  // Numbers.
  static nan = function nan(value: unknown): asserts value is unknown {
    return is.assertType(is.nan(value), AssertionTypeDescription.nan, value);
  };

  static integer = function integer(value: unknown): asserts value is number {
    return is.assertType(
      is.integer(value),
      AssertionTypeDescription.integer,
      value,
    );
  };

  static safeInteger = (value: unknown): asserts value is number =>
    is.assertType(
      is.safeInteger(value),
      AssertionTypeDescription.safeInteger,
      value,
    );

  static evenInteger = (value: number): asserts value is number =>
    is.assertType(
      is.evenInteger(value),
      AssertionTypeDescription.evenInteger,
      value,
    );

  static oddInteger = (value: number): asserts value is number =>
    is.assertType(
      is.oddInteger(value),
      AssertionTypeDescription.oddInteger,
      value,
    );

  static infinite = function infinite(value: unknown): asserts value is number {
    return is.assertType(
      is.infinite(value),
      AssertionTypeDescription.infinite,
      value,
    );
  };

  static numericString = (value: unknown): asserts value is string =>
    is.assertType(
      is.numericString(value),
      AssertionTypeDescription.numericString,
      value,
    );

  static inRange = (
    value: number,
    range: number | number[],
  ): asserts value is number =>
    is.assertType(
      is.inRange(value, range),
      AssertionTypeDescription.inRange,
      value,
    );

  static emptyArray = (value: unknown): asserts value is never[] =>
    is.assertType(
      is.emptyArray(value),
      AssertionTypeDescription.emptyArray,
      value,
    );

  static emptySet = function emptySet(
    value: unknown,
  ): asserts value is Set<never> {
    return is.assertType(
      is.emptySet(value),
      AssertionTypeDescription.emptySet,
      value,
    );
  };

  static emptyMap = function emptyMap(
    value: unknown,
  ): asserts value is Map<never, never> {
    return is.assertType(
      is.emptyMap(value),
      AssertionTypeDescription.emptyMap,
      value,
    );
  };

  static emptyObject = <Key extends keyof any = string>(
    value: unknown,
  ): asserts value is Record<Key, never> =>
    is.assertType(
      is.emptyObject(value),
      AssertionTypeDescription.emptyObject,
      value,
    );

  static emptyString = (value: unknown): asserts value is "" =>
    is.assertType(
      is.emptyString(value),
      AssertionTypeDescription.emptyString,
      value,
    );

  static whitespace = (value: unknown): asserts value is string =>
    is.assertType(
      is.whitespace(value),
      AssertionTypeDescription.whitespace,
      value,
    );

  static emptyStringOrWhitespace = (
    value: unknown,
  ): asserts value is string =>
    is.assertType(
      is.emptyStringOrWhitespace(value),
      AssertionTypeDescription.emptyStringOrWhitespace,
      value,
    );

  static nonEmptyArray = (
    value: unknown,
  ): asserts value is [unknown, ...unknown[]] =>
    is.assertType(
      is.nonEmptyArray(value),
      AssertionTypeDescription.nonEmptyArray,
      value,
    );

  static nonEmptySet = <T = unknown>(
    value: unknown,
  ): asserts value is Set<T> =>
    is.assertType(
      is.nonEmptySet(value),
      AssertionTypeDescription.nonEmptySet,
      value,
    );

  static nonEmptyMap = <Key = unknown, Value = unknown>(
    value: unknown,
  ): asserts value is Map<Key, Value> =>
    is.assertType(
      is.nonEmptyMap(value),
      AssertionTypeDescription.nonEmptyMap,
      value,
    );

  static nonEmptyObject = <Key extends keyof any = string, Value = unknown>(
    value: unknown,
  ): asserts value is Record<Key, Value> =>
    is.assertType(
      is.nonEmptyObject(value),
      AssertionTypeDescription.nonEmptyObject,
      value,
    );

  static nonEmptyString = (value: unknown): asserts value is string =>
    is.assertType(
      is.nonEmptyString(value),
      AssertionTypeDescription.nonEmptyString,
      value,
    );

  static nonEmptyStringAndNotWhitespace = (
    value: unknown,
  ): asserts value is string =>
    is.assertType(
      is.nonEmptyStringAndNotWhitespace(value),
      AssertionTypeDescription.nonEmptyStringAndNotWhitespace,
      value,
    );

  // Variadic functions.
  static any = (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): void | never =>
    is.assertType(
      is.any(predicate, ...values),
      AssertionTypeDescription.any,
      values,
      { multipleValues: true },
    );

  static all = (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): void | never =>
    is.assertType(
      is.all(predicate, ...values),
      AssertionTypeDescription.all,
      values,
      { multipleValues: true },
    );

  static every = (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): void | never =>
    is.assertType(
      is.every(predicate, ...values),
      AssertionTypeDescription.every,
      values,
      { multipleValues: true },
    );

  static some = (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): void | never =>
    is.assertType(
      is.some(predicate, ...values),
      AssertionTypeDescription.some,
      values,
      { multipleValues: true },
    );

  static none = (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): void | never =>
    is.assertType(
      is.none(predicate, ...values),
      AssertionTypeDescription.none,
      values,
      { multipleValues: true },
    );

  /** @deprecated use {@linkcode assert.function} instead */
  @deprecated({
    since: "0.1.0",
    substitute: Assertions.function,
    hide: true,
    seal: true,
  })
  static function_ = function function_(
    value: unknown,
  ): asserts value is Function {
    return is.assertType(is.function(value), "Function", value);
  };

  /** @deprecated use {@linkcode assert.class} instead */
  @deprecated({
    since: "0.1.0",
    substitute: Assertions.class,
    hide: true,
    seal: true,
  })
  static class_ = function class_<P = unknown>(
    value: unknown,
  ): asserts value is Class<P> {
    return is.assertType(
      is.class<P>(value),
      AssertionTypeDescription.class_,
      value,
    );
  };

  /** @deprecated use {@linkcode assert.null} instead */
  @deprecated({
    since: "0.1.0",
    substitute: Assertions.null,
    hide: true,
    seal: true,
  })
  static null_ = function null_(value: unknown): asserts value is null {
    return is.assertType(is.null(value), "null", value);
  };

  static [DenoCustomInspect](inspect: typeof Deno.inspect) {
    const options: Deno.InspectOptions = {
      colors: true,
      compact: true,
      depth: 1,
      getters: true,
      showHidden: false,
      showProxy: false,
      sorted: true,
      trailingComma: true,
    };

    return `is.assert ${inspect({ ...this }, options)}`;
  }
}

/**
 * Type Assertions. If conditions are not as expected, throws a TypeError.
 */
const assert: Assert = Object.assign(
  is.assertType as Partial<Assert>,
  Assertions as unknown as Assert,
) as Assert;

interface is extends Id<typeof is> {
  <T>(value: T): GetTypeName<T>;
  (value: unknown): TypeName;
  assert: Assert;
}

type DeprecatedMethods = `${"null" | "function" | "class"}_`;
type ExcludedMethods =
  | DeprecatedMethods
  | "assert"
  | "assertType"
  | "prototype"
  | "constructor"
  | "arguments"
  | "caller"
  | "callee"
  | "name"
  | "typeName"
  | "not"
  | "negated"
  | typeof Symbol.toStringTag
  | typeof IsNegated
  | typeof DenoCustomInspect;

const _excludedMethods = [
  ...Reflect.ownKeys(Function.prototype),
  "null_",
  "function_",
  "class_",
  "not",
  "typeName",
  "assert",
  "assertType",
] as const;

type TypeChecks = NonNullable<
  ConditionalExcept<
    Except<is, Extract<ExcludedMethods, keyof is>>,
    never | null | undefined
  >
>;

type TypeCheckNames = keyof TypeChecks;

// deno-fmt-ignore
type Args<T> = (
  | T extends ((...a: infer P extends any[]) => any) ? P 
  : T extends (abstract new (...a: infer P extends any[]) => any) ? P 
  : never[]
);

type NegatedMethods<
  Base,
  Keys extends keyof Base = keyof Base,
> = Flatten<
  ConditionalExcept<
    {
      [K in Keys as Filter<K, ExcludedMethods | symbol>]:
        ((...args: Args<Base[K]>) => boolean);
    },
    never
  >
>;

// deno-fmt-ignore
interface isnt extends NegatedMethods<TypeChecks> {
  [IsNegated]: boolean;
  /* negated interface */
  (value: unknown): boolean;
}

type Id<U> = U extends infer T extends Record<string, any> | unknown[] ? {
    [K in keyof T]: T[K] extends
      Record<string | symbol | number, unknown> | unknown[] ? Id<T[K]> : T[K];
  }
  : U;

// formatPropertyDescriptors(is as unknown as is, { sealed: false });

// function createNegated<T extends is, U extends isnt>(this: T): {
//   proxy: U;
// };

interface CreateNegatedOptions {
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

interface RevocableNegatedOptions extends CreateNegatedOptions {
  revocable: true;
}

function createNegated<
  T extends is | Assert | typeof is | typeof Assertions,
  U extends isnt,
>(
  this: T,
): { proxy: U };
function createNegated<
  T extends is | Assert | typeof is | typeof Assertions,
  U extends isnt,
>(
  this: T,
  options: RevocableNegatedOptions,
): { proxy: U; revoke: () => void };
function createNegated<
  T extends is | Assert | typeof is | typeof Assertions,
  U extends isnt,
>(
  this: T,
  options?: CreateNegatedOptions,
): { proxy: U };
function createNegated<
  T extends is | Assert | typeof is | typeof Assertions,
  U extends isnt,
>(
  this: T,
  options: CreateNegatedOptions = {
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
  const deprecatedProperties = Reflect.ownKeys(
    Reflect.get(this, IsDeprecated, this),
  ).filter(is.nonEmptyStringAndNotWhitespace);

  const excluded = Array.from(
    new Set([
      "not",
      ...options?.excluded,
      IsDeprecated,
      DenoCustomInspect,
      ...deprecatedProperties,
    ]),
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
    if (is.function(result) && !is.promise(result)) {
      result = result.apply(target, args);
    }

    if (is.promise(result)) {
      return result.then((result) => {
        if (is.boolean(result) && this[IsNegated]) {
          this[IsNegated] = false;
          return !result;
        }
        return result;
      });
    }
    if (is.boolean(result) && this[IsNegated]) {
      this[IsNegated] = false;
      return !result;
    }
    return result;
  }

  /** Check if a property is marked for exclusion from the proxy. */
  function isExcluded(property: string | symbol): boolean {
    if (is.symbol(property)) {
      return excluded.includes(property);
    }

    return excluded.some((pattern) =>
      !is.symbol(pattern) && new RegExp(pattern).test(property)
    );
  }

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
      value ??= Reflect.getOwnPropertyDescriptor(target, p)?.value;

      if (is.function(value)) {
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
    getOwnPropertyDescriptor(target, p) {
      if (excluded.includes(p)) {
        return undefined;
      }
      const desc = Reflect.getOwnPropertyDescriptor(target, p);
      // sanity check
      if (is.propertyDescriptor(desc)) {
        if (is.dataDescriptor(desc)) {
          if (is.function(desc.value)) {
            const value = desc.value;

            const valueProxy = function valueProxy(this: any, ...args: any[]) {
              const result = value.apply(target, args);
              return handleResult.call(target, this, args, result);
            };

            if (options?.maskMethodNames) renameFunction(valueProxy, p);
            desc.value = valueProxy;
          }
        } else if (is.accessorDescriptor(desc) && is.function(desc.get)) {
          const get = desc.get;

          const getterProxy = function getterProxy() {
            const result = get.apply(target);
            return handleResult.call(target, target, [], result);
          };

          if (options?.maskMethodNames) {
            renameFunction(getterProxy, p);
          }
          desc.get = getterProxy;
        }
        return desc;
      }
    },
    ownKeys(target) {
      let keys: Set<string | symbol> | (string | symbol)[] = new Set(
        Reflect.ownKeys(target).filter((key) => !excluded.includes(key)),
      ).add(Symbol.toStringTag);

      keys = [...keys] as (string | symbol)[];
      return options?.sorted
        ? keys.sort((a, b) =>
          String((a as symbol)?.description ?? a).localeCompare(
            String((b as symbol)?.description ?? b),
          )
        )
        : keys;
    },
  };

  return options?.revocable
    ? Proxy.revocable(this as unknown as U, handler)
    : { proxy: new Proxy(this as unknown as U, handler) };
}

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
 *
 * @example
 * ```ts
 * import { is, assert } from "https://deno.land/x/dis/mod.ts";
 *
 * let eitherStringOrNumber: string | number = "1";
 *
 * eitherStringOrNumber = 1;
 * // type is still `string | number`
 *
 * assert.number(eitherStringOrNumber);
 * // type is now number
 *
 * is.assert.plainObject(new Map())
 * // => Unexpected TypeError: ...
 * ```
 */
// @ts-ignore janky re-assignment
is = new Proxy<is>(is as unknown as is, {
  apply<T = unknown>(
    _target: is,
    _thisArg: any,
    args: [value: T],
  ): GetTypeName<T> {
    return getTypeName(args[0] as T) as GetTypeName<T>;
  },
  construct(target, args, newTarget) {
    console.warn(
      [
        `Warning: improper usage of the \`new\` operator. The \`is\` module is a static class and cannot be instantiated in prototype form.`,
        " ",
        `Instead, try one of these supported syntax examples:`,
        ` • is(value: unknown) => TypeName`,
        ` • is.assert(expr: boolean, msg?: string) => asserts expr`,
        ` • is.string(value: unknown) => value is string`,
        ` • is.not.string(value: unknown) => boolean`,
      ].join("\n"),
    );

    return Reflect.apply(target, newTarget, args) as unknown as is;
  },
  get(target, p, receiver) {
    switch (p) {
      case "name":/* fall through */
      case Symbol.toStringTag:
        return "is";
      case "assert":/* fall through */
      case "asserts": {
        // proxied to handle the .not operator
        return new Proxy(assert, {
          get(target, p, _receiver) {
            if (p === "not") {
              Reflect.set(target, IsNegated, true, target);
              return createNegated.call(assert, {
                revocable: false,
                sorted: true,
                excluded: ["assert"],
                maskMethodNames: true,
              }).proxy;
            }
            return Reflect.get(target, p, target);
          },
          ownKeys(target) {
            return [...Reflect.ownKeys(target), "not"];
          },
        });
      }
      case "not": {
        Reflect.set(target, IsNegated, true, target);
        return createNegated.call(target, {
          revocable: false,
          sorted: true,
          excluded: ["assert"],
          maskMethodNames: true,
        }).proxy;
      }
      default:
        return Reflect.get(target, p, receiver);
    }
  },
  ownKeys(target) {
    const excluded = [
      "assertType",
      DenoCustomInspect,
    ];

    const keys = Array.from(
      new Set(
        Reflect.ownKeys(target).filter((key) => !excluded.includes(key)),
      ),
    );

    return keys.toSorted((a, b) =>
      String((a as symbol)?.description ?? a).localeCompare(
        String((b as symbol)?.description ?? b),
      )
    );
  },
  getOwnPropertyDescriptor(target, p) {
    const desc = Reflect.getOwnPropertyDescriptor(target, p) ?? {};

    if (isDeprecated(target, p) || is.symbol(p)) {
      return { ...desc, enumerable: false };
    }
    return desc;
  },
}) as is;

/**
 * Determine the {@linkcode TypeName} of an arbitrary value of unknown type.
 *
 * @example
 * ```ts
 * import { is } from "https://deno.land/x/dis/mod.ts";
 *
 * getTypeName("🦕") // => "string"
 * getTypeName(100n) // => "bigint"
 * getTypeName({ foo: "bar" }) // => "Object"
 * getTypeName(new Uint8Array()) // => "Uint8Array"
 * ```
 */
function getTypeName<T = unknown>(value: T) {
  return ((value: unknown) => {
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
      throw new TypeError(
        "Please don't use object wrappers for primitive types",
      );
    }

    return getObjectType(value) ?? "Object";
  })(value) as GetTypeName<T>;
}

export default is as unknown as is;
export { type Assert, assert, type GetTypeName, is, type TypeName };
