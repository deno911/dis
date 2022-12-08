import { Buffer, Buffer as DenoBuffer, NodeBuffer } from "./deps.ts";
import type {
  AccessorDescriptor,
  ArrayAssertion,
  Class,
  DataDescriptor,
  Falsy,
  GetTypeName,
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
  deprecated,
  formatPropertyDescriptors,
  freeze,
  getObjectType,
  inspect,
  isDomElement,
  isElement,
  isObjectOfType,
  isOfType,
  isPrimitiveTypeName,
  isSvgElement,
  isTypedArrayName,
  predicateOnArray,
} from "./_util.ts";
import {
  type Assert,
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

const isAbsoluteMod2 =
  (remainder: number) => (value: number): value is number =>
    is.integer(value) && Math.abs(value % 2) === remainder;
/**
 * Check if a value is of the valid length for its given type.
 * @param value
 * @returns `boolean`
 */
const isValidLength = (value: unknown): value is number =>
  is.safeInteger(value) && value >= 0;

/**
 * Check if a value is a given type, or retrieve its {@linkcode TypeName}.
 * @param value The value to check
 */
class is {
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

  @inspect()
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

  static exact = function exact<T extends Record<string, unknown>, U extends T>(
    obj: unknown,
    shape: T,
  ): obj is U {
    if (!is.nonEmptyObject(obj as U)) return false;
    // forward comparison
    if (!(is.subset(obj, shape) && is.superset(obj, shape))) return false;
    // strict value type comparison
    return (Object.entries(obj as U).every(([key, value]) => {
      if (is.plainObject(value)) {
        if (is.plainObject(shape[key])) {
          // both values are objects, recurse their properties
          return is.exact(value, shape[key] as Record<string, unknown>);
        }
        // shape value for this key is not an object; fails to match
        return false;
      }
      // otherwise just check equality of types using getTypeName()
      return getTypeName(value) === getTypeName(shape[key]);
    }));
  };

  /**
   * Determines if an object is a **subset** of another (the "shape" object).
   * The target object **may not** have any keys that aren't present in the
   * shape. However, it does not need to have ***all*** of the shape's keys.
   *
   * @template T
   * @param shape The object used as a schema shape to compare against
   * @param obj The target object to inspect
   * @returns `true` if the target is a subset of the shape, `false` otherwise
   *
   * @see {@linkcode is.superset} for a typecheck that is the opposite of this.
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
  static subset = function subset<T extends Record<string, unknown>>(
    obj: unknown,
    shape: T,
  ): obj is {
    [K in keyof T as (typeof obj)[K] extends never ? never : K]: unknown;
  } {
    if (is.nonEmptyObject(shape) && is.nonEmptyObject(obj)) {
      if (Object.keys(obj).every((key) => key in shape)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Determines if an object is a **superset** of a given "shape". The object
   * must have **all** of the keys in the shape, but (unlike the
   * {@link is.subset} typecheck) it may also have other keys/properties that
   * are not defined in the shape object. Another way to think of this is that
   * the target object is an **_extension_** of the shape object.
   *
   * @template T
   * @param shape The object used as a "schema" to compare against
   * @param obj The target object to inspect
   * @returns `true` if the target is a superset of the shape, `false` otherwise
   *
   * @see {@linkcode is.subset} for a typecheck that is the opposite of this.
   *
   * @example
   * ```ts
   * is.superset(
   *   { a: 0, b: 0 }, // the schema/shape object
   *   { a: 1, b: 2, c: 3 }, // the target object
   * ) // => TRUE - target has all the keys as required by the shape
   * ```
   *
   * @example
   * ```ts
   * is.superset(
   *   { a: 1, b: 2, c: 3 }, // shape
   *   { a: 1, c: 3, d: 4 }, // target
   * ) // => FALSE - target has an unknown key not defined by the shape!
   * ```
   */
  static superset = function superset<T extends Record<string, unknown>>(
    obj: unknown,
    shape: T,
  ): obj is { [K in keyof T]: unknown } & { [x: string]: unknown } {
    if (is.nonEmptyObject(shape) && is.nonEmptyObject(obj)) {
      if (Object.keys(shape).every((key) => key in obj)) {
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

  // TODO: Use `not ''` when the `not` operator is available.
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

  /** @deprecated use {@linkcode is.function} instead */
  @deprecated({ since: "0.1.0", substitute: "function" })
  static function_(value: unknown): value is Function {
    return isOfType<Function>("function")(value);
  }

  /** @deprecated use {@linkcode is.class} instead */
  @deprecated({ since: "0.1.0", substitute: "class" })
  static class_ = <T>(value: unknown): value is Class<T> => is.class(value);

  /**
   * @deprecated use {@linkcode is.null} instead
   */
  @deprecated({ since: "0.1.0", substitute: "null" })
  static null_ = (value: unknown): value is null => value === null;

  static typeName = function typeName(value: unknown) {
    return getTypeName(value) as TypeName;
  };

  static [Symbol.for("Deno.customInspect")](inspect: typeof Deno.inspect) {
    const options: Deno.InspectOptions = {
      colors: true,
      compact: true,
      depth: 2,
      getters: true,
      showHidden: false,
      showProxy: false,
      sorted: true,
      trailingComma: true,
    };

    return `is ${inspect({ ...this }, options)}`;
  }
}

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
            (value as any[]).map((singleValue) =>
              `\`${getTypeName(singleValue)}\``
            ),
          ),
        ].join(", ")
      }`
      : `received value of type \`${getTypeName(value)}\``;

    throw new TypeError(
      `Expected value which is \`${description}\`, ${valuesMessage}.`,
    );
  }
};

