/** Shared Prettier config — canonical source lives here (packages/config);
    the repo-root prettier.config.mjs re-exports it. */
export default {
  printWidth: 100,
  singleQuote: false,
  trailingComma: "all",
  arrowParens: "always",
  endOfLine: "lf",
};
