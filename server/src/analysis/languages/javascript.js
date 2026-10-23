import parser from "@babel/parser";
import { SYNTAX_STATUS } from "../constants.js";

/**
 * Parse JavaScript/TypeScript with @babel/parser.
 * Static only — never evaluates the AST.
 */
export const parseJavaScript = (sourceCode, { typescript = false } = {}) => {
  try {
    const ast = parser.parse(String(sourceCode), {
      sourceType: "unambiguous",
      errorRecovery: false,
      plugins: typescript
        ? ["typescript", "jsx"]
        : ["jsx", "classProperties", "optionalChaining", "nullishCoalescingOperator"],
    });
    return {
      syntaxStatus: SYNTAX_STATUS.VALID,
      astSummary: {
        type: ast.type,
        programBodyLength: ast.program?.body?.length ?? 0,
      },
      error: null,
    };
  } catch (error) {
    return {
      syntaxStatus: SYNTAX_STATUS.INVALID,
      astSummary: null,
      error: String(error.message || "Parse error").slice(0, 300),
    };
  }
};