@freeze
class Assertions {
  // Unknowns.
  static undefined = function (
    value: unknown,
  ): asserts value is undefined {
    return assertType(is.undefined(value), "undefined", value);
  };

  static null = function (value: unknown): asserts value is null {
    return assertType(is.null(value), "null", value);
  };

  static nullOrUndefined = function nullOrUndefined(
    value: unknown,
  ): asserts value is null | undefined {
    return assertType(
      is.nullOrUndefined(value),
      AssertionTypeDescription.nullOrUndefined,
      value,
    );
  };

  static string = function string(value: unknown): asserts value is string {
    return assertType(is.string(value), "string", value);
  };

  static number = function number(value: unknown): asserts value is number {
    return assertType(is.number(value), "number", value);
  };

  static bigint = function bigint(value: unknown): asserts value is bigint {
    return assertType(is.bigint(value), "bigint", value);
  };

  static function = function (value: unknown): asserts value is Function {
    return assertType(is.function(value), "Function", value);
  };

  static class = function <P = unknown>(
    value: unknown,
  ): asserts value is Class<P> {
    return assertType(
      is.class<P>(value),
      AssertionTypeDescription.class_,
      value,
    );
  };

  static nullish = function nullish(
    value: unknown,
  ): asserts value is null | undefined {
    return assertType(
      is.nullish(value),
      AssertionTypeDescription.nullish,
      value,
    );
  };

  static object = function object(value: unknown): asserts value is object {
    return assertType(is.object(value), "Object", value);
  };

  static boolean = function boolean(value: unknown): asserts value is boolean {
    return assertType(is.boolean(value), "boolean", value);
  };

  static symbol = function symbol(value: unknown): asserts value is symbol {
    return assertType(is.symbol(value), "symbol", value);
  };

  static truthy = function truthy(value: unknown): asserts value is unknown {
    return assertType(is.truthy(value), AssertionTypeDescription.truthy, value);
  };

  static falsy = function falsy(value: unknown): asserts value is unknown {
    return assertType(is.falsy(value), AssertionTypeDescription.falsy, value);
  };

  static primitive = function primitive(
    value: unknown,
  ): asserts value is Primitive {
    return assertType(
      is.primitive(value),
      AssertionTypeDescription.primitive,
      value,
    );
  };

  static boxedPrimitive = function boxedPrimitive(
    value: unknown,
  ): asserts value is object {
    return assertType(is.boxedPrimitive(value), "BoxedPrimitive", value);
  };

  static array = function array<T = unknown>(
    value: unknown,
    assertion?: ArrayAssertion<T>,
  ): asserts value is T[] {
    const assert: (
      condition: boolean,
      description: string,
      value: unknown,
    ) => asserts condition = assertType;

    assert(is.array(value), "Array", value);

    if (assertion) {
      value.forEach(assertion);
    }
  };

