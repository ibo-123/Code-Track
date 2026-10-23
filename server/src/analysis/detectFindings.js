import { SEVERITY } from "./constants.js";

/**
 * Conservative rule-based quality findings.
 * Prefer potential issues over definite bugs.
 */

export const detectFindings = (sourceCode, language, structure) => {
  const findings = [];
  const src = String(sourceCode || "");
  const lines = src.split(/\r?\n/);

  const add = (f) =>
    findings.push({
      ruleId: f.ruleId,
      severity: f.severity,
      title: f.title,
      explanation: f.explanation,
      evidence: f.evidence || null,
      location: f.location || null,
      suggestedFix: f.suggestedFix || null,
      confidence: Number((f.confidence ?? 0.5).toFixed(2)),
    });

  // Expensive work inside nested loops
  if (structure.nestedLoopDepth >= 2 && structure.sortCalls >= 1) {
    add({
      ruleId: "perf.nested_sort",
      severity: SEVERITY.WARNING,
      title: "Sorting inside nested control flow",
      explanation:
        "A sort appears together with nested loops. If sort runs repeatedly, overall cost may grow significantly.",
      evidence: "sort call count + nested loop depth",
      suggestedFix:
        "Sort once before the nested loops when the data does not change.",
      confidence: 0.55,
    });
  }

  // Repeated string concatenation in loops (JS/Java/Python)
  if (
    structure.loopCount >= 1 &&
    (/\+=\s*["'`]|\.concat\(|\+\s*"/.test(src) ||
      (language === "python" && /\+=\s*['"]/.test(src)))
  ) {
    add({
      ruleId: "perf.string_concat_in_loop",
      severity: SEVERITY.INFO,
      title: "String concatenation inside a loop",
      explanation:
        "Repeated immutable string concatenation can be costly for large n.",
      suggestedFix:
        "Accumulate parts in a list/StringBuilder and join once after the loop.",
      confidence: 0.5,
    });
  }

  // Recursion without obvious base case
  if (structure.hasRecursionHint) {
    const hasBase =
      /\bif\b[\s\S]{0,80}\breturn\b/.test(src) ||
      /\breturn\b[\s\S]{0,40}\bif\b/.test(src);
    if (!hasBase) {
      add({
        ruleId: "correctness.recursion_base_unclear",
        severity: SEVERITY.WARNING,
        title: "Recursion without an evident base case",
        explanation:
          "Recursive structure was detected but a clear terminating condition was not found by static rules.",
        suggestedFix:
          "Ensure every recursive path reaches a base case for all valid inputs.",
        confidence: 0.4,
      });
    }
  }

  // Suspicious off-by-one: for (i = 0; i <= n; i++)
  lines.forEach((line, idx) => {
    if (/for\s*\([^;]*;\s*\w+\s*<=\s*n\s*;/.test(line)) {
      add({
        ruleId: "correctness.off_by_one_leq_n",
        severity: SEVERITY.INFO,
        title: "Loop uses <= n",
        explanation:
          "Loops of the form i <= n are a common off-by-one source when arrays are 0-indexed with size n.",
        location: { line: idx + 1, snippet: line.trim().slice(0, 120) },
        suggestedFix:
          "Confirm whether the intended bound is i < n or i <= n for this problem.",
        confidence: 0.45,
      });
    }
  });

  // Empty catch / ignored errors (JS)
  if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(src)) {
    add({
      ruleId: "quality.empty_catch",
      severity: SEVERITY.INFO,
      title: "Empty catch block",
      explanation: "Exceptions are swallowed without handling or logging.",
      suggestedFix: "Handle, rethrow, or document why the error is ignored.",
      confidence: 0.7,
    });
  }

  // Potential redundant condition a == a
  if (/\b(\w+)\s*==\s*\1\b/.test(src) || /\b(\w+)\s*===\s*\1\b/.test(src)) {
    add({
      ruleId: "quality.tautology",
      severity: SEVERITY.INFO,
      title: "Tautological comparison",
      explanation: "A variable is compared to itself, which is always true.",
      suggestedFix: "Remove or correct the condition.",
      confidence: 0.8,
    });
  }

  // Nested loops over same array without break — possible O(n^2) scan
  if (structure.nestedLoopDepth >= 2 && structure.binaryHalvingSignals === 0) {
    add({
      ruleId: "perf.nested_linear_scan",
      severity: SEVERITY.INFO,
      title: "Nested linear scans",
      explanation:
        "Nested loops without binary search may indicate an O(n²) approach.",
      suggestedFix:
        "Consider hashing, two pointers, or sorting if the problem allows.",
      confidence: 0.4,
    });
  }

  return findings;
};
