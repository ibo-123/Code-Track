import { createHash } from "crypto";
import {
  ANALYSIS_STATUS,
  LANGUAGE_SUPPORT,
  SYNTAX_STATUS,
} from "./constants.js";
import { ANALYZER_VERSION, MAX_SOURCE_BYTES } from "./version.js";
import { resolveLanguage } from "./identifyLanguage.js";
import { scanStructure } from "./scanStructure.js";
import { detectPatterns } from "./detectPatterns.js";
import { estimateComplexity } from "./estimateComplexity.js";
import { detectFindings } from "./detectFindings.js";
import { generateSuggestions } from "./generateSuggestions.js";
import { parseJavaScript } from "./languages/javascript.js";
import { checkBraceBalance } from "./languages/braceLanguage.js";

export const hashSource = (sourceCode) =>
  createHash("sha256").update(String(sourceCode), "utf8").digest("hex");

/**
 * Core analysis entry point — pure function over source text.
 * Never executes user code.
 *
 * @param {string} sourceCode
 * @param {string} [languageHint]
 * @param {object} [options]
 */
export const analyzeSubmission = (sourceCode, languageHint = null, options = {}) => {
  const startedAt = new Date();
  const limitations = [];

  if (sourceCode == null || String(sourceCode).trim() === "") {
    return {
      analyzerVersion: ANALYZER_VERSION,
      status: ANALYSIS_STATUS.FAILED,
      language: null,
      languageSupport: LANGUAGE_SUPPORT.UNSUPPORTED,
      syntaxStatus: SYNTAX_STATUS.UNKNOWN,
      sourceHash: null,
      detectedAlgorithms: [],
      detectedDataStructures: [],
      timeComplexity: null,
      spaceComplexity: null,
      findings: [],
      suggestions: [],
      limitations: ["Source code is empty or missing"],
      errorCode: "SOURCE_MISSING",
      startedAt,
      completedAt: new Date(),
    };
  }

  const source = String(sourceCode);
  if (Buffer.byteLength(source, "utf8") > MAX_SOURCE_BYTES) {
    return {
      analyzerVersion: ANALYZER_VERSION,
      status: ANALYSIS_STATUS.FAILED,
      language: null,
      languageSupport: LANGUAGE_SUPPORT.UNSUPPORTED,
      syntaxStatus: SYNTAX_STATUS.UNKNOWN,
      sourceHash: hashSource(source),
      detectedAlgorithms: [],
      detectedDataStructures: [],
      timeComplexity: null,
      spaceComplexity: null,
      findings: [],
      suggestions: [],
      limitations: [
        `Source exceeds limit of ${MAX_SOURCE_BYTES} bytes`,
      ],
      errorCode: "SOURCE_TOO_LARGE",
      startedAt,
      completedAt: new Date(),
    };
  }

  const sourceHash = hashSource(source);
  const { language, languageSupport, analyzable } = resolveLanguage(
    languageHint || options.language,
    source
  );

  if (!analyzable) {
    return {
      analyzerVersion: ANALYZER_VERSION,
      status: ANALYSIS_STATUS.FAILED,
      language,
      languageSupport: LANGUAGE_SUPPORT.UNSUPPORTED,
      syntaxStatus: SYNTAX_STATUS.UNKNOWN,
      sourceHash,
      detectedAlgorithms: [],
      detectedDataStructures: [],
      timeComplexity: null,
      spaceComplexity: null,
      findings: [],
      suggestions: [],
      limitations: [
        `Language "${language}" is not supported by analyzer ${ANALYZER_VERSION}`,
      ],
      errorCode: "LANGUAGE_UNSUPPORTED",
      startedAt,
      completedAt: new Date(),
    };
  }

  // Syntax stage
  let syntaxStatus = SYNTAX_STATUS.UNKNOWN;
  let syntaxError = null;

  if (language === "javascript" || language === "typescript") {
    const parsed = parseJavaScript(source, {
      typescript: language === "typescript",
    });
    syntaxStatus = parsed.syntaxStatus;
    syntaxError = parsed.error;
  } else if (language === "python") {
    // Indentation / colon heuristics only
    const openColon = (source.match(/:\s*$/gm) || []).length;
    syntaxStatus =
      openColon >= 0 ? SYNTAX_STATUS.UNKNOWN : SYNTAX_STATUS.UNKNOWN;
    limitations.push(
      "Python analysis uses structural heuristics without a full AST parser"
    );
  } else {
    const braced = checkBraceBalance(source);
    syntaxStatus = braced.syntaxStatus;
    syntaxError = braced.error;
    limitations.push(
      `${language} analysis uses brace-balance + pattern heuristics (partial support)`
    );
  }

  if (syntaxStatus === SYNTAX_STATUS.INVALID) {
    return {
      analyzerVersion: ANALYZER_VERSION,
      status: ANALYSIS_STATUS.FAILED,
      language,
      languageSupport,
      syntaxStatus,
      sourceHash,
      detectedAlgorithms: [],
      detectedDataStructures: [],
      timeComplexity: null,
      spaceComplexity: null,
      findings: [],
      suggestions: [],
      limitations: [
        ...limitations,
        "Syntax validation failed; complexity was not estimated",
      ],
      errorCode: "SYNTAX_INVALID",
      errorMessage: syntaxError,
      startedAt,
      completedAt: new Date(),
    };
  }

  if (languageSupport === LANGUAGE_SUPPORT.PARTIAL) {
    limitations.push(
      "Language support is partial — detections are heuristic and may miss or over-approximate patterns"
    );
  }

  const structure = scanStructure(source, language);
  const { algorithms, dataStructures } = detectPatterns(
    source,
    language,
    structure
  );
  const { timeComplexity, spaceComplexity } = estimateComplexity(structure, {
    algorithms,
    dataStructures,
  });
  const findings = detectFindings(source, language, structure);
  const suggestions = generateSuggestions({
    algorithms,
    dataStructures,
    timeComplexity,
    findings,
    structure,
  });

  if (timeComplexity?.worstCase === "unknown") {
    limitations.push("Time complexity could not be determined reliably");
  }

  const status =
    limitations.length > 0 || languageSupport === LANGUAGE_SUPPORT.PARTIAL
      ? ANALYSIS_STATUS.PARTIAL
      : ANALYSIS_STATUS.COMPLETED;

  return {
    analyzerVersion: ANALYZER_VERSION,
    status,
    language,
    languageSupport,
    syntaxStatus,
    sourceHash,
    detectedAlgorithms: algorithms,
    detectedDataStructures: dataStructures,
    timeComplexity,
    spaceComplexity,
    findings,
    suggestions,
    limitations,
    errorCode: null,
    startedAt,
    completedAt: new Date(),
  };
};

export { ANALYZER_VERSION, MAX_SOURCE_BYTES };
