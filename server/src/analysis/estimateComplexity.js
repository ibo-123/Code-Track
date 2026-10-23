import { COMPLEXITY } from "./constants.js";

/**
 * Static complexity estimator.
 * Convention: space estimate is AUXILIARY (excludes input storage) unless noted.
 */

const rank = {
  [COMPLEXITY.O1]: 0,
  [COMPLEXITY.O_LOG_N]: 1,
  [COMPLEXITY.O_N]: 2,
  [COMPLEXITY.O_N_LOG_N]: 3,
  [COMPLEXITY.O_N2]: 4,
  [COMPLEXITY.O_N3]: 5,
  [COMPLEXITY.O_2N]: 6,
  [COMPLEXITY.O_N_FACT]: 7,
  [COMPLEXITY.UNKNOWN]: -1,
};

const maxComplexity = (a, b) => {
  if (a === COMPLEXITY.UNKNOWN) return b;
  if (b === COMPLEXITY.UNKNOWN) return a;
  return rank[a] >= rank[b] ? a : b;
};

export const estimateComplexity = (structure, detections = {}) => {
  const assumptions = [];
  let time = COMPLEXITY.O1;
  let confidence = 0.35;
  const algorithms = detections.algorithms || [];

  const loops = structure.loopCount || 0;
  const nest = structure.nestedLoopDepth || 0;

  if (loops === 0 && !structure.hasRecursionHint) {
    time = COMPLEXITY.O1;
    confidence = 0.5;
    assumptions.push("No loops or recursion detected in the scanned structure");
  } else if (nest >= 3 || (loops >= 3 && nest >= 2)) {
    time = COMPLEXITY.O_N3;
    confidence = 0.45;
    assumptions.push(
      "Deeply nested loops approximated as cubic when bounds are unknown"
    );
  } else if (nest >= 2 || loops >= 2) {
    time = COMPLEXITY.O_N2;
    confidence = 0.5;
    assumptions.push(
      "Nested loops approximated as quadratic when iteration bounds are unknown"
    );
  } else if (loops >= 1) {
    time = COMPLEXITY.O_N;
    confidence = 0.55;
    assumptions.push(
      "Single-level loops approximated as linear in input size n"
    );
  }

  // Binary search / halving — prefer log when a single search loop is clear
  if (structure.binaryHalvingSignals >= 2) {
    if (loops <= 1 || nest <= 1) {
      time = COMPLEXITY.O_LOG_N;
      confidence = 0.7;
      assumptions.push("Halving search interval suggests logarithmic iterations");
    } else {
      // nested outer work + binary search inside
      time = maxComplexity(time, COMPLEXITY.O_N_LOG_N);
      confidence = Math.min(confidence, 0.55);
      assumptions.push(
        "Outer linear scan with inner binary search approximated as O(n log n)"
      );
    }
  }

  if (structure.sortCalls >= 1) {
    time = maxComplexity(time, COMPLEXITY.O_N_LOG_N);
    confidence = Math.max(confidence, 0.65);
    assumptions.push("Library sort assumed O(n log n)");
  }

  const names = new Set(algorithms.map((a) => a.name));
  if (names.has("bfs") || names.has("dfs")) {
    time = maxComplexity(time, COMPLEXITY.O_N);
    assumptions.push(
      "Graph traversal approximated as O(V+E) → reported as O(n)"
    );
    confidence = Math.max(confidence, 0.5);
  }
  if (names.has("dijkstra")) {
    time = maxComplexity(time, COMPLEXITY.O_N_LOG_N);
    assumptions.push(
      "Dijkstra with binary heap approximated as O((V+E) log V)"
    );
  }
  if (names.has("dynamic_programming") && nest >= 2) {
    time = maxComplexity(time, COMPLEXITY.O_N2);
    assumptions.push("2D DP table fill approximated as quadratic");
  }
  if (names.has("backtracking")) {
    time = maxComplexity(time, COMPLEXITY.O_2N);
    confidence = Math.min(confidence, 0.4);
    assumptions.push(
      "Backtracking exponential upper bound used when branching factor unknown"
    );
  }

  if (structure.hasRecursionHint && time === COMPLEXITY.O1) {
    time = COMPLEXITY.UNKNOWN;
    confidence = 0.2;
    assumptions.push(
      "Recursion detected but recurrence could not be established reliably"
    );
  }

  // Space (auxiliary)
  let space = COMPLEXITY.O1;
  let spaceConfidence = 0.4;
  const spaceAssumptions = [
    "Auxiliary space excludes the original input storage",
  ];
  const cols = structure.collections || {};

  if (cols.mapLike || cols.setLike || names.has("dynamic_programming")) {
    space = COMPLEXITY.O_N;
    spaceConfidence = 0.5;
    spaceAssumptions.push(
      "Hash maps/sets or DP tables often allocate proportional to n"
    );
  }
  if (names.has("graph_adjacency") || names.has("bfs") || names.has("dfs")) {
    space = maxComplexity(space, COMPLEXITY.O_N);
    spaceAssumptions.push("Graph adjacency / visited set typically O(V+E)");
  }
  if (structure.hasRecursionHint) {
    space = maxComplexity(space, COMPLEXITY.O_N);
    spaceAssumptions.push(
      "Recursion may use O(n) call-stack depth in the worst case"
    );
    spaceConfidence = Math.min(spaceConfidence, 0.45);
  }
  if (nest >= 2 && names.has("dynamic_programming")) {
    // could be O(n^2) table
    if (/dp\s*\[\s*\w+\s*\]\s*\[\s*\w+\s*\]/.test("")) {
      /* placeholder */
    }
  }

  // Detect 2D dp for space
  // handled lightly via nest + dp name
  if (names.has("dynamic_programming") && structure.nestedLoopDepth >= 2) {
    space = maxComplexity(space, COMPLEXITY.O_N2);
    spaceAssumptions.push("Nested DP loops may imply a 2D table → O(n²) space");
  }

  if (time === COMPLEXITY.O1 && loops === 0 && !structure.hasRecursionHint) {
    // ok
  } else if (confidence < 0.3) {
    time = COMPLEXITY.UNKNOWN;
  }

  return {
    timeComplexity: {
      worstCase: time,
      averageCase: time === COMPLEXITY.UNKNOWN ? COMPLEXITY.UNKNOWN : time,
      bestCase:
        names.has("binary_search") || structure.binaryHalvingSignals >= 2
          ? COMPLEXITY.O1
          : time === COMPLEXITY.UNKNOWN
            ? COMPLEXITY.UNKNOWN
            : COMPLEXITY.O1,
      confidence: Number(confidence.toFixed(2)),
      assumptions,
    },
    spaceComplexity: {
      auxiliary: space,
      includesInputStorage: false,
      confidence: Number(spaceConfidence.toFixed(2)),
      assumptions: spaceAssumptions,
    },
  };
};
