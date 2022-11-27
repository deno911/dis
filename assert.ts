import { Buffer, NodeJS } from "./types.ts";
import type {
  AccessorDescriptor,
  Class,
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
  numericString = "string with a number",
  nullOrUndefined = "null or undefined",
  nullish = "nullish (null or undefined)",
  iterable = "Iterable",
  asyncIterable = "AsyncIterable",
  nativePromise = "native Promise",
  urlString = "string with a URL",
  url = "URL instance or a string with a URL",
  truthy = "truthy",
  falsy = "falsy",
  nan = "NaN",
  primitive = "primitive",
  integer = "integer",
  safeInteger = "integer",
  plainObject = "plain object",
  arrayLike = "array-like",
  typedArray = "TypedArray",
  domElement = "HTMLElement",
  nodeStream = "Node.js Stream",
  infinite = "infinite number",
  entry = "tuple-pair entry",
  entries = "tuple-pair entries",
  sparseArray = "sparse array",
  emptyArray = "empty array",
  nonEmptyArray = "non-empty array",
  emptyString = "empty string",
  whitespace = "whitespace string",
  emptyStringOrWhitespace = "empty string or whitespace",
  nonEmptyString = "non-empty string",
  nonEmptyStringAndNotWhitespace = "non-empty string and not whitespace",
  emptyObject = "empty object",
  nonEmptyObject = "non-empty object",
  emptySet = "empty set",
  nonEmptySet = "non-empty set",
  emptyMap = "empty map",
  nonEmptyMap = "non-empty map",

  evenInteger = "even integer",
  oddInteger = "odd integer",

  directInstanceOf = "T",
  inRange = "in range",

  any = "predicate returns truthy for any value",
  all = "predicate returns truthy for all values",
  none = "predicate returns falsy for all values / truthy for none",
  some = any,
  every = all,
}

/**
 * Type assertions have to be declared with an explicit type.
 */
export interface Assertions {
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

  // Unknowns.
  undefined: (value: unknown) => asserts value is undefined;
  nullOrUndefined: (value: unknown) => asserts value is null | undefined;
  nullish: (value: unknown) => asserts value is null | undefined;
  null: (value: unknown) => asserts value is null;
  /** @deprecated use {@linkcode assert.null} instead */
  null_: (value: unknown) => asserts value is null;

  function: (value: unknown) => asserts value is Function;
  /** @deprecated use {@linkcode assert.function} instead */
  function_: (value: unknown) => asserts value is Function;
  class: <P = unknown>(value: unknown) => asserts value is Class<P>;
  /** @deprecated use {@linkcode assert.class} instead */
  class_: <P = unknown>(value: unknown) => asserts value is Class<P>;

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

  // Variadic functions.
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

export interface Assert extends Assertions {
  (expression: boolean, message?: string): asserts expression;
  (
    expression: boolean,
    value: unknown,
    message: string,
  ): asserts expression;
  (
    expression: boolean,
    received: unknown,
    expected: string,
    options?: AssertOptions,
  ): asserts expression;
}
