/**
 * Language-agnostic structural scan used by complexity/pattern detectors.
 * Does NOT execute code. Produces a lightweight structure summary.
 */

const stripCommentsAndStrings = (source, language) => {
  let s = String(source);
  // Block comments
  s = s.replace(/\/\*[\s\S]*?\*\//g, " ");
  // Line comments // and #
  s = s.replace(/\/\/.*$/gm, " ");
  if (language === "python") {
    s = s.replace(/#.*$/gm, " ");
    s = s.replace(/'''[\s\S]*?'''/g, " ");
    s = s.replace(/"""[\s\S]*?"""/g, " ");
  }
  // Rough string removal
  s = s.replace(/'(?:\\.|[^'\\])*'/g, "''");
  s = s.replace(/"(?:\\.|[^"\\])*"/g, '""');
  s = s.replace(/`(?:\\.|[^`\\])*`/g, "``");
  return s;
};

const countMatches = (text, re) => {
  const m = text.match(re);
  return m ? m.length : 0;
};

/**
 * Count Python indentation-based nested loops roughly.
 */
const maxPythonIndentDepth = (source) => {
  let max = 0;
  for (const line of String(source).split(/\r?\n/)) {
    if (!/^\s*(for|while)\b/.test(line)) continue;
    const indent = line.match(/^\s*/)[0].replace(/\t/g, "    ").length / 4;
    if (indent + 1 > max) max = indent + 1;
  }
  return max;
};

export const scanStructure = (sourceCode, language) => {
  const raw = String(sourceCode || "");
  const cleaned = stripCommentsAndStrings(raw, language);
  const lines = raw.split(/\r?\n/);

  const forLoops = countMatches(
    cleaned,
    language === "python" ? /\bfor\b/g : /\bfor\s*\(/g
  );
  const whileLoops = countMatches(cleaned, /\bwhile\s*\(/g) +
    (language === "python" ? countMatches(cleaned, /\bwhile\b/g) : 0);

  const recursiveCalls = countMatches(
    cleaned,
    /\bfunction\s+(\w+)[\s\S]{0,400}?\b\1\s*\(/g
  );

  const hasRecursionHint =
    recursiveCalls > 0 ||
    /\breturn\s+\w+\s*\(/.test(cleaned) ||
    (language === "python" && /def\s+(\w+)\([\s\S]*?\b\1\s*\(/.test(cleaned));

  const binaryHalving =
    countMatches(cleaned, /mid\s*=.*(low|left|lo|l)\s*\+|>>\s*1|\/\s*2/gi) +
    countMatches(cleaned, /\b(low|left|lo)\s*=\s*mid\s*\+\s*1/gi) +
    countMatches(cleaned, /\b(high|right|hi|r)\s*=\s*mid\s*-\s*1/gi);

  const sortCalls = countMatches(
    cleaned,
    /\.sort\s*\(|\bsort\s*\(|\bArrays\.sort\b|\bCollections\.sort\b|\bstd::sort\b|\bsorted\s*\(/g
  );

  const mapLike = countMatches(
    cleaned,
    /\bMap\b|\bHashMap\b|\bunordered_map\b|\bdict\b|\bnew Map\b|\b\{\}\s*;/g
  );
  const setLike = countMatches(
    cleaned,
    /\bSet\b|\bHashSet\b|\bunordered_set\b|\bset\s*\(|\bnew Set\b/g
  );
  const stackLike = countMatches(cleaned, /\bstack\b|\bStack\b|\.push\(|\.pop\(/gi);
  const queueLike = countMatches(
    cleaned,
    /\bqueue\b|\bQueue\b|\bDeque\b|\.shift\(|\.enqueue\(/gi
  );
  const heapLike = countMatches(
    cleaned,
    /\bPriorityQueue\b|\bheapq\b|\bpriority_queue\b|\bBinaryHeap\b/g
  );

  const bfsHints =
    countMatches(cleaned, /\bqueue\b|\bQueue\b/g) +
    countMatches(cleaned, /\bvisited\b/gi) +
    countMatches(cleaned, /\bBFS\b|\bbfs\b/g);

  const dfsHints =
    countMatches(cleaned, /\bDFS\b|\bdfs\b/g) +
    countMatches(cleaned, /\bvisited\b/gi) +
    (hasRecursionHint ? 1 : 0);

  const dpHints =
    countMatches(cleaned, /\bdp\s*\[/gi) +
    countMatches(cleaned, /\bmemo\b|\bmemoize\b|\bcache\b/gi);

  const twoPointers =
    countMatches(cleaned, /\b(left|lo|i)\b[\s\S]{0,80}\b(right|hi|j)\b/gi) +
    countMatches(cleaned, /\bwhile\s*\(\s*\w+\s*<\s*\w+/g);

  const slidingWindow =
    countMatches(cleaned, /\bwindow\b/gi) +
    countMatches(cleaned, /\bright\b[\s\S]{0,40}\bleft\b/gi);

  const prefixSums =
    countMatches(cleaned, /\bprefix\b|\bpref\s*\[/gi) +
    countMatches(cleaned, /\bcumsum\b|\baccumulate\b/gi);

  // Nested loop depth: count how deep for/while nests via braces.
  let nestedLoopDepth =
    language === "python" ? maxPythonIndentDepth(raw) : 0;
  if (language !== "python") {
    let loopDepth = 0;
    let maxLoop = 0;
    let braceDepth = 0;
    const loopBraceStack = [];
    for (let i = 0; i < cleaned.length; i++) {
      const slice = cleaned.slice(i, i + 8);
      if (/^(for|while)\s*\(/.test(slice)) {
        loopDepth++;
        if (loopDepth > maxLoop) maxLoop = loopDepth;
        loopBraceStack.push(braceDepth);
        i += slice.match(/^(for|while)/)[0].length - 1;
        continue;
      }
      const ch = cleaned[i];
      if (ch === "{") braceDepth++;
      else if (ch === "}") {
        braceDepth = Math.max(0, braceDepth - 1);
        while (
          loopBraceStack.length &&
          braceDepth <= loopBraceStack[loopBraceStack.length - 1]
        ) {
          loopBraceStack.pop();
          loopDepth = Math.max(0, loopDepth - 1);
        }
      }
    }
    nestedLoopDepth = maxLoop;
    if (nestedLoopDepth === 0 && forLoops + whileLoops > 0) {
      nestedLoopDepth = 1;
    }
  }

  return {
    lineCount: lines.length,
    charCount: raw.length,
    forLoops,
    whileLoops,
    loopCount: forLoops + whileLoops,
    nestedLoopDepth,
    hasRecursionHint,
    binaryHalvingSignals: binaryHalving,
    sortCalls,
    collections: {
      mapLike,
      setLike,
      stackLike,
      queueLike,
      heapLike,
    },
    patternHints: {
      bfs: bfsHints,
      dfs: dfsHints,
      dp: dpHints,
      twoPointers,
      slidingWindow,
      prefixSums,
    },
  };
};
