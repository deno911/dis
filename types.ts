import {
  Buffer,
  Buffer as DenoBuffer,
  NodeBuffer,
  NodeEventEmitter,
  NodeReadable,
  NodeStream,
  NodeWritable,
} from "./deps.ts";

export { Buffer, DenoBuffer, NodeBuffer };

export declare namespace NodeJS {
  export type Buffer = NodeBuffer;
  export type Stream = NodeStream;
  export type Readable = NodeReadable;
  export type Writable = NodeWritable;
  export type EventEmitter = NodeEventEmitter;
  export type ReadableStream = Readable & {
    readonly readable: true;
  };
  export type WritableStream = Writable & {
    readonly writable: true;
  };
  const Buffer: Buffer;
  const Stream: Stream;
  const Readable: Readable;
  const Writable: Writable;
  const EventEmitter: EventEmitter;
  const ReadableStream: ReadableStream;
  const WritableStream: WritableStream;

  export interface Streams extends EventEmitter {
    pipe<T extends Writable>(
      destination: T,
      options?: { end?: boolean },
    ): T;
  }
}

declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}

/**
 * Matches a value that is like an Observable.
 * @see https://github.com/tc39/proposal-observable
 */
export interface ObservableLike {
  subscribe(observer: (value: unknown) => void): void;
  [Symbol.observable](): ObservableLike;
}

export type Falsy = false | 0 | 0n | "" | null | undefined;

export interface WeakRef<T extends object> {
  readonly [Symbol.toStringTag]: "WeakRef";
  deref(): T | undefined;
}

/**
 * Matches any primitive value.
 * @see https://mdn.io/Primitive
 */
export type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint;

export type Predicate = (value: unknown) => boolean;

export type ArrayMethod = (
  fn: (value: unknown, index: number, array: unknown[]) => boolean,
  thisArg?: unknown,
) => boolean;

/**
 * Matches a `class` constructor.
 * @see https://mdn.io/Classes.
 */
export interface Constructor<Proto = unknown, Args extends any[] = any[]> {
  new (...args: Args): Proto;
}

export interface Class<
  Proto = unknown,
  Args extends any[] = any[],
> extends Constructor<Proto, Args> {
  readonly prototype: Proto;
}

export type AccessorDescriptor<T = any> = Omit<
  TypedPropertyDescriptor<T>,
  "value" | "writable"
>;

export type DataDescriptor<T = any> = Pick<
  TypedPropertyDescriptor<T>,
  "configurable" | "enumerable" | "writable" | "value"
>;

export type MapIterator = ReturnType<typeof Map.prototype.entries>;

export type SetIterator = ReturnType<typeof Set.prototype.entries>;

export interface Module {
  [property: string]: unknown;
}

/**
 * Matches any [typed array](https://mdn.io/TypedArray).
 * @see https://mdn.io/TypedArray
 */
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

/**
 * TypedArrays
 */
export const typedArrayTypeNames = [
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",
] as const;

export type typedArrayTypeNames = typeof typedArrayTypeNames;
export type TypedArrayTypeName = typedArrayTypeNames[number];

export const objectTypeNames = [
  "Function",
  "Generator",
  "GeneratorFunction",
  "AsyncFunction",
  "AsyncGenerator",
  "AsyncGeneratorFunction",
  "Observable",
  "Array",
  "Buffer",
  "Blob",
  "Object",
  "RegExp",
  "Date",
  "Error",
  "Iterable",
  "Iterator",
  "IterableIterator",
  "AsyncIterable",
  "AsyncIterator",
  "AsyncIterableIterator",
  "Map Iterator",
  "Set Iterator",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "WeakRef",
  "ArrayBuffer",
  "SharedArrayBuffer",
  "DataView",
  "Module",
  "Promise",
  "FormData",
  "Headers",
  "Request",
  "Response",
  "ReadableStream",
  "WritableStream",
  "TransformStream",
  "Reader",
  "Writer",
  "FileInfo",
  "Proxy",
  "URLSearchParams",
  "URLPattern",
  "URL",
  "HTMLElement",
  "SVGElement",
  "NaN",
  ...typedArrayTypeNames,
] as const;

export type objectTypeNames = typeof objectTypeNames;
export type ObjectTypeName = objectTypeNames[number];

/**
 * Primitives
 */
export const primitiveTypeNames = [
  "null",
  "undefined",
  "string",
  "number",
  "bigint",
  "boolean",
  "symbol",
  "object",
  "function",
] as const;
export type primitiveTypeNames = typeof primitiveTypeNames;
export type PrimitiveTypeName = primitiveTypeNames[number];
export type TypeName = ObjectTypeName | PrimitiveTypeName;
