import { LANGUAGE_IDS } from "../constants/platforms.js";
import {
  LANGUAGE_SUPPORT,
  LANGUAGE_SUPPORT_MAP,
  SUPPORTED_ANALYSIS_LANGUAGES,
} from "./constants.js";

/**
 * Normalize a platform language string to an analysis language id.
 */
export const normalizeAnalysisLanguage = (raw) => {
  if (!raw || typeof raw !== "string") return LANGUAGE_IDS.OTHER;
  const s = raw.toLowerCase().trim();

  if (
    s.includes("c++") ||
    s.includes("g++") ||
    s.includes("clang++") ||
    s === "cpp" ||
    s === "cplusplus"
  ) {
    return LANGUAGE_IDS.CPP;
  }
  if (s === "c" || (/\bc\b/.test(s) && !s.includes("c++") && !s.includes("c#"))) {
    return LANGUAGE_IDS.C;
  }
  if (s.includes("python") || s.includes("pypy") || s === "py") {
    return LANGUAGE_IDS.PYTHON;
  }
  if (s.includes("javascript") || s === "js" || s.includes("node")) {
    return LANGUAGE_IDS.JAVASCRIPT;
  }
  if (s.includes("typescript") || s === "ts") return LANGUAGE_IDS.TYPESCRIPT;
  if (s.includes("java") && !s.includes("javascript")) return LANGUAGE_IDS.JAVA;
  if (s === "go" || s.includes("golang")) return LANGUAGE_IDS.GO;

  return LANGUAGE_IDS.OTHER;
};

/**
 * Heuristic sniff from source when language hint is missing/other.
 */
export const sniffLanguageFromSource = (sourceCode = "") => {
  const src = String(sourceCode);
  if (/^\s*#include\s*<|std::|int\s+main\s*\(/.test(src)) return LANGUAGE_IDS.CPP;
  if (/^\s*package\s+main\b|fmt\.Println/.test(src)) return LANGUAGE_IDS.GO;
  if (/^\s*public\s+class\b|System\.out\.println/.test(src)) return LANGUAGE_IDS.JAVA;
  if (
    /def\s+\w+\s*\(|^\s*import\s+\w+|print\s*\(/m.test(src) &&
    !/function\s+|=>/.test(src)
  ) {
    return LANGUAGE_IDS.PYTHON;
  }
  if (/function\s+|const\s+\w+\s*=|=>|console\.log/.test(src)) {
    return LANGUAGE_IDS.JAVASCRIPT;
  }
  return LANGUAGE_IDS.OTHER;
};

export const resolveLanguage = (hint, sourceCode) => {
  let language = normalizeAnalysisLanguage(hint);
  if (language === LANGUAGE_IDS.OTHER || !language) {
    language = sniffLanguageFromSource(sourceCode);
  }
  const support =
    LANGUAGE_SUPPORT_MAP[language] || LANGUAGE_SUPPORT.UNSUPPORTED;
  return {
    language,
    languageSupport: support,
    analyzable: SUPPORTED_ANALYSIS_LANGUAGES.includes(language),
  };
};
