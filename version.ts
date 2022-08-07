import * as ansi from "https://deno.land/std@0.151.0/fmt/colors.ts";

/** `VERSION` managed by https://deno.land/x/publish */
export const VERSION = "0.0.1"
export const MODULE = "dis";

/** `prepublish` will be invoked before publish */
export async function prepublish(version: string) {
  for (const filename of [
    "README.md",
    "mod.ts",
  ]) {
    await bump(filename, version)
  }

  return false;
}

/** `prepublish` will be invoked after publish */
export function postpublish(version: string) {
  console.log(
    ansi.bgGreen(" SUCCESS "),
    ` ✓ published ${ansi.bold(ansi.underline(MODULE + "@" + version))}`,
  );
}

async function bump(filename: string, version: string) {
  try {
    const module_regex = new RegExp(
      `(?<=[/"'\s](${MODULE})[@]([{]{1,2}VERSION[}]{1,2}|\$VERSION|[^/"'\s]+)(?=[/"'\s])`,
      "ig",
    );
    const content = await Deno.readTextFile(filename);

    await Deno.writeTextFile(
      filename,
      content.replace(module_regex, `$1@${version}`),
    );
  } catch (e) {
    console.error(
      ansi.bgRed(" FAILED "),
      `⚠︎ could not update ${ansi.underline(ansi.italic(filename))} to ${
        ansi.bold(version)
      }!\n\n${e}`,
    );
  }
}
