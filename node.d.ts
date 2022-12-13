declare namespace NodeJS {
  export type Buffer = import("./deps.ts").NodeBuffer;
  export const Buffer: Buffer;

  export type EventEmitter = import("./deps.ts").NodeEventEmitter;
  export const EventEmitter: EventEmitter;

  export type Readable = import("./deps.ts").NodeReadable;
  export const Readable: Readable;

  export type Writable = import("./deps.ts").NodeWritable;
  export const Writable: Writable;

  export type Stream = import("./deps.ts").NodeStream;
  export const Stream: Stream;

  export type ReadableStream = Readable & { readonly readable: true };
  export const ReadableStream: ReadableStream;

  export type WritableStream = Writable & { readonly writable: true };
  export const WritableStream: WritableStream;

  export interface Streams extends EventEmitter {
    pipe<T extends Writable>(
      destination: T,
      options?: { end?: boolean },
    ): T;
  }
  export const Streams: Streams;
}

declare interface SymbolConstructor {
  readonly observable: symbol;
}

// deno-lint-ignore ban-types
declare interface WeakRef<T extends object> {
  readonly [Symbol.toStringTag]: "WeakRef";
  deref(): T | undefined;
}

/**
 * Matches a value that is like an Observable.
 * @see https://github.com/tc39/proposal-observable
 */
declare interface ObservableLike {
  subscribe(observer: (value: unknown) => void): void;
  [Symbol.observable](): ObservableLike;
}

declare type Falsy = false | 0 | 0n | "" | null | undefined;

interface SymbolConstructor {
  /**
   * A method that describes the object as `Observable` and returns an object
   * with a `subscribe` method. That method accepts an `observer` for its
   * single argument, which in turn accepts a arbitrary `value` argument. The
   * subscribe method may return an `unsubscribe` method to run as a cleanup
   * or teardown routine when the observable is disposed.
   *
   * @see https://github.com/tc39/proposal-observable for more details.
   * @see {@linkcode ObservableLike} for the interface this matches.
   */
  readonly observable: unique symbol;
}

/**
 * Matches a value that is like an Observable.
 * @see https://github.com/tc39/proposal-observable
 */
interface ObservableLike {
  subscribe(observer: (value: unknown) => void): void;
  [Symbol.observable](): ObservableLike;
}

/**
 * The "Printable" Primitives - `string`, `number`, `boolean`, `bigint` - are
 * the subset of the Primitive types that can be printed in Template Literal
 * types (a feature of TypeScript 4.1+).
 *
 * _Technically_ `null` and `undefined` are also printable, but only as the
 * literal strings `"null"` and `"undefined"`, respectively. As such, they
 * are not included in this type.
 *
 * @see {@linkcode MaybePrintable} if you need to include `null` and `undefined` in the Printable type for your use case.
 */
declare type Printable = NonNullable<Exclude<Primitive, symbol>>;

declare type MaybePrintable = Exclude<Primitive, symbol>;