  static iterable = function iterable<T = unknown>(
    value: unknown,
  ): asserts value is Iterable<T> {
    return assertType(
      is.iterable(value),
      AssertionTypeDescription.iterable,
      value,
    );
  };

  static asyncIterable = function asyncIterable<T = unknown>(
    value: unknown,
  ): asserts value is AsyncIterable<T> {
    return assertType(
      is.asyncIterable(value),
      AssertionTypeDescription.asyncIterable,
      value,
    );
  };

  static generator = function generator(
    value: unknown,
  ): asserts value is Generator {
    return assertType(is.generator(value), "Generator", value);
  };

  static asyncGenerator = function asyncGenerator(
    value: unknown,
  ): asserts value is AsyncGenerator {
    return assertType(is.asyncGenerator(value), "AsyncGenerator", value);
  };

  static nativePromise = function nativePromise<T = unknown>(
    value: unknown,
  ): asserts value is Promise<T> {
    return assertType(
      is.nativePromise(value),
      AssertionTypeDescription.nativePromise,
      value,
    );
  };

  static promise = function promise<T = unknown>(
    value: unknown,
  ): asserts value is Promise<T> {
    return assertType(is.promise(value), "Promise", value);
  };

  static generatorFunction = function generatorFunction(
    value: unknown,
  ): asserts value is GeneratorFunction {
    return assertType(is.generatorFunction(value), "GeneratorFunction", value);
  };

  static asyncGeneratorFunction = function asyncGeneratorFunction(
    value: unknown,
  ): asserts value is AsyncGeneratorFunction {
    return assertType(
      is.asyncGeneratorFunction(value),
      "AsyncGeneratorFunction",
      value,
    );
  };

  static asyncFunction = function asyncFunction(
    value: unknown,
  ): asserts value is Function {
    return assertType(is.asyncFunction(value), "AsyncFunction", value);
  };

  static boundFunction = function boundFunction(
    value: unknown,
  ): asserts value is Function {
    return assertType(is.boundFunction(value), "Function", value);
  };

  static directInstanceOf = function directInstanceOf<T>(
    instance: unknown,
    class_: Class<T>,
  ): asserts instance is T {
    return assertType(
      is.directInstanceOf(instance, class_),
      AssertionTypeDescription.directInstanceOf,
      instance,
    );
  };

  static instanceOf = function instanceOf<T>(
    instance: unknown,
    class_: Class<T>,
  ): asserts instance is T {
    return assertType(
      is.instanceOf(instance, class_),
      AssertionTypeDescription.directInstanceOf,
      instance,
    );
  };

  static regExp = function regExp(value: unknown): asserts value is RegExp {
    return assertType(is.regExp(value), "RegExp", value);
  };

  static date = function date(value: unknown): asserts value is Date {
    return assertType(is.date(value), "Date", value);
  };

  static error = function error(value: unknown): asserts value is Error {
    return assertType(is.error(value), "Error", value);
  };

  static map = function map<Key = unknown, Value = unknown>(
    value: unknown,
  ): asserts value is Map<Key, Value> {
    return assertType(is.map(value), "Map", value);
  };

  static set = function set<T = unknown>(
    value: unknown,
  ): asserts value is Set<T> {
    return assertType(is.set(value), "Set", value);
  };

  static weakMap = function weakMap<
    Key extends object = object,
    Value = unknown,
  >(
    value: unknown,
  ): asserts value is WeakMap<Key, Value> {
    return assertType(is.weakMap(value), "WeakMap", value);
  };

  static weakSet = function weakSet<T extends object = object>(
    value: unknown,
  ): asserts value is WeakSet<T> {
    return assertType(is.weakSet(value), "WeakSet", value);
  };

  static weakRef = function weakRef<T extends object = object>(
    value: unknown,
  ): asserts value is WeakRef<T> {
    return assertType(is.weakRef(value), "WeakRef", value);
  };

  static arrayLike = function arrayLike<T = unknown>(
    value: unknown,
  ): asserts value is ArrayLike<T> {
    return assertType(
      is.arrayLike(value),
      AssertionTypeDescription.arrayLike,
      value,
    );
  };

