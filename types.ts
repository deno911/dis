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

export * from "./_util/types.d.ts";
export * from "./_util/typenames.ts";

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
}
