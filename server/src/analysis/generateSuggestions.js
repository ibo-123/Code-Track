/**
 * Optimization suggestions derived from detections + findings.
 * Never rewrites code; includes preconditions and trade-offs.
 */

export const generateSuggestions = ({
  algorithms = [],
  dataStructures = [],
  timeComplexity,
  findings = [],
  structure,
}) => {
  const suggestions = [];
  const names = new Set(algorithms.map((a) => a.name));
  const ds = new Set(dataStructures.map((d) => d.name));
  const findingIds = new Set(findings.map((f) => f.ruleId));

  const add = (s) =>
    suggestions.push({
      id: s.id,
      currentPattern: s.currentPattern,
      proposedImprovement: s.proposedImprovement,
      rationale: s.rationale,
      expectedComplexityImpact: s.expectedComplexityImpact || null,
      preconditions: s.preconditions || [],
      tradeOffs: s.tradeOffs || [],
    });

  if (names.has("linear_search") && !ds.has("hash_map") && !ds.has("hash_set")) {
    add({
      id: "opt.hash_lookup",
      currentPattern: "Repeated linear scans for membership/equality",
      proposedImprovement:
        "Use a hash set/map for O(1) average lookups when duplicates or membership tests dominate",
      rationale:
        "Hashing avoids rescanning the array when the problem only needs existence or frequency counts",
      expectedComplexityImpact: "Often O(n²) → O(n) for lookup-heavy nested scans",
      preconditions: [
        "Elements must be hashable",
        "Problem allows extra O(n) memory",
      ],
      tradeOffs: ["Higher constant factors", "Extra memory"],
    });
  }

  if (
    structure.nestedLoopDepth >= 2 &&
    structure.binaryHalvingSignals === 0 &&
    names.has("sorting") === false
  ) {
    add({
      id: "opt.consider_sort_twopointers",
      currentPattern: "Nested loops over ranges",
      proposedImprovement:
        "If a monotonicity or sortedness condition exists, sort once and apply two pointers / binary search",
      rationale: "Many pair/sum problems become O(n log n) after sorting",
      expectedComplexityImpact: "Possible O(n²) → O(n log n)",
      preconditions: [
        "A correct ordering/monotonic property must exist for the problem",
      ],
      tradeOffs: ["Sorting destroys original index order unless tracked"],
    });
  }

  if (findingIds.has("perf.nested_sort")) {
    add({
      id: "opt.hoist_sort",
      currentPattern: "Sort invoked in nested control flow",
      proposedImprovement: "Hoist sorting outside loops when input is unchanged",
      rationale: "Avoid repeating O(n log n) work",
      expectedComplexityImpact: "Removes a multiplicative log n factor per iteration",
      preconditions: ["Sorted data remains valid across iterations"],
      tradeOffs: [],
    });
  }

  if (findingIds.has("perf.string_concat_in_loop")) {
    add({
      id: "opt.string_builder",
      currentPattern: "String += inside a loop",
      proposedImprovement: "Use a buffer/list and join once",
      rationale: "Avoid quadratic string building on immutable strings",
      expectedComplexityImpact: "Often O(n²) → O(n) for large concatenations",
      preconditions: ["Language string model is immutable or copy-on-write costly"],
      tradeOffs: ["Slightly more verbose code"],
    });
  }

  if (names.has("dfs") && structure.hasRecursionHint) {
    add({
      id: "opt.iterative_dfs",
      currentPattern: "Deep recursive DFS",
      proposedImprovement:
        "Consider an explicit stack if recursion depth may hit stack limits",
      rationale: "Competitive programming graphs can be deep/skewed",
      expectedComplexityImpact: "Asymptotic time usually unchanged",
      preconditions: ["Language recursion limit may be exceeded"],
      tradeOffs: ["Iterative code can be harder to read"],
    });
  }

  if (names.has("prefix_sums") === false && /sum.*(range|l.*r)/i.test("")) {
    /* skip */
  }

  if (
    structure.loopCount >= 1 &&
    names.has("prefix_sums") === false &&
    /for[\s\S]{0,120}sum\s*\+=/.test(String(structure._src || ""))
  ) {
    // optional — skip without source
  }

  if (suggestions.length === 0 && timeComplexity?.worstCase === "O(n²)") {
    add({
      id: "opt.review_quadratic",
      currentPattern: "Estimated quadratic time",
      proposedImprovement:
        "Review whether hashing, sorting, or two pointers can remove a nested scan",
      rationale: "Quadratic solutions often TLE on large competitive programming constraints",
      expectedComplexityImpact: "Potential improvement to O(n) or O(n log n)",
      preconditions: ["Depends entirely on problem constraints and semantics"],
      tradeOffs: ["May require additional memory or sortedness assumptions"],
    });
  }

  return suggestions;
};