  static mapIterator = function mapIterator<T = unknown>(
    value: unknown,
  ): asserts value is MapIterator {
    return assertType(is.mapIterator(value), "Map Iterator", value);
  };

  static setIterator = function setIterator<T = unknown>(
    value: unknown,
  ): asserts value is SetIterator {
    return assertType(is.setIterator(value), "Set Iterator", value);
  };

  static namespaceModule = function namespaceModule(
    value: unknown,
  ): asserts value is Module {
    return assertType(is.namespaceModule(value), "Module", value);
  };

  static plainObject = <Value = unknown>(
    value: unknown,
  ): asserts value is Record<string, Value> =>
    assertType(
      is.plainObject(value),
      AssertionTypeDescription.plainObject,
      value,
    );

  static propertyKey = function propertyKey(
    value: unknown,
  ): asserts value is number {
    return assertType(is.propertyKey(value), "PropertyKey", value);
  };

  static propertyDescriptor = <T = unknown>(
    value: unknown,
  ): asserts value is TypedPropertyDescriptor<T> =>
    assertType(
      is.propertyDescriptor(value),
      "PropertyDescriptor",
      value,
    );

  static accessorDescriptor = <T = unknown>(
    value: unknown,
  ): asserts value is AccessorDescriptor<T> =>
    assertType(is.accessorDescriptor(value), "AccessorDescriptor", value);

  static dataDescriptor = <T = unknown>(
    value: unknown,
  ): asserts value is DataDescriptor<T> =>
    assertType(is.dataDescriptor(value), "DataDescriptor", value);

  static key = <
    T extends readonly unknown[] | Record<PropertyKey, unknown> = {},
  >(
    value: unknown,
    target: T,
  ): asserts value is keyof T =>
    assertType(is.key(value, target), "Key", value);

  static value = <
    T extends readonly unknown[] | Record<PropertyKey, unknown> = {},
  >(
    value: unknown,
    target: T,
  ): asserts value is T[keyof T] =>
    assertType(is.value(value, target), "Value", value);

  static enumKey = <T = unknown>(
    value: unknown,
    targetEnum: T,
  ): asserts value is keyof T =>
    assertType(is.enumKey(value, targetEnum), "EnumKey", value);

  static enumCase = <T = unknown>(
    value: unknown,
    targetEnum: T,
  ): asserts value is T[keyof T] =>
    assertType(is.enumCase(value, targetEnum), "EnumCase", value);

  static entry = <K = unknown, V = unknown>(
    value: unknown,
  ): asserts value is readonly [K, V] =>
    assertType(
      is.entry(value),
      AssertionTypeDescription.entry,
      value,
    );

  static entries = <K = unknown, V = unknown>(
    value: unknown,
  ): asserts value is readonly (readonly [K, V])[] =>
    assertType(
      is.entries(value),
      AssertionTypeDescription.entries,
      value,
    );

  static sparseArray = (value: unknown): asserts value is unknown[] =>
    assertType(
      is.sparseArray(value),
      AssertionTypeDescription.sparseArray,
      value,
    );

  static typedArray = (value: unknown): asserts value is TypedArray =>
    assertType(
      is.typedArray(value),
      AssertionTypeDescription.typedArray,
      value,
    );

  static int8Array = function int8Array(
    value: unknown,
  ): asserts value is Int8Array {
    return assertType(is.int8Array(value), "Int8Array", value);
  };

  static uint8Array = function uint8Array(
    value: unknown,
  ): asserts value is Uint8Array {
    return assertType(is.uint8Array(value), "Uint8Array", value);
  };

  static uint8ClampedArray = (
    value: unknown,
  ): asserts value is Uint8ClampedArray =>
    assertType(is.uint8ClampedArray(value), "Uint8ClampedArray", value);

  static int16Array = function int16Array(
    value: unknown,
  ): asserts value is Int16Array {
    return assertType(is.int16Array(value), "Int16Array", value);
  };

  static uint16Array = function uint16Array(
    value: unknown,
  ): asserts value is Uint16Array {
    return assertType(is.uint16Array(value), "Uint16Array", value);
  };

  static int32Array = function int32Array(
    value: unknown,
  ): asserts value is Int32Array {
    return assertType(is.int32Array(value), "Int32Array", value);
  };

