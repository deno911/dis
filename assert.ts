import { Buffer, NodeJS } from "./types.ts";
import type {
  AccessorDescriptor,
  Class,
  ConditionalExcept,
  DataDescriptor,
  MapIterator,
  Module,
  ObservableLike,
  Predicate,
  Primitive,
  SetIterator,
  TypedArray,
} from "./types.ts";

export enum AssertionTypeDescription {
  class_ = "Class",

  nullish = "null or undefined (nullish)",
  nullOrUndefined = "null or undefined",

  truthy = "truthy",
  falsy = "falsy",
  primitive = "primitive",
  printable = "printable primitive",

  plainObject = "plain object",

  arrayLike = "array-like",
  typedArray = "TypedArray",

  entry = "tuple-pair entry",
  entries = "tuple-pair entries",

  iterable = "Iterable",
  asyncIterable = "AsyncIterable",

  key = "key exists in the given object",
  value = "value exists in the given object",
  enumKey = "key exists in the given enum",
  enumCase = "value exists in the given enum",

  nativePromise = "native Promise",

  urlSearchParams = "URLSearchParams instance",
  urlInstance = "URL instance",
  urlString = "string with a URL",
  url = "URL instance or a string with a URL",
  headers = "Headers instance",
  response = "Response instance",
  request = "Request instance",
  formData = "FormData instance",
  blob = "Blob instance",
  file = "File instance",
  fileInfo = "FileInfo instance",
  namespaceModule = "module imported via `import * as ...` syntax",

  domElement = "HTMLElement",
  svgElement = "SVGElement",
  nodeStream = "Node.js Stream",
  nodeBuffer = "Node.js Buffer",
  denoBuffer = "Deno Buffer",
  buffer = "Buffer (Node.js or Deno)",

  sparseArray = "sparse array",
  emptyArray = "empty array",
  whitespace = "whitespace string",
  emptyString = "empty string",
  emptyStringOrWhitespace = "empty string or whitespace",
  emptyObject = "empty object",
  emptySet = "empty Set",
  emptyMap = "empty Map",

  nonEmptyArray = "non-empty array",
  nonEmptyString = "non-empty string",
  nonEmptyStringAndNotWhitespace = "non-empty string and not whitespace",
  nonEmptyObject = "non-empty object",
  nonEmptySet = "non-empty Set",
  nonEmptyMap = "non-empty Map",

  nan = "NaN (not a number)",
  numericString = "string with a number",
  safeInteger = "integer (safe)",
  evenInteger = "even integer",
  oddInteger = "odd integer",
  infinite = "infinite number (+Infinity or -Infinity)",
  inRange = "in range",
  integer = "integer",

  instanceOf = "instanceof T",
  directInstanceOf = "instanceof T",

  any = "predicate is truthy for any one value",
  all = "predicate is truthy for **all** of the values",
  none = "predicate is truthy for **none** of the values",
  some = any,
  every = all,
}

/**
 * Type assertions have to be declared with an explicit type.
 */
export interface assert {
  string: (value: unknown) => asserts value is string;
  number: (value: unknown) => asserts value is number;
  bigint: (value: unknown) => asserts value is bigint;
  boolean: (value: unknown) => asserts value is boolean;
  symbol: (value: unknown) => asserts value is symbol;
  numericString: (value: unknown) => asserts value is string;
  array: <T = unknown>(
    value: unknown,
    assertion?: (element: unknown) => asserts element is T,
  ) => asserts value is T[];
  undefined: (value: unknown) => asserts value is undefined;
  nullOrUndefined: (value: unknown) => asserts value is null | undefined;
  nullish: (value: unknown) => asserts value is null | undefined;
  null: (value: unknown) => asserts value is null;
  function: (value: unknown) => asserts value is Function;
  class: <P = unknown>(value: unknown) => asserts value is Class<P>;

