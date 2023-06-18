import { is } from "../mod.ts";
import "./deps.ts";

const { assign, freeze } = Object;

describe("is(value: unknown) => TypeName", () => {
  it("should accurately return primitive type names", () =>
    ([
      ["string", "string"],
      [0o644, "number"],
      [true, "boolean"],
      [0o644n, "bigint"],
      [Symbol(), "symbol"],
    ] as const).forEach(
      ([input, output]) => assertStrictEquals(is(input as any), output),
    ));

  it("should differentiate 'null' and 'undefined'", () => {
    assertEquals(is(null), "null");
    assertEquals(is(undefined), "undefined");
  });

  it(
    "should differentiate 'number' and NaN",
    () => assertEquals(is(NaN), "NaN"),
  );

  it(
    "should differentiate 'number' and Infinity",
    () => assertEquals(is(Infinity), "Infinity"),
  );

  it("can identify TemplateStringsArray (new)", () => {
    const tsa: TemplateStringsArray = assign(
      ["hello ", "world"],
      freeze({ raw: ["hello ", "world"] }),
    );
    assert(is.templateStringsArray(tsa));
    assertEquals(is(tsa), "TemplateStringsArray");
  });

  it(
    "can identify ArrayLike objects",
    () => assertEquals(is(freeze({ "length": 1, "0": "hello!" })), "ArrayLike"),
  );

  it(
    "should identify functions as 'Function'",
    () => assertEquals(is(() => {}), "Function"),
  );

  it(
    "should identify async functions as 'AsyncFunction'",
    () => assertEquals(is(async () => {}), "AsyncFunction"),
  );
});
