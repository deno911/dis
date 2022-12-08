export const ansi = (s: string, pre = 1, post = 22) =>
  `\x1b[${pre}m${s}\x1b[${post}m`;

ansi.bold = (s: string) => ansi(s, 1, 22);
ansi.dim = (s: string) => ansi(s, 2, 22);
ansi.italic = (s: string) => ansi(s, 3, 23);
ansi.underline = (s: string) => ansi(s, 4, 24);
ansi.inverse = (s: string) => ansi(s, 7, 27);
ansi.hidden = (s: string) => ansi(s, 8, 28);
ansi.strikethrough = (s: string) => ansi(s, 9, 29);
ansi.reset = (s: string) => ansi(s, 0, 0);