  iterable: <T = unknown>(value: unknown) => asserts value is Iterable<T>;
  asyncIterable: <T = unknown>(
    value: unknown,
  ) => asserts value is AsyncIterable<T>;
  generator: (value: unknown) => asserts value is Generator;
  asyncGenerator: (value: unknown) => asserts value is AsyncGenerator;
  nativePromise: <T = unknown>(value: unknown) => asserts value is Promise<T>;
  promise: <T = unknown>(value: unknown) => asserts value is Promise<T>;
  generatorFunction: (value: unknown) => asserts value is GeneratorFunction;
  asyncGeneratorFunction: (
    value: unknown,
  ) => asserts value is AsyncGeneratorFunction;
  asyncFunction: (value: unknown) => asserts value is Function;
  boundFunction: (value: unknown) => asserts value is Function;
  regExp: (value: unknown) => asserts value is RegExp;
  regex: (value: unknown) => asserts value is RegExp;
  date: (value: unknown) => asserts value is Date;
  error: (value: unknown) => asserts value is Error;
  map: <Key = unknown, Value = unknown>(
    value: unknown,
  ) => asserts value is Map<Key, Value>;
  set: <T = unknown>(value: unknown) => asserts value is Set<T>;
  weakMap: <Key extends object = object, Value = unknown>(
    value: unknown,
  ) => asserts value is WeakMap<Key, Value>;
  weakSet: <T extends object = object>(
    value: unknown,
  ) => asserts value is WeakSet<T>;
  weakRef: <T extends object = object>(
    value: unknown,
  ) => asserts value is WeakRef<T>;
  typedArray: (value: unknown) => asserts value is TypedArray;
  int8Array: (value: unknown) => asserts value is Int8Array;
  uint8Array: (value: unknown) => asserts value is Uint8Array;
  uint8ClampedArray: (value: unknown) => asserts value is Uint8ClampedArray;
  int16Array: (value: unknown) => asserts value is Int16Array;
  uint16Array: (value: unknown) => asserts value is Uint16Array;
  int32Array: (value: unknown) => asserts value is Int32Array;
  uint32Array: (value: unknown) => asserts value is Uint32Array;
  float32Array: (value: unknown) => asserts value is Float32Array;
  float64Array: (value: unknown) => asserts value is Float64Array;
  bigInt64Array: (value: unknown) => asserts value is BigInt64Array;
  bigUint64Array: (value: unknown) => asserts value is BigUint64Array;
  arrayBuffer: (value: unknown) => asserts value is ArrayBuffer;
  sharedArrayBuffer: (value: unknown) => asserts value is SharedArrayBuffer;
  dataView: (value: unknown) => asserts value is DataView;
  buffer: (value: unknown) => asserts value is Buffer;
  object: <Key extends keyof any = string, Value = unknown>(
    value: unknown,
  ) => asserts value is Record<Key, Value>;
  namespaceModule: (value: unknown) => asserts value is Module;
  mapIterator: (value: unknown) => asserts value is MapIterator;
  setIterator: (value: unknown) => asserts value is SetIterator;
  propertyKey: (value: unknown) => asserts value is PropertyKey;
  propertyDescriptor: <T = unknown>(
    value: unknown,
  ) => asserts value is TypedPropertyDescriptor<T>;
  accessorDescriptor: <T = unknown>(
    value: unknown,
  ) => asserts value is AccessorDescriptor<T>;
  dataDescriptor: <T = unknown>(
    value: unknown,
  ) => asserts value is DataDescriptor<T>;
  exact: <T>(
    shape: T,
    value: unknown,
  ) => asserts value is T;
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
   * is.assert.subset(
   *   { a: 0, b: 0 }, // the schema/shape object
   *   { a: 1, b: 2, c: 3 }, // the target object
   * ) // => ❌ target has keys not defined in shape!
   * ```
   *
   * @example
   * ```ts
   * is.assert.subset(
   *   { a: 1, b: 2, c: 3 }, // shape
   *   { a: 1, c: 3 }, // target
   * ) // => ✔️ target is missing `b`, but all other keys are in the shape!
   * ```
   */
  subset: <T extends Record<string, unknown>>(
    shape: T,
    value: unknown,
  ) => asserts value is {
    [K in keyof T as (typeof value)[K] extends never ? never : K]: unknown;
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
   * @see {@linkcode assert.subset} for a typecheck that is the opposite of this.
   *
   * @example
   * ```ts
   * is.assert.superset(
   *   { a: 0, b: 0 }, // the schema/shape object
   *   { a: 1, b: 2, c: 3 }, // the target object
   * ) // => ✔️ target has all the keys as required by the shape
   * ```
   *
   * @example
   * ```ts
   * is.assert.superset(
   *   { a: 1, b: 2, c: 3 }, // shape
   *   { a: 1, c: 3, d: 4 }, // target
   * ) // => ❌ target has an unknown key not defined by the shape!
   * ```
   */
  superset: <T extends Record<string, unknown>>(
    shape: T,
    value: unknown,
  ) => asserts value is { [K in keyof T | string]: unknown };
  key: <T extends readonly unknown[] | Record<PropertyKey, unknown> = {}>(
    value: unknown,
    target: T,
  ) => asserts value is keyof T;
  value: <T extends readonly unknown[] | Record<PropertyKey, unknown> = {}>(
    value: unknown,
    target: T,
  ) => asserts value is T[keyof T];
  enumKey: <T = unknown>(
    value: unknown,
    targetEnum: T,
  ) => asserts value is keyof T;
  enumCase: <T = unknown>(
    value: unknown,
    targetEnum: T,
  ) => asserts value is T[keyof T];
  plainObject: <Value = unknown>(
    value: unknown,
  ) => asserts value is Record<string, Value>;
  arrayLike: <T = unknown>(value: unknown) => asserts value is ArrayLike<T>;
  entry: <K = unknown, V = unknown>(
    value: unknown,
  ) => asserts value is readonly [K, V];
  entries: <K = unknown, V = unknown>(
    value: unknown,
  ) => asserts value is readonly (readonly [K, V])[];
  sparseArray: (value: unknown) => asserts value is unknown[];
  emptyArray: (value: unknown) => asserts value is never[];
  nonEmptyArray: (value: unknown) => asserts value is [unknown, ...unknown[]];
  whitespace: (value: unknown) => asserts value is string;
  emptyString: (value: unknown) => asserts value is "";
  emptyStringOrWhitespace: (value: unknown) => asserts value is string;
  nonEmptyString: (value: unknown) => asserts value is string;
  nonEmptyStringAndNotWhitespace: (value: unknown) => asserts value is string;
  emptyObject: <Key extends keyof any = string>(
    value: unknown,
  ) => asserts value is Record<Key, never>;
  nonEmptyObject: <Key extends keyof any = string, Value = unknown>(
    value: unknown,
  ) => asserts value is Record<Key, Value>;
  emptySet: (value: unknown) => asserts value is Set<never>;
  nonEmptySet: <T = unknown>(value: unknown) => asserts value is Set<T>;
  emptyMap: (value: unknown) => asserts value is Map<never, never>;
  nonEmptyMap: <Key = unknown, Value = unknown>(
    value: unknown,
  ) => asserts value is Map<Key, Value>;

  domElement: (value: unknown) => asserts value is HTMLElement;
  observable: (value: unknown) => asserts value is ObservableLike;
  nodeStream: (value: unknown) => asserts value is NodeJS.Stream;

  blob: (value: unknown) => asserts value is Blob;
  formData: (value: unknown) => asserts value is FormData;
  headers: (value: unknown) => asserts value is Headers;
  request: (value: unknown) => asserts value is Request;
  response: (value: unknown) => asserts value is Response;
  urlSearchParams: (value: unknown) => asserts value is URLSearchParams;
  urlInstance: (value: unknown) => asserts value is URL;
  urlString: (value: unknown) => asserts value is string;
  url: (value: unknown) => asserts value is string | URL;

  // Numbers.
  truthy: (value: unknown) => asserts value is unknown;
  falsy: (value: unknown) => asserts value is unknown;
  nan: (value: unknown) => asserts value is unknown;
  primitive: (value: unknown) => asserts value is Primitive;
  integer: (value: unknown) => asserts value is number;
  safeInteger: (value: unknown) => asserts value is number;
  evenInteger: (value: number) => asserts value is number;
  oddInteger: (value: number) => asserts value is number;
  inRange: (value: number, range: number | number[]) => asserts value is number;
  infinite: (value: unknown) => asserts value is number;
  directInstanceOf: <T>(
    instance: unknown,
    class_: Class<T>,
  ) => asserts instance is T;
  instanceOf: <T>(
    instance: unknown,
    class_: Class<T>,
  ) => asserts instance is T;
  any: (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ) => void | never;
  all: (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ) => void | never;
  every: (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ) => void | never;
  some: (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ) => void | never;
  none: (
    predicate: Predicate | Predicate[],
    ...values: unknown[]
  ) => void | never;
}

export interface AssertOptions {
  multipleValues?: boolean;
}

export type AssertionToTypeCheck<
  Source,
  Keys extends keyof Source = keyof Source,
> = ConditionalExcept<
  {
    [K in Keys]: Source[K] extends ((
      value: unknown,
      ...args: infer A extends unknown[]
    ) => asserts value is infer Type)
      ? ((value: unknown, ...args: A) => value is Type)
      : Source[K] extends (
        (
          value: unknown,
          ...args: infer Args extends unknown[]
        ) => asserts value is infer Type
      ) ? ((value: unknown, ...args: Args) => value is Type)
      : never;
  },
  never
>;

// assemble a list of assertions based on the available is.{method} typechecks
// (with a teeny bit of inference magic to extract types for args and return)
export type TypeChecksToAssertions<
  Source,
  Keys extends keyof Source = keyof Source,
> = ConditionalExcept<
  {
    [K in Keys]: (
      Source[K] extends (
        (value: unknown) => value is infer R
      ) ? (
          (value: unknown) => asserts value is R
        )
        : Source[K] extends (
          (
            value: unknown,
            ...args: infer Rest extends unknown[]
          ) => value is infer R
        ) ? (
            (value: unknown, ...args: Rest) => asserts value is R
          )
        : Source[K] extends (
          (other: infer Other, value: unknown) => value is infer R
        ) ? ((other: Other, value: unknown) => asserts value is R)
        : never
    );
  },
  never
>;

export interface Assert extends assert {
  (expression: boolean, message?: string): asserts expression;
  (
    condition: boolean,
    valueReceived: unknown,
    errorMessage: string,
  ): asserts condition;
  (
    expression: boolean,
    valueReceived: unknown,
    valueExpected: unknown,
    options?: AssertOptions,
  ): asserts expression;
}
