<h1>🦕 dis</h1>

[![](https://migo.deno.dev/width=1280;height=640;pxRatio=1;bgColor=10141a;icon=deno;iconColor=papayawhip;titleColor=white;subtitleColor=white;iconY=80;iconX=950;titleFontSize=120;titleX=175;titleY=450;subtitleX=420;subtitleY=550;subtitleFontSize=48;titleTextAnchor=left;subtitleTextAnchor=left/dis/https://deno.land/x/dis.png)](https://deno.land/x/dis)

Originally by [**Sindre Sorhus**](https://github.com/sindresorhus/is) for Node,
ported by [**Nicholas Berlette**](https://github.com/nberlette) for Deno.

---

## Usage

```ts
import * as is from "https://deno.land/x/dis@0.0.0/mod.ts";
```

### Type Checking

```ts
is("🦕");
// 'string'

is(new Map());
// 'Map'

is.number(6);
// true
```

### Assertions

[Assertions](#type-assertions) perform the same type checks, but throw an error
if the type does not match.

```ts
import { assert } from "https://deno.land/x/dis@0.0.0/mod.ts";

assert.string(2);
// => Error: Expected value which is `string`, received value of type `number`.
```

### Assertions with TypeScript

```ts
import { assert } from "https://deno.land/x/dis@0.0.0/mod.ts";

assert.string(foo);
// `foo` is now typed as a `string`.
```

## Highlights

- Written in TypeScript, for Deno and Deno Deploy
- [Extensive use of type guards](#type-guards)
- [Supports type assertions](#type-assertions)
- [Aware of generic type parameters](#generic-type-parameters) (use with
  caution)
- Actively maintained

---

# API

## is(value)

Attempts to ascertain the type of the value it receives. Accepts only one
argument.

```ts
is("🦕");
// 'string'

is(new Map());
// 'Map'
```

> **Returns**: the type of `value`.

## `is.{method}`

All the below methods accept a value and returns a boolean for whether the value
is of the desired type.

```ts
is.number(6);
// true

is.undefined(true);
// false
```

---

## Primitives

> **Note**: Primitives are **lowercase** and object types are **camelCase**.

<details><summary><strong>Examples of Primitives</strong></summary>

---

- `'undefined'`
- `'null'`
- `'string'`
- `'symbol'`
- `'Array'`
- `'Function'`
- `'Object'`

> **Note**: It will throw an error if you try to feed it object-wrapped
> primitives, as that's a bad practice (e.g. `new String('foo')`)

</details>

<details open><summary><strong>API Methods</strong></summary>

---

### undefined

```ts
is.undefined(value);
```

### null

```ts
is.null(value);
```

> **Note**: TypeScript users must use `.null_()` because of a TypeScript naming
> limitation.

### string

```ts
is.string(value);
```

### number

```ts
is.number(value);
```

> **Note:** `is.number(NaN)` returns `false`. This intentionally deviates from
> `typeof` behavior to increase user-friendliness of `is` type checks.

### boolean

```ts
is.boolean(value);
```

### symbol

```ts
is.symbol(value);
```

### bigint

```ts
is.bigint(value);
```

</details>

---

## Builtins

<details open><summary><strong>API Methods</strong></summary>

---

### array

```ts
is.array(value, assertion?)
```

> **Returns**: true if `value` is an array and all of its items match the
> assertion (if provided).

#### Examples

```ts
is.array(value); // Validate `value` is an array.
is.array(value, is.number); // Validate `value` is an array and all of its items are numbers.
```

### function

```ts
is.function(value);
```

> **Note**: TypeScript users must use `.function_()` because of a TypeScript
> naming limitation.

### buffer

```ts
is.buffer(value);
```

### blob

```ts
is.blob(value);
```

### object

```ts
is.object(value);
```

> **Important**: Keep in mind that
> [functions are objects too](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions).

### numericString

```ts
is.numericString(value);
```

> **Returns**: `true` for a string that represents a number satisfying
> `is.number`, for example, `'42'` and `'-8.3'`.

> **Important**: `'NaN'` returns `false`, but `'Infinity'` and `'-Infinity'`
> return `true`.

### regExp

```ts
is.regExp(value);
```

### date

```ts
is.date(value);
```

### error

```ts
is.error(value);
```

### nativePromise

```ts
is.nativePromise(value);
```

### promise

```ts
is.promise(value);
```

> **Returns**: `true` for any object with a `.then()` and `.catch()` method.
> Prefer this one over `.nativePromise()` as you usually want to allow userland
> promise implementations too.

### generator

```ts
is.generator(value);
```

> **Returns**: `true` for any object that implements its own `.next()` and
> `.throw()` methods and has a function definition for `Symbol.iterator`.

### generatorFunction

```ts
is.generatorFunction(value);
```

### asyncFunction

```ts
is.asyncFunction(value);
```

> **Returns**: `true` for any `async` function that can be called with the
> `await` operator.

#### Examples

```ts
is.asyncFunction(async () => {});
// true

is.asyncFunction(() => {});
// false
```

### asyncGenerator

```ts
is.asyncGenerator(value);
```

#### Examples

```ts
is.asyncGenerator(
  (async function* () {
    yield 4;
  })(),
);
// true

is.asyncGenerator(
  (function* () {
    yield 4;
  })(),
);
// false
```

### asyncGeneratorFunction

```ts
is.asyncGeneratorFunction(value);
```

#### Examples

```ts
is.asyncGeneratorFunction(async function* () {
  yield 4;
});
// true

is.asyncGeneratorFunction(function* () {
  yield 4;
});
// false
```

### boundFunction

```ts
is.boundFunction(value);
```

> **Returns**: `true` for any `bound` function.

```ts
is.boundFunction(() => {});
// true

is.boundFunction(function () {}.bind(null));
// true

is.boundFunction(function () {});
// false
```

### map

```ts
is.map(value);
```

### set

```ts
is.set(value);
```

### weakMap

```ts
is.weakMap(value);
```

### weakSet

```ts
is.weakSet(value);
```

### weakRef

```ts
is.weakRef(value);
```

</details>

---

## TypedArrays

<details open><summary><strong>API Methods</strong></summary>

---

### int8Array

```ts
is.int8Array(value);
```

### uint8Array

```ts
is.uint8Array(value);
```

### uint8ClampedArray

```ts
is.uint8ClampedArray(value);
```

### int16Array

```ts
is.int16Array(value);
```

### uint16Array

```ts
is.uint16Array(value);
```

### int32Array

```ts
is.int32Array(value);
```

### uint32Array

```ts
is.uint32Array(value);
```

### float32Array

```ts
is.float32Array(value);
```

### float64Array

```ts
is.float64Array(value);
```

### bigInt64Array

```ts
is.bigInt64Array(value);
```

### bigUint64Array

```ts
is.bigUint64Array(value);
```

</details>

---

## Structured Data

<details open><summary><strong>API Methods</strong></summary>

---

### arrayBuffer

```ts
is.arrayBuffer(value);
```

### sharedArrayBuffer

```ts
is.sharedArrayBuffer(value);
```

### dataView

```ts
is.dataView(value);
```

### enumCase

```ts
is.enumCase(value, enum)
```

> **Note**: **TypeScript-only**. Returns `true` if `value` is a member of
> `enum`.

```ts
enum Direction {
  Ascending = "ascending",
  Descending = "descending",
}
is.enumCase("ascending", Direction);
// true
is.enumCase("other", Direction);
// false
```

</details>

---

## Emptiness

<details open><summary><strong>API Methods</strong></summary>

---

### emptyString

```ts
is.emptyString(value);
```

> **Returns**: `true` if the value is a `string` and the `.length` is 0.

### emptyStringOrWhitespace

```ts
is.emptyStringOrWhitespace(value);
```

> **Returns**: `true` if `is.emptyString(value)` or if it's a `string` that is
> all whitespace.

### nonEmptyString

```ts
is.nonEmptyString(value);
```

> **Returns**: `true` if the value is a `string` and the `.length` is more
> than 0.

### nonEmptyStringAndNotWhitespace

```ts
is.nonEmptyStringAndNotWhitespace(value);
```

> **Returns**: `true` if the value is a `string` that is not empty and not
> whitespace.

```ts
const values = ["property1", "", null, "property2", "    ", undefined];
values.filter(is.nonEmptyStringAndNotWhitespace);
// ['property1', 'property2']
```

### emptyArray

```ts
is.emptyArray(value);
```

> **Returns**: `true` if the value is an `Array` and the `.length` is 0.

### nonEmptyArray

```ts
is.nonEmptyArray(value);
```

> **Returns**: `true` if the value is an `Array` and the `.length` is more
> than 0.

### emptyObject

```ts
is.emptyObject(value);
```

> **Returns**: `true` if the value is an `Object` and
> `Object.keys(value).length` is 0.

> **Note**: `Object.keys` returns only own enumerable properties. Hence
> something like this can happen:

```ts
const object1 = {};
Object.defineProperty(object1, "property1", {
  value: 42,
  writable: true,
  enumerable: false,
  configurable: true,
});
is.emptyObject(object1);
// true
```

### nonEmptyObject

```ts
is.nonEmptyObject(value);
```

> **Returns**: `true` if the value is an `Object` and
> `Object.keys(value).length` is more than 0.

### emptySet

```ts
is.emptySet(value);
```

> **Returns**: `true` if the value is a `Set` and the `.size` is 0.

### nonEmptySet

```ts
is.nonEmptySet(Value);
```

> **Returns**: `true` if the value is a `Set` and the `.size` is more than 0.

### emptyMap

```ts
is.emptyMap(value);
```

> **Returns**: `true` if the value is a `Map` and the `.size` is 0.

### nonEmptyMap

```ts
is.nonEmptyMap(value);
```

> **Returns**: `true` if the value is a `Map` and the `.size` is more than 0.

</details>

---

## Everything Else

<details open><summary><strong>API Methods</strong></summary>

---

### directInstanceOf

```ts
is.directInstanceOf(value, class)
```

> **Returns**: `true` if `value` is a direct instance of `class`.

```ts
is.directInstanceOf(new Error(), Error);
// true
class UnicornError extends Error {}
is.directInstanceOf(new UnicornError(), Error);
// false
```

### urlInstance

```ts
is.urlInstance(value);
```

> **Returns**: `true` if `value` is an instance of the
> [`URL` class](https://mdn.io/URL).

```ts
const url = new URL("https://example.com");
is.urlInstance(url);
// true
```

### urlString

```ts
is.urlString(value);
```

> **Returns**: `true` if `value` is a URL string.

Note: this only does basic checking using the [`URL` class](https://mdn.io/URL)
constructor.

```ts
const url = "https://example.com";
is.urlString(url);
// true
is.urlString(new URL(url));
// false
```

### truthy

```ts
is.truthy(value);
```

> **Returns**: `true` for all values that evaluate to true in a boolean context:

```ts
is.truthy("🦕");
// true
is.truthy(undefined);
// false
```

### falsy

```ts
is.falsy(value);
```

> **Returns**: `true` if `value` is one of: `false`, `0`, `''`, `null`,
> `undefined`, `NaN`.

### NaN

```ts
is.nan(value);
```

### nullOrUndefined

```ts
is.nullOrUndefined(value);
```

### primitive

```ts
is.primitive(value);
```

JavaScript primitives are as follows: `null`, `undefined`, `string`, `number`,
`boolean`, `symbol`.

### integer

```ts
is.integer(value);
```

### safeInteger

```ts
is.safeInteger(value);
```

> **Returns**: `true` if `value` is a
> [safe integer](https://mdn.io/isSafeInteger).

### plainObject

```ts
is.plainObject(value);
```

An object is plain if it's created by either `{}`, `new Object()`, or
`Object.create(null)`.

### iterable

```ts
is.iterable(value);
```

### asyncIterable

```ts
is.asyncIterable(value);
```

### class

```ts
is.class(value);
```

> **Returns**: `true` for instances created by a class.

**Note:** TypeScript users must use `.class_()` because of a TypeScript naming
limitation.

### typedArray

```ts
is.typedArray(value);
```

### arrayLike

```ts
is.arrayLike(value);
```

A `value` is array-like if it is not a function and has a `value.length` that is
a safe integer greater than or equal to 0.

```ts
is.arrayLike(document.forms);
// true

function foo() {
  is.arrayLike(arguments);
  // true
}
foo();
```

### inRange

```ts
is.inRange(value, range);
```

Check if `value` (number) is in the given `range`. The range is an array of two
values, lower bound and upper bound, in no specific order.

```ts
is.inRange(3, [0, 5]);
is.inRange(3, [5, 0]);
is.inRange(0, [-2, 2]);
```

### inRange

```ts
is.inRange(value, upperBound);
```

Check if `value` (number) is in the range of `0` to `upperBound`.

```ts
is.inRange(3, 10);
```

### domElement

```ts
is.domElement(value);
```

> **Returns**: `true` if `value` is a DOM Element.

### nodeStream

```ts
is.nodeStream(value);
```

> **Returns**: `true` if `value` is a Node.js
> [stream](https://nodejs.org/api/stream.html).

```ts
import fs from "node:fs";
is.nodeStream(fs.createReadStream("unicorn.png"));
// true
```

### observable

```ts
is.observable(value);
```

> **Returns**: `true` if `value` is an `Observable`.

```ts
import { Observable } from "rxjs";
is.observable(new Observable());
// true
```

### infinite

```ts
is.infinite(value);
```

Check if `value` is `Infinity` or `-Infinity`.

### evenInteger

```ts
is.evenInteger(value);
```

> **Returns**: `true` if `value` is an even integer.

### oddInteger

```ts
is.oddInteger(value);
```

> **Returns**: `true` if `value` is an odd integer.

### propertyKey

```ts
is.propertyKey(value);
```

> **Returns**: `true` if `value` can be used as an object property key (either
> `string`, `number`, or `symbol`).

### formData

```ts
is.formData(value);
```

> **Returns**: `true` if `value` is an instance of the
> [`FormData` class](https://developer.mozilla.org/en-US/docs/Web/API/FormData).

```ts
const data = new FormData();
is.formData(data);
// true
```

### urlSearchParams

```ts
is.urlSearchParams(value);
```

> **Returns**: `true` if `value` is an instance of the
> [`URLSearchParams` class](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).

```ts
const searchParams = new URLSearchParams();
is.urlSearchParams(searchParams);
// true
```

### any

```ts
is.any(predicate | predicate[], ...values)
```

Using a single `predicate` argument, returns `true` if **any** of the input
`values` returns true in the `predicate`:

```ts
is.any(is.string, {}, true, "🦕");
// true
is.any(is.boolean, "denosaurs", [], new Map());
// false
```

Using an array of `predicate[]`, returns `true` if **any** of the input `values`
returns true for **any** of the `predicates` provided in an array:

```ts
is.any([is.string, is.number], {}, true, "🦕");
// true
is.any([is.boolean, is.number], "denosaurs", [], new Map());
// false
```

### all

```ts
is.all(predicate, ...values);
```

> **Returns**: `true` if **all** of the input `values` returns true in the
> `predicate`:

```ts
is.all(is.object, {}, new Map(), new Set());
// true
is.all(is.string, "🦕", [], "denosaurs");
// false
```

</details>

---

## Type Guards

When using `is` together with TypeScript,
[type guards](http://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types)
are being used extensively to infer the correct type inside if-else statements.

<details open><summary><strong>Examples</strong></summary>

---

```ts
import is from "https://deno.land/x/dis@0.0.0/mod.ts";
const padLeft = (value: string, padding: string | number) => {
  if (is.number(padding)) {
    // `padding` is typed as `number`
    return Array(padding + 1).join(" ") + value;
  }

  if (is.string(padding)) {
    // `padding` is typed as `string`
    return padding + value;
  }

  throw new TypeError(
    `Expected 'padding' to be of type 'string' or 'number', got '${
      is(padding)
    }'.`,
  );
};
padLeft("🦕", 3);
// '   🦕'

padLeft("🦕", "🌈");
// '🌈🦕'
```

</details>

---

## Type Assertions

The type guards are also available as
[type assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions),
which throw an error for unexpected types. It is a convenient one-line version
of the often repetitive `"if-not-expected-type-throw"` pattern.

<details open><summary><strong>Examples</strong></summary>

---

```ts
import { assert } from "https://deno.land/x/dis@0.0.0/mod.ts";

const handleMovieRatingApiResponse = (response: unknown) => {
  assert.plainObject(response);
  // `response` is now typed as a plain `object` with `unknown` properties.

  assert.number(response.rating);
  // `response.rating` is now typed as a `number`.

  assert.string(response.title);
  // `response.title` is now typed as a `string`.

  return `${response.title} (${response.rating * 10})`;
};
handleMovieRatingApiResponse({ rating: 0.87, title: "The Matrix" });
// 'The Matrix (8.7)'

// This throws an error.
handleMovieRatingApiResponse({ rating: "🦕" });
```

</details>

---

## Generic type parameters

<details open><summary><strong>More Information</strong></summary>

---

---

The type guards and type assertions are aware of
[generic type parameters](https://www.typescriptlang.org/docs/handbook/generics.html),
such as `Promise<T>` and `Map<Key, Value>`. The default is `unknown` for most
cases, since `is` cannot check them at runtime. If the generic type is known at
compile-time, either implicitly (inferred) or explicitly (provided), `is`
propagates the type so it can be used later.

Use generic type parameters with caution. They are only checked by the
TypeScript compiler, and not checked by `is` at runtime. This can lead to
unexpected behavior, where the generic type is _assumed_ at compile-time, but
actually is something completely different at runtime. It is best to use
`unknown` (default) and type-check the value of the generic type parameter at
runtime with `is` or `assert`.

</details>
<details open><summary><strong>Examples</strong></summary>

---

```ts
import { assert } from "https://deno.land/x/dis@0.0.0/mod.ts";
async function badNumberAssumption(input: unknown) {
  // Bad assumption about the generic type parameter fools the compile-time type system.
  assert.promise<number>(input);
  // `input` is a `Promise` but only assumed to be `Promise<number>`.
  const resolved = await input;
  // `resolved` is typed as `number` but was not actually checked at runtime.
  // Multiplication will return NaN if the input promise did not actually contain a number.
  return 2 * resolved;
}
async function goodNumberAssertion(input: unknown) {
  assert.promise(input);
  // `input` is typed as `Promise<unknown>`
  const resolved = await input;
  // `resolved` is typed as `unknown`
  assert.number(resolved);
  // `resolved` is typed as `number`
  // Uses runtime checks so only numbers will reach the multiplication.
  return 2 * resolved;
}
badNumberAssumption(Promise.resolve("An unexpected string"));
// NaN
// This correctly throws an error because of the unexpected string value.
goodNumberAssertion(Promise.resolve("An unexpected string"));
```

</details>

---

## Frequently Asked Questions

<details>
<summary><strong>Why yet another type checking module?</strong></summary>

---

There are hundreds of type checking modules on npm, unfortunately, I couldn't
find any that fit my needs:

- Includes both type methods and ability to get the type
- Types of primitives returned as lowercase and object types as camelcase
- Covers all built-ins
- Unsurprising behavior
- Well-maintained
- Comprehensive test suite

For the ones I found, pick 3 of these.

The most common mistakes I noticed in these modules was using `instanceof` for
type checking, forgetting that functions are objects, and omitting `symbol` as a
primitive.

</details>

<details><summary><strong>Why not just use `instanceof` instead of this package?</strong></summary>

---

`instanceof` does not work correctly for all types and it does not work across
[realms](https://stackoverflow.com/a/49832343/64949). Examples of realms are
iframes, windows, web workers, and the `vm` module in Node.js.

</details>

---

**MIT License**. Originally by
[**Sindre Sorhus**](https://github.com/sindresorhus/is). Ported by
[**Nicholas Berlette**](https://github.com/nberlette) for Deno.