  static uint32Array = function uint32Array(
    value: unknown,
  ): asserts value is Uint32Array {
    return assertType(is.uint32Array(value), "Uint32Array", value);
  };

  static float32Array = function float32Array(
    value: unknown,
  ): asserts value is Float32Array {
    return assertType(is.float32Array(value), "Float32Array", value);
  };

  static float64Array = function float64Array(
    value: unknown,
  ): asserts value is Float64Array {
    return assertType(is.float64Array(value), "Float64Array", value);
  };

  static bigInt64Array = function bigInt64Array(
    value: unknown,
  ): asserts value is BigInt64Array {
    return assertType(is.bigInt64Array(value), "BigInt64Array", value);
  };

  static bigUint64Array = function bigUint64Array(
    value: unknown,
  ): asserts value is BigUint64Array {
    return assertType(is.bigUint64Array(value), "BigUint64Array", value);
  };

  static arrayBuffer = function arrayBuffer(
    value: unknown,
  ): asserts value is ArrayBuffer {
    return assertType(is.arrayBuffer(value), "ArrayBuffer", value);
  };

  static dataView = function dataView(
    value: unknown,
  ): asserts value is DataView {
    return assertType(is.dataView(value), "DataView", value);
  };

  static sharedArrayBuffer = (
    value: unknown,
  ): asserts value is SharedArrayBuffer =>
    assertType(is.sharedArrayBuffer(value), "SharedArrayBuffer", value);

  static domElement = (value: unknown): asserts value is HTMLElement =>
    assertType(
      is.domElement(value),
      AssertionTypeDescription.domElement,
      value,
    );

  static element = (value: unknown): asserts value is Element =>
    assertType(
      is.element(value),
      AssertionTypeDescription.domElement,
      value,
    );

  static svgElement = (value: unknown): asserts value is SVGElement =>
    assertType(
      is.svgElement(value),
      AssertionTypeDescription.svgElement,
      value,
    );

  static observable = function observable(
    value: unknown,
  ): asserts value is ObservableLike {
    return assertType(is.observable(value), "Observable", value);
  };

  static nodeStream = (value: unknown): asserts value is NodeJS.Stream =>
    assertType(
      is.nodeStream(value),
      AssertionTypeDescription.nodeStream,
      value,
    );

  static buffer = function buffer(value: unknown): asserts value is Buffer {
    return assertType(is.buffer(value), "Buffer", value);
  };

  static blob = function blob(value: unknown): asserts value is Blob {
    return assertType(is.blob(value), "Blob", value);
  };

  static formData = function formData(
    value: unknown,
  ): asserts value is FormData {
    return assertType(is.formData(value), "FormData", value);
  };

  static headers = function headers(value: unknown): asserts value is Headers {
    return assertType(is.headers(value), "Headers", value);
  };

  static request = function request(value: unknown): asserts value is Request {
    return assertType(is.request(value), "Request", value);
  };

  static response = function response(
    value: unknown,
  ): asserts value is Response {
    return assertType(is.response(value), "Response", value);
  };

  static urlSearchParams = (
    value: unknown,
  ): asserts value is URLSearchParams =>
    assertType(is.urlSearchParams(value), "URLSearchParams", value);

  static urlInstance = function urlInstance(
    value: unknown,
  ): asserts value is URL {
    return assertType(is.urlInstance(value), "URL", value);
  };

  static urlString = (value: unknown): asserts value is string =>
    assertType(
      is.urlString(value),
      AssertionTypeDescription.urlString,
      value,
    );

  static url = function url(value: unknown): asserts value is string | URL {
    return assertType(is.url(value), AssertionTypeDescription.url, value);
  };

  // Numbers.
  static nan = function nan(value: unknown): asserts value is unknown {
    return assertType(is.nan(value), AssertionTypeDescription.nan, value);
  };

  static integer = function integer(value: unknown): asserts value is number {
    return assertType(
      is.integer(value),
      AssertionTypeDescription.integer,
      value,
    );
  };

  static safeInteger = (value: unknown): asserts value is number =>
    assertType(
      is.safeInteger(value),
      AssertionTypeDescription.safeInteger,
      value,
    );

