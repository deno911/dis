import type { Buffer } from "https://deno.land/std@0.151.0/io/buffer.ts";

export declare namespace NodeJS {
  export type Buffer =
    import("https://deno.land/std@0.151.0/node/buffer.ts").Buffer;
  export type EventEmitter =
    import("https://deno.land/std@0.151.0/node/events.ts").EventEmitter;
  export type Readable =
    import("https://deno.land/std@0.151.0/node/stream.ts").Readable;
  export type Writable =
    import("https://deno.land/std@0.151.0/node/stream.ts").Writable;
  export type Stream =
    import("https://deno.land/std@0.151.0/node/stream.ts").Stream;
  export type ReadableStream = Readable & {
    readonly readable: true;
  };
  export type WritableStream = Writable & {
    readonly writable: true;
  };
  export interface Streams extends EventEmitter {
    pipe<T extends Writable>(
      destination: T,
      options?: { end?: boolean },
    ): T;
  }
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

/**
 * Matches a `class` constructor.
 * @see https://mdn.io/Classes.
 */
export type Class<T = unknown, Arguments extends any[] = any[]> = new (
  ...arguments_: Arguments
) => T;

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

export type Falsey = false | 0 | 0n | "" | null | undefined;

export interface WeakRef<T extends object> {
  readonly [Symbol.toStringTag]: "WeakRef";
  deref(): T | undefined;
}
