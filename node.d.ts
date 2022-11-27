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
