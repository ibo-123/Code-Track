/**
 * Rule-based algorithm / data-structure detection with evidence + confidence.
 * Heuristic — never label solely from a name match without structural signals.
 */

const clamp = (n) => Math.max(0, Math.min(1, n));

const pushDetection = (list, item) => {
  if (!item || item.confidence < 0.35) return;
  list.push({
    name: item.name,
    category: item.category,
    confidence: Number(item.confidence.toFixed(2)),
    evidence: item.evidence || [],
  });
};

export const detectPatterns = (sourceCode, language, structure) => {
  const src = String(sourceCode || "");
  const algorithms = [];
  const dataStructures = [];
  const s = structure || {};
  const hints = s.patternHints || {};
  const cols = s.collections || {};

  // ── Data structures ─────────────────────────────────────────────────
  if (cols.mapLike >= 1 || /\bdict\b|\bHashMap\b|\bunordered_map\b|\bMap</.test(src)) {
    pushDetection(dataStructures, {
      name: "hash_map",
      category: "data_structure",
      confidence: clamp(0.55 + cols.mapLike * 0.1),
      evidence: ["Map/dictionary/hash-map usage detected in source"],
    });
  }
  if (cols.setLike >= 1) {
    pushDetection(dataStructures, {
      name: "hash_set",
      category: "data_structure",
      confidence: clamp(0.55 + cols.setLike * 0.1),
      evidence: ["Set/hash-set usage detected"],
    });
  }
  if (cols.stackLike >= 2) {
    pushDetection(dataStructures, {
      name: "stack",
      category: "data_structure",
      confidence: 0.6,
      evidence: ["Stack-like push/pop operations detected"],
    });
  }
  if (cols.queueLike >= 2 || hints.bfs >= 2) {
    pushDetection(dataStructures, {
      name: "queue",
      category: "data_structure",
      confidence: 0.55,
      evidence: ["Queue/deque usage patterns detected"],
    });
  }
  if (cols.heapLike >= 1) {
    pushDetection(dataStructures, {
      name: "heap",
      category: "data_structure",
      confidence: 0.7,
      evidence: ["Priority queue / heap library usage detected"],
    });
  }
  if (/\bvector\b|\bArrayList\b|\blist\s*\[|\b\[\s*\]/.test(src)) {
    pushDetection(dataStructures, {
      name: "array_list",
      category: "data_structure",
      confidence: 0.5,
      evidence: ["Array/list container usage detected"],
    });
  }
  if (/\bstring\b|\bString\b|\bstr\b/.test(src)) {
    pushDetection(dataStructures, {
      name: "string",
      category: "data_structure",
      confidence: 0.4,
      evidence: ["String type usage detected"],
    });
  }
  if (
    /adjacency|adj\s*\[|vector\s*<\s*vector|List\s*<\s*List|graph\s*=/.test(src)
  ) {
    pushDetection(dataStructures, {
      name: "graph_adjacency",
      category: "data_structure",
      confidence: 0.65,
      evidence: ["Adjacency-list style graph structure detected"],
    });
  }
  if (/parent\s*\[|find\s*\(|union\s*\(|DSU|disj/.test(src)) {
    pushDetection(dataStructures, {
      name: "disjoint_set_union",
      category: "data_structure",
      confidence: 0.7,
      evidence: ["Parent/find/union DSU patterns detected"],
    });
  }
  if (/TreeNode|left\s*=|right\s*=|BinaryTree|Node\s*\{/.test(src)) {
    pushDetection(dataStructures, {
      name: "tree",
      category: "data_structure",
      confidence: 0.55,
      evidence: ["Tree node / left-right child patterns detected"],
    });
  }

  // ── Algorithms ──────────────────────────────────────────────────────
  if (s.binaryHalvingSignals >= 2 && s.loopCount >= 1) {
    pushDetection(algorithms, {
      name: "binary_search",
      category: "algorithm",
      confidence: clamp(0.5 + s.binaryHalvingSignals * 0.12),
      evidence: [
        "Search interval is repeatedly divided (mid / low / high updates)",
      ],
    });
  }

  if (s.sortCalls >= 1) {
    pushDetection(algorithms, {
      name: "sorting",
      category: "algorithm",
      confidence: 0.85,
      evidence: ["Explicit sort library/call detected"],
    });
  }

  if (hints.twoPointers >= 2 && s.loopCount >= 1) {
    pushDetection(algorithms, {
      name: "two_pointers",
      category: "algorithm",
      confidence: 0.55,
      evidence: ["Paired left/right indices with advancing loop detected"],
    });
  }

  if (hints.slidingWindow >= 2) {
    pushDetection(algorithms, {
      name: "sliding_window",
      category: "algorithm",
      confidence: 0.5,
      evidence: ["Window / left-right expansion patterns detected"],
    });
  }

  if (hints.prefixSums >= 1) {
    pushDetection(algorithms, {
      name: "prefix_sums",
      category: "algorithm",
      confidence: 0.6,
      evidence: ["Prefix/cumsum array construction detected"],
    });
  }

  if (hints.bfs >= 3) {
    pushDetection(algorithms, {
      name: "bfs",
      category: "algorithm",
      confidence: 0.65,
      evidence: ["Queue + visited traversal signals consistent with BFS"],
    });
  }

  if (hints.dfs >= 2 && (s.hasRecursionHint || /stack/i.test(src))) {
    pushDetection(algorithms, {
      name: "dfs",
      category: "algorithm",
      confidence: 0.55,
      evidence: ["Recursive/stack traversal with visited markers"],
    });
  }

  if (hints.dp >= 2) {
    pushDetection(algorithms, {
      name: "dynamic_programming",
      category: "algorithm",
      confidence: 0.6,
      evidence: ["DP table / memoization patterns detected"],
    });
  }

  if (/backtrack|permute|combination/i.test(src) && s.hasRecursionHint) {
    pushDetection(algorithms, {
      name: "backtracking",
      category: "algorithm",
      confidence: 0.55,
      evidence: ["Recursive search with backtracking vocabulary/structure"],
    });
  }

  if (/dijkstra|dist\s*\[|priority_queue.*dist/i.test(src) && cols.heapLike) {
    pushDetection(algorithms, {
      name: "dijkstra",
      category: "algorithm",
      confidence: 0.7,
      evidence: ["Distance array + priority queue pattern resembling Dijkstra"],
    });
  }

  if (/parent\s*\[|find\s*\(|union\s*\(/.test(src)) {
    pushDetection(algorithms, {
      name: "disjoint_set_union",
      category: "algorithm",
      confidence: 0.65,
      evidence: ["DSU find/union operations detected"],
    });
  }

  if (
    /greedy|sort.*then|locally optimal/i.test(src) &&
    s.sortCalls >= 1
  ) {
    pushDetection(algorithms, {
      name: "greedy",
      category: "algorithm",
      confidence: 0.4,
      evidence: ["Sort-then-scan structure often used in greedy solutions"],
    });
  }

  // Linear search: single loop scanning with equality check, no binary signals
  if (
    s.loopCount >= 1 &&
    s.nestedLoopDepth <= 1 &&
    s.binaryHalvingSignals === 0 &&
    /==|===|equals\(/.test(src)
  ) {
    pushDetection(algorithms, {
      name: "linear_search",
      category: "algorithm",
      confidence: 0.4,
      evidence: ["Single-pass loop with equality checks (heuristic)"],
    });
  }

  // Tree traversal
  if (/TreeNode|inorder|preorder|postorder/i.test(src)) {
    pushDetection(algorithms, {
      name: "binary_tree_traversal",
      category: "algorithm",
      confidence: 0.6,
      evidence: ["Tree traversal naming or TreeNode structure detected"],
    });
  }

  if (algorithms.length === 0) {
    algorithms.push({
      name: "unknown",
      category: "algorithm",
      confidence: 0,
      evidence: ["Insufficient structural evidence for a specific algorithm"],
    });
  }

  return { algorithms, dataStructures };
};
