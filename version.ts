import { $, ansi } from "./deps.ts";

/** `VERSION` managed by https://deno.land/x/publish */
export const VERSION = "0.0.1";
export const MODULE = "dis";

/** `prepublish` will be invoked before publish */
export async function prepublish(version: string) {
  for await (const file of $.fs.expandGlob("./*.{md,ts}")) {
    if (file.isFile) await bump(file.path, version);
  }
}

/** `postpublish` will be invoked after publish */
export function postpublish(version: string) {
  console.log(
    ansi.brightGreen(
      ` ✓ published ${ansi.bold(ansi.underline(`dis@${version}`))}`,
    ),
  );
}

export async function bump(path: string, version: string, prev = VERSION) {
  const filename = $.path.basename(path);
  const _dirname = $.path.dirname(path);

  try {
    const TAG = "VERSION";
    const PLACEHOLDERS = `\{${TAG}\}|\{\{${TAG}\}\}|\$${TAG}|${VERSION}`;
    const SPECIFIER_RE = new RegExp(
      `(?<=(?:^|[/"'\s])${MODULE}[@])(${PLACEHOLDERS}|[^/"'\s]+)(?=$|[/"'\s])`,
      "mig",
    );
    let content = await Deno.readTextFile(path);

    if (SPECIFIER_RE.test(content)) {
      content = content.replaceAll(SPECIFIER_RE, version),
        await Deno.writeTextFile(path, content).catch(console.error);
    }
  } catch (error) {
    console.error(
      ansi.bgRed(" FAILED "),
      `⚠︎ Unable to bump ${ansi.underline(ansi.red(filename))} from ${
        ansi.underline(prev)
      } to ${ansi.bold(version)}!\n\n${error}`,
    );
  }
}