  static evenInteger = (value: number): asserts value is number =>
    assertType(
      is.evenInteger(value),
      AssertionTypeDescription.evenInteger,
      value,
    );

  static oddInteger = (value: number): asserts value is number =>
    assertType(
      is.oddInteger(value),
      AssertionTypeDescription.oddInteger,
      value,
    );

  static infinite = function infinite(value: unknown): asserts value is number {
    return assertType(
      is.infinite(value),
      AssertionTypeDescription.infinite,
      value,
    );
  };

  static numericString = (value: unknown): asserts value is string =>
    assertType(
      is.numericString(value),
      AssertionTypeDescription.numericString,
      value,
    );

  static inRange = (
    value: number,
    range: number | number[],
  ): asserts value is number =>
    assertType(
      is.inRange(value, range),
      AssertionTypeDescription.inRange,
      value,
    );

  static emptyArray = (value: unknown): asserts value is never[] =>
    assertType(
      is.emptyArray(value),
      AssertionTypeDescription.emptyArray,
      value,
    );

  static emptySet = function emptySet(
    value: unknown,
  ): asserts value is Set<never> {
    return assertType(
      is.emptySet(value),
      AssertionTypeDescription.emptySet,
      value,
    );
  };

  static emptyMap = function emptyMap(
    value: unknown,
  ): asserts value is Map<never, never> {
    return assertType(
      is.emptyMap(value),
      AssertionTypeDescription.emptyMap,
      value,
    );
  };

  static emptyObject = <Key extends keyof any = string>(
    value: unknown,
  ): asserts value is Record<Key, never> =>
    assertType(
      is.emptyObject(value),
      AssertionTypeDescription.emptyObject,
      value,
    );

  static emptyString = (value: unknown): asserts value is "" =>
    assertType(
      is.emptyString(value),
      AssertionTypeDescription.emptyString,
      value,
    );

  static whitespace = (value: unknown): asserts value is string =>
    assertType(
      is.whitespace(value),
      AssertionTypeDescription.whitespace,
      value,
    );

  static emptyStringOrWhitespace = (
    value: unknown,
  ): asserts value is string =>
    assertType(
      is.emptyStringOrWhitespace(value),
      AssertionTypeDescription.emptyStringOrWhitespace,
      value,
    );

  static nonEmptyArray = (
    value: unknown,
  ): asserts value is [unknown, ...unknown[]] =>
    assertType(
      is.nonEmptyArray(value),
      AssertionTypeDescription.nonEmptyArray,
      value,
    );

  static nonEmptySet = <T = unknown>(
    value: unknown,
  ): asserts value is Set<T> =>
    assertType(
      is.nonEmptySet(value),
      AssertionTypeDescription.nonEmptySet,
      value,
    );

  static nonEmptyMap = <Key = unknown, Value = unknown>(
    value: unknown,
  ): asserts value is Map<Key, Value> =>
    assertType(
      is.nonEmptyMap(value),
      AssertionTypeDescription.nonEmptyMap,
      value,
    );

  static nonEmptyObject = <Key extends keyof any = string, Value = unknown>(
    value: unknown,
  ): asserts value is Record<Key, Value> =>
    assertType(
      is.nonEmptyObject(value),
      AssertionTypeDescription.nonEmptyObject,
      value,
    );

  static nonEmptyString = (value: unknown): asserts value is string =>
    assertType(
      is.nonEmptyString(value),
      AssertionTypeDescription.nonEmptyString,
      value,
    );

  static nonEmptyStringAndNotWhitespace = (
    value: unknown,
  ): asserts value is string =>
    assertType(
      is.nonEmptyStringAndNotWhitespace(value),
      AssertionTypeDescription.nonEmptyStringAndNotWhitespace,
      value,
    );

  // Variadic functions.
  static any = (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): void | never =>
    assertType(
      is.any(predicate, ...values),
      AssertionTypeDescription.any,
      values,
      { multipleValues: true },
    );

  static all = (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): void | never =>
    assertType(
      is.all(predicate, ...values),
      AssertionTypeDescription.all,
      values,
      { multipleValues: true },
    );

  static every = (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): void | never =>
    assertType(
      is.every(predicate, ...values),
      AssertionTypeDescription.every,
      values,
      { multipleValues: true },
    );

