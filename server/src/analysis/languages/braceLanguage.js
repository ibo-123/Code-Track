import { SYNTAX_STATUS } from "../constants.js";

/**
 * Lightweight brace balance check for C-family / Go / Java.
 * Not a full parser — marks support as partial at the pipeline level.
 */
export const checkBraceBalance = (sourceCode) => {
  const src = String(sourceCode);
  let curly = 0;
  let paren = 0;
  let square = 0;
  let inLine = false;
  let inBlock = false;
  let inStr = null;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];

    if (inLine) {
      if (ch === "\n") inLine = false;
      continue;
    }
    if (inBlock) {
      if (ch === "*" && next === "/") {
        inBlock = false;
        i++;
      }
      continue;
    }
    if (inStr) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }

    if (ch === "/" && next === "/") {
      inLine = true;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlock = true;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }

    if (ch === "{") curly++;
    if (ch === "}") curly--;
    if (ch === "(") paren++;
    if (ch === ")") paren--;
    if (ch === "[") square++;
    if (ch === "]") square--;
    if (curly < 0 || paren < 0 || square < 0) {
      return {
        syntaxStatus: SYNTAX_STATUS.INVALID,
        error: "Unbalanced brackets detected",
      };
    }
  }

  if (curly !== 0 || paren !== 0 || square !== 0) {
    return {
      syntaxStatus: SYNTAX_STATUS.INVALID,
      error: "Unbalanced brackets at end of file",
    };
  }

  return { syntaxStatus: SYNTAX_STATUS.VALID, error: null };
};
