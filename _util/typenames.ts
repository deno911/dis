import { NodeJS } from "../types.ts";
import type {
  AccessorDescriptor,
  AsyncFunction,
  Buffer,
  Class,
  DataDescriptor,
  Infinity,
  MapIterator,
  Module,
  NegativeInfinity,
  Numeric,
  ObservableLike,
  PositiveInfinity,
  ReadonlyAccessorDescriptor,
  ReadonlyDataDescriptor,
  SetIterator,
  Zero,
} from "./types.d.ts";

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

export const objectTypeNames = [
  "Function",
  "Generator",
  "GeneratorFunction",
  "AsyncFunction",
  "AsyncGenerator",
  "AsyncGeneratorFunction",
  "Observable",
  "Array",
  "ArrayLike",
  "ReadonlyArray",
  "Buffer",
  "Blob",
  "Object",
  "RegExp",
  "RegExpMatchArray",
  "RegExpExecArray",
  "TemplateStringsArray",
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
  "String Iterator",
  "Array Iterator",
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
  "URLSearchParams",
  "URLPattern",
  "URL",
  "HTMLElement",
  "SVGElement",
  "Element",
  "NaN",
  // TypedArrayTypeNames
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

export type PrimitiveTypeName = (typeof primitiveTypeNames)[number];
export type TypedArrayTypeName = (typeof typedArrayTypeNames)[number];
export type ObjectTypeName = (typeof objectTypeNames)[number];
export namespace TypeNameMap {
  export interface Primitives {
    "null": null;
    "undefined": undefined;
    "string": string;
    "number": number;
    "bigint": bigint;
    "boolean": boolean;
    "symbol": symbol;
    "object": object;
    "function": Function;
  }

  export interface Objects<T extends any = any, U = unknown> {
    "Function": Function;
    "AsyncFunction": AsyncFunction<T>;
    "Promise": Promise<any>;
    "PromiseLike": PromiseLike<any>;
    "Array": Array<any>;
    "Object": Object;
    "RegExp": RegExp;
    "Date": Date;
    "Error": Error;
    "Map": Map<T, U>;
    "Set": Set<T>;
  }

  export interface Additional {
    "Module": Module;
    "Observable": ObservableLike;
    "WeakMap": WeakMap<object, unknown>;
    "WeakSet": WeakSet<object>;
    "WeakRef": WeakRef<object>;
  }

  export interface StructuredData {
    // TypedArrays
    "Int8Array": Int8Array;
    "Uint8Array": Uint8Array;
    "Uint8ClampedArray": Uint8ClampedArray;
    "Int16Array": Int16Array;
    "Uint16Array": Uint16Array;
    "Int32Array": Int32Array;
    "Uint32Array": Uint32Array;
    "Float32Array": Float32Array;
    "Float64Array": Float64Array;
    "BigInt64Array": BigInt64Array;
    "BigUint64Array": BigUint64Array;
    // ArrayBufferLike
    "Buffer": Buffer;
    "ArrayBuffer": ArrayBuffer;
    "SharedArrayBuffer": SharedArrayBuffer;
    "DataView": DataView;
    "Blob": Blob;
  }

  export interface ArrayLikes {
    "RegExpMatchArray": RegExpMatchArray;
    "RegExpExecArray": RegExpExecArray;
    "TemplateStringsArray": TemplateStringsArray;
    "ArrayLike": ArrayLike<any>;
    "ReadonlyArray": ReadonlyArray<any>;
  }

  export interface Iterators<T extends any = any> {
    "Generator": Generator;
    "GeneratorFunction": GeneratorFunction;
    "AsyncGenerator": AsyncGenerator;
    "AsyncGeneratorFunction": AsyncGeneratorFunction;
    "Iterable": Iterable<T>;
    "Iterator": Iterator<T>;
    "IterableIterator": IterableIterator<T>;
    "AsyncIterable": AsyncIterable<T>;
    "AsyncIterator": AsyncIterator<T>;
    "AsyncIterableIterator": AsyncIterableIterator<T>;
    "Map Iterator": MapIterator<T>;
    "Set Iterator": SetIterator<T>;
    "String Iterator": IterableIterator<T>;
    "Array Iterator": IterableIterator<T>;
  }

  export interface WebAPI {
    "FormData": FormData;
    "Headers": Headers;
    "Request": Request;
    "Response": Response;
    "URL": URL;
    "URLSearchParams": URLSearchParams;
    "URLPattern": URLPattern;
  }

  export interface NodeAPI {
    "Buffer": NodeJS.Buffer;
    "Readable": NodeJS.Readable;
    "Writable": NodeJS.Writable;
    "ReadableStream": NodeJS.ReadableStream;
    "WritableStream": NodeJS.WritableStream;
    "Stream": NodeJS.Stream;
    "EventEmitter": NodeJS.EventEmitter;
  }

  export interface DenoAPI {
    "Buffer": Buffer;
    "Reader": Deno.Reader;
    "Writer": Deno.Writer;
    "Closer": Deno.Closer;
    "Listener": Deno.Listener;
    "ReaderWriter": Deno.Reader & Deno.Writer;
    "ReaderWriterCloser": Deno.Reader & Deno.Writer & Deno.Closer;
    "FileInfo": Deno.FileInfo;
    "FsFile": Deno.FsFile;
    "DirEntry": Deno.DirEntry;
    "Permissions": Deno.Permissions;
    "Process": Deno.Process;
  }

  export interface DOM {
    "HTMLElement": HTMLElement;
    "SVGElement": SVGElement;
    "Element": Element;
  }

  export interface Numerics<T extends Numeric = any> {
    "Infinity": Infinity;
    "PositiveInfinity": PositiveInfinity;
    "NegativeInfinity": NegativeInfinity;
    "NaN": unknown;
    "NumericString": number | `${number}`;
    // "Integer": Integer<T>;
    // "Negative": Negative<T>;
    // "NonNegative": NonNegative<T>;
    // "Positive": NonNegative<T>;
    // "NegativeInteger": NegativeInteger<T>;
    // "NonNegativeInteger": NonNegativeInteger<T>;
    // "PositiveInteger": NonNegativeInteger<T>;
    // "Float": Float<T>;
    // "NegativeFloat": NegativeFloat<T>;
    "Zero": Zero;
  }

  export interface Streams {
    "ReadableStream": ReadableStream;
    "WritableStream": WritableStream;
    "TransformStream": TransformStream;
  }

  export interface Descriptors {
    "PropertyDescriptor": PropertyDescriptor;
    "AccessorDescriptor": AccessorDescriptor;
    "DataDescriptor": DataDescriptor;
    "ReadonlyAccessorDescriptor": ReadonlyAccessorDescriptor;
    "ReadonlyDataDescriptor": ReadonlyDataDescriptor;
  }

  export interface Misc {
    "unknown": unknown;
  }
}

export interface TypeNameMap
  extends
    TypeNameMap.Additional,
    TypeNameMap.ArrayLikes,
    TypeNameMap.DOM,
    TypeNameMap.Descriptors,
    TypeNameMap.Iterators,
    TypeNameMap.Numerics,
    TypeNameMap.Objects,
    TypeNameMap.Primitives,
    TypeNameMap.Streams,
    TypeNameMap.StructuredData,
    TypeNameMap.WebAPI,
    TypeNameMap.DenoAPI,
    TypeNameMap.Misc {
  /* extended typename map */
}

export type TypeName = keyof TypeNameMap;
export type TypeNameAlt =
  | ObjectTypeName
  | TypedArrayTypeName
  | PrimitiveTypeName;

type GetTypeNameImpl<T> = {
  [K in keyof TypeNameMap]: TypeNameMap[K] extends T ? K
    : never;
}[keyof TypeNameMap];

// type-world implementation of getTypeName()
// deno-fmt-ignore
export type GetTypeName<T> = 
  | T extends Promise<unknown> ? "Promise"
  : T extends PromiseLike<unknown> ? "PromiseLike"
  : T extends AsyncGenerator<infer _, any, any> ? "AsyncGenerator"
  : T extends () => AsyncGenerator<infer _, any, any> ? "AsyncGenerator"
  : T extends AsyncIterable<unknown> ? "AsyncIterable"
  : T extends () => AsyncIterable<unknown> ? "AsyncIterable"
  : T extends AsyncIterableIterator<unknown> ? "AsyncIterableIterator"
  : T extends () => AsyncIterableIterator<unknown> ? "AsyncIterableIterator"
  : T extends AsyncIterator<unknown> ? "AsyncIterator"
  : T extends IterableIterator<any> ? "IterableIterator"
  : T extends Iterable<any> ? "Iterable"
  : T extends Iterator<any> ? "Iterator"
  : T extends (...a: unknown[]) => Promise<unknown> ? "AsyncFunction"
  : T extends Generator<any, any, any> ? "Generator"
  : T extends () => Generator<any, any, any> ? "Generator"
  : T extends symbol ? "symbol"
  : T extends Map<unknown, unknown> ? "Map"
  : T extends WeakMap<object, unknown> ? "WeakMap"
  : T extends Set<unknown> ? "Set"
  : T extends WeakSet<object> ? "WeakSet"
  : T extends RegExp ? "RegExp"
  : T extends Date ? "Date"
  : T extends readonly unknown[] ? "ReadonlyArray"
  : T extends Class<unknown> ? "Class"
  : T extends (...a: unknown[]) => unknown ? "Function"
  : T extends object ? "Object"
  : [T] extends [never] ? "undefined"
  : GetTypeNameImpl<T> extends infer U
    ? [U] extends [never] ? TypeName : `${LastOf<U> & string}`
    : never;