  static some = (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): void | never =>
    assertType(
      is.some(predicate, ...values),
      AssertionTypeDescription.some,
      values,
      { multipleValues: true },
    );

  static none = (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ): void | never =>
    assertType(
      is.none(predicate, ...values),
      AssertionTypeDescription.none,
      values,
      { multipleValues: true },
    );

  /** @deprecated use {@linkcode assert.function} instead */
  @deprecated({
    since: "0.1.0",
    substitute: "function",
    hide: true,
    seal: true,
  })
  static function_ = function function_(
    value: unknown,
  ): asserts value is Function {
    return assertType(is.function(value), "Function", value);
  };

  /** @deprecated use {@linkcode assert.class} instead */
  @deprecated({ since: "0.1.0", substitute: "class", hide: true, seal: true })
  static class_ = function class_<P = unknown>(
    value: unknown,
  ): asserts value is Class<P> {
    return assertType(
      is.class<P>(value),
      AssertionTypeDescription.class_,
      value,
    );
  };

  /** @deprecated use {@linkcode assert.null} instead */
  @deprecated({ since: "0.1.0", substitute: "null", hide: true, seal: true })
  static null_ = function null_(value: unknown): asserts value is null {
    return assertType(is.null(value), "null", value);
  };

  static [Symbol.for("Deno.customInspect")](inspect: typeof Deno.inspect) {
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
            `${i === values.length - 1 ? "and " : ""}\`${getTypeName(v)}\``
          ).join(", ")
        }`
        : `value of type \`${getTypeName(value)}\``;

      throw new TypeError(
        `Assertion Failure: Expected value of \`${message}\` but received ${msg}.`,
      );
    }
  } as Partial<Assert>,
  Assertions as unknown as Assert,
) as Assert;

interface is extends Flatten<typeof is, false> {
  <T>(value: T): GetTypeName<T>;
  new (): typeof is;
  assert: Assert;
}

const isTarget = Object.assign(
  is,
  function is<T>(value: T) {
    return getTypeName<T>(value) as GetTypeName<T>;
  },
  { assert: assert as Assert },
) as unknown as is;

formatPropertyDescriptors(isTarget, { sealed: true, hideDeprecated: true });

// We're proxying the `is` and `assert` classes combined with the `getTypeName`
// function, to allow for the following pattern:
//
// ```ts
// import { is } from "https://deno.land/x/dis/mod.ts";
//
// is("🦕") // => "string"
// is(100n) // => "bigint"
// is.bigint(100n) // => true
// is.assert.bigint(100) // => throws TypeError
// ```

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
const $is: is = new Proxy<is>(isTarget, {
  apply(
    _: is,
    thisArg,
    argArray = [undefined],
  ): ReturnType<typeof getTypeName> {
    return getTypeName.apply(
      thisArg,
      argArray as Parameters<typeof getTypeName>,
    );
  },
  construct(_t, _a, newTarget) {
    throw new TypeError(
      `Cannot create a new instance of ${newTarget.name} using \`new\` operator. Use the syntax \`is(value)\`, \`is.assert(condition)\`, or \`is.{type}(value)\` instead.`,
    );
  },
  get(target, p, receiver) {
    switch (p) {
      case Symbol.toStringTag:
        return "is";
      case "assert":/* fall through */
        return assert;
      case "asserts":
        return assert;
      default:
        return Reflect.get(target, p, receiver);
    }
  },
  set(target, p, value, receiver) {
    return Reflect.set(target, p, value, receiver);
  },
  ownKeys(target) {
    return Reflect.ownKeys(target);
  },
  getOwnPropertyDescriptor(target, p) {
    return Reflect.getOwnPropertyDescriptor(target, p);
  },
  isExtensible(t) {
    return Reflect.isExtensible(t);
  },
  preventExtensions(t) {
    return Reflect.preventExtensions(t);
  },
  defineProperty(t, p, a) {
    return Reflect.defineProperty(t, p, a);
  },
  deleteProperty() { // (t, p) {
    // return Reflect.deleteProperty(t, p);
    return false;
  },
}) as is;

Reflect.defineProperty($is, Symbol.toStringTag, { value: "is" });

export { $is as default, $is as is, assert };

export type { Assert, TypeName };
