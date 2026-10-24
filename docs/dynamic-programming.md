# Dynamic Programming (DP) — From Scratch to Advanced

A self-study guide from zero knowledge of dynamic programming to the techniques used on Codeforces, CSES, AtCoder, and other competitive-programming contests.

You should already be comfortable with variables, arrays, loops, functions, recursion, and the idea of big-O. Everything about DP itself is taught from the beginning.

**How to use this guide**

1. Read in order. Later sections assume earlier ones.
2. When you meet a recurrence, say out loud what the state *means* before you look at the code.
3. After each solved problem, close the solution and recompute the sample by hand in a table.
4. Implement the problem again from memory the next day. Recognition, not memorization of code, is the skill.

Every major solved problem in this guide uses the same layout: statement, brute force, state, transition, base cases, C++17 solution, complexity, mistakes, and a takeaway. C++ solutions are 0-indexed unless a problem is clearer with an extra boundary row or column (that choice is always explained).

---

## Contents

1. [Introduction](#1-introduction-to-dynamic-programming)
2. [Prerequisites](#2-prerequisites)
3. [The core DP idea](#3-the-core-dp-idea)
4. [Recursion before DP](#4-recursion-before-dp)
5. [Memoization](#5-memoization--top-down-dp)
6. [Tabulation](#6-tabulation--bottom-up-dp)
7. [Space optimization](#7-space-optimization)
8. [Recognizing a DP problem](#8-how-to-recognize-a-dp-problem)
9. [Basic patterns](#9-basic-dp-patterns)
10. [String DP](#10-important-string-dp-problems)
11. [Sequence DP and LIS](#11-sequence-dp)
12. [Interval DP](#12-interval-dp)
13. [DP on trees](#13-dp-on-trees)
14. [Bitmask DP](#14-bitmask-dp)
15. [Digit DP](#15-digit-dp)
16. [DP with bitsets](#16-dp-with-bitsets)
17. [DP optimizations](#17-dp-optimization-techniques)
18. [DP on DAGs](#18-dp-on-dags)
19. [Game DP](#19-game-dp)
20. [Probability DP](#20-probability-dp)
21. [Expected-value DP](#21-expected-value-dp)
22. [Common mistakes](#22-common-dp-mistakes)
23. [Debugging](#23-dp-debugging-method)
24. [Deriving a DP](#24-how-to-derive-dp-from-a-problem)
25. [Contest workflow](#25-dp-problem-solving-workflow)
26. [Solved problem set](#26-complete-solved-problem-set)
27. [Pattern cheat sheet](#27-dp-pattern-cheat-sheet)
28. [State recognition cheat sheet](#28-dp-state-recognition-cheat-sheet)
29. [Learning roadmap](#29-final-dp-learning-roadmap)

---

## 1. Introduction to Dynamic Programming

### What is dynamic programming?

Dynamic programming is a way to solve a problem by solving its smaller pieces and storing those answers so you never compute the same piece twice.

The stored answers are the whole trick. Recursion already knows how to break a problem apart. DP adds a memory.

### Why do we need it?

Many recursive solutions redo the same work an exponential number of times. A Fibonacci call for `n = 5` computes `fib(3)` twice and `fib(2)` three times. For `n = 40` the same pattern does billions of calls, even though there are only 41 distinct questions: `fib(0)` through `fib(40)`.

DP exists to turn “solve this subproblem every time it appears” into “solve it once, then look it up.”

### What problem does DP solve?

DP solves problems with both of these properties:

1. **Optimal substructure.** The best answer for a problem can be built from the best answers of smaller problems.
2. **Overlapping subproblems.** Those smaller problems show up again and again.

If either property is missing, DP is the wrong tool.

### How is DP related to recursion?

Recursion is the thinking tool. You ask: “If I already knew the answers for smaller inputs, how would I finish this one?”

That question produces a recurrence. Memoized recursion *is* DP (top-down). An iterative loop that fills a table in the same order *is* the same DP (bottom-up). The recurrence does not change. Only the order of evaluation changes.

### How is DP related to divide and conquer?

Both split a problem into smaller pieces and combine the results.

| | Divide and conquer | Dynamic programming |
| --- | --- | --- |
| Subproblems | Usually disjoint | Overlap |
| Example | Merge sort splits an array into two halves that do not share elements | Fibonacci splits `n` into `n-1` and `n-2`, and those trees share calls |
| Reuse | Combining is enough | Stored answers are required |
| Typical cost | `O(n log n)` style recurrences | Proportional to (number of states) × (work per state) |

Merge sort does not benefit from a cache of subarray sorts, because each subarray is sorted once. Fibonacci does, because the same `n` is requested from many parents.

### What are overlapping subproblems?

A subproblem overlaps when the identical smaller question is asked more than once.

“What is the minimum cost to reach stair 4?” might be asked while solving stair 6 and again while solving stair 5. It is the same question. Computing it twice is waste.

### What is optimal substructure?

Optimal substructure means a globally best solution contains best solutions of its pieces.

House robber: the best loot from the first `i` houses is either

- the best loot from the first `i-1` houses (skip house `i-1`), or
- the best loot from the first `i-2` houses, plus this house.

There is no reason to use a *non-best* answer for those smaller prefixes. If a better prefix existed, you could swap it in and improve the whole answer.

Shortest paths in a graph with no negative cycles have the same shape. A shortest path from `s` to `t` that goes through `u` is a shortest path from `s` to `u` plus a shortest path from `u` to `t`.

### A tiny example, before any code

You are climbing a staircase of 4 steps. A step takes either 1 or 2 stairs. How many ways can you reach the top?

Write the last step only:

- Arrive by a single step from stair 3.
- Arrive by a double step from stair 2.

So

```text
ways(4) = ways(3) + ways(2)
```

The same sentence works for every stair. You do not need a new idea for `ways(3)`. You need `ways(2)` and `ways(1)`, and those need even smaller answers, until you hit facts you can see directly:

- `ways(0) = 1` (one way to stand on the ground: do nothing)
- `ways(1) = 1` (only a single step)

Then `ways(2) = 2`, `ways(3) = 3`, `ways(4) = 5`.

That is DP. The state is “ways to reach this stair.” The transition is “last step was 1 or 2.” The base cases are the stairs you can answer without a decision. The answer is the state for the top stair.

### When should you think about DP?

Think about DP when the problem asks for an optimum, a count, a possibility, or a probability, and the input can be described by a small position: an index, a remaining capacity, a pair of string prefixes, a subtree, a subset mask, a digit position.

A practical test: if you can write a recursive search whose arguments repeat, you can probably store those arguments.

### When should you not use DP?

Do not use DP when:

- A greedy choice is provably safe (activity selection, Huffman, fractional knapsack).
- The subproblems do not overlap (plain divide and conquer, binary search).
- The state you would need is already as large as the set of all solutions. DP must *compress* the past into a few numbers. If two histories that look different can lead to different futures, they are different states. If that blows the state space past the constraints, DP will not pass.
- You need one specific structure a specialized algorithm already computes faster (sorting, union-find connectivity, a single-source shortest path in a general graph with Dijkstra, a maximum flow).

“Minimum” in a statement is a hint, not a proof. Minimum spanning tree is not a DP problem.

---

## 2. Prerequisites

These are assumed, not taught in depth.

**Variables and arrays.** An array `dp[i]` is a labeled shelf. The label `i` is part of the meaning. If you cannot finish the sentence “`dp[i]` is …”, you do not have a state yet.

**Loops.** Bottom-up DP is a loop that fills shelves in an order where the right-hand side is already filled.

**Functions and recursion.** A function that calls itself with a smaller argument is the top-down form of a recurrence. Every recursive DP needs a base case, or it never stops.

**Complexity.** You should be able to read `O(n)`, `O(n^2)`, `O(n * W)`, `O(2^n * n^2)`.

| Notation | Rough contest meaning (`n` up to…) |
| --- | --- |
| `O(n)`, `O(n log n)` | `10^6` … `10^7` |
| `O(n^2)` | a few thousand (`5000` is tight, `10^4` usually too slow) |
| `O(n^3)` | about `100` … `500` |
| `O(n * W)` | `n * W` up to about `10^7` … `10^8` operations |
| `O(2^n * n)` | `n` about `20` |
| `O(2^n * n^2)` | `n` about `16` … `18` |
| `O(3^n)` | `n` about `15` |

These are rules of thumb for about `10^8` simple operations per second. Always count the real work inside the inner loop.

**Integer range.** `int` holds up to about `2.1e9`. Counts of ways, path counts, and knapsack values often need `long long` (up to about `9.2e18`) or a modulus, usually `1e9 + 7`. Write the modulus as an integer:

```cpp
const int MOD = 1000000007;
```

`const int MOD = 1e9 + 7` is a double literal. Do not use it.

---

## 3. The Core DP Idea

Every DP solution answers four questions, in this order:

1. **State.** What does a cell mean?
2. **Transition.** How does a cell follow from smaller cells?
3. **Base case.** Which cells are known without a transition?
4. **Answer.** Which cell (or combination of cells) is the result the problem asked for?

Code comes fifth. A beautiful loop with the wrong sentence for `dp[i]` is a wrong program.

### 3.1 State

The state is the smallest description of a subproblem that still lets you finish the problem.

```text
dp[i] = maximum value obtainable using the first i elements
```

is a complete sentence. It names the input that is allowed (`the first i elements`) and the quantity stored (`maximum value`).

More examples:

```text
dp[i]     = number of ways to make sum i
dp[i]     = minimum cost to reach position i
dp[i][w]  = maximum value using the first i items and capacity w
dp[i][j]  = length of the LCS of the first i characters of a and the first j of b
dp[l][r]  = best cost to solve the interval [l, r]
dp[u][0]  = best answer in the subtree of u if u is not taken
dp[mask][i] = best cost after visiting the cities in mask and ending at i
```

**Why the state is the hard part.** The transition is usually a short search over decisions once the state is right. The state is hard because it has to forget the past without forgetting anything the future still needs.

House robber: the future does not care *which* earlier houses you robbed. It only cares about the best loot so far and whether the previous house was robbed. That second fact is encoded by having two kinds of prefixes (ending with a skip, or ending with a take), or equivalently by looking at `i-1` and `i-2`. If the problem forbade robbing any two houses at distance at most 5, “best loot from a prefix” would no longer be enough. You would also need to remember the last few decisions.

A state is correct when two histories that produce the same state have the same set of legal futures and the same contribution to the objective.

Checklist for a candidate state:

- The parameters are few enough for the constraints.
- You can write a transition that only reads smaller states.
- The original question is one of the states, or a simple combination of them.
- You did not hide a second independent choice inside one number.

### 3.2 Transition

The transition is the recurrence: the rule that builds a bigger state from smaller ones.

```text
dp[i] = dp[i - 1] + dp[i - 2]
```

This does not come from algebra. It comes from a decision. For climbing stairs, the last action was a 1-step (then you must have reached `i-1`) or a 2-step (then you must have reached `i-2`). Those cases are disjoint and cover every way to reach `i`, so the counts add.

The general shape is:

```text
dp[state] = combine over decisions ( cost(decision)  ∘  dp[next state after decision] )
```

`combine` is `min`, `max`, `+` (for counts), `||` (for possibility), or a probability sum. `∘` is “add the cost”, “add one item”, or “multiply by the probability of this branch.”

Write the transition in words before you write it in code:

```text
best for the first i houses =
    max( skip house i-1  →  best for the first i-1 houses,
         take house i-1  →  best for the first i-2 houses + value of house i-1 )
```

If you cannot name the decision, you are not ready to type the formula.

### 3.3 Base cases

A transition points at smaller states. Something has to stop the chain.

Base cases are the subproblems with no legal decision, or the subproblems small enough to answer by inspection.

| Problem | Base case | Why |
| --- | --- | --- |
| Ways to make sum `0` | `dp[0] = 1` | One way to make nothing: choose nothing |
| Min coins to make sum `0` | `dp[0] = 0` | Zero coins make sum 0 |
| Cost to reach stone `0` | `dp[0] = 0` | You start there |
| LCS with an empty prefix | `dp[i][0] = dp[0][j] = 0` | No characters, no common subsequence |
| Edit distance to an empty string | `dp[i][0] = i` | Delete everything that remains |
| Game with no moves | losing position | The player to move cannot move |

**How to find them.** Shrink the state until a decision is impossible. Empty prefix, zero capacity, a single cell, a leaf, a mask with one bit, the bottom of the staircase.

**Common mistakes**

- Using `dp[0] = 0` for a counting problem. That says there are zero ways to make sum 0, and every later count stays zero.
- Using `dp[0] = 0` for a minimum-cost problem on positive sums other than the true start. Unreachable states must be an infinity sentinel, or a `0` looks like a free solution.
- Off-by-one: initializing `dp[1]` with the answer that belongs to `dp[0]`.
- Forgetting that a one-element interval is a base case in interval DP (`dp[i][i] = 0` or `dp[i][i] = a[i]`, depending on the meaning).

### 3.4 Answer

The answer is not “whatever sits in the last cell” unless your state was defined that way. Decide this when you define the state.

| State meaning | Where the answer lives |
| --- | --- |
| `dp[i]` = best for a prefix of length `i` | `dp[n]` |
| `dp[i]` = best subsequence **ending at** `i` | `max` over all `dp[i]` |
| `dp[l][r]` = best on interval `[l, r]` | `dp[0][n - 1]` |
| `dp[u][taken]` on a tree | the better of the two states at the root |
| `dp[mask][i]` for a tour | `min` over endpoints, often plus the edge back to the start |
| Min cost, some states impossible | the answer cell, after checking it is not infinity |

LIS is the classic trap. `dp[i]` is the best increasing subsequence that **ends at index `i`**, so the answer is the maximum in the whole array, not `dp[n - 1]`.

### 3.5 DP template

```cpp
// 1. Define the state
//    Write the sentence: dp[...] = ...
// 2. Initialize base cases
//    Fill only the cells you know without a decision.
//    Mark every other cell as unknown / impossible.
// 3. Define the transition
//    Name the decision. Read only states the decision depends on.
// 4. Compute states
//    In an order that respects dependencies (or recurse with a cache).
// 5. Return the answer
//    The cell, or the min/max/sum of cells, that matches the sentence.
```

Top-down and bottom-up share steps 1–3 and 5. They differ only in step 4.

---

## 4. Recursion Before DP

Recursion makes the recurrence visible. You should be able to write the slow recursive solution before you store anything. If the recursion is wrong, the DP will be wrong faster.

### Fibonacci, defined

The Fibonacci sequence used in this guide is:

```text
F(0) = 0
F(1) = 1
F(n) = F(n - 1) + F(n - 2)   for n >= 2
```

So the sequence starts `0, 1, 1, 2, 3, 5, 8, 13, ...`.

### Naive recursion

```cpp
#include <bits/stdc++.h>
using namespace std;

long long fib(int n) {
    if (n <= 1) return n;                 // base: F(0) = 0, F(1) = 1
    return fib(n - 1) + fib(n - 2);       // the recurrence, recomputed every time
}

int main() {
    cout << fib(10) << "\n";              // 55
}
```

Line by line:

- `if (n <= 1) return n;` stops the recursion. Without it the calls never end.
- `return fib(n - 1) + fib(n - 2);` trusts that smaller values are correct and adds them. It does not remember the result.

### Why it is slow

Here is the call tree for `fib(5)`:

```text
                         fib(5)
                        /      \
                   fib(4)      fib(3)
                   /    \      /    \
              fib(3)  fib(2) fib(2) fib(1)
              /   \    /  \   /  \
         fib(2) fib(1) ... ...
         /   \
     fib(1) fib(0)
```

`fib(3)` is a full subtree in two places. `fib(2)` appears three times. Each of those repeats its own children. The number of calls is exponential: about `O(φ^n)` where `φ ≈ 1.618`. The recursion depth is `O(n)`, so the call stack uses `O(n)` memory even though no array is allocated.

| `n` | Approximate calls of the naive function |
| --- | --- |
| 5 | 15 |
| 10 | 177 |
| 20 | about 2·10^4 |
| 40 | about 3·10^8 |
| 50 | about 4·10^10 |

There are only `n + 1` distinct subproblems. The tree is large because it ignores that fact.

> This repetition is the main reason DP exists.

The recursive *idea* is still right. `F(n)` really is `F(n-1) + F(n-2)`. We only refuse to pay for the same addition twice.

---

## 5. Memoization — Top-Down DP

**Memoization** means: the first time you solve a subproblem, write the answer down. Every later time, return the note.

Recursion + a cache is top-down DP. You start from the large question and descend. The cache stops repeated descents.

### Fibonacci with memory

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<long long> dp;

long long fib(int n) {
    if (n <= 1) return n;          // base case, not stored specially

    if (dp[n] != -1)               // already solved this exact n
        return dp[n];

    return dp[n] = fib(n - 1) + fib(n - 2);   // compute once, store, return
}

int main() {
    int n = 10;
    dp.assign(n + 1, -1);          // -1 means "not computed yet"
    cout << fib(n) << "\n";        // 55
}
```

Every important line:

- `dp.assign(n + 1, -1);` creates one shelf per subproblem. The sentinel `-1` is legal only because a Fibonacci number is never negative. If a real answer can be `-1`, use a separate `visited` array.
- `if (n <= 1) return n;` is unchanged. Base cases do not look at the cache.
- `if (dp[n] != -1) return dp[n];` is the overlap check. The second call with this `n` costs `O(1)`.
- `return dp[n] = fib(n - 1) + fib(n - 2);` stores and returns in one expression. The assignment happens after both recursive calls return, so the children are already cached.

### What the cache changes in the tree

The first time `fib(3)` runs, it fills `dp[3]`. The second time the tree wants `fib(3)`, the function returns immediately. Each `n` from `2` up to the original argument is fully computed once. Each computation does `O(1)` work besides the two calls, and those calls are `O(1)` when the value exists.

```text
Time:  O(n)     one new computation per distinct n
Space: O(n)     the array, plus O(n) call-stack depth
```

Compare:

| Method | What it does | Time | Extra space |
| --- | --- | --- | --- |
| Naive recursion | Recomputes every overlapping call | `O(φ^n)` | `O(n)` stack |
| Memoization | Computes each `n` once, from the top | `O(n)` | `O(n)` array + stack |

Memoization did not change the mathematics. It changed the number of times each subproblem is allowed to run.

---

## 6. Tabulation — Bottom-Up DP

**Tabulation** fills a table from the smallest states toward the largest, with loops instead of recursive calls.

It is called bottom-up because the base cases are the bottom. You climb from `dp[0]` and `dp[1]` up to `dp[n]`. Top-down starts at `dp[n]` and recurses down until it hits the same base cases.

### Converting the recursive solution

Look at the memoized function and answer three mechanical questions:

1. Which values of `n` are base cases? Initialize those.
2. Which order makes `dp[n - 1]` and `dp[n - 2]` exist before `dp[n]`? Increasing `n`.
3. What is the transition body, with the recursive calls replaced by array reads?

```cpp
#include <bits/stdc++.h>
using namespace std;

long long fib(int n) {
    if (n <= 1) return n;

    vector<long long> dp(n + 1);
    dp[0] = 0;                              // base
    dp[1] = 1;                              // base
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];      // same transition, no recursion
    }
    return dp[n];                           // the answer cell
}

int main() {
    cout << fib(10) << "\n";                // 55
}
```

```text
Time:  O(n)
Space: O(n)     and no recursion stack
```

### Why contests often prefer tabulation

- No recursion-depth limit. A top-down chain of length `10^5` can crash even when the time complexity is fine.
- The order of updates is visible, which makes 0/1 knapsack’s backward loop and interval DP’s length loop easier to get right.
- Constants are smaller, and you can sometimes drop the dimensions you no longer need.

Top-down is still the better design tool when the state graph is sparse: only a fraction of states are reachable from the original query (digit DP is the usual example). You pay only for states you visit. Bottom-up pays for every cell unless you add extra logic.

### Side-by-side

| Method | Approach | Recursion | Time | Space |
| --- | --- | --- | --- | --- |
| Brute force | Recompute every call | Yes | `O(φ^n)` | `O(n)` stack |
| Memoization | Cache each `n` on the way down | Yes | `O(n)` | `O(n)` array + stack |
| Tabulation | Fill `0 … n` in a loop | No | `O(n)` | `O(n)` |
| Optimized (next section) | Keep only the two previous values | No | `O(n)` | `O(1)` |

---

## 7. Space Optimization

The Fibonacci transition reads only `dp[i - 1]` and `dp[i - 2]`. Cells `dp[0]` through `dp[i - 3]` will never be read again. Storing them is optional.

```cpp
#include <bits/stdc++.h>
using namespace std;

long long fib(int n) {
    if (n <= 1) return n;
    long long prev2 = 0;                    // F(0)
    long long prev1 = 1;                    // F(1)
    for (int i = 2; i <= n; i++) {
        long long cur = prev1 + prev2;      // F(i)
        prev2 = prev1;                      // shift the window
        prev1 = cur;
    }
    return prev1;                           // F(n)
}

int main() {
    cout << fib(10) << "\n";                // 55
}
```

The window of “previous states” is exactly the set of states the transition still needs. For Fibonacci that window has size 2, so extra memory is `O(1)`.

The same idea applies far beyond Fibonacci:

- A 2D grid recurrence that reads only the previous row can keep two rows, or sometimes one row.
- 0/1 knapsack’s row `i` reads only row `i - 1`, and a backward loop can even reuse a single row (explained in the knapsack section — the direction matters).

Do not compress the table until the meaning and the transition are correct. Space optimization reorders writes. It is the easiest way to destroy a correct recurrence.

Also notice what you lose: the full table, so reconstructing *every* intermediate answer, or printing one optimal set of decisions, may require the uncompressed table (or parent pointers). If the problem only asks for the final number, compression is free.

`long long` still overflows for large `n`. `F(92)` fits in a signed 64-bit integer. `F(93)` does not. When the statement asks for `F(n) mod M`, take the modulus on every addition.

---

## 8. How to Recognize a DP Problem

Use this checklist before you commit to a solution.

```text
Ask yourself:

1. Can I divide the problem into smaller states?
2. Do the same states appear repeatedly?
3. Does the answer depend on previous decisions?
4. Can I define a small state?
5. Can I express the answer using smaller states?
```

If you answer yes to all five, design the state next. If question 4 fails — the honest state is huge — stop and look for a different model, a greedy argument, or a data structure.

### Keywords that often appear

| Word in the statement | Usual DP combine step | Still check |
| --- | --- | --- |
| minimum / maximum | `min` or `max` over decisions | Is there a greedy exchange argument? |
| number of ways / count | add the ways of each decision, often mod `1e9+7` | Are the cases disjoint? |
| possible / impossible | boolean OR, or a reachability bit | Is this just BFS/DFS on a small graph? |
| longest / shortest | `max` / `min` length or cost | Shortest path in a general graph is Dijkstra, not a random DP |
| maximum score / minimum cost | `max` / `min` of (cost + smaller state) | Does the state forget something the constraint still needs? |

These words do **not** automatically mean DP. “Minimum spanning tree”, “shortest path in an unweighted graph”, and “minimum number of swaps to sort an array of positions” are famous non-DP problems that use the same vocabulary.

### Constraints are part of the statement

| Constraint shape | State family to try |
| --- | --- |
| `n ≤ 20` and subsets matter | bitmask DP |
| `n ≤ 100`, two strings | `dp[i][j]` string DP |
| `n ≤ 400` and intervals split | interval DP `O(n^3)` |
| `n * W ≤ 1e7` with weights | knapsack |
| A tree and `n ≤ 1e5` | tree DP, `O(n)` or `O(n)` per state bit |
| “Count integers from L to R” with `R` up to `10^18` | digit DP |
| A DAG, or transitions only go forward | DAG DP in topological order |

Read the constraints before you fall in love with a recurrence. An `O(n^2)` LIS is correct and still too slow when `n = 1e5`. That is why the optimized LIS section exists.


---

## 9. Basic DP Patterns

Each pattern below is a shape you will see again under a different story. Learn the shape, not the story.

The progression inside a pattern is always the same when it applies:

```text
brute force  →  recursion  →  memoization  →  tabulation  →  space optimization
```

---

### Pattern 1 — Fibonacci / Linear DP

#### Concept

A linear DP walks an index from left to right. The value at `i` depends on a constant number of earlier indices, often `i-1` and `i-2`.

Fibonacci is the pure form. Climbing stairs is the same recurrence wearing a problem statement. The modeling in Pattern 2 is the part worth practicing. The arithmetic is the same.

#### How to identify it

- One index describes the subproblem.
- The decision at `i` looks back a fixed distance.
- After you write the recurrence, it matches `dp[i] = dp[i-1] + dp[i-2]` or a close cousin (`min`, `max`, or a small extra cost).

#### State, transition, base, answer

```text
dp[i] = F(i)
dp[i] = dp[i - 1] + dp[i - 2]
dp[0] = 0, dp[1] = 1
answer = dp[n]
```

The transition is correct because that is the definition of `F(i)`, and the two smaller values do not overlap in the *count of sequences* only after we have defined `F` that way. For Fibonacci specifically we are not counting compositions. We are computing a defined sequence. Climbing stairs, in the next pattern, *is* a counting argument: the two previous states are disjoint cases.

#### Complexity of the four versions

| Version | Time | Space |
| --- | --- | --- |
| Naive recursion | `O(φ^n)` | `O(n)` stack |
| Memoization | `O(n)` | `O(n)` |
| Tabulation | `O(n)` | `O(n)` |
| Two variables | `O(n)` | `O(1)` |

Full code for all four versions is in sections 4–7.

#### Common mistakes

- Defining `F(0) = 1` and then mixing it with a statement that uses `F(0) = 0`.
- Adding `int` values until they overflow. Use `long long`, or mod on every update.
- Caching with `0` as the “empty” sentinel. `F(0)` is `0`, so `0` cannot mean “not yet computed.”

#### Practice

- Fibonacci Number — LeetCode 509
- Climbing Stairs — LeetCode 70 (next pattern)
- Dice Combinations — CSES (unbounded linear count, Pattern 6)

---

### Pattern 2 — 1D DP

#### Concept

1D DP means the state is a single index. That index might be a position on a line, a prefix length, or a sum. Fibonacci is a special case. The general job is to decide **what the index means** and **which earlier indices a decision needs**.

#### How to identify it

You can describe every partial solution by one integer, and a decision moves that integer forward by a small amount.

---

## Problem: Climbing Stairs

### Problem Statement

You stand on stair `0` and want to reach stair `n`. Each move climbs either 1 stair or 2 stairs. Return the number of distinct ways to reach stair `n`.

Platform: LeetCode 70.

### Example

Input:

```text
n = 4
```

Output:

```text
5
```

The five ways are `1+1+1+1`, `1+1+2`, `1+2+1`, `2+1+1`, `2+2`.

### First Thought / Brute Force

From the current stair, try both moves and count the leaves that land exactly on `n`.

```cpp
long long brute(int stair, int n) {
    if (stair == n) return 1;
    if (stair > n) return 0;
    return brute(stair + 1, n) + brute(stair + 2, n);
}
```

### Why Brute Force Is Too Slow

Each call branches by 2, and the depth is `n`. The tree has `O(φ^n)` nodes. The same stair is reached by many different paths, and the function re-counts the ways from that stair every time.

```text
Time:  O(φ^n)
Space: O(n) recursion stack
```

### Identify the DP State

```text
dp[i] = number of ways to reach stair i from stair 0
```

The index is the stair you are standing on. Everything about the path before that is irrelevant except the number of ways to be there.

### Transition

```text
dp[i] = dp[i - 1] + dp[i - 2]
```

Any path that reaches `i` has a last move. That move came from `i-1` (a 1-step) or from `i-2` (a 2-step). A path cannot have both as its last move, and it cannot have any other last move. So the sets of paths are disjoint and complete, and the counts add.

### Base Cases

```text
dp[0] = 1
```

There is one way to be on stair 0 before any move: the empty sequence of moves.

`dp[1]` then becomes `dp[0]` plus a look at `dp[-1]`, which does not exist. Handle `i = 1` as a base as well, or guard the `i-2` term:

```text
dp[1] = 1     (only a single 1-step)
```

### DP Approach

1. Create `dp[0..n]`.
2. Set `dp[0] = 1` and `dp[1] = 1` (when `n >= 1`).
3. For `i` from 2 to `n`, set `dp[i] = dp[i-1] + dp[i-2]`.
4. Return `dp[n]`.

Only the last two values are required, so the array collapses to two variables after the table version is correct.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long climbStairs(int n) {
    if (n <= 1) return 1;
    long long prev2 = 1;                 // dp[0]
    long long prev1 = 1;                 // dp[1]
    for (int i = 2; i <= n; i++) {
        long long cur = prev1 + prev2;   // dp[i]
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}

int main() {
    cout << climbStairs(4) << "\n";      // 5
}
```

### Code Explanation

- `prev2` and `prev1` are the ways to reach the stair two behind and one behind the stair currently being computed.
- The loop body is the transition. `cur` is a temporary so we do not overwrite `prev1` before `prev2` has copied it.
- After the shift, `prev1` is `dp[i]` and `prev2` is `dp[i-1]`, ready for the next index.
- `n <= 1` avoids a loop that would never establish both bases.

### Complexity

```text
Time:  O(n)
Space: O(1)
```

The uncompressed table is also `O(n)` time and uses `O(n)` space.

### Common Mistakes

- Setting `dp[0] = 0`. Then every answer stays 0.
- Returning `dp[n-1]` because the array was sized `n` and the top stair was stored at the last index of a 0-based array of size `n`. Decide the meaning, then pick the cell. In this solution the answer is the value after processing stair `n`.
- Using `int` for large `n`. LeetCode’s `n` is small, but the same recurrence on CSES-sized inputs needs `long long` and usually a modulus.
- Counting combinations instead of sequences. `1+2` and `2+1` are different sequences of moves. The recurrence counts sequences, which is what this problem wants.

### Key Takeaway

A 1D counting DP adds the disjoint ways to arrive. Write the last decision, list the states it could have come from, and add those states.

---

### Pattern 3 — Minimum Cost DP

#### Concept

The state still describes a position. The transition still tries every legal last decision. The combine step is `min` (or `max`) instead of `+`, and each decision adds a cost.

#### How to identify it

The statement asks for the cheapest (or most profitable) way to reach a configuration, and every candidate “last action” has a cost you can compute from the previous state alone.

Unreachable states must not look like cost 0. Initialize them to a sentinel larger than any real answer, and never propagate a sentinel as if it were a real cost. A convenient sentinel is a value around `4e18` for `long long`, or a boolean “reachable” beside the cost.

---

## Problem: Min Cost Climbing Stairs

### Problem Statement

You are given `cost[0..n-1]`, the cost of using stair `i`. After you pay `cost[i]` you may climb 1 or 2 stairs upward. You may start on stair 0 or stair 1. Return the minimum cost to reach the top, which sits just past the last stair (position `n`).

Platform: LeetCode 746.

### Example

Input:

```text
cost = [10, 15, 20]
```

Output:

```text
15
```

Start on stair 1, pay `15`, and climb two stairs to the top. Starting on stair 0 and climbing two stairs lands on stair 2, not on the top. You would still have to pay `cost[2] = 20`, for a total of 30.

The states are:

```text
dp[0] = 0
dp[1] = 0
dp[2] = min(dp[1] + 15, dp[0] + 10) = 10
dp[3] = min(dp[2] + 20, dp[1] + 15) = min(30, 15) = 15
```

### First Thought / Brute Force

From each stair, pay and try both jumps. Take the minimum over the recursion tree. Also try both legal starts.

### Why Brute Force Is Too Slow

The recursion tree is the Fibonacci tree again: `O(φ^n)` overlapping calls of the form “minimum cost starting from this stair.”

### Identify the DP State

```text
dp[i] = minimum cost to reach position i
```

Position `n` is the top. Reaching a stair does not, by itself, charge you. You pay when you *use* a stair to jump further. Starting on stair 0 or stair 1 is free, which is why `dp[0]` and `dp[1]` are 0: you are allowed to begin there without a payment.

### Transition

```text
dp[i] = min( dp[i - 1] + cost[i - 1],
             dp[i - 2] + cost[i - 2] )
```

To arrive at `i` you jumped from `i-1` or from `i-2`. A jump from `j` costs `cost[j]`, and you must already have reached `j`.

### Base Cases

```text
dp[0] = 0
dp[1] = 0
```

Both starts are free. For `n = 1` the array has one stair and the top is position 1, so the answer is `dp[1] = 0` if we define the top as reachable by starting there. Check the problem’s `n`: LeetCode guarantees `n >= 2`. The loop below starts at 2 and matches that guarantee. If `n` can be smaller, return early.

### DP Approach

Fill `dp` from 2 through `n`. The answer is `dp[n]`, the cost of reaching the top.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

int minCostClimbingStairs(vector<int> cost) {
    int n = (int)cost.size();
    vector<int> dp(n + 1, 0);             // dp[i] = min cost to reach position i
    for (int i = 2; i <= n; i++) {
        int from_one = dp[i - 1] + cost[i - 1];
        int from_two = dp[i - 2] + cost[i - 2];
        dp[i] = min(from_one, from_two);
    }
    return dp[n];
}

int main() {
    cout << minCostClimbingStairs({10, 15, 20}) << "\n";                 // 15
    cout << minCostClimbingStairs({1, 100, 1, 1, 1, 100, 1, 1, 100, 1}) << "\n"; // 6
}
```

### Code Explanation

- `dp` has length `n + 1` because position `n` (the top) is a real state, and it is not a stair in `cost`.
- `from_one` is the decision “I used stair `i-1`.” `from_two` is “I used stair `i-2`.”
- `min` is the whole difference between this pattern and climbing-stairs counting. Same graph of moves, different combine step.
- The starts stay 0, so the first payments enter when some later position jumps *from* stair 0 or stair 1.

### Complexity

```text
Time:  O(n)
Space: O(n)     reducible to O(1), because only the previous two costs are read
```

### Common Mistakes

- Charging `cost[i]` when *arriving* at `i`, and also charging a start. That double-counts or charges the top.
- Forgetting position `n` and returning `min(dp[n-1], dp[n-2])` under a different state definition without rewriting the transition. Both definitions can be correct. Mixing them is not.
- Initializing the whole array to 0 and then taking mins against untouched zeros, if your loop order leaves gaps. Here every `dp[i]` is written exactly once from real predecessors, so zeros at the starts are intentional and later zeros do not survive.

### Key Takeaway

Minimum-cost DP uses the same “last decision” reasoning as counting DP. Replace “add the ways” with “add the cost of that decision, then take the min.” Keep impossible states out of the min.

---

## Problem: Frog Jump (minimum cost on a line)

### Problem Statement

There are `n` stones in a line, with heights `h[0], h[1], ..., h[n-1]`. You start on stone 0. From stone `i` you may jump to `i+1` or, if it exists, to `i+2`. The cost of a jump from `i` to `j` is `|h[i] - h[j]|`. Return the minimum cost to reach stone `n-1`.

Platform: AtCoder Educational DP Contest, task A (Frog 1).

### Example

Input:

```text
4
10 30 40 20
```

Output:

```text
30
```

One optimal sequence of stones is `0 → 1 → 3`, with cost `|30-10| + |20-30| = 30`.

### First Thought / Brute Force

Try every sequence of 1-steps and 2-steps that ends at the last stone. There are exponentially many sequences.

### Why Brute Force Is Too Slow

It is the Fibonacci recursion tree again, with an absolute-difference cost on each edge. `n` can be `10^5` on AtCoder. Exponential time is impossible. Even a careless `O(n^2)` search over all previous stones is too slow. This problem only allows jumps of length 1 and 2, so the DP is linear.

### Identify the DP State

```text
dp[i] = minimum cost to reach stone i from stone 0
```

### Transition

```text
dp[i] = dp[i - 1] + |h[i] - h[i - 1]|                         if i == 1
dp[i] = min(
            dp[i - 1] + |h[i] - h[i - 1]|,
            dp[i - 2] + |h[i] - h[i - 2]|
        )                                                      if i >= 2
```

Stone `i` was reached by one jump, from `i-1` or from `i-2`. The jump cost depends only on the two heights. Optimal substructure holds: a cheapest way to reach `i` arrives by one cheapest way to reach the previous stone. A worse path to `i-1` cannot become the unique best path to `i`, because you could swap in the cheaper path to `i-1` and improve it.

### Base Cases

```text
dp[0] = 0
```

You start on stone 0 and no jump has been paid.

### DP Approach

Fill stones from left to right. When you are at `i`, both legal origins are smaller indices, so they are already final.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long frog(const vector<long long>& h) {
    int n = (int)h.size();
    const long long INF = (long long)4e18;
    vector<long long> dp(n, INF);
    dp[0] = 0;                                   // start
    for (int i = 1; i < n; i++) {
        long long best = dp[i - 1] + llabs(h[i] - h[i - 1]);
        if (i >= 2) {
            best = min(best, dp[i - 2] + llabs(h[i] - h[i - 2]));
        }
        dp[i] = best;
    }
    return dp[n - 1];
}

int main() {
    cout << frog({10, 30, 40, 20}) << "\n";      // 30
    cout << frog({10, 10}) << "\n";              // 0
}
```

### Code Explanation

- `INF` marks “not yet reached.” Stone 0 overwrites that sentinel.
- The transition is written as “who can I arrive from?” which matches `dp[i]` = cost to reach `i`. You can also push forward (“from `i`, relax `i+1` and `i+2`”). Both orders are correct if every edge moves to a larger index.
- `llabs` is the 64-bit absolute value. `abs` on a `long long` is easy to get wrong across platforms. Heights on AtCoder fit in 32-bit integers, but the habit matters.
- `i >= 2` is the guard that there is no stone `-1`.

### Complexity

```text
Time:  O(n)
Space: O(n)
```

If jumps of length `1..K` are allowed (AtCoder Frog 2, `K ≤ 100`, `n ≤ 1e5`), the same state works and the inner loop runs `K` times: `O(nK)` time, which fits. When `K` is large, the later monotonic-queue section shows the extra structure you would need. Frog 2’s cost `|h[i]-h[j]|` depends on both ends, so a plain sliding-window minimum does **not** apply. That distinction is discussed in the optimization chapter.

### Common Mistakes

- Setting `dp[0] = h[0]` or `dp[0] = INF` and then wondering why every answer is wrong.
- Taking a jump from `i` to `j < i` and creating a cycle. On a line with only forward jumps the dependency order is the index order. Backward jumps need a different model.
- Using `int` for the cost when heights are large and `n` is `1e5`. The sample fits in `int`. The habit of `long long` costs is safer when the statement does not bound the sum of costs tightly.

### Key Takeaway

On a line, `dp[i]` as “best cost to reach `i`” plus transitions from the stones that can jump to `i` is the default minimum-cost pattern. Draw the edges. If every edge increases the index, a left-to-right loop is a valid topological order.

---

### Pattern 4 — Maximum Sum

#### Concept

At each element you have a binary decision: take it or skip it, under a local constraint (here, you cannot take two adjacent elements). The state remembers only what the next decision still needs.

#### How to identify it

A sequence, a yes/no choice at each position, and a constraint that only involves nearby positions. If the constraint involved the entire subset in a non-local way (a capacity, a target sum), you are heading toward knapsack, not this pattern.

---

## Problem: House Robber

### Problem Statement

A street has houses `nums[0..n-1]` with money `nums[i]`. You cannot rob two adjacent houses. Return the maximum amount you can rob.

Platform: LeetCode 198.

### Example

Input:

```text
nums = [2, 7, 9, 3, 1]
```

Output:

```text
12
```

Rob houses with `2`, `9`, and `1`.

### First Thought / Brute Force

Every house is taken or skipped, except that after a take the next house must be skipped. There are `O(2^n)` subsets, and the adjacency check does not change the exponential worst case (a subset of every other house is always legal).

### Why Brute Force Is Too Slow

`n` can be `100` on LeetCode and far larger in contest variants. `2^100` is not a plan. The overlapping subproblems are “maximum loot from this suffix, given whether the previous house was taken.”

### Identify the DP State

```text
dp[i] = maximum money we can steal from the first i houses
        (houses 0 .. i-1)
```

`i` is a count, not the last index. `dp[0]` means “no houses.” `dp[n]` means “all houses.” This makes the base case obvious.

### Transition

```text
dp[i] = max(
    dp[i - 1],                  // skip house i-1
    dp[i - 2] + nums[i - 1]     // take house i-1
)
```

**Skip.** If you do not rob house `i-1`, the best loot is exactly the best loot from the first `i-1` houses. Robbing or not robbing house `i-2` is already decided optimally inside `dp[i-1]`.

**Take.** If you rob house `i-1`, you are forbidden to rob house `i-2`. The earlier street that is still free is the first `i-2` houses, and you add `nums[i-1]`.

These two decisions cover every legal plan, so the better one is optimal.

### Base Cases

```text
dp[0] = 0                 // no houses, no money
dp[1] = nums[0]           // one house: take it (values are non-negative)
```

If values could be negative you would use `max(0, nums[0])`. They are not negative in this problem.

### DP Approach

Fill `i` from 2 to `n`. Because each state reads only `i-1` and `i-2`, two rolling variables are enough. The answer is `dp[n]`.

To *reconstruct* the houses, keep the full array and walk backward: if `dp[i] == dp[i-1]` you skipped house `i-1`, otherwise you took it and jump back by 2. Do this only after the values are correct.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long rob(const vector<long long>& nums) {
    int n = (int)nums.size();
    long long prev2 = 0;                     // dp[0]
    long long prev1 = 0;                     // dp[1], filled below if n >= 1
    if (n == 0) return 0;
    prev1 = nums[0];
    for (int i = 2; i <= n; i++) {
        long long skip = prev1;              // dp[i - 1]
        long long take = prev2 + nums[i - 1];
        long long cur = max(skip, take);
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;                            // dp[n]
}

int main() {
    cout << rob({2, 7, 9, 3, 1}) << "\n";    // 12
    cout << rob({1, 2, 3, 1}) << "\n";       // 4
    cout << rob({5}) << "\n";                // 5
}
```

### Code Explanation

- `prev2` is the best loot two prefixes ago. `prev1` is the best loot one prefix ago.
- `skip` does not add `nums[i-1]`. `take` adds it and is forbidden from using `prev1`, because `prev1` may have robbed the adjacent house.
- The shift copies `prev1` into `prev2` only after `take` has read the old `prev2`.
- An empty street returns 0. A single house never enters the loop and returns `nums[0]`.

### Complexity

```text
Time:  O(n)
Space: O(1) extra      O(n) if you keep the table for reconstruction
```

### Common Mistakes

- Writing `max(dp[i-1], dp[i-1] + nums[i-1])`. The take branch must skip the neighbor. Using `dp[i-1]` on both sides robs adjacent houses.
- Defining `dp[i]` as “best ending at `i`” and then returning `dp[n-1]` instead of the maximum over all end positions. The prefix definition avoids that trap. The “ending at `i`” definition is also valid, but the answer is `max(dp[i])`.
- Forgetting the single-house base and reading `nums[i-1]` on an empty array.

### Key Takeaway

When the constraint is local, encode it in the transition (take looks back two steps, skip looks back one step) instead of storing the entire subset.

---

### Pattern 5 — 0/1 Knapsack

#### Concept

You have items. Each item may be used **at most once**. Each item has a weight and a value. You have a capacity `W`. Choose a subset whose weight is at most `W` and whose value is maximum.

This is the template for a huge family: subset sum, partition, “pick or skip” with a numeric budget, and CSES Book Shop.

#### How to identify it

- A list of objects, each taken at most once.
- A numeric resource (capacity, remaining sum, remaining time).
- An objective that is a max, a min, a count, or a boolean “can I reach this resource level?”

If each object may be used any number of times, it is unbounded knapsack (next pattern). The state looks similar. The loop direction does not.

#### State

```text
dp[i][w] = maximum value using the first i items (items 0 .. i-1)
           with capacity exactly? no: with capacity at most w,
           i.e. using total weight ≤ w
```

More tightly, the recurrence below stores the best value achievable with weight **at most** `w`, because skipping is always allowed and values are non-negative. If values could be negative you would define the state more carefully. Contest knapsacks almost always have non-negative values.

Using the first `i` items, not “item `i` specifically,” keeps item `i-1` as the decision inside the transition.

#### Transition

```text
dp[i][w] = dp[i - 1][w]                                 if w < weight[i - 1]
dp[i][w] = max(
              dp[i - 1][w],                              // skip item i-1
              dp[i - 1][w - weight[i - 1]] + value[i - 1] // take item i-1
           )                                              otherwise
```

**Skip** leaves the capacity unchanged and forbids this item from appearing later, because later states only see the first `i` items through this cell.

**Take** spends `weight[i-1]` and gains `value[i-1]`. The remaining capacity was solved with the earlier items only, so the item cannot be selected twice.

#### Base case

```text
dp[0][w] = 0    for every w
```

Zero items produce zero value. Also `dp[i][0] = 0` when every weight is positive: no item fits in capacity 0.

#### Answer

```text
dp[n][W]
```

#### A full numeric example

Capacity `W = 5`. Three items:

| Item | Weight | Value |
| --- | --- | --- |
| 0 | 2 | 3 |
| 1 | 3 | 4 |
| 2 | 4 | 5 |

Table rows are “first `i` items”, columns are capacity.

| i \ w | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 (item 0) | 0 | 0 | 3 | 3 | 3 | 3 |
| 2 (items 0–1) | 0 | 0 | 3 | 4 | 4 | 7 |
| 3 (all) | 0 | 0 | 3 | 4 | 5 | 7 |

At `i = 2`, `w = 5`: take item 1 and you have `dp[1][2] + 4 = 3 + 4 = 7`, which beats skipping (`3`).

At `i = 3`, `w = 5`: taking item 2 needs capacity 4 and leaves `dp[2][1] + 5 = 5`, which loses to skipping (`7`). The best subset is items 0 and 1, value 7, weight 5.

---

## Problem: 0/1 Knapsack (Book Shop)

### Problem Statement

There are `n` books. Book `i` costs `price[i]` and gives `pages[i]` pages of happiness. You have `W` units of money. Each book may be bought at most once. Return the maximum number of pages you can get.

Platform: CSES Book Shop. The same recurrence is the classical 0/1 knapsack.

### Example

Input:

```text
n = 3, W = 5
price = [2, 3, 4]
pages = [3, 4, 5]
```

Output:

```text
7
```

This is the table above.

### First Thought / Brute Force

Try all `2^n` subsets, keep the subset with total price `≤ W` and maximum pages.

### Why Brute Force Is Too Slow

CSES allows `n ≤ 1000` and `W ≤ 1e5`. `2^1000` is impossible. The DP will be `O(nW)`, about `10^8` updates, which is the intended solution.

### Identify the DP State

```text
dp[i][w] = maximum pages using the first i books and budget w
```

### Transition

```text
dp[i][w] = max(
    dp[i - 1][w],
    dp[i - 1][w - price[i - 1]] + pages[i - 1]    // only if w >= price[i - 1]
)
```

### Base Cases

```text
dp[0][w] = 0 for all w
```

### DP Approach

Iterate items in the outer loop and budgets in the inner loop. Build row `i` entirely from row `i-1`.

Then throw row `i-1` away. A single array `dp[w]` can store “the best pages with budget `w` using the items considered so far,” **if** each item is applied in a direction that does not reuse it. That direction is downward.

### Why the 1D loop goes backward

Suppose one array holds the previous row, and you insert a book of price `3` and pages `4`.

If you scan `w` from small to large:

```text
dp[3] = dp[3 - 3] + 4 = dp[0] + 4
dp[6] = dp[6 - 3] + 4 = dp[3] + 4
```

When `dp[6]` is updated, `dp[3]` may already contain this same book. The book has been bought twice. That is unbounded knapsack, and it is wrong for Book Shop.

If you scan `w` from large to small:

```text
dp[6] reads dp[3]   while dp[3] still belongs to the previous set of books
dp[3] reads dp[0]   still the previous set
```

Each budget reads a cell that has not yet been updated by the current book, so the book is used at most once. Cells are updated in place safely.

```text
for (int i = 0; i < n; i++) {
    for (int w = W; w >= price[i]; w--) {
        dp[w] = max(dp[w], dp[w - price[i]] + pages[i]);
    }
}
```

The inner loop stops at `price[i]` because a smaller budget cannot hold the book, and `dp[w]` for those budgets must stay as it was (the skip decision).

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long knapsack(int W, const vector<int>& price, const vector<int>& pages) {
    int n = (int)price.size();
    vector<long long> dp(W + 1, 0);          // dp[w] = best pages with budget w
    for (int i = 0; i < n; i++) {
        for (int w = W; w >= price[i]; w--) {    // backward: use book i at most once
            dp[w] = max(dp[w], dp[w - price[i]] + pages[i]);
        }
    }
    return dp[W];
}

int main() {
    cout << knapsack(5, {2, 3, 4}, {3, 4, 5}) << "\n";   // 7
}
```

### Code Explanation

- `dp` starts as the zero-item base case: every budget yields 0 pages.
- The outer loop adds one book, which is one row of the 2D table, compressed.
- The inner loop’s downward direction is the compression invariant. Reverse it and the function solves a different problem.
- `dp[w - price[i]]` is the skip-or-take partner from the previous row, still intact because we have not updated lower capacities yet during this book.
- The answer is `dp[W]`, the best value with budget at most `W`. Since pages are non-negative, a larger budget is never worse, so the at-most-`W` optimum sits at `W`.

### Complexity

```text
Time:  O(n * W)
Space: O(W)          the 2D table would be O(n * W)
```

### Common Mistakes

- Looping `w` from `price[i]` upward and accidentally allowing unlimited copies.
- Looping items in the inner loop and budget on the outside in a way that applies the same item across a whole budget sweep more than once. The safe pairing is: outer = items, inner = budget downward.
- Using `dp[w] = dp[w - price] + pages` without the `max` against `dp[w]`. You must be allowed to skip.
- An `int` accumulator when `pages` sums can exceed `2^31 - 1`. CSES pages fit in 32-bit integers per book, and `n * max_pages` can exceed `2^31`. Use `long long`.
- Starting the backward loop at `W` but writing `w > price[i]` and skipping the equal case, so a book that costs exactly `w` is ignored.

### Key Takeaway

0/1 knapsack is take-or-skip with a budget. The 2D state makes the “previous items only” rule obvious. The 1D backward loop is that same rule, saved into one row. Forward loops are for unlimited reuse.

---

### Pattern 6 — Unbounded Knapsack

#### Concept

Unbounded knapsack is 0/1 knapsack with the opposite constraint: each item (or coin) may be used as many times as you want.

#### How to identify it

“Infinite supply”, “you may use an element more than once”, coin problems, and the word “combinations” of an unlimited set. Confirm whether order matters. That choice changes the loop nesting, not just the story.

#### Difference from 0/1

| | 0/1 knapsack | Unbounded knapsack |
| --- | --- | --- |
| Uses of one item | at most one | any number |
| 2D transition reads | previous row `dp[i-1][...]` | same row `dp[i][...]` after a take, because the item stays available |
| 1D loop direction | **backward** | **forward** |
| Why the direction | forward would reuse the item | forward reuses the item, and that is what we want |

2D unbounded transition, if you ever write it:

```text
dp[i][w] = max(
    dp[i - 1][w],                                      // stop using this item
    dp[i][w - weight[i - 1]] + value[i - 1]           // use it once more
)
```

The take branch reads `dp[i]`, the current item’s row, not `dp[i-1]`. That is the entire mathematical difference.

---

## Problem: Coin Change (minimum number of coins)

### Problem Statement

You have coin denominations `coins[0..n-1]` and an amount `target`. Each denomination may be used any number of times. Return the fewest coins that sum to `target`. If it is impossible, return `-1`.

Platform: LeetCode 322. The same DP is CSES Minimizing Coins.

### Example

Input:

```text
coins = [1, 3, 4]
target = 6
```

Output:

```text
2
```

`3 + 3`, or `4 + 1 + 1` which is worse.

### First Thought / Brute Force

Subtract a coin and recurse: `1 + min over coins of solve(target - coin)`.

### Why Brute Force Is Too Slow

Without a cache the search tree is exponential. The same remaining amount is reached through many orders of coins.

### Identify the DP State

```text
dp[x] = minimum number of coins that sum to x
```

### Transition

```text
dp[x] = min over coins c with c ≤ x of ( dp[x - c] + 1 )
```

The last coin added is some `c`. The coins before it form an optimal solution for `x - c`. If `x - c` is impossible, it is not a candidate.

### Base Cases

```text
dp[0] = 0
dp[x] = infinity    for x > 0, until a transition improves them
```

Zero coins make amount 0. Every positive amount starts impossible, not zero. If you initialize positive amounts to 0, the minimum is already 0 and no coin is ever needed.

### DP Approach

For each amount from 1 to `target`, try every coin. Because a coin may be reused, `dp[x - c]` must already be final when you read it. Filling amounts in increasing order guarantees that: `x - c < x`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long minCoins(const vector<int>& coins, int target) {
    const long long INF = (long long)4e18;
    vector<long long> dp(target + 1, INF);
    dp[0] = 0;
    for (int x = 1; x <= target; x++) {
        for (int c : coins) {
            if (c <= x && dp[x - c] != INF) {
                dp[x] = min(dp[x], dp[x - c] + 1);
            }
        }
    }
    return dp[target] == INF ? -1 : dp[target];
}

int main() {
    cout << minCoins({1, 3, 4}, 6) << "\n";     // 2
    cout << minCoins({2}, 3) << "\n";           // -1
}
```

### Code Explanation

- `INF` means impossible. The check `dp[x - c] != INF` refuses to add one coin to an impossible remainder. `INF + 1` would also risk overflow if you ever used a smaller sentinel carelessly.
- The amount loop is the outer loop. Any order of coins inside it is fine for a *minimum*, because min does not care about order and every coin is available at every amount.
- Returning `-1` translates the sentinel into the problem’s “impossible” convention.

### Complexity

```text
Time:  O(target * (number of coins))
Space: O(target)
```

### Common Mistakes

- Initializing `dp` to 0 and taking a minimum.
- Forgetting `dp[0] = 0`, so no amount can ever be built.
- Using 0/1 (backward) updates when coins are unlimited, which undercounts and can miss an optimum that uses two copies.
- Comparing against `INF` after doing `INF + 1`, which overflows a tight sentinel such as `LLONG_MAX`.

### Key Takeaway

Minimum-coin DP is unbounded knapsack whose “value” of a take is `+1` coin, and whose combine step is `min`. Impossible states stay at infinity.

---

## Problem: Coin Change (number of ways)

### Problem Statement

Count the number of ways to make `target` using the coins in `coins`. Each coin may be used any number of times. Two ways that use the same multiset of coins in a different order are the **same** way (combinations, not permutations).

Return the count modulo `1000000007` when it can be large. LeetCode 518 asks for the raw combination count. CSES Coin Combinations II is the combination count modulo `1e9+7`. CSES Coin Combinations I counts **ordered** sequences (permutations).

### Example

Input:

```text
coins = [1, 3, 4]
target = 6
```

Output (combinations):

```text
4
```

The multisets are `{1,1,1,1,1,1}`, `{3,1,1,1}`, `{3,3}`, `{4,1,1}`.

Output (permutations, for contrast):

```text
9
```

`{3,1,1,1}` alone has 4 distinct orders. The combination count does not care.

### First Thought / Brute Force

Recurse on the remaining sum, and either force coins to be considered in nondecreasing order (combinations) or allow every coin at every step (permutations).

### Why Brute Force Is Too Slow

The number of ordered tuples is exponential in `target`. CSES allows `target ≤ 1e6` and up to 100 coins. You need a linear DP over the amount.

### Identify the DP State

```text
dp[x] = number of ways to make sum x
```

The **order of loops** decides whether two orders of the same coins are one way or many. The state sentence should mention which one you mean:

```text
dp[x] = number of unordered combinations that sum to x
```

or

```text
dp[x] = number of ordered sequences that sum to x
```

### Transition

**Combinations** (order does not matter). Process one coin completely before the next coin. Inside a coin, walk amounts upward so the coin can be reused:

```text
for each coin c:
    for x from c to target:
        dp[x] += dp[x - c]
```

Why this counts each multiset once: every combination is generated in coin-loop order. The coins have a fixed order in the outer loop, so the multiset `{3,1,1,1}` is built only when the `1`s are placed and then the `3`, or more precisely only along the unique way the nested loops add those denominations. It is not rebuilt for every permutation.

**Permutations** (order matters). The last coin can be anything, so the coin loop is inside the amount loop:

```text
for x from 1 to target:
    for each coin c with c ≤ x:
        dp[x] += dp[x - c]
```

Here `1+3` and `3+1` both end with a different last coin and are both counted. That is what CSES Coin Combinations I asks for.

### Base Cases

```text
dp[0] = 1
```

There is one empty combination that makes sum 0. Every non-empty combination is an empty one plus coins.

If you set `dp[0] = 0`, every update adds nothing.

### DP Approach

Choose combination or permutation from the statement before writing the loops. Initialize `dp[0] = 1`. Apply the matching loop nest. Take the modulus on every addition if required.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MOD = 1000000007;

long long combinationWays(const vector<int>& coins, int target) {
    vector<long long> dp(target + 1, 0);
    dp[0] = 1;
    for (int c : coins) {                         // coin outer: combinations
        for (int x = c; x <= target; x++) {       // forward: unlimited copies
            dp[x] = (dp[x] + dp[x - c]) % MOD;
        }
    }
    return dp[target];
}

long long permutationWays(const vector<int>& coins, int target) {
    vector<long long> dp(target + 1, 0);
    dp[0] = 1;
    for (int x = 1; x <= target; x++) {           // amount outer: permutations
        for (int c : coins) {
            if (c <= x) dp[x] = (dp[x] + dp[x - c]) % MOD;
        }
    }
    return dp[target];
}

int main() {
    cout << combinationWays({1, 3, 4}, 6) << "\n";   // 4
    cout << permutationWays({1, 3, 4}, 6) << "\n";   // 9
}
```

### Code Explanation

- Both functions share the state and the base case. Only the loop nest differs.
- The forward inner scan in `combinationWays` reuses the current coin. The outer coin loop prevents a second denomination order from being generated.
- `permutationWays` asks “what was the last coin?” at every amount. Different last coins are different sequences.
- `% MOD` is applied when the value is still non-negative, which it is, because both terms are.

### Complexity

```text
Time:  O(target * (number of coins))    for either variant
Space: O(target)
```

### Common Mistakes

- Solving combinations when the judge asked for permutations, or the reverse. Read “order matters” carefully. CSES I is ordered. CSES II is unordered. LeetCode 518 is unordered.
- A backward loop, which uses each coin at most once (that is a different problem: number of subsets of a list of coins).
- `dp[0] = 0`.
- Forgetting the modulus on a count that the statement says to reduce. On CSES the answer is huge.
- Sorting the coins and believing that sorting alone turns permutations into combinations. The loop nest is what does it. Sorting is unnecessary for correctness of either version.

### Key Takeaway

Unlimited reuse means a forward loop. “Does order matter?” is a separate question, answered by which loop is on the outside. Minimum coins do not have this ambiguity, because the minimum does not count orders.

---

### Pattern 7 — Subset Sum

#### Concept

Subset sum asks a yes/no question: can some subset of the numbers add up to `target`? Each number is used at most once.

It is 0/1 knapsack where the weight and the value are the number itself, and you only care whether value `target` is reachable, not about a maximum.

#### How to identify it

“Choose a subset with sum equal to `S`”, partition into two parts with equal sum, or “is `S` achievable?” with each element once.

#### State

```text
dp[i][s] = true if some subset of the first i numbers sums to s
```

#### Transition

```text
dp[i][s] = dp[i - 1][s]                      // skip number i-1
        OR dp[i - 1][s - a[i - 1]]           // take it, when s >= a[i - 1]
```

#### Base case

```text
dp[0][0] = true
dp[0][s] = false for s > 0
```

The empty subset sums to 0 and to nothing else.

#### Answer

```text
dp[n][target]
```

#### Relation to other problems

- **0/1 knapsack.** Replace the boolean OR with a max of values, and replace “sum exactly `s`” with “weight exactly `w`” or “weight at most `w`.”
- **Partition Equal Subset Sum.** Let `total` be the sum of the array. If `total` is odd, the answer is false. If `total` is even, the array can be partitioned into two equal-sum parts exactly when a subset sums to `total / 2`. One part is the subset. The other part is the complement, and its sum is `total - total/2`.
- **Count of subsets with sum `S`.** Change `bool` to a counter. The transition adds instead of ORs. Watch the modulus and the empty subset (`dp[0] = 1`).

The 1D form is the backward boolean knapsack:

```text
dp[0] = true
for each number x:
    for s from target down to x:
        dp[s] = dp[s] OR dp[s - x]
```

Backward, because each number is used once. The same bug as forward knapsack applies: a forward loop would use `x` many times.

---

## Problem: Subset Sum

### Problem Statement

Given `n` positive integers and a target `S`, determine whether a subset sums to exactly `S`.

This is the decision version. CSES Money Sums asks for *all* achievable sums in `1..sum(a)` and is the same DP, printing every `s` with `dp[s] == true`.

### Example

Input:

```text
a = [3, 34, 4, 12, 5, 2]
S = 9
```

Output:

```text
YES
```

`4 + 5 = 9`. Another subset is `3 + 4 + 2`.

### First Thought / Brute Force

Test all subsets.

### Why Brute Force Is Too Slow

`n = 40` is already uncomfortable for `2^n`. The DP is `O(n * S)`, perfect when `S` is up to about `1e5` or `1e6` and `n` is a few hundred. When `n ≤ 40` and `S` is huge, meet-in-the-middle (`2^{n/2}`) beats this DP. Pick the algorithm from the constraints.

### Identify the DP State

```text
dp[s] = true if some subset of the numbers considered so far sums to s
```

### Transition

```text
When inserting number x, for s from S down to x:
    if dp[s - x] then dp[s] = true
```

### Base Cases

```text
dp[0] = true
```

### DP Approach

Insert numbers one by one, scanning the sum axis backward. At the end, read `dp[S]`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

bool subsetSum(const vector<int>& a, int S) {
    vector<char> dp(S + 1, 0);
    dp[0] = 1;
    for (int x : a) {
        for (int s = S; s >= x; s--) {       // backward: each x at most once
            if (dp[s - x]) dp[s] = 1;
        }
    }
    return dp[S];
}

int main() {
    cout << (subsetSum({3, 34, 4, 12, 5, 2}, 9) ? "YES\n" : "NO\n");   // YES
    cout << (subsetSum({1, 2, 5}, 4) ? "YES\n" : "NO\n");               // NO
}
```

### Code Explanation

- `vector<char>` is a compact boolean array. `vector<bool>` works but is a special proxy container. Avoid it in new code.
- The backward scan preserves the 0/1 constraint, exactly as in knapsack.
- `dp[0]` stays true. A number never needs to “turn off” sum 0.
- If you need every achievable sum (Money Sums), ignore the early target and let `S` be the total sum. Every index with `dp[s] == 1` is achievable.

### Complexity

```text
Time:  O(n * S)
Space: O(S)
```

### Common Mistakes

- Forward loops that reuse a number (`[2]` suddenly makes every even sum).
- Forgetting `dp[0] = true`, so nothing is ever reachable.
- Using subset sum on an unbounded coin instance. Unlimited coins are the forward loop of Pattern 6.
- Allocating `dp[n][S]` when `n = 1000` and `S = 1e5` and running out of memory. The 1D table is the one that fits. `1000 * 100000` booleans are 100 MB if stored naively as ints. One boolean row is fine.

### Key Takeaway

Subset sum is reachability knapsack. Partition problems on arrays reduce to it when the target is half the total sum.

---

## Problem: Partition Equal Subset Sum

### Problem Statement

Return whether the array can be partitioned into two subsets with equal sum.

Platform: LeetCode 416.

### Example

Input:

```text
nums = [1, 5, 11, 5]
```

Output:

```text
true
```

`{11}` and `{1, 5, 5}` both sum to 11.

### First Thought / Brute Force

Enumerate subsets and compare the subset sum with `total - subset sum`.

### Why Brute Force Is Too Slow

Same `2^n` wall. Here `n ≤ 200` and values are small, so the half-sum DP fits.

### Identify the DP State

```text
dp[s] = true if a subset sums to s
```

The original question is `dp[total / 2]` after rejecting an odd total.

### Transition

The subset-sum transition. Target capacity is `total / 2`.

### Base Cases

```text
dp[0] = true
```

If `total` is odd, answer false immediately. No base case saves an odd total.

### DP Approach

Compute the total. If it is odd, return false. Otherwise run 0/1 subset sum for target `total / 2`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

bool canPartition(vector<int> nums) {
    long long total = accumulate(nums.begin(), nums.end(), 0LL);
    if (total % 2 != 0) return false;
    int target = (int)(total / 2);
    vector<char> dp(target + 1, 0);
    dp[0] = 1;
    for (int x : nums) {
        if (x > target) return false;
        for (int s = target; s >= x; s--) {
            if (dp[s - x]) dp[s] = 1;
        }
    }
    return dp[target];
}

int main() {
    cout << (canPartition({1, 5, 11, 5}) ? "true\n" : "false\n");   // true
    cout << (canPartition({1, 2, 3, 5}) ? "true\n" : "false\n");    // false
}
```

### Code Explanation

- Odd totals are rejected before any DP. Half a coin does not exist.
- The DP target is half, not the full sum. Asking for the full sum is trivial (take everything) and does not partition.
- `x > target` cannot fit in either equal part if the other part must also sum to `target` and all numbers are positive. Returning false is optional. The loop would simply fail to use that `x`, and the complement could not make the other half either. The explicit check is a clear edge case.

### Complexity

```text
Time:  O(n * total)
Space: O(total)
```

### Common Mistakes

- Running the DP when the total is odd.
- Using a forward loop and “reaching” the half-sum by reusing one element.
- Comparing subset sums in `int` when the total exceeds `2^31 - 1`. Accumulate into `long long`. LeetCode’s constraints fit in `int`. Contest constraints sometimes do not.

### Key Takeaway

Equal partition is subset sum aimed at half the total. The reduction is the solution. Do not invent a second DP.

---

### Pattern 8 — Grid DP

#### Concept

A grid DP walks a matrix. The usual moves are right and down, so cell `(i, j)` depends only on cells that are above it or to its left. That dependency is acyclic, and nested loops in increasing `i` and `j` are a valid order.

#### How to identify it

Paths through a matrix, a robot that only moves forward, cherries, or dungeon games. If the robot can move in all four directions, you no longer have a trivial loop order. You may need Dijkstra, 0-1 BFS, or an extra state.

#### State

```text
dp[i][j] = best answer for a path that ends at cell (i, j)
           (or the number of ways to reach (i, j))
```

#### Transition

From the top and from the left, when those are the legal moves:

```text
dp[i][j] comes from dp[i - 1][j] and dp[i][j - 1]
```

Add them for counts. Take the min or max, then add `grid[i][j]`, for path costs.

---

## Problem: Unique Paths

### Problem Statement

An `m` by `n` grid. You start at the top-left `(0, 0)` and want the bottom-right `(m-1, n-1)`. You may move only right or down. Return the number of paths.

Platform: LeetCode 62. CSES Grid Paths is the same DP with blocked cells and a modulus.

### Example

Input:

```text
m = 3, n = 3
```

Output:

```text
6
```

### First Thought / Brute Force

DFS every right/down path.

### Why Brute Force Is Too Slow

The number of paths is `C(m+n-2, m-1)`, and the recursion recomputes each cell many times. For `m = n = 100` the combination itself does not fit in 64 bits, and the naive tree is enormous.

### Identify the DP State

```text
dp[i][j] = number of ways to reach cell (i, j) from (0, 0)
```

### Transition

```text
dp[i][j] = dp[i - 1][j] + dp[i][j - 1]
```

A path enters `(i, j)` from above or from the left. Those are the only legal last moves, and they are disjoint.

Missing neighbors (the top row has no “above”, the left column has no “left”) contribute 0, except the start.

### Base Cases

```text
dp[0][0] = 1
```

Every cell in the first row is reachable in exactly one way (all rights), and every cell in the first column in exactly one way (all downs), as long as there are no obstacles:

```text
dp[0][j] = 1
dp[i][0] = 1
```

These are consequences of the transition if you treat out-of-bounds as 0 and keep `dp[0][0] = 1`.

### DP Approach

Fill row by row, left to right. Return `dp[m-1][n-1]`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long uniquePaths(int m, int n) {
    vector<vector<long long>> dp(m, vector<long long>(n, 0));
    dp[0][0] = 1;
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (i == 0 && j == 0) continue;
            long long from_up = (i > 0) ? dp[i - 1][j] : 0;
            long long from_left = (j > 0) ? dp[i][j - 1] : 0;
            dp[i][j] = from_up + from_left;
        }
    }
    return dp[m - 1][n - 1];
}

int main() {
    cout << uniquePaths(3, 3) << "\n";       // 6
    cout << uniquePaths(3, 2) << "\n";       // 3
}
```

### Code Explanation

- The start is set before the loops and skipped, so it is not overwritten by `0 + 0`.
- Each cell adds the two possible entrances. A missing entrance adds 0, which is why the first row and first column become 1 automatically.
- For a grid with blocked cells (CSES), set `dp[i][j] = 0` when `(i, j)` is blocked, and do not add into it. Also if the start is blocked the answer is 0. Take the result modulo `1000000007` on CSES.

### Complexity

```text
Time:  O(m * n)
Space: O(m * n)     or O(n) with one rolling row, since only the previous row and the current left cell are required
```

### Common Mistakes

- Setting every first-row cell to 1 *and* also adding from the left, which doubles them.
- Allowing up and left moves in the transition while still looping top-left to bottom-right. Those moves read cells you have not finished, or cells that depend on the current one.
- Overflow. `uniquePaths(100, 100)` does not fit in `long long`. Use a modulus when the statement asks, or big integers when it does not.

### Key Takeaway

Grid DP is 1D DP with two indices. Draw the arrows into the cell. If they all come from already-processed cells, the nested loops are safe.

---

## Problem: Minimum Path Sum

### Problem Statement

Given an `m` by `n` grid of non-negative numbers, find a path from `(0, 0)` to `(m-1, n-1)` that moves only right or down and minimizes the sum of visited cells. You must include both endpoints.

Platform: LeetCode 64.

### Example

Input:

```text
grid = [
  [1, 3, 1],
  [1, 5, 1],
  [4, 2, 1]
]
```

Output:

```text
7
```

The path `1 → 3 → 1 → 1 → 1`.

### First Thought / Brute Force

Enumerate paths, track the minimum sum.

### Why Brute Force Is Too Slow

Same exponential family of paths as Unique Paths.

### Identify the DP State

```text
dp[i][j] = minimum sum of a path from (0, 0) to (i, j)
```

### Transition

```text
dp[i][j] = grid[i][j] + min(dp[i - 1][j], dp[i][j - 1])
```

You pay for the current cell exactly once, when the path arrives, and you arrive from the cheaper legal neighbor.

### Base Cases

```text
dp[0][0] = grid[0][0]
```

The first row only comes from the left. The first column only comes from above.

### DP Approach

Fill in increasing row and column order, using only the neighbor that exists.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long minPathSum(const vector<vector<int>>& grid) {
    int m = (int)grid.size();
    int n = (int)grid[0].size();
    const long long INF = (long long)4e18;
    vector<vector<long long>> dp(m, vector<long long>(n, INF));
    dp[0][0] = grid[0][0];
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (i == 0 && j == 0) continue;
            long long best = INF;
            if (i > 0) best = min(best, dp[i - 1][j]);
            if (j > 0) best = min(best, dp[i][j - 1]);
            dp[i][j] = grid[i][j] + best;
        }
    }
    return dp[m - 1][n - 1];
}

int main() {
    vector<vector<int>> grid = {{1, 3, 1}, {1, 5, 1}, {4, 2, 1}};
    cout << minPathSum(grid) << "\n";        // 7
}
```

### Code Explanation

- The cell value is added after the `min`, because every path that ends here pays it, so it factors out of the choice.
- `INF` is only a local starter for the min of existing neighbors. On a fully open grid a neighbor always exists after the start, so `INF` does not leak into the answer.
- Non-negative cells guarantee that a simple right/down path has no benefit from detours. The problem already forbids detours.

### Complexity

```text
Time:  O(m * n)
Space: O(m * n)     or O(n) with a rolling row
```

### Common Mistakes

- Adding `grid[i][j]` inside only one branch, so one entrance forgets to pay.
- Initializing the whole table to 0, then taking `min` with an uncomputed 0.
- Starting `dp[0][0]` at 0 and adding `grid[0][0]` a second time in the loop.

### Key Takeaway

Path-sum DP is unique-paths DP with `min` (or `max`) instead of `+`, plus the weight of the current cell.

---

### Pattern 9 — 2D DP

#### Concept

2D DP means the state has two parameters. A grid is one example, where both parameters are coordinates. Many 2D states are not grids.

Each dimension should answer “what did I forget, and why does the future need it?”

| Dimension pair | What the two axes remember | Typical problem |
| --- | --- | --- |
| `(i, j)` cell coordinates | where the path is | grid paths |
| `(i, w)` items used, capacity left | which prefix of items, and the budget | knapsack |
| `(i, j)` prefixes of two strings | how much of each string is decided | LCS, edit distance |
| `(l, r)` endpoints | the remaining subarray or interval | interval DP |
| `(i, k)` index, segments used | position, and how many groups you already opened | array partition into `k` parts |
| `(u, taken)` node, choice bit | subtree, and whether `u` is used | tree DP |

#### How to identify the dimensions

List the facts a future decision still needs. Each independent fact that cannot be reconstructed from the others becomes a dimension.

Example: longest common subsequence. After you have matched some prefix, the future cares about **how many characters of `a` are already consumed** and **how many of `b` are consumed**. It does not care which particular matching you used, only the best length for that pair of prefixes. Two dimensions, `dp[i][j]`.

If you add a third fact — “I must still match a special character later” — you grow a third dimension or you redesign the state. Extra dimensions are how DP gets too slow. The art is proving a fact is unnecessary.

#### Base cases and order

Initialize the slice where one dimension is zero (empty prefix, zero capacity, interval of length 1). Fill so that every read looks toward the base. For two prefixes, increasing `i` and increasing `j` works when the transition only reads smaller `i` or smaller `j`.

#### Complexity

Two dimensions cost the product of their sizes, times the work inside the transition. `n * m` states and `O(1)` work is `O(nm)`. `n * n` states and a loop of length `n` inside is `O(n^3)` (interval DP).

#### Common mistakes

- Adding a dimension “just in case” and exceeding memory. `dp[1000][1000][1000]` does not exist in contest memory.
- Swapping the meaning of the axes halfway through the code.
- Filling `j` in the outer loop and `i` in the inner loop when the transition reads `dp[i][j-1]` from a row you have not computed. Match the loop order to the dependencies, not to habit.

The next pattern is the most important non-grid 2D example.

---

### Pattern 10 — String DP

#### Concept

String DP builds an answer on prefixes (sometimes suffixes) of one or two strings. The state remembers how far you have processed each string, and sometimes a small extra flag (the previous character matched, the last deleted letter, whether the string so far is empty).

#### How to identify it

Two strings and a question about subsequences, substrings, alignments, or edits. One string and a palindrome question often becomes either string DP on prefixes or interval DP on `[l, r]`. Both appear in the next chapter.

---

## Problem: Longest Common Subsequence (LCS)

### Problem Statement

A subsequence is formed by deleting some characters without reordering the rest. Given strings `a` and `b`, return the length of their longest common subsequence.

Platform: LeetCode 1143. CSES Longest Common Subsequence asks you to reconstruct one such string as well.

### Example

Input:

```text
a = abcde
b = ace
```

Output:

```text
3
```

The subsequence `ace`.

### First Thought / Brute Force

Generate every subsequence of `a` and test whether it is a subsequence of `b`. A string of length `n` has `2^n` subsequences.

### Why Brute Force Is Too Slow

For `n = m = 1000`, `2^1000` is impossible. The DP is `O(nm)`, about `10^6` cells, which is comfortable. `n = m = 5000` is the edge of `O(nm)` time and of memory if you store ints. CSES allows `n, m ≤ 5000`, so you implement `O(nm)` carefully. Reconstructing the string needs the table or parent pointers. The length alone can be computed with two rolling rows.

### Identify the DP State

```text
dp[i][j] = length of the LCS of a[0 .. i) and b[0 .. j)
```

`i` and `j` are prefix **lengths**, so the last characters of those prefixes are `a[i - 1]` and `b[j - 1]`. The strings themselves stay 0-indexed. The extra row and column are the empty prefixes.

### Transition

```text
if a[i - 1] == b[j - 1]:
    dp[i][j] = dp[i - 1][j - 1] + 1
else:
    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
```

**Why the equal case takes the diagonal.** If the last characters match, there is an optimal LCS that matches them to each other. Suppose an optimal subsequence matches `a[i-1]` to something earlier in `b`, or does not use it. You can rematch `a[i-1]` with `b[j-1]` without losing length, because those characters are equal and both are still free at the ends of the prefixes. So it is enough to take the best solution of the shorter prefixes and add 1.

You should **not** also take `max` with the skip options in the equal case if you want one clean recurrence. Adding 1 to the diagonal is always at least as good as skipping one of the two equal characters (skipping yields `dp[i-1][j]` or `dp[i][j-1]`, and both are ≤ `dp[i-1][j-1] + 1`). Using only the diagonal when they match is correct.

**Why the unequal case takes a max of skips.** The last characters cannot be matched to each other. At least one of them is absent from some optimal subsequence. Drop `a[i-1]` (answer `dp[i-1][j]`) or drop `b[j-1]` (answer `dp[i][j-1]`). One of those choices preserves an optimal subsequence.

### Base Cases

```text
dp[0][j] = 0 for all j
dp[i][0] = 0 for all i
```

An empty string has no characters in common with anything.

### DP Approach

Fill `i` from 1 to `n`, and for each `i` fill `j` from 1 to `m`. Every transition reads a smaller `i`, a smaller `j`, or both.

The length is `dp[n][m]`.

To reconstruct one subsequence, start at `(n, m)`. If the characters match, append that character and step to `(i-1, j-1)`. Otherwise step to the neighbor with the larger `dp` value. Reverse the collected characters at the end.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

int lcsLength(const string& a, const string& b) {
    int n = (int)a.size();
    int m = (int)b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[n][m];
}

string lcsString(const string& a, const string& b) {
    int n = (int)a.size();
    int m = (int)b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    string sub;
    int i = n, j = m;
    while (i > 0 && j > 0) {
        if (a[i - 1] == b[j - 1]) {
            sub.push_back(a[i - 1]);
            i--;
            j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }
    reverse(sub.begin(), sub.end());
    return sub;
}

int main() {
    cout << lcsLength("abcde", "ace") << "\n";          // 3
    cout << lcsString("abcde", "ace") << "\n";          // ace
    cout << lcsLength("ABCBDAB", "BDCABA") << "\n";     // 4
}
```

### Code Explanation

- `dp` is `(n+1)` by `(m+1)` so index `i` means “first `i` characters,” and row 0 / column 0 are the empty-prefix bases. The characters live at `a[i-1]`, not `a[i]`. Off-by-one here is the standard LCS bug.
- The equal branch adds 1 to the diagonal only.
- The unequal branch does not add 1. Skipping a character does not extend the subsequence.
- Reconstruction walks from the answer cell back to a base. When the characters differ, moving toward the larger neighbor stays on an optimal path. `>=` versus `>` only changes which optimal subsequence you print when both skips are equal.
- The walk collects characters in reverse, so `reverse` fixes the order.

### Complexity

```text
Time:  O(n * m)
Space: O(n * m)     O(min(n, m)) if you only need the length and keep two rows
```

### Common Mistakes

- Comparing `a[i]` with `b[j]` while `dp[i][j]` means prefixes of length `i` and `j`. That reads one past the prefix, or off the end of the string.
- Writing `dp[i][j] = dp[i-1][j-1] + 1` even when the characters differ.
- Taking `max(dp[i-1][j], dp[i][j-1], dp[i-1][j-1] + 1)` when they differ. The `+1` is illegal unless the characters match.
- Returning a subsequence that is not a subsequence because reconstruction stepped diagonally on a mismatch.
- Using substrings (contiguous) logic for a subsequence problem. Contiguous is a different DP (and often a different algorithm).

### Key Takeaway

`dp[i][j]` on two prefixes, diagonal when the ends match, max of the two skips when they do not: that is LCS. Edit distance, shortest common supersequence, and longest palindromic subsequence are variations of this decision.


---

## 10. Important String DP Problems

LCS is the template. The next four problems change the question and keep the habit: define prefixes or intervals, then decide what happens to the ends.

---

## Problem: Longest Palindromic Subsequence

### Problem Statement

Return the length of the longest subsequence of `s` that is a palindrome.

Platform: LeetCode 516.

### Example

Input:

```text
s = bbbab
```

Output:

```text
4
```

One such subsequence is `bbbb`.

### First Thought / Brute Force

Try all subsequences and keep the longest palindrome, or run LCS against the reversed string without realizing it.

### Why Brute Force Is Too Slow

`2^n` subsequences. `n ≤ 1000` in the usual version, so you want `O(n^2)`.

### Identify the DP State

Two equivalent states exist. Both are worth knowing.

**As LCS.** A palindromic subsequence is a common subsequence of `s` and its reverse. The length is `LCS(s, reverse(s))`. The state is the LCS state. This is the fastest way to *remember* the algorithm if you already trust LCS. It uses the same `O(n^2)` time.

**As an interval**, which is the version this section develops, because the next chapter is interval DP:

```text
dp[l][r] = length of the longest palindromic subsequence of s[l .. r]
           (inclusive indices)
```

### Transition

```text
if l == r:
    dp[l][r] = 1
else if s[l] == s[r]:
    dp[l][r] = dp[l + 1][r - 1] + 2          // both ends join the palindrome
else:
    dp[l][r] = max(dp[l + 1][r], dp[l][r - 1])  // drop one end
```

When the ends match, any palindromic subsequence of the inside can grow by those two characters. When `r = l + 1` and the two characters match, the inside is empty and the length is 2. The code must not read `dp[l+1][r-1]` when that interval is inverted. Treat an empty inside as 0.

When the ends differ, at least one of them is missing from some optimal palindromic subsequence. Try both ways of dropping an end.

### Base Cases

```text
dp[i][i] = 1          // one character is a palindrome
dp[l][r] = 0          // if l > r, the interval is empty
```

### DP Approach

Compute short intervals before long ones. Iterate the length `len` from 1 to `n`. For each left endpoint `l`, set `r = l + len - 1`.

The answer is `dp[0][n - 1]`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

int longestPalindromeSubseq(const string& s) {
    int n = (int)s.size();
    vector<vector<int>> dp(n, vector<int>(n, 0));
    for (int len = 1; len <= n; len++) {
        for (int l = 0; l + len - 1 < n; l++) {
            int r = l + len - 1;
            if (len == 1) {
                dp[l][r] = 1;
            } else if (s[l] == s[r]) {
                dp[l][r] = (len == 2 ? 0 : dp[l + 1][r - 1]) + 2;
            } else {
                dp[l][r] = max(dp[l + 1][r], dp[l][r - 1]);
            }
        }
    }
    return n == 0 ? 0 : dp[0][n - 1];
}

int main() {
    cout << longestPalindromeSubseq("bbbab") << "\n";   // 4
    cout << longestPalindromeSubseq("cbbd") << "\n";    // 2
}
```

### Code Explanation

- `len` is the number of characters in `[l, r]`. Shorter lengths are finished before a longer length reads them.
- `len == 2` and matching ends would look at `dp[l+1][r-1] = dp[r][l]`, which is outside the interval. The empty inside contributes 0, so the answer is 2.
- The mismatch branch reads `[l+1, r]` and `[l, r-1]`, both of length `len - 1`, already computed in the previous `len` pass.
- This is the same decision as LCS, restricted to one string read from both ends.

### Complexity

```text
Time:  O(n^2)
Space: O(n^2)
```

The LCS-with-reverse implementation has the same complexity.

### Common Mistakes

- Filling the table in the wrong order, so `dp[l+1][r-1]` is still 0 when you read it.
- Adding 2 when the ends match even if you also need the inside, but reading an inverted interval and pulling a garbage 0 that happens to look right only for length 2.
- Confusing subsequence with substring. The longest palindromic *substring* can be solved by expanding around centers in `O(n^2)` as well, but the recurrence is different and the answer is contiguous.

### Key Takeaway

Palindromic subsequence is “do the ends match?” on an interval. Compute by increasing length.

---

## Problem: Edit Distance

### Problem Statement

You may insert a character, delete a character, or replace a character. Each operation costs 1. Return the minimum number of operations that turns string `a` into string `b`.

Platform: LeetCode 72. CSES Edit Distance is the same problem.

### Example

Input:

```text
a = horse
b = ros
```

Output:

```text
3
```

One optimal sequence: `horse → rorse` (replace `h`), `rorse → rose` (delete `r`), `rose → ros` (delete `e`).

### First Thought / Brute Force

Recurse on the two suffixes, trying all three edits at the first mismatch, plus a free skip when the current characters already match.

### Why Brute Force Is Too Slow

Each step branches up to 3 ways and the depth is `n + m`. The distinct subproblems are only `(n+1) * (m+1)` prefixes. Memoize those, or fill a table.

### Identify the DP State

```text
dp[i][j] = minimum edits to turn a[0 .. i) into b[0 .. j)
```

Again `i` and `j` are prefix lengths.

### Transition

```text
if i > 0 and j > 0 and a[i - 1] == b[j - 1]:
    dp[i][j] = dp[i - 1][j - 1]                 // already equal, pay nothing
else:
    dp[i][j] = 1 + min(
        dp[i][j - 1],        // insert b[j - 1] at the end of the current a-prefix
        dp[i - 1][j],        // delete a[i - 1]
        dp[i - 1][j - 1]     // replace a[i - 1] with b[j - 1]
    )
```

The three edits:

- **Insert** `b[j-1]`. After the insert, `a`’s first `i` characters must match `b`’s first `j-1` characters. Cost 1 plus `dp[i][j-1]`.
- **Delete** `a[i-1]`. Then `a`’s first `i-1` characters must match `b`’s first `j` characters.
- **Replace** `a[i-1]` by `b[j-1]` (or substitute even if you prefer to think “match them by paying 1”). Then the shorter prefixes must match.

When the ends are already equal, replace would be wasteful. Doing nothing and solving the shorter prefixes is optimal. (A replace of a matching character is never cheaper than the free match.)

### Base Cases

```text
dp[0][0] = 0
dp[i][0] = i      // delete the whole prefix of a
dp[0][j] = j      // insert the whole prefix of b
```

Turning a string into empty is `i` deletes. Turning empty into a string is `j` inserts.

### DP Approach

The base row and column are filled first. Then every other cell reads a cell above, to the left, or on the diagonal, all of which exist if you iterate `i` and `j` upward.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

int editDistance(const string& a, const string& b) {
    int n = (int)a.size();
    int m = (int)b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 0; i <= n; i++) dp[i][0] = i;
    for (int j = 0; j <= m; j++) dp[0][j] = j;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + min({dp[i][j - 1], dp[i - 1][j], dp[i - 1][j - 1]});
            }
        }
    }
    return dp[n][m];
}

int main() {
    cout << editDistance("horse", "ros") << "\n";                 // 3
    cout << editDistance("intention", "execution") << "\n";       // 5
}
```

### Code Explanation

- The loops that set `dp[i][0]` and `dp[0][j]` are the base cases, not an optimization.
- `min({...})` needs `<algorithm>` via `bits/stdc++.h` and the initializer-list overload. It is C++11 and fine in C++17.
- On a match, the cost does not increase. On a mismatch, exactly one edit is charged and all three shorter problems are legal candidates.
- The answer `dp[n][m]` is the full strings.

### Complexity

```text
Time:  O(n * m)
Space: O(n * m)     or O(min(n, m)) with two rolling rows if you only need the number
```

### Common Mistakes

- Setting the base row to 0, as in LCS. Edit distance to empty is not 0.
- Charging 1 when the characters match.
- Forgetting the replace option `dp[i-1][j-1]`, which leaves only insertions and deletions. That computes a different (larger) distance.
- Indexing `a[i]` instead of `a[i-1]`.

### Key Takeaway

Edit distance is LCS’s cousin: prefixes of both strings, a free diagonal when the ends match, and three paid moves when they do not. The base row and column are the costs of building a string from nothing.

---

## Problem: Distinct Subsequences

### Problem Statement

Return the number of distinct subsequences of `s` that equal `t`. Two subsequences are different when they come from different index sets, even if the characters look the same.

Platform: LeetCode 115.

### Example

Input:

```text
s = rabbbit
t = rabbit
```

Output:

```text
3
```

The three ways pick different `b`s from `s` to match the two `b`s in `t`.

### First Thought / Brute Force

Match `t` against `s` with a recursive search that either consumes the current character of `s` or skips it.

### Why Brute Force Is Too Slow

The search is exponential in the number of repeated characters. `s` and `t` can have length up to 1000. There are `O(|s| * |t|)` prefix pairs.

### Identify the DP State

```text
dp[i][j] = number of ways to form t[0 .. j) as a subsequence of s[0 .. i)
```

### Transition

Always, you may skip `s[i - 1]`:

```text
dp[i][j] includes dp[i - 1][j]
```

If `s[i - 1] == t[j - 1]`, you may also match them:

```text
dp[i][j] includes dp[i - 1][j - 1]
```

So:

```text
if s[i - 1] == t[j - 1]:
    dp[i][j] = dp[i - 1][j] + dp[i - 1][j - 1]
else:
    dp[i][j] = dp[i - 1][j]
```

The two branches are disjoint: one uses index `i-1` as the match for `t[j-1]`, the other does not.

### Base Cases

```text
dp[i][0] = 1    for every i, including 0
dp[0][j] = 0    for every j > 0
```

There is one way to form the empty string: choose no characters. There is no way to form a non-empty `t` from an empty `s`.

### DP Approach

Fill increasing prefixes. The answer is `dp[n][m]` where `n = s.size()` and `m = t.size()`. Counts can be large. LeetCode’s answer fits in a 32-bit signed integer under its constraints, but a contest version often wants `long long` or a modulus. The code below uses `long long`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long numDistinct(const string& s, const string& t) {
    int n = (int)s.size();
    int m = (int)t.size();
    vector<vector<long long>> dp(n + 1, vector<long long>(m + 1, 0));
    for (int i = 0; i <= n; i++) dp[i][0] = 1;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            dp[i][j] = dp[i - 1][j];                       // skip s[i - 1]
            if (s[i - 1] == t[j - 1]) {
                dp[i][j] += dp[i - 1][j - 1];             // match it
            }
        }
    }
    return dp[n][m];
}

int main() {
    cout << numDistinct("rabbbit", "rabbit") << "\n";     // 3
    cout << numDistinct("babgbag", "bag") << "\n";        // 5
}
```

### Code Explanation

- Column 0 is entirely 1. That is the empty-target base, and it is what makes the first real matches work: matching the first character of `t` adds `dp[i-1][0] = 1`.
- Row 0 stays 0 for `j > 0` because the vector was created full of zeros and the loops start at 1.
- Skip is unconditional. Match is conditional. They add because they correspond to different index choices.

### Complexity

```text
Time:  O(n * m)
Space: O(n * m)     or O(m) with a rolling row, updated from the right so you do not reuse a fresh value
```

### Common Mistakes

- Setting `dp[0][0] = 0`, which kills every count.
- Adding `dp[i][j-1]` (same `i`) and matching one character of `s` to several characters of `t`.
- Using `int` when the real count overflows. The problem of “number of ways” should make you look at the modulus line of the statement before choosing the type.

### Key Takeaway

Distinct subsequences is a counting LCS. Skip always. Match only on equal characters, and add the two disjoint choices.

---

## 11. Sequence DP

Sequence DP chooses a subset or subsequence of an array under an order constraint. LIS is the problem every contestant is expected to know in two complexities.

---

## Problem: Longest Increasing Subsequence (LIS)

### Problem Statement

Given an array `a[0..n-1]`, return the length of the longest strictly increasing subsequence. The elements do not have to be contiguous. Their indices must increase.

Platform: LeetCode 300. CSES Increasing Subsequence asks for the length with `n ≤ 2·10^5`, so the `O(n log n)` method is required.

### Example

Input:

```text
a = [10, 9, 2, 5, 3, 7, 101, 18]
```

Output:

```text
4
```

One LIS is `2, 3, 7, 101`. Another is `2, 5, 7, 18`.

### First Thought / Brute Force

Try every subset, check whether the chosen values increase with their indices, keep the largest subset. That is `O(n * 2^n)`.

A better brute force still exponential: at each index, take it if it is larger than the previous taken value, or skip it.

### Why Brute Force Is Too Slow

`n ≤ 2500` on LeetCode needs at most `O(n^2)`. `n ≤ 2·10^5` on CSES needs `O(n log n)`.

### Identify the DP State

The `O(n^2)` state:

```text
dp[i] = length of the longest increasing subsequence that ends at index i
```

The ending index is part of the state because the next append decision needs the last value, and `a[i]` is that value.

### Transition

```text
dp[i] = 1 + max{ dp[j] : j < i and a[j] < a[i] }
```

If no such `j` exists, the max is 0 and `dp[i] = 1`. The subsequence consisting of `a[i]` alone is always legal.

**Why this is optimal.** Any increasing subsequence ending at `i` has a predecessor `j`, or it has length 1. The predecessor itself should be the best increasing subsequence ending at `j`. Using a worse subsequence ending at the same `j` cannot help.

### Base Cases

```text
dp[i] = 1 for every i, before looking at predecessors
```

### Answer

```text
max over i of dp[i]
```

Not `dp[n-1]`. The best subsequence might end in the middle.

### DP Approach (`O(n^2)`)

For each `i`, scan all `j < i`. Then take the maximum of `dp`.

### C++ Solution (`O(n^2)`)

```cpp
#include <bits/stdc++.h>
using namespace std;

int lisN2(const vector<int>& a) {
    int n = (int)a.size();
    if (n == 0) return 0;
    vector<int> dp(n, 1);
    int best = 1;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (a[j] < a[i]) dp[i] = max(dp[i], dp[j] + 1);
        }
        best = max(best, dp[i]);
    }
    return best;
}

int main() {
    cout << lisN2({10, 9, 2, 5, 3, 7, 101, 18}) << "\n";   // 4
    cout << lisN2({7, 7, 7, 7}) << "\n";                   // 1
}
```

### Code Explanation

- Every `dp[i]` starts at 1, the singleton.
- The inner loop only extends from a strictly smaller value. Change `<` to `<=` if the problem wants a non-decreasing subsequence.
- `best` tracks the answer definition: the best ending anywhere.

### Complexity

```text
Time:  O(n^2)
Space: O(n)
```

### The `O(n log n)` method

The quadratic DP is the right mental model. It is too slow when `n = 1e5`. The faster algorithm keeps a different array.

```text
tails[len] = the smallest possible tail value of any increasing
             subsequence of length len+1 seen so far
```

`tails` is sorted strictly increasing. That is the fact that makes binary search legal.

Process the array from left to right. For each value `x`:

- If `x` is larger than every tail, it extends the longest subsequence. Append `x`.
- Otherwise find the first tail that is `≥ x` (`lower_bound`) and replace it with `x`.

The length of `tails` at the end is the LIS length.

#### Why replacement is correct

Maintain this invariant: after each prefix of the array, `tails[k]` is the smallest tail of any strictly increasing subsequence of length `k+1` inside that prefix, and `tails` is strictly increasing.

`tails` is strictly increasing because a subsequence of length `k+2` ends with something larger than its own predecessor, and that predecessor is at least `tails[k]` (the smallest tail of length `k+1`). So the smallest tail of length `k+2` is `> tails[k]`.

Now consider a new value `x`.

**Case append.** `x` is greater than every tail, so it is greater than `tails.back()`, the smallest tail of a longest subsequence. There is a real subsequence of that length ending at that tail, earlier in the array, and `x` extends it. A new length exists, and `x` is its only tail so far, hence the smallest.

**Case replace.** Let `pos = lower_bound(tails, x)`. Then `tails[pos] ≥ x`, and if `pos > 0` then `tails[pos - 1] < x`. There is an increasing subsequence of length `pos` ending at `tails[pos - 1]`, and that element sits at some earlier index. Appending `x` produces an increasing subsequence of length `pos+1` ending at `x`. No previously seen subsequence of length `pos+1` ends below `x`, because `tails[pos]` was the smallest such tail and `tails[pos] ≥ x`. So setting `tails[pos] = x` preserves the minimum. If `x` equals `tails[pos]`, the assignment changes nothing, which is correct for a *strictly* increasing subsequence: `x` cannot extend a subsequence that already ends at `x`.

Replacing a tail does not throw away a length. The slot `pos` still certifies that length `pos+1` exists. It only improves the tail, which makes future extensions easier. A smaller tail can only help, because the test to extend is `previous < x`.

#### What `tails` is not

`tails` is not always one subsequence of the original array. Each slot is the best tail for that length, and those tails may come from different subsequences. Reading `tails` left to right can print values that never appear together. The *length* is still correct. To reconstruct one actual subsequence, store for each index the predecessor from the `O(n^2)` DP, or store indices alongside the binary-search method.

#### Non-decreasing subsequence

Use `upper_bound` instead of `lower_bound`. You may extend a tail equal to `x`, so you replace the first tail that is **strictly greater** than `x`.

### C++ Solution (`O(n log n)`, length only)

```cpp
#include <bits/stdc++.h>
using namespace std;

int lisNLogN(const vector<int>& a) {
    vector<int> tails;
    for (int x : a) {
        auto it = lower_bound(tails.begin(), tails.end(), x);  // first tail >= x
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    return (int)tails.size();
}

int main() {
    cout << lisNLogN({10, 9, 2, 5, 3, 7, 101, 18}) << "\n";   // 4
    cout << lisNLogN({7, 7, 7, 7}) << "\n";                   // 1
    cout << lisNLogN({1, 2, 3, 4}) << "\n";                   // 4
}
```

### Code Explanation

- `lower_bound` assumes `tails` is sorted. The invariant keeps it sorted, so we never sort explicitly.
- Appending grows the answer. Replacing does not.
- Duplicates do not grow a strict LIS, because `lower_bound` finds the existing equal tail and overwrites it with the same value.

### Complexity

```text
Time:  O(n log n)
Space: O(n)
```

### Walk-through of the example

| `x` | Action | `tails` afterward |
| --- | --- | --- |
| 10 | append | `[10]` |
| 9 | replace 10 | `[9]` |
| 2 | replace 9 | `[2]` |
| 5 | append | `[2, 5]` |
| 3 | replace 5 | `[2, 3]` |
| 7 | append | `[2, 3, 7]` |
| 101 | append | `[2, 3, 7, 101]` |
| 18 | replace 101 | `[2, 3, 7, 18]` |

Length 4. Notice `[2, 3, 7, 18]` happens to be a real subsequence here. That will not always be true. Trust the length, not the contents, unless you added predecessor links.

### Common Mistakes

- Returning `dp[n-1]` in the quadratic DP.
- Using `lower_bound` for a non-decreasing problem, which refuses equal elements.
- Using `upper_bound` for a strict problem, which allows equals and overcounts.
- Printing `tails` as the subsequence.
- Assuming the `O(n log n)` method is a different problem. It computes the same length. If you cannot explain the invariant, use `O(n^2)` whenever it fits. A fast wrong answer scores zero.

### Key Takeaway

`dp[i]` = best length **ending at** `i` is the subsequence pattern. The answer is a max over endings. The `O(n log n)` algorithm keeps the smallest tail of each length so binary search can place the next value.

---

## 12. Interval DP

### Concept

Interval DP solves a problem on every contiguous subarray (or every chain of matrices, or every span of balloons). The state is the two endpoints:

```text
dp[l][r] = best answer on the inclusive interval [l, r]
```

The transition almost always **splits** the interval, or **peels** its ends:

```text
dp[l][r] = best over k in [l, r) of  ( dp[l][k] + dp[k + 1][r] + cost of combining )
```

or, when the last action removes an interior point `k`:

```text
dp[l][r] = best over k strictly between l and r of
           ( dp[l][k] + dp[k][r] + cost that uses k as the last action )
```

### Why the order of computation is the whole implementation

`dp[l][r]` depends on **shorter** intervals. If you loop `l` from 0 to `n-1` and `r` from 0 to `n-1` naively, you will read intervals that are not ready.

The safe order is by length:

```text
for len = 1, 2, ..., n:                 // or the minimum length that has a decision
    for l = 0, 1, ..., n - len:
        r = l + len - 1
        compute dp[l][r] from shorter intervals
```

Base case: an interval too small to split.

```text
dp[i][i] = 0          // one matrix alone, nothing to multiply
                      // or one element, no burst, depending on the problem
```

### How to identify it

- The objects are in a line and you repeatedly combine neighbors, or you remove an element and the two sides become independent.
- The cost of a choice depends on the whole current interval, not only on a prefix.
- `n` is small: `O(n^3)` needs `n` around 100 to 500.

If the two sides of a split did not become independent, the state `dp[l][r]` is not enough.

---

## Problem: Matrix Chain Multiplication

### Problem Statement

You have `n` matrices. Matrix `i` (0-indexed) has dimensions `p[i] × p[i+1]`. You may parenthesize the product `M0 · M1 · ... · M(n-1)` however you like. Multiplying a `x × y` matrix by a `y × z` matrix costs `x * y * z`. Return the minimum cost to compute the full product. The matrices are not actually multiplied. Only the parenthesization cost matters.

This is the classical problem. It shows up in textbooks and in contests under “minimum cost to merge a chain.”

### Example

Input:

```text
p = [10, 30, 5, 60]
```

Three matrices: `10×30`, `30×5`, `5×60`.

Output:

```text
4500
```

`(M0 M1) M2` costs `10*30*5 + 10*5*60 = 1500 + 3000 = 4500`.

`M0 (M1 M2)` costs `30*5*60 + 10*30*60 = 9000 + 18000 = 27000`.

### First Thought / Brute Force

Try every place to put the outermost multiplication, and recurse on both sides. The number of parenthesizations is the Catalan number, exponential in `n`.

### Why Brute Force Is Too Slow

The recursion recomputes the same subchain many times. There are `O(n^2)` subchains and `O(n)` split points, so a table is `O(n^3)`. For `n ≤ 300` or so, that passes. For `n ≤ 2000` it does not, and you would look for Knuth optimization (later), which does **not** automatically apply to every chain problem.

### Identify the DP State

```text
dp[l][r] = minimum cost to multiply matrices l, l+1, ..., r inclusive
```

### Transition

The last multiplication splits the chain after some matrix `k`, with `l ≤ k < r`:

```text
dp[l][r] = min over k in [l, r) of
           dp[l][k] + dp[k + 1][r] + p[l] * p[k + 1] * p[r + 1]
```

The left product is a single matrix of shape `p[l] × p[k+1]`. The right product has shape `p[k+1] × p[r+1]`. Multiplying them costs `p[l] * p[k+1] * p[r+1]`.

Both subchains are shorter, so optimal substructure applies: an optimal parenthesization uses optimal parenthesizations of the two sides. A worse side could be replaced and the total would drop.

### Base Cases

```text
dp[i][i] = 0
```

One matrix is already a product. Nothing to multiply.

### DP Approach

Length 1 is the base. For length from 2 to `n`, try every split. Answer `dp[0][n-1]`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long matrixChain(const vector<long long>& p) {
    // p.size() == n + 1 for n matrices
    int n = (int)p.size() - 1;
    const long long INF = (long long)4e18;
    vector<vector<long long>> dp(n, vector<long long>(n, 0));
    for (int len = 2; len <= n; len++) {
        for (int l = 0; l + len - 1 < n; l++) {
            int r = l + len - 1;
            long long best = INF;
            for (int k = l; k < r; k++) {
                long long cost = dp[l][k] + dp[k + 1][r] + p[l] * p[k + 1] * p[r + 1];
                best = min(best, cost);
            }
            dp[l][r] = best;
        }
    }
    return n == 0 ? 0 : dp[0][n - 1];
}

int main() {
    cout << matrixChain({10, 30, 5, 60}) << "\n";    // 4500
}
```

### Code Explanation

- `p` has one extra entry because `n` matrices have `n+1` dimensions.
- `k` stops before `r` so the right side `k+1 .. r` is non-empty, and `k` starts at `l` so the left side is non-empty.
- The multiply cost uses `p[l]`, `p[k+1]`, and `p[r+1]`, the three dimensions that survive after the two subproducts are formed.
- `len` from 2 upward guarantees both sides of any split are already computed: each side has fewer than `len` matrices.

### Complexity

```text
Time:  O(n^3)
Space: O(n^2)
```

### Common Mistakes

- Using `p[k]` instead of `p[k+1]` as the shared dimension. Draw two matrices and label the edges before coding.
- Looping `r` from `l+1` in an outer `l` loop that has not yet computed later intervals the split needs. Length order removes the guesswork.
- Storing only `dp[i]` for a prefix. A prefix state cannot price an arbitrary subchain that a split produces in the middle.

### Key Takeaway

Interval DP: state is `[l, r]`, transition is a split, order is increasing length, base is a single cell. Matrix chain is that pattern with cost `p[l] * p[k+1] * p[r+1]`.

---

## Problem: Burst Balloons

### Problem Statement

You are given `nums[0..n-1]`, the values of balloons in a row. When you burst balloon `k`, and its current neighbors are `left` and `right`, you gain `left * nums[k] * right`. After the burst, `left` and `right` become neighbors. Balloons of value 1 sit virtually outside both ends and cannot be burst. Return the maximum coins you can collect by bursting every real balloon.

Platform: LeetCode 312.

### Example

Input:

```text
nums = [3, 1, 5, 8]
```

Output:

```text
167
```

One optimal order is `1`, then `5`, then `3`, then `8`, scoring `3*1*5 + 3*5*8 + 1*3*8 + 1*8*1 = 15 + 120 + 24 + 8 = 167`.

### First Thought / Brute Force

Try every order of bursts. There are `n!` orders.

### Why Brute Force Is Too Slow

`n ≤ 300` on LeetCode. `n!` is absurd. The interval DP is `O(n^3)`.

### Identify the DP State

Thinking about the *first* balloon you burst is painful, because the neighbors of later balloons depend on everything you already removed. Think about the **last** balloon you burst inside an interval. Its neighbors are then the two balloons that bound the interval, which are still alive.

Add sentinels: let `a[0] = 1`, `a[i+1] = nums[i]`, `a[n+1] = 1`. Real balloons are indices `1..n` in `a`.

```text
dp[l][r] = maximum coins from bursting every balloon strictly between l and r,
           while balloon l and balloon r stay alive
```

### Transition

```text
dp[l][r] = max over k with l < k < r of
           dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]
```

`k` is the **last** balloon burst in `(l, r)`. When it bursts, its neighbors are `l` and `r`, because every other balloon in the open interval is already gone. The coins from bursting the left open interval `(l, k)` and the right open interval `(k, r)` were collected earlier and do not interfere: those bursts happened while `k` was still alive, which is exactly what `dp[l][k]` and `dp[k][r]` assume.

### Base Cases

```text
dp[l][r] = 0 when r == l + 1
```

Nothing sits between adjacent balloons, so there is nothing to burst. The code can leave those cells at 0 and only compute gaps of size at least 2.

### DP Approach

Increase the distance `r - l`. A split at `k` produces two strictly smaller distances. The answer is `dp[0][n+1]`, the open interval between the two sentinels, which contains every real balloon.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long maxCoins(const vector<int>& nums) {
    int n = (int)nums.size();
    vector<long long> a(n + 2, 1);
    for (int i = 0; i < n; i++) a[i + 1] = nums[i];
    vector<vector<long long>> dp(n + 2, vector<long long>(n + 2, 0));
    for (int len = 2; len <= n + 1; len++) {          // r - l
        for (int l = 0; l + len <= n + 1; l++) {
            int r = l + len;
            for (int k = l + 1; k < r; k++) {
                long long coins = dp[l][k] + dp[k][r] + a[l] * a[k] * a[r];
                dp[l][r] = max(dp[l][r], coins);
            }
        }
    }
    return dp[0][n + 1];
}

int main() {
    cout << maxCoins({3, 1, 5, 8}) << "\n";          // 167
    cout << maxCoins({1, 5}) << "\n";                // 10
}
```

### Code Explanation

- Sentinels at both ends turn “the balloon has no neighbor” into “the neighbor is 1,” which matches the problem statement and removes edge branches.
- `k` is the last burst, not the first. That single change makes the neighbors known.
- `len = r - l` starts at 2, the smallest interval that contains one balloon (`k` between two walls).
- Subintervals `[l, k]` and `[k, r]` have smaller `r - l`, so they were computed in earlier `len` iterations. Cells that contain no `k` stay 0.

### Complexity

```text
Time:  O(n^3)
Space: O(n^2)
```

### Common Mistakes

- Defining `k` as the first balloon burst. The neighbors are then unknown, and the recurrence is not an interval split.
- Forgetting the sentinel 1s and special-casing the ends with zeros. A zero neighbor wipes out the score.
- Iterating `l` and `r` without increasing gap length, so one side of the split is unread.

### Key Takeaway

When the cost of removing an element depends on its current neighbors, let the state be the last removal inside an interval. The boundaries of the interval are the neighbors.

---

## 13. DP on Trees

### Concept

A tree has no cycles. If you root it anywhere, every subtree is an independent smaller instance, and the subtrees of a node only meet at that node.

The state is usually:

```text
dp[node][state] = best answer in this subtree, given a small choice about the node
```

`state` is whatever the parent still needs to know: “this node was taken”, “this node is matched to a child”, “this node is colored black.” It should be a constant number of bits, or a very small integer. If it grows with `n`, the DP will not be linear.

### DFS + DP

The computation order is postorder. A node’s answer is a function of its children’s answers, so you recurse first and combine on the way back up.

```text
void dfs(u, parent):
    for v in children of u:
        dfs(v, u)
    combine dp[v] into dp[u]
```

That is bottom-up DP whose “smaller states” are subtrees instead of prefixes. The topological order is “children before parent.”

### How to identify it

The input is a tree (or a graph that the statement proves is a tree). The question is a max, min, or count over subsets with a constraint between adjacent nodes. Rooting is free: if the statement does not name a root, pick node 0.

---

## Problem: Maximum Independent Set on a Tree

### Problem Statement

A tree has `n` nodes and `n-1` edges. Node `i` has weight `w[i]`. An independent set contains no two adjacent nodes. Return the maximum total weight of an independent set.

This is the standard introduction to tree DP. The unweighted version (every `w[i] = 1`) asks for the maximum number of nodes.

### Example

Input:

```text
n = 4
w = [3, 2, 1, 4]
edges = 0-1, 1-2, 2-3
```

Output:

```text
7
```

Take nodes 0 and 3 (`3 + 4`). Nodes 1 and 3 give only 6. Nodes 0 and 2 give only 4.

### First Thought / Brute Force

Try every subset and reject those with an edge inside. `2^n` subsets.

### Why Brute Force Is Too Slow

Trees in contests have `n ≤ 1e5`. You need a linear DP.

### Identify the DP State

Root the tree at 0.

```text
dp[u][0] = maximum weight of an independent set in u's subtree, not taking u
dp[u][1] = maximum weight of an independent set in u's subtree, taking u
```

### Transition

If `u` is taken, no child may be taken:

```text
dp[u][1] = w[u] + sum over children v of dp[v][0]
```

If `u` is not taken, each child is free. That child independently chooses its own better option:

```text
dp[u][0] = sum over children v of max(dp[v][0], dp[v][1])
```

The children do not share edges with each other. Every edge from a child goes into its own subtree or up to `u`. Once `u`’s choice is fixed, the subtrees are separate knapsacks with one item of interaction. Summing them is correct.

### Base Cases

A leaf has no children.

```text
dp[leaf][0] = 0
dp[leaf][1] = w[leaf]
```

The sums over an empty child list produce exactly that, so leaves do not need a special branch if `w[u]` is added only in the “take” state.

### DP Approach

DFS from the root. Compute children first. The answer is `max(dp[root][0], dp[root][1])`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> adj;
vector<long long> w, dp0, dp1;

void dfs(int u, int parent) {
    dp1[u] = w[u];
    dp0[u] = 0;
    for (int v : adj[u]) {
        if (v == parent) continue;
        dfs(v, u);
        dp1[u] += dp0[v];                          // child must be skipped
        dp0[u] += max(dp0[v], dp1[v]);             // child is free
    }
}

long long maxIndependentSet(int n, const vector<long long>& weight,
                            const vector<pair<int, int>>& edges) {
    adj.assign(n, {});
    w = weight;
    dp0.assign(n, 0);
    dp1.assign(n, 0);
    for (auto [a, b] : edges) {
        adj[a].push_back(b);
        adj[b].push_back(a);
    }
    dfs(0, -1);
    return max(dp0[0], dp1[0]);
}

int main() {
    cout << maxIndependentSet(4, {3, 2, 1, 4}, {{0, 1}, {1, 2}, {2, 3}}) << "\n"; // 7
    cout << maxIndependentSet(1, {5}, {}) << "\n";                                 // 5
}
```

### Code Explanation

- `parent` stops the DFS from walking back up the undirected edge. Without it the search cycles forever. The tree has no other cycles.
- `dp1[u]` starts at `w[u]` and only adds `dp0` of children, which is the adjacency constraint.
- `dp0[u]` adds the better state of each child. A child’s internal choice is already optimal.
- The root’s parent is `-1`, which matches no node.
- A one-node tree never loops and returns `w[0]` via `dp1`.

### Complexity

```text
Time:  O(n)
Space: O(n)
```

Each edge is examined a constant number of times.

### Common Mistakes

- Forgetting the parent pointer and recursing forever.
- Allowing a taken node to add `dp1` of a child. That takes both ends of an edge.
- Defining only `dp[u]` with no taken/not-taken bit, then being unable to enforce the edge into the parent. The extra bit is the point of the state.
- Rooting and then also adding an edge from the root to a fictional parent.

### Key Takeaway

Tree DP is postorder DFS. The state at a node is the answer for its subtree plus the one bit the parent needs. Independent set needs the bit “did I take this node?”

---

## Problem: Tree Matching

### Problem Statement

A matching is a set of edges with no shared endpoint. Given a tree, return the size of a maximum matching (the maximum number of edges).

Platform: CSES Tree Matching.

### Example

Input:

```text
n = 4
edges (1-indexed in the statement, 0-indexed here) = 0-1, 1-2, 2-3
```

Output:

```text
2
```

Take edges `0-1` and `2-3`, or just note that a path of 3 edges has a maximum matching of 2. On this path of 3 edges (4 nodes) the maximum matching has 2 edges. A path of 2 edges (3 nodes) has a maximum matching of 1.

Check a smaller sample in code: three nodes in a path return 1. A single edge returns 1.

### First Thought / Brute Force

General maximum matching is Edmonds’ algorithm. On a tree that is unnecessary machinery. A DFS DP is enough.

### Why Brute Force Is Too Slow

`n ≤ 2·10^5` on CSES. You need `O(n)`.

### Identify the DP State

```text
dp[u][0] = maximum matching inside u's subtree when u is not matched to any child
dp[u][1] = maximum matching inside u's subtree when u is matched to exactly one child
```

“Matched to the parent” is not stored as a third state. If the parent later matches the edge `parent-u`, the parent will use `dp[u][0]`, because `u` then has no free slot for a child. The edge to the parent is counted in the parent, not in `u`.

### Transition

Not matching `u` downward: each child contributes its own best matching.

```text
dp[u][0] = sum over children v of max(dp[v][0], dp[v][1])
```

Matching `u` to one child `v`: add the edge, and `v` must be in state 0 (not already matched to one of its children). Every other child `w` stays at its best.

```text
dp[u][1] = max over children v of
           ( dp[u][0] - max(dp[v][0], dp[v][1]) + dp[v][0] + 1 )
```

The formula starts from `dp[u][0]`, removes the contribution you had stored for `v`, replaces it with `dp[v][0]`, and adds 1 for the new edge. Taking the max over `v` chooses the best child to connect.

### Base Cases

A leaf:

```text
dp[leaf][0] = 0
dp[leaf][1] = 0
```

A leaf has no child to match. Both formulas produce 0 when the child list is empty. `dp[u][1]` stays 0 if you initialize it to 0 and there is no `v` to improve it.

### DP Approach

Postorder DFS. Answer `max(dp[root][0], dp[root][1])`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> adj;
vector<int> dp0, dp1;

void dfs(int u, int parent) {
    dp0[u] = 0;
    dp1[u] = 0;
    for (int v : adj[u]) {
        if (v == parent) continue;
        dfs(v, u);
        dp0[u] += max(dp0[v], dp1[v]);
    }
    for (int v : adj[u]) {
        if (v == parent) continue;
        int take = dp0[u] - max(dp0[v], dp1[v]) + dp0[v] + 1;
        dp1[u] = max(dp1[u], take);
    }
}

int treeMatching(int n, const vector<pair<int, int>>& edges) {
    adj.assign(n, {});
    dp0.assign(n, 0);
    dp1.assign(n, 0);
    for (auto [a, b] : edges) {
        adj[a].push_back(b);
        adj[b].push_back(a);
    }
    if (n == 0) return 0;
    dfs(0, -1);
    return max(dp0[0], dp1[0]);
}

int main() {
    cout << treeMatching(4, {{0, 1}, {1, 2}, {2, 3}}) << "\n";   // 2
    cout << treeMatching(3, {{0, 1}, {1, 2}}) << "\n";           // 1
    cout << treeMatching(2, {{0, 1}}) << "\n";                   // 1
}
```

### Code Explanation

- The first child loop builds `dp0`, the matching that leaves `u` free of its children.
- The second loop tries each child as the unique partner of `u`. Subtracting `max(dp0[v], dp1[v])` removes the old contribution so it is not counted twice.
- `+ 1` is the edge `(u, v)`.
- `dp1` is 0 when `u` has no children, so a leaf is not a fake matching.

### Complexity

```text
Time:  O(n)
Space: O(n)
```

### Common Mistakes

- Counting the edge in both the child and the parent.
- Using `dp1[v]` when `u` is matched to `v`. That matches `v` to two nodes.
- A general-graph matching algorithm that is longer and easier to get wrong. The tree is the reason the DP exists.

### Key Takeaway

Matching on a tree is independent set’s sibling: the bit at `u` records whether the matching edge goes downward. The parent counts the upward edge.

---

## 14. Bitmask DP

### What a bitmask is

A bitmask is an integer whose bits represent a small set. Bit `i` (value `1 << i`) means element `i` is in the set.

```text
mask = 0b0110     elements 1 and 2 are present (0-indexed bits)
```

Useful operations:

```cpp
(mask >> i) & 1          // is i in the set?
mask | (1 << i)          // add i
mask & ~(1 << i)         // remove i
mask ^ (1 << i)          // toggle i
__builtin_popcount(mask) // how many bits are on (use popcountll for 64-bit)
```

There are exactly `2^n` subsets of an `n`-element set, and they are the integers `0 .. (1<<n) - 1`. When `n ≤ 20`, `2^n` is about a million. That is small enough to be a DP dimension. When `n ≤ 15` or `16`, you can often afford a second dimension of size `n`.

### Why bitmasks are useful

A subset is the natural state for “which items have I already used?” If you stored the subset as a `vector`, you could not use it as an array index. The integer *is* the index.

### State

```text
dp[mask] = best answer after deciding exactly the set of elements in mask
```

Often you also need the identity of one special element, usually the last one:

```text
dp[mask][i] = best answer after using the set mask, with i as the last element
```

`i` should be a member of `mask`. Cells where bit `i` is off are unused.

---

## Problem: Traveling Salesman Problem (TSP)

### Problem Statement

There are `n` cities, numbered `0 .. n-1`. `dist[i][j]` is the cost of flying from `i` to `j`. Start at city 0, visit every city exactly once, and return to city 0. Return the minimum tour cost. `n` is at most 16 or so.

This is the classical Held–Karp DP. Contest problems phrase it as a shortest Hamiltonian cycle, or they drop the return edge and ask only for a Hamiltonian path.

### Example

Input:

```text
n = 4
dist =
  0 10 15 20
  10  0 35 25
  15 35  0 30
  20 25 30  0
```

Output:

```text
80
```

One optimal tour is `0 → 1 → 3 → 2 → 0` with cost `10 + 25 + 30 + 15 = 80`.

### First Thought / Brute Force

Permute the middle cities and evaluate the cycle. That is `(n-1)!` tours. For `n = 10` that is already millions of heavy evaluations. For `n = 15` it is impossible. Held–Karp is `O(2^n * n^2)`, about `1.5·10^7` operations at `n = 15` and about `7·10^7` at `n = 16`.

### Why Brute Force Is Too Slow

Factorial grows faster than `2^n n^2` once `n` leaves the single digits. The DP reuses “best way to reach this subset and end at this city.”

### Identify the DP State

```text
dp[mask][i] = minimum cost to start at city 0, visit each city in mask exactly once,
              and finish at city i
```

`i` must belong to `mask`, and city 0 must belong to `mask`, because the tour started there.

### Transition

```text
dp[mask][i] = min over j in mask, j != i, of
              ( dp[mask without i][j] + dist[j][i] )
```

The tour of this subset ended with the flight `j → i`. Before that flight, `j` was the end of an optimal tour of the smaller subset. Same optimal-substructure argument as everywhere else: a worse tour of the subset ending at `j` could be swapped out.

### Base Cases

```text
dp[1 << 0][0] = 0
```

The subset `{0}`, standing at 0, has cost 0. Every other cell starts at infinity.

### Answer

```text
min over i != 0 of ( dp[(1 << n) - 1][i] + dist[i][0] )
```

`(1<<n) - 1` is the full set. You may end at any city except you still must fly home. If several components are impossible, those cells stay at infinity and you must detect an impossible instance. A complete distance matrix with finite entries is always possible.

If the problem does **not** ask to return home, the answer is the min of `dp[full][i]` over all `i`, and you may need a start that is not fixed. The code below fixes the start at 0 and adds the return edge, matching the classical tour.

### DP Approach

Iterate masks in increasing numeric order. Removing a bit produces a smaller integer, so the submask is already processed when masks increase. For each mask that contains city 0, try every endpoint `i` in the mask, then try flying to a new city.

An equivalent loop pushes forward from every finished `(mask, j)`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long tsp(const vector<vector<long long>>& dist) {
    int n = (int)dist.size();
    const long long INF = (long long)4e18;
    int FULL = 1 << n;
    vector<vector<long long>> dp(FULL, vector<long long>(n, INF));
    dp[1 << 0][0] = 0;                                   // only city 0, at city 0

    for (int mask = 0; mask < FULL; mask++) {
        if ((mask & 1) == 0) continue;                   // tour always contains the start
        for (int i = 0; i < n; i++) {
            if (((mask >> i) & 1) == 0) continue;        // i must be in the subset
            if (dp[mask][i] == INF) continue;
            for (int j = 0; j < n; j++) {
                if ((mask >> j) & 1) continue;           // j is new
                int nmask = mask | (1 << j);
                dp[nmask][j] = min(dp[nmask][j], dp[mask][i] + dist[i][j]);
            }
        }
    }

    long long ans = INF;
    int full = FULL - 1;
    for (int i = 0; i < n; i++) {
        if (dp[full][i] == INF) continue;
        ans = min(ans, dp[full][i] + dist[i][0]);        // fly home
    }
    return ans;
}

int main() {
    vector<vector<long long>> dist = {
        {0, 10, 15, 20},
        {10, 0, 35, 25},
        {15, 35, 0, 30},
        {20, 25, 30, 0}
    };
    cout << tsp(dist) << "\n";                           // 80
}
```

### Code Explanation

- `1 << i` is bit `i`. The start mask `1` is bit 0 only.
- Skipping masks that do not contain the start keeps the table honest. Those states are not part of this formulation.
- The push transition “from `i`, fly to a missing `j`” is the same recurrence as the pull form, written in the direction that is convenient to code.
- Because we iterate `mask` from small to large, `nmask` is always a larger integer and will be relaxed before we pop it as a source. We also relax it before the outer loop reaches it, and later reads see the finished value. This is safe: when we *leave* `mask`, `dp[mask]` is final, because every incoming flight comes from a smaller mask.
- The return edge is added only at the end. It is not stored in the mask, because city 0 is already in the mask and cannot be “visited again” by setting a bit.

### Complexity

```text
Time:  O(2^n * n^2)
Space: O(2^n * n)
```

### Common Mistakes

- Forgetting the flight back to the start, or adding it inside the DP and trying to set bit 0 twice.
- Iterating submasks incorrectly and reading a larger mask first. Numeric order works for the “add a bit” transition. It does not automatically work for every bitmask recurrence. Check that every dependency is a mask you have already finished.
- Using `1 << n` when `n = 31` and `1` is a 32-bit signed int. `1 << 31` is undefined for signed 32-bit `int`. Use `1u << n` or, better, keep `n ≤ 20` and write `int mask = 0; mask |= 1 << i` only for `i < 31`. For safety in the shift that builds `FULL`, write `1 << n` only when `n ≤ 30`.
- Storing distances in `int` and adding them until they overflow into a negative “minimum.”
- Treating the bitmask as a list of cities in visit order. The mask has no order. The endpoint dimension is what remembers order-sensitive information. If you need the full path, store parent pointers `(previous city)` for each state.

### Key Takeaway

`dp[mask][i]` means “this subset has been handled, and the path ends at `i`.” Add one element at a time. TSP is the template. Assignment over subsets, shortest Hamiltonian paths, and “visit all nodes of a small graph” are the same state.

---

## 15. Digit DP

### What digit DP is

Digit DP counts (or sums) integers in a range `[L, R]` whose decimal digits satisfy a property, without looping over the integers.

When `R` fits in `10^18`, there are too many integers to scan, but each integer has at most 18 digits. The state walks those digits.

### When it is useful

Use it when the limits are huge and the property is local to the digits: digit sum, no adjacent equal digits, digits only from a set, count of a particular digit, divisibility by a small modulus (the running remainder is part of the state).

### Why ordinary DP is not enough

A normal knapsack or prefix DP indexes the *value*. You cannot allocate an array of size `10^18`. Digit DP indexes the *position in the decimal representation*, which is tiny, and uses extra flags so that the number being built never exceeds `R`.

### Digits as the state space

Write `R` as a decimal string, most significant digit first, with no leading zeros in the string itself (`"20"`, not `"020"`). The recursive position `pos` means “I am choosing the digit at this index.”

### The tight constraint

`tight = 1` means the digits chosen so far are exactly the prefix of `R`. The next digit may be at most `R[pos]`. If you place a strictly smaller digit, the rest of the number is free to use digits `0..9`, and `tight` becomes 0.

```text
limit = tight ? (R[pos] - '0') : 9
```

Every integer from 0 to `R` with the same number of digits (leading zeros allowed in the DP, not in the string) is generated exactly once.

### Leading zeros

If the property cares about the written digits of the integer (`"7"` has one digit, not `"007"`), padding with leading zeros will lie to you. Add a flag:

```text
started = 0   means every digit so far is a leading zero
started = 1   means a nonzero digit has already been placed
```

While `started` is 0, a zero does not count as a real digit. The number `0` itself is the path that never starts. Decide explicitly whether 0 satisfies the property.

### The common state

```text
dp[pos][tight][state] = number of ways to fill the remaining digits,
                        given the tight flag and a small summary of the digits so far
```

`state` is the property: digit sum so far, remainder modulo `M`, last digit, whether you have seen a 7, and so on. It must be small.

---

## Problem: Count Integers with a Given Digit Sum

### Problem Statement

Given integers `R ≥ 0` and `S ≥ 0`, count how many integers `x` with `0 ≤ x ≤ R` have digits that sum to exactly `S`.

This is the smallest digit DP that still contains a position, a tight flag, and a real property. Leading zeros do not change a digit sum, so a `started` flag is unnecessary: the padded representation of a smaller number has the same digit sum as the number.

### Example

Input:

```text
R = 20
S = 2
```

Output:

```text
3
```

The integers are `2`, `11`, and `20`.

### First Thought / Brute Force

Loop `x` from 0 to `R` and add digits.

### Why Brute Force Is Too Slow

Correct for `R = 20`. Useless for `R = 10^18`, which is the usual size. There are only 19 digit positions and digit sums up to `9 * 18 = 162`, so the memoized state space is a few thousand cells.

### Identify the DP State

```text
dp[pos][tight][sum] = number of ways to fill digits from position pos to the end,
                      producing total digit sum exactly S,
                      if the sum of the digits already chosen is `sum`,
                      and `tight` says whether the prefix matches R
```

The stored answer is the number of valid completions, not the digit sum itself. `sum` is an input to the state.

### Transition

```text
limit = tight ? digit R[pos] : 9
for d in 0 .. limit:
    add dp[pos + 1][tight && (d == limit)][sum + d]
```

Each choice of digit is a disjoint set of integers.

### Base Cases

```text
at pos == length: return 1 if sum == S else 0
```

The number is finished. It counts if the accumulated digit sum is the target.

### DP Approach

Memoize the recursion. The original call is `dfs(0, tight=1, sum=0)` on the decimal string of `R`.

To count a range `[L, R]`, compute `count(R) - count(L - 1)`, with `count(-1) = 0`. Digit-sum properties are easy to subtract because every integer is counted once.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

string digits;
int target;
long long memo[20][2][200];

long long dfs(int pos, int tight, int sum) {
    if (pos == (int)digits.size()) return sum == target;
    long long& cell = memo[pos][tight][sum];
    if (cell != -1) return cell;
    int limit = tight ? digits[pos] - '0' : 9;
    long long ans = 0;
    for (int d = 0; d <= limit; d++) {
        int ntight = tight && (d == limit);
        ans += dfs(pos + 1, ntight, sum + d);
    }
    return cell = ans;
}

long long countUpTo(long long R, int S) {
    if (R < 0) return 0;
    digits = to_string(R);
    target = S;
    memset(memo, -1, sizeof(memo));
    return dfs(0, 1, 0);
}

int main() {
    cout << countUpTo(20, 2) << "\n";          // 3
    cout << countUpTo(10, 1) << "\n";          // 2   (1 and 10)
    cout << countUpTo(5, 0) << "\n";           // 1   (only 0)
}
```

### Code Explanation

- `digits` is the decimal representation. Position 0 is the most significant digit.
- `tight` starts at 1. The first digit cannot exceed the first digit of `R`.
- `ntight` stays 1 only if we were tight and we placed the maximum allowed digit. Any smaller digit unlocks the suffix.
- `sum + d` carries the property. At the last position we compare with `S`.
- `memo[...] = -1` means unknown. The answer is never negative, so the sentinel is safe.
- Leading zeros are digits of 0 in the sum, which is correct for this property. The number 2, when `R` has two digits, is built as digits `(0, 2)`. It is counted once.

### Complexity

```text
Time:  O(digits * 2 * (maxDigitSum) * 10)
       which is tiny for 64-bit integers (digits ≤ 19, maxDigitSum ≤ 9*19)
Space: O(digits * 2 * maxDigitSum)
```

### Common Mistakes

- Dropping the tight flag and counting numbers larger than `R`.
- Keeping tight at 1 even after placing a smaller digit.
- Using a `started` flag here and then forgetting to count the number 0, or double-counting. For digit sums you do not need `started`.
- Building the digit string with extra leading zeros (`"020"`) and also applying tight against that string. The tight digit would be wrong. Use `to_string`.
- Subtracting `count(L) ` instead of `count(L-1)` for a closed range `[L, R]`.

### Key Takeaway

Digit DP walks the decimal digits. `tight` enforces the upper bound. The third state component is the property. Leading zeros need an extra flag only when the written form matters.

---

## Problem: Count Integers with No Zero Digit

### Problem Statement

Count integers `x` with `1 ≤ x ≤ R` whose decimal representation contains no digit `0`. The number 10 does not qualify. The number 7 does.

This second example exists to show the `started` flag. Padding 7 as `07` would look like it contains a zero. It does not.

### Example

Input:

```text
R = 20
```

Output:

```text
18
```

From 1 through 20, only 10 and 20 contain a zero. `20 - 2 = 18`.

### First Thought / Brute Force

Scan every integer and reject those with a zero digit.

### Why Brute Force Is Too Slow

Same reason as every digit DP. The scan is fine for 20 and impossible for `10^18`.

### Identify the DP State

```text
dp[pos][tight][started] = number of valid ways to finish the number
```

`started = 0` means we are still in leading zeros.

### Transition

If not started, digit 0 continues the leading-zero prefix and does not violate the property. Digits 1 through `limit` start the number and are legal.

If started, digit 0 is forbidden. Digits 1 through `limit` are legal.

```text
for d in 0 .. limit:
    if started and d == 0: skip
    nstarted = started or (d != 0)
    add dfs(pos + 1, tight && d == limit, nstarted)
```

### Base Cases

```text
at the end: return 1 if started else 0
```

A number that never started is the integer 0, and 0’s representation is the digit 0, which is excluded. Returning `started` drops 0 and also drops the all-zero padding.

### DP Approach

Same tight recursion, plus the flag. Call it on `to_string(R)`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

string digits;
long long memo[20][2][2];

long long dfs(int pos, int tight, int started) {
    if (pos == (int)digits.size()) return started ? 1 : 0;
    long long& cell = memo[pos][tight][started];
    if (cell != -1) return cell;
    int limit = tight ? digits[pos] - '0' : 9;
    long long ans = 0;
    for (int d = 0; d <= limit; d++) {
        if (started && d == 0) continue;             // a real zero digit
        int nstarted = started || (d != 0);
        int ntight = tight && (d == limit);
        ans += dfs(pos + 1, ntight, nstarted);
    }
    return cell = ans;
}

long long countNoZero(long long R) {
    if (R <= 0) return 0;
    digits = to_string(R);
    memset(memo, -1, sizeof(memo));
    return dfs(0, 1, 0);
}

int main() {
    cout << countNoZero(20) << "\n";                 // 18
    cout << countNoZero(10) << "\n";                 // 9
}
```

### Code Explanation

- Before the number has started, placing 0 is the padding that lets us represent numbers with fewer digits than `R`. It is not a zero digit of the integer.
- After the number has started, placing 0 fails the property, so that branch is skipped.
- The base case requires `started`, which throws away 0.
- For `R = 10` the valid numbers are 1 through 9. That is 9. The code’s second sample checks this.

### Complexity

```text
Time:  O(digits * 2 * 2 * 10)
Space: O(digits * 2 * 2)
```

### Common Mistakes

- Treating padded zeros as real zeros and rejecting every number with fewer digits than `R`.
- Allowing digit 0 after start.
- Counting 0 as a valid “empty” number when the range starts at 1.

### Key Takeaway

`started` (sometimes called `leading_zero`) separates the mathematical integer from its padded digit string. Add it when the property looks at the written digits.

---

## 16. DP with Bitsets

### When a bitset helps

Subset-sum style DP often stores a boolean for every sum: `dp[s] = 1` if sum `s` is achievable. The transition

```text
dp[s] = dp[s] OR dp[s - x]
```

for all `s` is a bulk shift of the bit vector. A machine word ORs 32 or 64 bits at once. `std::bitset` does that with a clean syntax.

Use it when:

- The state is boolean reachability over a range of sums.
- You would have written a 0/1 backward loop of booleans.
- `S` is up to about `1e6` or a few million, and `n * S / 64` fits in time.

It does **not** speed up knapsacks that store large integer values. Bitsets carry bits, not `long long` scores. (You can sometimes bitset-optimize a boolean layer inside a larger DP.)

### Example: subset sums

```text
dp[s] = 1 if some subset sums to s
```

Inserting `x` is “every currently reachable sum, plus `x`, is also reachable”:

```text
new_dp = old_dp OR (old_dp shifted left by x)
```

The shift is the take branch. The unshifted copy is the skip branch. ORing them is the boolean transition. Because the shift reads the old bits, each `x` is used once, even though you write it as one expression. You must shift a copy, not the same bitset you are modifying, in a way that re-reads fresh bits. `dp |= dp << x` is correct in `std::bitset`: the right-hand side is computed from the old value.

### Complexity

A naive loop is `O(n * S)`. The bitset version is

```text
Time:  O(n * S / 64)     word operations, up to implementation constants
Space: O(S / 64) words, written as bitset<S+1> which is static
```

The `/64` is the whole improvement. It turns a tight `O(nS)` subset sum into something that often passes when the boolean loop does not.

### Walk-through

Achievable sums of `{1, 3, 3, 5}`:

```text
0
1
3, 1+3=4, and the second 3: 3, 6, 4+3=7, 1+3+3=7
plus 5: 5, 6, 8, 9, 11, 12
```

Positive achievable sums: 1, 3, 4, 5, 6, 7, 8, 9, 11, 12. That is 10 sums. `2` and `10` are impossible.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MAX_S = 1000;

bitset<MAX_S + 1> subsetSums(const vector<int>& a) {
    bitset<MAX_S + 1> dp;
    dp[0] = 1;
    for (int x : a) {
        if (x < 0 || x > MAX_S) continue;
        dp |= (dp << x);
    }
    return dp;
}

int main() {
    auto dp = subsetSums({1, 3, 3, 5});
    int count = 0;
    for (int s = 1; s <= 12; s++) if (dp[s]) count++;
    cout << count << "\n";                         // 10
    cout << dp[9] << " " << dp[2] << " " << dp[10] << "\n";  // 1 0 0
}
```

### Code Explanation

- `dp[0] = 1` is the empty subset.
- `dp << x` moves every reachable sum up by `x`.
- `|=` merges those new sums into the set. Sums that were already reachable stay reachable (the skip).
- `std::bitset`’s shift operator returns a new bitset, so the right-hand side does not observe the bits being written. One statement is one item, used once.
- The size is a compile-time constant. If `S` is only known at runtime, use a `vector` of `unsigned long long` and shift across words yourself, or allocate `bitset` only when `S` has a known upper bound.

### Common mistakes

- Writing a manual forward loop *and* a bitset shift for the same item, using it twice.
- Assuming bitset speeds up maximum-value knapsack. It does not carry the values.
- A `bitset` larger than memory. `bitset<1e8>` is about 12 MB. `bitset<1e9>` will not compile into a sane binary. Match `MAX_S` to the constraint.

### Key Takeaway

If the DP layer is a set of reachable integers and the transition adds a constant, a bitset shift is the same recurrence, word-parallel. The complexity drops by about the word size.

---

## Two more linear problems

Dice combinations and a single stock transaction are 1D DPs. They use only the prefix state from the early chapters. They are solved in full here so the later problem set has a complete write-up, before the optimization chapter starts speeding those same ideas up.

---

## Problem: Dice Combinations

### Problem Statement

You have a standard die with faces `1, 2, 3, 4, 5, 6`. Count the number of ordered ways to roll a sum of exactly `n`. Two sequences that differ in order are different. Answer modulo `1000000007`.

Platform: CSES Dice Combinations.

### Example

Input:

```text
n = 3
```

Output:

```text
4
```

The sequences are `1+1+1`, `1+2`, `2+1`, `3`.

### First Thought / Brute Force

Recurse on the remaining sum, trying all six faces, and count the leaves that hit 0.

### Why Brute Force Is Too Slow

The recursion tree is exponential in `n`. CSES allows `n ≤ 10^6`. The overlapping question is only “how many ways to make this remaining sum?”, and there are `n+1` such questions.

### Identify the DP State

```text
dp[x] = number of ordered ways to make sum x
```

### Transition

```text
dp[x] = dp[x-1] + dp[x-2] + dp[x-3] + dp[x-4] + dp[x-5] + dp[x-6]
        (skip any term whose index is negative)
```

The last roll was some face `f`. The rolls before it are an ordered way to make `x - f`. Different last faces are different sequences, which is what this problem wants. This is the permutation-style coin change of Pattern 6, with coins `{1,2,3,4,5,6}`.

### Base Cases

```text
dp[0] = 1
```

One way to make sum 0: roll nothing. Every non-empty sequence is that empty sequence plus rolls.

### DP Approach

Fill `x` from 1 to `n`. Add the six previous states when they exist. Take the modulus on every addition. The answer is `dp[n]`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MOD = 1000000007;

int diceCombinations(int n) {
    vector<int> dp(n + 1, 0);
    dp[0] = 1;
    for (int x = 1; x <= n; x++) {
        long long ways = 0;
        for (int face = 1; face <= 6; face++) {
            if (x - face >= 0) ways += dp[x - face];
        }
        dp[x] = (int)(ways % MOD);
    }
    return dp[n];
}

int main() {
    cout << diceCombinations(3) << "\n";     // 4
    cout << diceCombinations(1) << "\n";     // 1
    cout << diceCombinations(2) << "\n";     // 2   (1+1 and 2)
}
```

### Code Explanation

- `dp[0] = 1` is the empty sequence. It is not a roll of a 0-face.
- The inner loop is “what was the last face?”. Order matters, so the face loop sits inside the sum loop.
- `ways` is a `long long` because six residues can sum past `2^31 - 1` before the modulus, once `n` is large. Reducing after the inner loop is safe if `ways` cannot overflow 64 bits. Six values each `< MOD` fit easily.
- `n = 2` has exactly two sequences. A good second sample, because people who set `dp[0] = 0` get 0 for every `n`.

### Complexity

```text
Time:  O(n * 6) = O(n)
Space: O(n)
```

Only the previous six values are required, so the array can shrink to a circular buffer of size 6. Do that after the simple version is correct. The prefix-sum window in the optimization chapter is the same idea when the number of faces is `n` rather than 6.

### Common Mistakes

- `dp[0] = 0`.
- Putting the sum loop inside the face loop, which counts combinations instead of ordered rolls. For a die, order matters: `1+2` and `2+1` are different outcomes.
- Forgetting the modulus. The CSES statement requires it. `n = 10^6` does not fit in 64 bits.
- Using faces `0..6` and creating a self-loop at every sum.

### Key Takeaway

Ordered dice sums are unbounded coin change for the count, with the amount loop outside. `dp[0] = 1`.

---

## Problem: Best Time to Buy and Sell Stock

### Problem Statement

You are given `prices[0..n-1]`, the price of a stock on day `i`. You may complete at most one transaction: buy on one day, sell on a later day. Return the maximum profit. If no profit is possible, return 0.

Platform: LeetCode 121.

### Example

Input:

```text
prices = [7, 1, 5, 3, 6, 4]
```

Output:

```text
5
```

Buy at price 1, sell at price 6.

### First Thought / Brute Force

Try every pair of days `i < j` and maximize `prices[j] - prices[i]`. That is `O(n^2)`.

### Why Brute Force Is Too Slow

`n` can be `10^5`. The quadratic scan is too slow. The observation that makes it linear is a DP compression: on day `j`, the best buy day is the minimum price strictly before `j` (or on the buy day, which is the minimum on the prefix up to `j`, and selling on the same day yields 0, which we can ignore because the answer is at least 0).

### Identify the DP State

```text
dp[i] = maximum profit achievable using only days 0 .. i
min_price[i] = minimum price on days 0 .. i
```

### Transition

```text
min_price[i] = min(min_price[i - 1], prices[i])
dp[i] = max(dp[i - 1], prices[i] - min_price[i - 1])
```

If you sell today, you must have bought at the cheapest earlier day. `prices[i] - min_price[i - 1]` is that profit. If you do not sell today, the best profit is the best profit on the shorter prefix. Prices are the raw array. You never sell before you buy, because the minimum is taken from earlier indices only.

Selling today against `min_price[i]` (which includes today) would allow a profit of 0 from buying and selling today. Taking `max` with 0 at the end makes that harmless, and many implementations fold it into one variable. The version below keeps the “cheapest so far, including today, then compare today’s price against that cheapest” form. If today is the cheapest, today’s profit contribution is 0.

### Base Cases

```text
dp[0] = 0
min_price on the first day = prices[0]
```

One day cannot host both a buy and a later sell.

### DP Approach

Scan left to right. Remember the cheapest price seen and the best profit seen. This is the two-variable compression of the state above.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

int maxProfit(const vector<int>& prices) {
    if (prices.empty()) return 0;
    int cheapest = prices[0];
    int best = 0;                                 // dp so far
    for (int i = 1; i < (int)prices.size(); i++) {
        best = max(best, prices[i] - cheapest);   // sell today, bought at the best earlier price
        cheapest = min(cheapest, prices[i]);      // update only after the sell decision
    }
    return best;
}

int main() {
    cout << maxProfit({7, 1, 5, 3, 6, 4}) << "\n";   // 5
    cout << maxProfit({7, 6, 4, 3, 1}) << "\n";      // 0
}
```

### Code Explanation

- `cheapest` is the minimum of the prefix **before** today, at the moment we consider selling, because we update it after the comparison.
- `best` is `dp[i]`. The `max` with the previous `best` is the “don’t sell today” branch.
- A strictly decreasing array never beats 0, so the answer stays 0. You are not required to trade.
- This is one transaction. If the statement allows unlimited transactions, the state grows: `dp[i][holding]`, where `holding` is 0 or 1. If it allows at most `k` transactions, add the transaction count as a third dimension. Do not reuse this one-variable trick on those problems. The extra fact (whether you currently hold the stock, and how many buys you have spent) is part of the future, so it is part of the state.

### Complexity

```text
Time:  O(n)
Space: O(1)
```

### Common Mistakes

- Updating `cheapest` before computing today’s profit, then buying and selling on the same day. Here that would still yield 0, so this particular bug is harmless for “at most one trade, profit at least 0”, and fatal for variants that charge a fee or count the number of trades.
- Tracking the maximum price instead of the minimum. Profit needs a cheap buy, then a later sell.
- Applying the formula to “as many transactions as you want.” That problem adds every ascent (`prices[i] - prices[i-1]` when positive). Different state, different transition.

### Key Takeaway

One buy/sell is a prefix DP: best earlier buy, best profit so far. Name the extra facts (holding, fees, cooldown, `k` trades) before you reuse the code.

---

## 17. DP Optimization Techniques

An optimization is not a new problem. It is a faster way to evaluate a recurrence you already trust. Use one only when the slow DP is correct and the constraints reject it.

The order to learn them is the order below: each one asks for more structure than the previous.

### 17.1 Space optimization

Already used for Fibonacci, house robber, and knapsack. General rule: if the transition reads only the previous row, or only a fixed window, store that window.

Rolling two rows in a grid or in LCS:

```text
row[j] depends on old_row[j], old_row[j - 1], and row[j - 1]
```

Keep `previous` and `current`. Swap them after each outer iteration. For 0/1 knapsack the backward scan lets you keep one row, because the cell you read has not been overwritten yet.

Do not destroy the full table if you still need to reconstruct the path and you did not store parents.

### 17.2 Prefix sums and sliding windows

Sometimes the transition adds a whole range of earlier states:

```text
dp[i] = dp[i-1] + dp[i-2] + ... + dp[i-k]     (with the obvious bounds)
```

A loop of length `k` makes the DP `O(nk)`. A running window makes it `O(n)`.

This is exactly dice combinations when the die has faces `1..k` and `k` is large. `dp[i]` is the number of ordered ways to write `i` as a sum of parts, each part between 1 and `k`.

Let `window` be the sum of the dp values that are allowed to feed the next index. When `i` advances by one, the window gains `dp[i]` and, once they fall farther than `k` behind, loses `dp[i-k]`.

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MOD = 1000000007;

int waysBoundedParts(int n, int k) {
    vector<int> dp(n + 1, 0);
    dp[0] = 1;
    long long window = 1;                         // currently holds dp[0], which feeds dp[1]
    for (int i = 1; i <= n; i++) {
        dp[i] = (int)(window % MOD);
        window += dp[i];
        if (i - k >= 0) window -= dp[i - k];      // dp[i - k] no longer feeds dp[i + 1]
        window %= MOD;
        if (window < 0) window += MOD;
    }
    return dp[n];
}

int main() {
    cout << waysBoundedParts(3, 6) << "\n";       // 4, same as a 6-faced die
    cout << waysBoundedParts(4, 6) << "\n";       // 8
}
```

Check the window on `n = 4, k = 6`:

| `i` | `dp[i]` | window after gaining `dp[i]` |
| --- | --- | --- |
| start | `dp[0] = 1` | 1 |
| 1 | 1 | 2 |
| 2 | 2 | 4 |
| 3 | 4 | 8 |
| 4 | 8 | 16 |

`dp[4] = dp[3]+dp[2]+dp[1]+dp[0] = 8`. The face `7` does not exist, and for `i ≤ k` nothing is removed. At `i = 7` with `k = 6` the window drops `dp[0]` before `dp[7]` is formed on the next step. The code removes `dp[i-k]` after writing `dp[i]`, so it affects `dp[i+1]`, not `dp[i]`. That off-by-one is the usual bug. Trace `i = 1` and `i = k+1` by hand before you trust it.

```text
Time:  O(n)
Space: O(n)
```

Prefix sums are the same idea when the range is a prefix rather than a window: `dp[i] = sum_{j < i} dp[j]` becomes `dp[i] = prefix[i]`, then you append `dp[i]` to the prefix. Any transition that is “sum of dp over an interval of indices” should make you reach for a prefix array or a window, not for a nested loop.

### 17.3 Monotonic queue optimization

Use this when the transition is a sliding-window minimum or maximum of **dp values themselves**, plus a cost that does not depend on the old index in a messy way:

```text
dp[i] = a[i] + max(0, max{ dp[j] : i - K ≤ j < i })
```

The `max(0, ...)` in the problem below means “a subsequence may start at `i`”. The important shape is `max` of a window of earlier `dp[j]`.

A deque stores candidate indices. It maintains this invariant: indices increase, and their `dp` values decrease. The front is the best (largest) dp in the current window.

For each `i`:

1. Pop the front while it is left of `i - K` (out of the window).
2. The front, if any, is the best previous dp. Apply the transition.
3. Pop the back while its dp is **worse or equal** than `dp[i]`. Those indices die later and are never chosen, because `i` is newer and at least as good.
4. Push `i`.

Each index is pushed once and popped once, so the whole scan is `O(n)` after the `O(nK)` nested loop.

**Frog 2 is not this problem.** AtCoder Frog 2 minimizes `dp[j] + |h[i] - h[j]|` over `j` in `[i-K, i-1]`. The added cost depends on `j` through `h[j]`, so the best `j` is not the `j` with the smallest `dp[j]`. A deque of dp values gives the wrong answer. Only use the deque when comparing `dp[j]` (plus a cost that does not reorder them) is valid.

---

## Problem: Maximum Sum with a Gap Limit

### Problem Statement

Given `a[0..n-1]` and an integer `K`, find the maximum sum of a non-empty subsequence whose consecutive chosen indices differ by at most `K`. The subsequence may start at any index.

### Example

Input:

```text
a = [1, -2, 3, -1, 4]
K = 2
```

Output:

```text
8
```

Indices `0, 2, 4`: values `1 + 3 + 4`. The gaps are 2 and 2.

### First Thought / Brute Force

`dp[i]` as defined below, computed by scanning the previous `K` positions every time. That is already a DP. It is the slow one.

### Why Brute Force Is Too Slow

`O(nK)` fails when `n = 1e5` and `K = 1e5`. The deque evaluates the same recurrence in `O(n)`.

### Identify the DP State

```text
dp[i] = maximum sum of a valid subsequence that ends at index i
```

### Transition

```text
dp[i] = a[i] + max(0, max{ dp[j] : i - K ≤ j < i })
```

Extending a subsequence ending at `j` adds `a[i]`, and only if the gap is at most `K`. Starting a new subsequence at `i` contributes just `a[i]`, which is the `0` option. The answer is the maximum of `dp[i]` over all endings, because the best subsequence ends somewhere.

### Base Cases

```text
dp[0] = a[0]
```

The window before 0 is empty, so the max of an empty window is replaced by 0, and `dp[0] = a[0]`.

### DP Approach

Scan `i` from 0 to `n-1` with the deque invariant above. Because we need `dp[j]` for `j < i`, the left-to-right order is correct.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long maxGapSum(const vector<long long>& a, int K) {
    int n = (int)a.size();
    vector<long long> dp(n, 0);
    deque<int> dq;                                // indices with decreasing dp
    long long answer = LLONG_MIN / 4;
    for (int i = 0; i < n; i++) {
        while (!dq.empty() && dq.front() < i - K) dq.pop_front();
        long long best_prev = 0;
        if (!dq.empty()) best_prev = max(0LL, dp[dq.front()]);
        dp[i] = a[i] + best_prev;
        while (!dq.empty() && dp[dq.back()] <= dp[i]) dq.pop_back();
        dq.push_back(i);
        answer = max(answer, dp[i]);
    }
    return answer;
}

int main() {
    cout << maxGapSum({1, -2, 3, -1, 4}, 2) << "\n";   // 8
}
```

### Code Explanation

- The front of the deque is the index of the largest dp in the active window, because smaller values behind a larger, newer value were popped, and older values are popped when they leave the window.
- `best_prev` is at least 0 so a negative previous dp does not drag a fresh start below `a[i]`.
- Popping the back while `dp[dq.back()] <= dp[i]` keeps the decreasing invariant. Equal values can be dropped: the newer index `i` stays in the window at least as long and is just as good.
- Each index enters and leaves the deque at most once.

### Complexity

```text
Time:  O(n)
Space: O(n)
```

The direct window scan is `O(nK)` time and is the version to write first in a contest if `nK` fits.

### Common Mistakes

- Using the deque for `dp[j] + |h[i] - h[j]|` or any cost that can reorder the candidates.
- Forgetting to pop the front, so the “best” index is outside the window.
- Defining the window as `j ≤ i` and then using `dp[i]` inside its own transition.
- Taking `max` of `a[j]` instead of `dp[j]`. The window is over **states**, not over the raw array, unless the DP really says so (sliding-window maximum on an array is the same deque, with the array in place of `dp`).

### Key Takeaway

A transition that is “best dp in the last `K` positions” is a sliding-window maximum. The deque keeps the winner of that window in amortized constant time.

### 17.4 Divide-and-conquer optimization

Some layered DPs look like this:

```text
dp[g][i] = min over j < i of ( dp[g - 1][j] + cost(j + 1, i) )
```

`g` is the number of groups, `i` is a prefix length, and `cost(L, R)` is the cost of one contiguous group covering that segment. The straightforward loop is `O(K n^2)`.

Let `opt[g][i]` be the smallest `j` that achieves the minimum (leftmost, if you break ties toward smaller `j`). For many costs the optimal split **moves only right** as `i` moves right:

```text
opt[g][i] ≤ opt[g][i + 1]
```

When that is true, you do not search every `j` for every `i`. You compute the midpoint `i`, find its best `j` inside the narrowed range, then the left half of the `i`s only needs `j` up to that optimum, and the right half only needs `j` from that optimum upward. The search tree costs `O(n log n)` per layer, so the DP becomes `O(K n log n)`.

A standard sufficient condition is the quadrangle inequality on the cost. You do not need to memorize the inequality to *use* the technique, but you do need a reason to believe `opt` is monotone. “It looks sorted when I print `opt` on a sample” is not a proof. Known safe cases include partitioning an array of non-negative numbers into `K` contiguous segments when the segment cost is the square of the segment sum. The implementation below is that case. It was checked against the `O(K n^2)` DP on random instances. If your cost is different, check the condition or test the optimization against the slow DP on brute-forceable `n` before you submit it.

---

## Problem: Partition into K Segments (squared sum)

### Problem Statement

Split the array `a[0..n-1]` of non-negative integers into exactly `K` non-empty contiguous segments. The cost of a segment is the square of its sum. Return the minimum total cost.

### Example

Input:

```text
a = [1, 2, 3]
K = 2
```

Output:

```text
18
```

`[1, 2]` and `[3]` cost `3^2 + 3^2 = 18`. The other split, `[1]` and `[2, 3]`, costs `1 + 25 = 26`.

### First Thought / Brute Force

The slow DP tries every previous cut:

```text
dp[g][i] = min over j < i of dp[g-1][j] + (sum of a[j .. i-1])^2
```

with `dp[0][0] = 0` and every illegal cell at infinity.

### Why Brute Force Is Too Slow

`O(K n^2)` with `n = 5000` and `K = 100` is too slow. `O(K n log n)` fits. For `n ≤ 400` you should just write the quadratic version and skip this section.

### Identify the DP State

```text
dp[g][i] = minimum cost to split the first i elements into exactly g non-empty segments
```

### Transition

```text
dp[g][i] = min over j in [g-1, i) of ( dp[g-1][j] + (sum(a[j .. i-1]))^2 )
```

`j` is the number of elements already placed in the first `g-1` segments. The last segment is non-empty, so `j < i`. Those `g-1` segments need at least `g-1` elements, so `j ≥ g-1`.

### Base Cases

```text
dp[0][0] = 0
dp[0][i] = infinity for i > 0
```

Zero segments can only cover zero elements.

### DP Approach

Compute layer `g` from layer `g-1` with the divide-and-conquer search, using the monotone split. Tie-break toward the smaller `j`, which matches the monotone optimum this cost admits.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long minPartitionCost(const vector<long long>& a, int K) {
    int n = (int)a.size();
    vector<long long> pref(n + 1, 0);
    for (int i = 0; i < n; i++) pref[i + 1] = pref[i] + a[i];
    auto seg = [&](int l, int r) {                // inclusive indices into a, non-empty
        long long s = pref[r + 1] - pref[l];
        return s * s;
    };
    const long long INF = (long long)4e18;
    vector<long long> prev(n + 1, INF), cur(n + 1, INF);
    prev[0] = 0;

    function<void(int, int, int, int)> solve = [&](int L, int R, int optL, int optR) {
        if (L > R) return;
        int mid = (L + R) / 2;
        long long best = INF;
        int opt = optL;
        for (int j = optL; j <= min(mid - 1, optR); j++) {
            if (prev[j] >= INF / 2) continue;
            long long val = prev[j] + seg(j, mid - 1);
            if (val < best) {
                best = val;
                opt = j;
            }
        }
        cur[mid] = best;
        solve(L, mid - 1, optL, opt);
        solve(mid + 1, R, opt, optR);
    };

    for (int g = 1; g <= K; g++) {
        fill(cur.begin(), cur.end(), INF);
        solve(g, n, g - 1, n - 1);                // i from g..n needs at least g elements
        swap(prev, cur);
    }
    return prev[n];
}

int main() {
    cout << minPartitionCost({1, 2, 3}, 2) << "\n";   // 18
    cout << minPartitionCost({1, 2, 3}, 3) << "\n";   // 14
}
```

### Code Explanation

- `prev` is layer `g-1`. `cur` is layer `g`. Swapping reuses the arrays.
- `solve` computes `cur[mid]` by trying only `j` in `[optL, optR]`. The best `j` found becomes the right boundary for the left half and the left boundary for the right half. That is legal only because the optimal `j` is non-decreasing in `mid`.
- `j` runs up to `mid - 1` so the last segment is non-empty. `seg(j, mid-1)` is the slice `a[j .. mid-1]`, which has length `mid - j`.
- `INF / 2` guards against adding to a sentinel. `INF` itself is `(long long)4e18`, and `4e18 + something` must not overflow. Skipping unfinished `prev[j]` avoids that.
- The strict `<` keeps the leftmost optimum. The monotone proof for this cost is stated for a consistent tie-break. Do not switch to `<=` casually.

### Complexity

```text
Time:  O(K * n * log n)
Space: O(n)
```

The unoptimized transition is `O(K n^2)` time.

### Common Mistakes

- Applying divide-and-conquer optimization to a cost whose optimal split moves left somewhere. The program still prints a number. The number is not the minimum.
- Allowing `j == mid`, an empty last segment, which double-counts a previous layer.
- Using the optimization when `K = 1`. It still works (`g` from 1 to 1) but the simple prefix square is enough.
- Negative array values. The sample problem stated non-negative values. The square of a sum of negatives is a different geometry. Re-check monotonicity.

### Key Takeaway

Layered partition DP becomes `O(Kn log n)` when the best cut moves only to the right. The divide-and-conquer search *is* that observation. It is not a license to binary-search arbitrary DP.

### 17.5 Knuth optimization

Interval DP is often `O(n^3)` because every interval `[l, r]` tries every split `k`. Knuth optimization applies when the best split itself is monotone:

```text
opt[l][r - 1] ≤ opt[l][r] ≤ opt[l + 1][r]
```

Then `[l, r]` only needs to try `k` between `opt[l][r-1]` and `opt[l+1][r]`. Across a whole length, those ranges telescope, and the total time drops to `O(n^2)`.

This is **not** true for every interval recurrence. It is true for the optimal binary search tree cost below, which is the classical setting Knuth proved it for. Matrix chain does not automatically qualify. Burst balloons does not automatically qualify. If you cannot argue the inequality, write the `O(n^3)` loops.

The optimal BST recurrence, with key frequencies `freq[0..n-1]` (successful searches only):

```text
dp[i][i] = freq[i]
dp[l][r] = sum(freq[l] .. freq[r]) + min over k in [l, r] of
           ( cost of the left subtree + cost of the right subtree )
```

The left subtree is empty when `k = l`, and the right subtree is empty when `k = r`. A one-node tree costs its frequency: that key is compared once.

A standard check: frequencies `34, 8, 50` have optimal cost `142`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long optimalBST(const vector<long long>& freq) {
    int n = (int)freq.size();
    vector<long long> pref(n + 1, 0);
    for (int i = 0; i < n; i++) pref[i + 1] = pref[i] + freq[i];
    auto rangeSum = [&](int l, int r) { return pref[r + 1] - pref[l]; };

    const long long INF = (long long)4e18;
    vector<vector<long long>> dp(n, vector<long long>(n, 0));
    vector<vector<int>> opt(n, vector<int>(n, 0));
    for (int i = 0; i < n; i++) {
        dp[i][i] = freq[i];
        opt[i][i] = i;
    }
    for (int len = 2; len <= n; len++) {
        for (int l = 0; l + len - 1 < n; l++) {
            int r = l + len - 1;
            int lo = opt[l][r - 1];                   // monotone lower bound
            int hi = opt[l + 1][r];                   // monotone upper bound
            long long best = INF;
            int bestK = lo;
            for (int k = lo; k <= hi; k++) {
                long long left = (k == l) ? 0 : dp[l][k - 1];
                long long right = (k == r) ? 0 : dp[k + 1][r];
                if (left + right < best) {
                    best = left + right;
                    bestK = k;                        // leftmost optimum
                }
            }
            dp[l][r] = best + rangeSum(l, r);
            opt[l][r] = bestK;
        }
    }
    return n == 0 ? 0 : dp[0][n - 1];
}

int main() {
    cout << optimalBST({34, 8, 50}) << "\n";          // 142
}
```

### Code Explanation

- `dp[i][i] = freq[i]` is the base case. Leaving it at 0 computes a different, wrong cost. This is the mistake that makes Knuth “fail” even when the search range is coded correctly: the cubic DP was already wrong, so the optimized DP matches nothing real.
- `opt[l][r-1]` and `opt[l+1][r]` exist when `len ≥ 2`, because they are shorter intervals or single keys, all computed earlier. For `len = 2` the bounds are the two endpoints, so the search is the full range, which is what a two-key tree needs.
- The strict `<` stores the leftmost best root. The monotonicity used here is for that tie-break.
- `rangeSum(l, r)` is added once, outside the min. Every candidate pays it.

### Complexity

```text
Time:  O(n^2)     under the monotone-opt condition
Space: O(n^2)
```

The same recurrence with `k` from `l` to `r` is `O(n^3)` and is the right submission when `n ≤ 400` or when you are not sure Knuth applies.

### Common Mistakes

- Using Knuth on matrix chain or burst balloons because “they are interval DP.”
- Initializing `dp[i][i] = 0` for this cost.
- Taking the rightmost argmin (`<=`) while the proof you are using is for the leftmost, or the reverse.
- Forgetting that `opt` bounds are inclusive and then skipping `k = hi`.

### Key Takeaway

Knuth optimization speeds interval DP when the best split point is trapped between the best splits of the two slightly smaller intervals. Optimal BST is the textbook case. The `O(n^3)` solution remains the default.

### 17.6 Convex hull trick

The convex hull trick answers this shape:

```text
dp[i] = min over j < i of ( dp[j] + slope[j] * x[i] )
```

For a fixed `j`, the expression `slope[j] * x + dp[j]` is a straight line. `dp[i]` is the minimum of those lines at the query point `x[i]`.

If you insert lines from left to right and the slopes are **strictly decreasing**, and you query points `x` in **increasing** order, a deque stores the lower hull:

- Before pushing a new line, pop lines from the back that are no longer on the hull. A line `b` is useless between `a` and `c` when the intersection of `a` and `b` is at least as far right as the intersection of `b` and `c`.
- Before querying, pop the front while the next line is better at this `x`. Because queries only move right, a line that has fallen behind the next one never wins again.

Fully dynamic slopes and query orders need a Li Chao tree (each segment tree node stores the line that wins on the whole node range, and updates recurse into the half where the new line might win). Learn the deque version first. Reach for Li Chao when the statement refuses to give you sorted slopes or sorted queries.

Intersection arithmetic overflows 64-bit products. Compare cross-multiples with `__int128`.

The inequality, for lines `a`, `b`, `c` with strictly decreasing slopes (so both denominators `a.m - b.m` and `b.m - c.m` are positive):

```text
b is useless  if  inter(a, b) ≥ inter(b, c)
which is
(b.b - a.b) / (a.m - b.m) ≥ (c.b - b.b) / (b.m - c.m)
```

Cross-multiplying, the denominators are positive, so the inequality direction stays:

```text
(b.b - a.b) * (b.m - c.m) ≥ (c.b - b.b) * (a.m - b.m)
```

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

struct Line {
    long long m, b;
    long long eval(long long x) const { return m * x + b; }
};

// Slopes will be inserted in strictly decreasing order.
bool useless(const Line& a, const Line& b, const Line& c) {
    return (__int128)(b.b - a.b) * (b.m - c.m) >= (__int128)(c.b - b.b) * (a.m - b.m);
}

// dp[0] = 0
// dp[i] = min over j < i of (dp[j] + slope[j] * x[i])
// Requires slope strictly decreasing and x strictly increasing.
long long hullDP(const vector<long long>& x, const vector<long long>& slope) {
    int n = (int)x.size();
    vector<long long> dp(n, 0);
    deque<Line> hull;
    auto add = [&](long long m, long long b) {
        Line cur{m, b};
        while (hull.size() >= 2 && useless(hull[hull.size() - 2], hull.back(), cur)) {
            hull.pop_back();
        }
        hull.push_back(cur);
    };
    auto query = [&](long long qx) {
        while (hull.size() >= 2 && hull[0].eval(qx) >= hull[1].eval(qx)) hull.pop_front();
        return hull.front().eval(qx);
    };
    dp[0] = 0;
    add(slope[0], dp[0]);
    for (int i = 1; i < n; i++) {
        dp[i] = query(x[i]);
        add(slope[i], dp[i]);
    }
    return dp[n - 1];
}

int main() {
    cout << hullDP({1, 3, 4, 8, 10, 15}, {20, 11, 7, 3, 0, -5}) << "\n";   // 150
}
```

### Code Explanation

- Line `j` has slope `slope[j]` and intercept `dp[j]`. Evaluating it at `x[i]` is exactly `dp[j] + slope[j] * x[i]`.
- `dp[0] = 0` is the empty choice before any transition. The first line is available for every later index.
- `useless` drops the middle line of three when it is never the unique minimum. The cross-multiplication is the intersection test without division.
- The front-pop uses `>=`, so a tied line yields to the newer one. Either line is a correct minimum. Popping the old one keeps the deque short.
- The returned value is `dp[n-1]`, the last query. Change the return if the problem asks for every `dp[i]`.

### Complexity

```text
Time:  O(n)     amortized, each line pushed and popped at most once
Space: O(n)
```

The double loop over `j < i` is `O(n^2)` and is what you write when `n ≤ 5000` does not quite fit, or rather when it does not fit you switch to this, and when it fits you may still prefer `O(n^2)` until the slopes are clearly monotone.

### Common Mistakes

- Using the deque when slopes are not sorted. The hull insertions are wrong, quietly.
- Comparing intersections in `double`. Border cases flip. Use `__int128` or an exact fraction.
- Querying `x` in an arbitrary order while popping the front forever. Front-popping is only valid for monotone queries. For arbitrary queries, binary-search the hull instead of popping it.
- Overflow on `m * x + b` itself. The sample values are small. Contest values often need the statement’s bounds checked before you multiply in `long long`.

### Key Takeaway

If the transition is a minimum of lines and the slopes arrive in order, the lower hull answers each query in amortized constant time. If they do not arrive in order, the idea is the same and the data structure is a Li Chao tree.

### 17.7 Bitset optimization

Covered in the bitset chapter. Reminder: it speeds **boolean** reachability (`dp[s] |= dp[s - x]`), by about the word size, and it does not carry integer scores.

### When to reach for which tool

| You notice | Tool | Resulting time |
| --- | --- | --- |
| Only the previous row or a constant window is read | Rolling array | same time, less memory |
| Transition sums a range of dp | Prefix or sliding window | drops an `O(n)` or `O(k)` factor |
| Transition is min/max of dp over a moving window | Monotonic deque | `O(n)` instead of `O(nK)` |
| `dp[g][i] = min_{j<i} dp[g-1][j] + cost(j, i)` and `opt` moves right | Divide and conquer | `O(Kn log n)` instead of `O(Kn^2)` |
| Interval split `opt[l][r]` is trapped by neighboring opts | Knuth | `O(n^2)` instead of `O(n^3)` |
| Transition is min of linear functions, slopes monotone | Convex hull trick | `O(n)` instead of `O(n^2)` |
| Boolean subset sums | Bitset | about `64` times fewer word operations |

---

## 18. DP on DAGs

### Concept

Every DP table is a DAG. A cell is a node. A transition is an edge to the cells it depends on, or from the cells that produce it. We usually do not say this, because the topological order is obvious: increasing index, increasing interval length, postorder on a tree.

When the problem *gives* you a directed acyclic graph, the same idea applies with the graph’s own topological order.

```text
dp[u] = best answer for paths that start (or end) at u
```

Process nodes so that every predecessor is finished before you use it. Kahn’s algorithm (indegree queue) or a DFS finishing-time order both produce that sequence. A cycle would make “predecessor before successor” impossible, which is why the graph must be acyclic, or why a general graph with positive weights uses Dijkstra instead of this relaxation.

### Longest path

On a DAG, longest paths are well defined even with positive weights, because nothing can loop.

```text
dp[v] = maximum of dp[u] + weight(u, v) over edges u → v
```

Initialize the source to 0 and every other node to `-infinity`, meaning unreachable. Relax in topological order.

### Shortest path

The same loop with `min`, source 0, and `+infinity` for the rest. This is DAG shortest path. It handles negative weights, as long as there is no cycle. Dijkstra does not need the topological order and does not allow negative weights. Bellman-Ford handles negative weights and detects cycles, more slowly.

### Relationship to ordinary DP

House robber, grid paths, and knapsack are DAG DP on implicit graphs. You build those graphs with nested loops instead of an edge list. When the statement hands you edges, write the edge list and replace the nested loops with “for each node in order, for each outgoing edge.”

---

## Problem: Longest and Shortest Paths in a DAG

### Problem Statement

A directed acyclic graph has `n` nodes and weighted edges. Compute the longest-path weight and the shortest-path weight from node 0 to node `n-1`. If `n-1` is unreachable, there is no path.

### Example

Input:

```text
n = 4
edges (from, to, weight):
0 → 1 weight 3
0 → 2 weight 1
1 → 2 weight 1
1 → 3 weight 2
2 → 3 weight 5
```

Output:

```text
longest = 9
shortest = 5
```

Longest: `0 → 1 → 2 → 3` costs `3 + 1 + 5 = 9`.

Shortest: `0 → 1 → 3` costs `3 + 2 = 5`.

### First Thought / Brute Force

Enumerate simple paths. On a DAG the number of paths can still be exponential (a layered graph).

### Why Brute Force Is Too Slow

`n ≤ 1e5` and `m ≤ 2e5` are normal. You get one topological sort and one linear relaxation, `O(n + m)`.

### Identify the DP State

```text
long[u] = maximum weight of a path from 0 to u
short[u] = minimum weight of a path from 0 to u
```

### Transition

```text
for each edge u → v with weight w, after u is finished:
    long[v] = max(long[v], long[u] + w)
    short[v] = min(short[v], short[u] + w)
```

### Base Cases

```text
long[0] = short[0] = 0
long[u] = -infinity, short[u] = +infinity for u != 0
```

Unreachable nodes must not look like paths of weight 0.

### DP Approach

Compute indegrees, Kahn-sort, then relax every outgoing edge of each node in that order. When node `u` is processed, every incoming edge has already relaxed `long[u]`, because every predecessor appeared earlier in the topological order.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

pair<long long, long long> dagPaths(int n, const vector<tuple<int, int, long long>>& edges) {
    vector<vector<pair<int, long long>>> adj(n);
    vector<int> indeg(n, 0);
    for (auto [u, v, w] : edges) {
        adj[u].push_back({v, w});
        indeg[v]++;
    }
    queue<int> q;
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push(i);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        order.push_back(u);
        for (auto [v, w] : adj[u]) {
            if (--indeg[v] == 0) q.push(v);
        }
    }

    const long long INF = (long long)4e18;
    vector<long long> longest(n, -INF), shortest(n, INF);
    longest[0] = shortest[0] = 0;
    for (int u : order) {
        if (longest[u] == -INF) continue;         // not reachable from 0
        for (auto [v, w] : adj[u]) {
            longest[v] = max(longest[v], longest[u] + w);
            shortest[v] = min(shortest[v], shortest[u] + w);
        }
    }
    return {longest[n - 1], shortest[n - 1]};
}

int main() {
    vector<tuple<int, int, long long>> edges = {
        {0, 1, 3}, {0, 2, 1}, {1, 2, 1}, {1, 3, 2}, {2, 3, 5}
    };
    auto [lo, sh] = dagPaths(4, edges);
    cout << lo << "\n" << sh << "\n";             // 9 and 5
}
```

### Code Explanation

- Kahn’s algorithm appends a node only after all incoming edges are counted down. The resulting `order` is a topological order. If the graph had a cycle, `order` would be shorter than `n`. This problem assumes a DAG.
- Skipping a node whose `longest` is still `-infinity` stops a fake path from starting in the middle of the graph. Those nodes can appear in `order` before 0 if they have indegree 0 and are not 0. They must not relax their children with a sentinel.
- One pass updates both answers. The transition is identical except `max` versus `min`.
- Adding `w` to `-INF` is avoided by the `continue`. Adding `w` to `INF` is avoided because `shortest[u] == INF` exactly when `longest[u] == -INF` in this construction (we set them together and only relax reachable nodes).

### Complexity

```text
Time:  O(n + m)
Space: O(n + m)
```

### Common Mistakes

- Relaxing edges in input order and calling it DP. Without a topological order an edge may fire before its tail is final.
- Initializing distances to 0, so every node looks reachable at cost 0.
- Using this loop on a graph that might contain a cycle. A positive cycle makes the longest path undefined. Detect `order.size() != n` if the statement does not guarantee a DAG.
- Dijkstra with a negative edge. On a DAG the topological DP is the algorithm that allows those edges.

### Key Takeaway

DAG DP is ordinary DP whose order is a topological sort. Longest and shortest paths are the same relaxation with `max` or `min`.

---

## 19. Game DP

### Concept

Two perfect players alternate moves. A position is a **losing position** if every move leaves a winning position for the opponent, or if no move exists. A position is a **winning position** if some move leaves a losing position for the opponent.

```text
dp[state] = true if the player about to move can force a win
dp[state] = false if the player to move loses against perfect play
```

```text
dp[state] = OR over moves ( not dp[next state] )
```

The base case is the position with no moves. In normal play (the player who cannot move loses), that position is a loss. In misère play the last move loses. Read which one the statement uses. Almost every introductory problem is normal play.

You do not simulate both players with a search tree. The boolean already means “the player to move.” After one move, the opponent *is* the player to move in the next state, so `dp[next] == false` means “I can hand them a loss.”

---

## Problem: Subtraction Game

### Problem Statement

A pile has `n` stones. A move removes 1, 2, or 3 stones. The player who takes the last stone wins (the player who faces 0 stones has already lost). Return whether the first player can force a win.

This is the classic impartial subtraction game, often worded as “Stone Game” in tutorials. It is not LeetCode 877, which is the interval game on an array of piles. That variant is summarized after the code.

### Example

Input:

```text
n = 4
```

Output:

```text
LOSE
```

Whatever the first player takes, the opponent can take the rest and finish. `n = 5` is a win: take 1, leave 4.

### First Thought / Brute Force

Minimax the game tree.

### Why Brute Force Is Too Slow

The tree is exponential, and the same pile size appears constantly. There are only `n+1` positions.

### Identify the DP State

```text
dp[i] = true if the player to move can force a win when i stones remain
```

### Transition

```text
dp[i] = true if dp[i-1] is false or dp[i-2] is false or dp[i-3] is false
        (only for those i-k that are ≥ 0)
```

### Base Cases

```text
dp[0] = false
```

No legal move. The player to move loses.

### DP Approach

Fill `i` from 1 to `n`. The answer is `dp[n]`.

After you compute a few values you will see the period: `i` is a loss exactly when `i` is a multiple of 4. The DP is how you discover the pattern. You may then replace the loop with `n % 4 != 0`, but only after the table agrees. Guessing the modulus from three samples is how this problem gets failed.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

bool firstPlayerWins(int n) {
    vector<char> dp(n + 1, 0);
    dp[0] = 0;                                    // no move: loss
    for (int i = 1; i <= n; i++) {
        bool win = false;
        for (int take = 1; take <= 3; take++) {
            if (i >= take && !dp[i - take]) win = true;
        }
        dp[i] = win;
    }
    return dp[n];
}

int main() {
    cout << (firstPlayerWins(4) ? "WIN\n" : "LOSE\n");   // LOSE
    cout << (firstPlayerWins(5) ? "WIN\n" : "LOSE\n");   // WIN
    cout << (firstPlayerWins(0) ? "WIN\n" : "LOSE\n");   // LOSE
}
```

### Code Explanation

- `!dp[i - take]` is “this move leaves a losing position for the opponent.”
- Any one such move makes `i` winning. If the inner loop never finds one, `i` stays losing.
- The loop only reads smaller piles, so the forward scan is the whole topological order of the game.
- `n = 0` does not enter the loop and correctly loses.

### Complexity

```text
Time:  O(n * 3)
Space: O(n)
```

### Common Mistakes

- Defining `dp[0] = true`. That says the player who faces an empty pile has won, which is the opposite convention, and it flips every later answer.
- Searching only one move and forgetting that a winning strategy needs *some* move, while a loss requires *all* moves to fail.
- Assuming both players play randomly. The state is about perfect play.

### Key Takeaway

A position is winning when it has a move into a losing position. Encode “player to move” inside the boolean so you never write separate Alice and Bob tables.

### Piles on a row (interval game)

LeetCode 877 / “Stone Game” on an array: piles stand in a row. A move takes a pile from either end. Both play optimally. Ask whether the first player can get strictly more stones than the second.

The total number of stones is fixed, so it is enough to know the best *difference* the player to move can force:

```text
dp[l][r] = (stones the player to move collects) - (stones the opponent collects)
           on the inclusive subarray piles[l .. r]
```

```text
dp[i][i] = piles[i]
dp[l][r] = max( piles[l] - dp[l+1][r], piles[r] - dp[l][r-1] )
```

You take an end, add its value, and subtract the difference the opponent will then force on the smaller interval. Compute by increasing length. The first player gets a strictly greater share when `dp[0][n-1] > 0`.

```cpp
#include <bits/stdc++.h>
using namespace std;

bool firstGetsMore(const vector<int>& piles) {
    int n = (int)piles.size();
    vector<vector<int>> dp(n, vector<int>(n, 0));
    for (int i = 0; i < n; i++) dp[i][i] = piles[i];
    for (int len = 2; len <= n; len++) {
        for (int l = 0; l + len - 1 < n; l++) {
            int r = l + len - 1;
            int takeL = piles[l] - dp[l + 1][r];
            int takeR = piles[r] - dp[l][r - 1];
            dp[l][r] = max(takeL, takeR);
        }
    }
    return dp[0][n - 1] > 0;
}

int main() {
    cout << (firstGetsMore({5, 3, 4, 5}) ? "WIN\n" : "LOSE\n");   // WIN
}
```

On `[5, 3, 4, 5]` the difference is `1`: the first player can force 9 against 8. The subtraction `piles[end] - dp[rest]` is the entire “opponent becomes the player to move” idea, written with numbers instead of booleans.

```text
Time:  O(n^2)
Space: O(n^2)
```

---

## 20. Probability DP

### Concept

A probability DP stores the probability of being in a state, or of eventually reaching a state. Transitions multiply by the probability of a branch and add over disjoint branches.

```text
dp[state] = sum over incoming branches of ( dp[previous] * probability of that branch )
```

Two rules keep the numbers honest:

- **Disjoint cases add.** The last jump was `+1` or it was `+2`, never both.
- **Sequential steps multiply.** “I was at `i-2`” and “from there I chose a jump of 2” are independent in the model below, so the probabilities multiply.

If the branches are not disjoint you will count some outcomes twice and the total probability will drift above 1. After writing the DP, check a tiny `n` where you can enumerate every outcome.

---

## Problem: Probability of Landing on n

### Problem Statement

A marker starts at position 0. From a position `i` with `i < n`, it jumps to `i+1` or to `i+2` with probability `1/2` each. It stops when it reaches a position `≥ n`. What is the probability that it lands exactly on `n` (instead of jumping over `n`)?

### Example

Input:

```text
n = 2
```

Output:

```text
0.75
```

- Jump 2 immediately. Probability `1/2`. Lands on 2.
- Jump 1, then jump 1. Probability `1/4`. Lands on 2.
- Jump 1, then jump 2. Probability `1/4`. Lands on 3 and misses 2.

Total `3/4`.

### First Thought / Brute Force

Enumerate sequences of jumps until the position reaches or passes `n`.

### Why Brute Force Is Too Slow

The number of sequences grows exponentially. Many sequences visit the same position, and the probability of *ever visiting* `i` is a single number.

### Identify the DP State

```text
reach[i] = probability that the marker lands on i
```

For `i > n` this is the probability of stopping there by a jump that passed over `n`. We only need `reach[n]` for the answer, but the overshoot cells are what make the recurrence local.

### Transition

From every `i < n` that we landed on, we always jump:

```text
reach[i+1] += reach[i] * 1/2
reach[i+2] += reach[i] * 1/2
```

We do not jump from `i ≥ n`. The process has stopped.

### Base Cases

```text
reach[0] = 1
```

The marker starts there with certainty. It did not need a jump to arrive.

### DP Approach

Push probability forward from 0 through `n-1`. The answer is `reach[n]`.

This is correct because every position `i < n` is visited, if at all, before the process stops, and the only ways to arrive are a `+1` from `i-1` or a `+2` from `i-2`, each taken with probability `1/2` when the marker is there.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

double landExactly(int n) {
    vector<double> reach(n + 2, 0.0);
    reach[0] = 1.0;
    for (int i = 0; i < n; i++) {
        reach[i + 1] += reach[i] * 0.5;
        reach[i + 2] += reach[i] * 0.5;
    }
    return reach[n];
}

int main() {
    cout << fixed << setprecision(2) << landExactly(2) << "\n";   // 0.75
    cout << fixed << setprecision(2) << landExactly(1) << "\n";   // 0.50
}
```

### Code Explanation

- The array has length `n+2` because a jump from `n-1` writes `reach[n+1]`.
- The loop stops before `n`, so a marker that already landed on `n` does not keep jumping.
- For `n = 1`: from 0, half the probability goes to 1 and half to 2. The answer is `0.5`. There is no second chance from an intermediate cell.
- `double` is appropriate for a teaching example and for probabilities that fit in binary floating point. When the statement wants an exact fraction modulo `1e9+7`, replace `1/2` with the modular inverse of 2 and store `long long`.

### Complexity

```text
Time:  O(n)
Space: O(n)
```

### Common Mistakes

- Adding `1/2` instead of multiplying by `reach[i] * 1/2`. The jump probability is conditional on being at `i`.
- Continuing the loop up to `n` and jumping onward after a successful landing.
- Forgetting that two different jump sequences can visit `i`, so `reach[i]` is not “number of ways over `2^something`” unless every path has the same number of jumps. Here paths have different lengths, and the DP still works because it multiplies along each jump rather than assuming a uniform distribution over paths.

### Key Takeaway

Push probability along the edges. Multiply by the branch probability, add across disjoint incoming edges, and stop at absorbing states.

---

## 21. Expected-Value DP

### Concept

Expected value is the probability-weighted average of a number. For a process that pays a cost and then moves:

```text
E[state] = sum over outcomes of  probability(outcome) * (cost(outcome) + E[next state])
```

If a state can move to itself, `E[state]` appears on both sides. You solve the equation for `E[state]` instead of looping forever. The beginner example below has no self-loop: every roll moves the sum forward, so a backward loop is enough.

Linearity of expectation is allowed even when the events are dependent. You will not need it explicitly here, but it is why many “expected number of times X happens” problems become a sum of probabilities.

---

## Problem: Expected Rolls to Reach a Sum

### Problem Statement

You start at sum 0 and repeatedly roll a fair six-sided die, adding the face to the sum. Stop when the sum is at least `n`. Return the expected number of rolls.

### Example

Input:

```text
n = 2
```

Output:

```text
1.1666...     which is 7/6
```

With probability `5/6` the first roll is 2, 3, 4, 5, or 6 and you stop after one roll. With probability `1/6` you roll a 1, move to sum 1, and then need one more roll for certain (every face from 1 reaches at least 2). Expected value: `(5/6)*1 + (1/6)*2 = 7/6`.

For `n = 1` every first roll finishes, so the expectation is exactly 1.

### First Thought / Brute Force

Simulate millions of random games and average them. That estimates the answer. It is not the exact DP the judge wants, and it is slow and noisy.

### Why Brute Force Is Too Slow

Exact enumeration of roll sequences is exponential. There are only `n` relevant sums below the threshold, plus the sums `n .. n+5` which are already finished.

### Identify the DP State

```text
E[s] = expected number of additional rolls needed when the current sum is s
```

### Transition

For `s ≥ n`, the process has stopped:

```text
E[s] = 0
```

For `s < n`:

```text
E[s] = 1 + (E[s+1] + E[s+2] + E[s+3] + E[s+4] + E[s+5] + E[s+6]) / 6
```

The `1` is the roll you are about to make. The average is the six equally likely futures. None of them stay at `s`, because every face is at least 1. So `E[s]` is not on the right-hand side, and you can compute from large `s` down toward 0.

### Base Cases

```text
E[s] = 0 for every s ≥ n
```

### DP Approach

Allocate `E[0 .. n+5]`, set the finished region to 0, then fill `s` from `n-1` down to 0. The answer is `E[0]`.

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

double expectedRolls(int n) {
    vector<double> E(n + 6, 0.0);             // E[s] = 0 for s >= n, already
    for (int s = n - 1; s >= 0; s--) {
        double sum = 0;
        for (int face = 1; face <= 6; face++) sum += E[s + face];
        E[s] = 1.0 + sum / 6.0;
    }
    return E[0];
}

int main() {
    cout << fixed << setprecision(10);
    cout << expectedRolls(1) << "\n";         // 1.0000000000
    cout << expectedRolls(2) << "\n";         // 1.1666666667
}
```

### Code Explanation

- The vector length `n+6` covers a roll of 6 from sum `n-1`, which lands on `n+5`. Those cells stay 0, correctly, because they are past the threshold.
- The downward loop reads larger sums first. An upward loop would read futures that are not computed yet (they would still be 0 and look “already finished”).
- Dividing by 6 is the fair die. A biased die replaces the average with a weighted sum.
- `n = 1` and `n = 2` match the manual calculation. Always keep one case you can compute by hand.

### Complexity

```text
Time:  O(n)
Space: O(n)
```

### Common Mistakes

- Computing upward from 0, so every future looks like 0 and every `E[s]` becomes 1.
- Forgetting the `1` for the current roll, which computes a sum of probabilities rather than an expected count.
- Using this straight loop when a move can stay in the same state (a “do nothing” outcome). Then `E[s]` sits on the right-hand side. Bring those terms to the left and divide. Example: from `s` you stay with probability `1/2` or move to `s+1` with probability `1/2`, and each attempt costs 1. Then `E[s] = 1 + 0.5 E[s] + 0.5 E[s+1]`, so `E[s] = 2 + E[s+1]`, and `E[n] = 0`. Solving is part of the DP, not a failure of it.
- Printing a simulation and calling it exact.

### Key Takeaway

Expected-cost DP writes “1 plus the average of the states I can move to.” If the next states are always larger, fill downward. If a state can repeat, solve for that variable algebraically.

---

## 22. Common DP Mistakes

### Wrong state definition

`dp[i]` = “best subsequence ending at `i`” is a different number from `dp[i]` = “best subsequence using the prefix `i`.” LIS wants the first meaning and then a maximum over `i`. House robber wants the second and then `dp[n]`. Mixing them returns a plausible-looking wrong answer on samples that happen to end at the best index.

Write the sentence before the array exists.

### Wrong transition

House robber take-branch reading `dp[i-1] + nums[i]` robs two neighbors. The transition must name a legal decision. If you cannot point at the decision in the problem, the formula is a guess.

### Missing base case

Counting DP with `dp[0] = 0` stays zero forever. Minimum-coin DP with every cell 0, including positive amounts, thinks every amount is free. Game DP with `dp[0] = true` flips the whole table.

### Off-by-one

LCS prefix lengths versus string indices: `dp[i][j]` talks about `a[i-1]` and `b[j-1]`. Interval length: `r = l + len - 1`, not `l + len`. Knapsack capacity loops that use `w > weight` and skip `w == weight`.

Pick one example with `n = 1` and one with `n = 2`. Off-by-ones show up there more often than on the big sample.

### Incorrect iteration order

Interval DP filled by increasing `l` instead of increasing length reads empty cells. DAG edges relaxed in input order are not DP. Digit DP has no array order problem if it is memoized, but the `pos + 1` recursion is the order.

### Updating in the wrong direction

0/1 knapsack scanned forward uses an item many times. Unbounded knapsack scanned backward uses it once. The direction is the constraint. Write a comment on the loop that says which constraint it enforces.

### Reusing an item in 0/1 knapsack

This is the forward scan, or a 2D transition that reads `dp[i][w - weight]` (current row) instead of `dp[i-1][w - weight]`. One extra copy of an item is enough to pass a sample and fail the judge.

### Integer overflow

`int` knapsack values, Fibonacci past `F(92)`, path counts without a modulus, and `INF + cost` when `INF` is `LLONG_MAX`. Use `long long`, take the modulus on every update that the statement names, and pick a sentinel around `4e18` so adding a cost does not overflow.

`F(92)` fits in signed 64-bit. `F(93)` does not.

### Incorrect initialization

| Goal | Initialize | Exception |
| --- | --- | --- |
| Minimum cost | `+infinity` | the true start, set to 0 |
| Maximum score, scores may be negative | `-infinity` | the true start |
| Count of ways | `0` | `dp[empty] = 1` |
| Reachability | `false` | `dp[0] = true` |
| Memoization sentinel | a value the answer cannot take | or a separate `visited` array |

A maximum-score DP initialized to 0 is correct only when the empty choice scores 0 and every real score is compared with `max`. If doing nothing is illegal, 0 is a lie.

### Forgetting impossible states

Leaving impossible cells at 0 and then taking `min` with them invents a free path. Propagating `infinity + 1` invents a huge finite cost or overflows. Skip cells that are still infinite.

### Excessive memory

`dp[1000][1000][1000]` of `int` is 4 GB. Before you allocate, multiply the dimensions by the size of the element. A rolling row, a bitset, or a smaller state is the fix. `vector<vector<int>>` also spends extra memory on row pointers. For tight limits, one flat vector is safer.

### Incorrect dimensions

A dimension you do not need costs time and memory. A dimension you dropped loses information the future needed: the last city in TSP, the tight flag in digit DP, the “taken” bit in tree DP. If two histories in the same cell have different legal futures, the cell is too small.

---

## 23. DP Debugging Method

Use this list in order. Do not start by rewriting the transition.

```text
1. Write down what dp[i] means.
2. Test the smallest input.
3. Check every base case.
4. Manually calculate a few states.
5. Verify the transition.
6. Check loop direction.
7. Check array boundaries.
8. Check impossible states.
9. Check complexity.
```

### What each step catches

1. **The sentence.** If you cannot finish “`dp[i][w]` means …”, stop coding. Most wrong submissions are a sentence that does not match the loops.
2. **Smallest input.** `n = 0`, `n = 1`, empty string, one item that does not fit, target 0, a single tree node, `R = 0` in digit DP.
3. **Base cases.** Print them. A counting base of 0 and a min-cost base of 0 on non-start cells are the two standard disasters.
4. **Hand table.** Fill the same cells the program fills, on an input of size 3 or 4. Compare printed cells to your paper.
5. **Transition.** For one cell that disagrees, list the decisions and the cells they read. The bug is usually one illegal decision or one wrong index.
6. **Direction.** 0/1 versus unbounded is a one-line reversal. If the sample has only one copy of each item, both directions can pass. Add a sample where using two copies is tempting and illegal.
7. **Boundaries.** The first row, the first column, `i-2` when `i = 1`, `w - weight` when it is negative, bit `n` when `1 << n` no longer fits in a signed 32-bit shift.
8. **Impossible states.** Print any answer cell that is still your sentinel. If the problem promises a solution, the sentinel means the transition never reached it.
9. **Complexity.** Count states times work per state. Compare with the constraint table in the prerequisites. A correct `O(n^3)` on `n = 5000` is a wrong submission.

### Debugging from a table

Knapsack, capacity 5, items `(weight, value) = (2, 3), (3, 4), (4, 5)`. Correct table (rows are items considered, columns are capacity):

| items \ capacity | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| none | 0 | 0 | 0 | 0 | 0 | 0 |
| `(2, 3)` | 0 | 0 | 3 | 3 | 3 | 3 |
| `(3, 4)` | 0 | 0 | 3 | 4 | 4 | 7 |
| `(4, 5)` | 0 | 0 | 3 | 4 | 5 | 7 |

Suppose the program prints 12 at the bottom-right. Look at the row where the table first disagrees with yours. If the second item already produced a 8 at capacity 5, the implementation used the first item twice (`3 + 3` is not even the transition, but `4 + 4` from a forward scan would show a value that one copy of item 2 cannot explain). The disagreement row tells you which item was applied incorrectly. The disagreement column tells you the capacity. You do not need to stare at the final answer and guess.

Print the whole table for `n ≤ 10`. For larger state spaces, print the base row and the answer cell’s predecessors.

---

## 24. How to Derive DP from a Problem

One problem, the whole pipeline. Decode Ways is a counting DP on a string. The framework is the point. The problem is the carrier.

```text
Problem
   ↓
Find decisions
   ↓
Find repeated subproblems
   ↓
Define state
   ↓
Define transition
   ↓
Define base cases
   ↓
Choose memoization or tabulation
   ↓
Optimize memory
   ↓
Analyze complexity
```

---

## Problem: Decode Ways

### Problem Statement

A string `s` contains digits. A way to decode it maps the string to letters by splitting it into numbers `1` through `26`, where `1` is `A` and `26` is `Z`. Return how many ways `s` can be decoded. A chunk may not have a leading zero. `s = "06"` has zero ways. `s = "10"` has one way.

Platform: LeetCode 91.

### Example

Input:

```text
s = 226
```

Output:

```text
3
```

`2|2|6` → `BBF`, `22|6` → `VF`, `2|26` → `BZ`. `226` as three digits is not a letter.

### First Thought / Brute Force

From the start of the remaining suffix, try to take one digit if it is `1..9`, and two digits if the number is `10..26`. Count the ways to finish the suffix.

### Why Brute Force Is Too Slow

Each position branches by up to 2, so the naive tree is `O(2^n)`. The same suffix is reached by many different splits of the prefix. `n ≤ 100` in the usual statement, which makes `O(n)` trivial and `2^n` unacceptable.

### Find the decisions

At the current index you have at most two legal decisions:

- Consume one character, if it is not `'0'`.
- Consume two characters, if they form a number from 10 to 26.

There is no third decision. A zero cannot start a chunk.

### Find the repeated subproblems

After you have consumed some prefix, the future does not care *how* you decoded that prefix. It only cares how many ways you did it, and where you are now. The suffix `s[i..]` is the whole remaining problem.

### Identify the DP State

```text
dp[i] = number of ways to decode the prefix s[0 .. i)
```

`i` is the number of characters already decoded. This is equivalent to “ways to decode the suffix starting at `i`,” written from the other end. The prefix form fits a forward loop.

### Transition

```text
dp[i] += dp[i - 1]        if i ≥ 1 and s[i - 1] != '0'
dp[i] += dp[i - 2]        if i ≥ 2 and the number s[i-2..i-1] is between 10 and 26
```

The last chunk was one legal digit, or two. Those cases are disjoint (different chunk lengths) and cover every decoding. Zeros are rejected by the conditions, so `"10"` counts the two-digit chunk and not a one-digit `'0'`.

### Base Cases

```text
dp[0] = 1
```

One way to decode the empty prefix: decode nothing. This is what makes a valid first chunk contribute 1.

`dp[1]` falls out of the transition. If `s[0]` is `'0'`, nothing is added and `dp[1]` stays 0, which is correct.

### Choose memoization or tabulation

The dependency is a short chain behind `i`. A forward loop is the natural order. Memoizing “ways from index `i` to the end” is equally correct and is the recursive version of the same decisions. Tabulation avoids a recursion of depth `n`.

### Optimize memory

`dp[i]` reads only `dp[i-1]` and `dp[i-2]`. Two variables are enough. The code below keeps the array so the base and the transition stay visible. Compress it the same way Fibonacci was compressed, after the samples pass.

### Analyze complexity

```text
Time:  O(n)
Space: O(n)     or O(1) after compression
```

### C++ Solution

```cpp
#include <bits/stdc++.h>
using namespace std;

long long numDecodings(const string& s) {
    int n = (int)s.size();
    vector<long long> dp(n + 1, 0);
    dp[0] = 1;                                    // empty prefix
    for (int i = 1; i <= n; i++) {
        if (s[i - 1] != '0') dp[i] += dp[i - 1];  // last chunk is one digit
        if (i >= 2 && s[i - 2] != '0') {
            int two = (s[i - 2] - '0') * 10 + (s[i - 1] - '0');
            if (two <= 26) dp[i] += dp[i - 2];    // last chunk is two digits
        }
    }
    return dp[n];
}

int main() {
    cout << numDecodings("226") << "\n";          // 3
    cout << numDecodings("06") << "\n";           // 0
    cout << numDecodings("10") << "\n";           // 1
    cout << numDecodings("12") << "\n";           // 2
}
```

### Code Explanation

- `dp[0] = 1` is the empty decoding, not a decoding of a zero.
- The one-digit branch refuses `'0'`. The two-digit branch refuses a leading zero by testing `s[i-2] != '0'`, so `"06"` does not become the number 6.
- `two <= 26` together with the leading-zero test is exactly the range 10..26. `"26"` passes. `"27"` fails. `"10"` passes.
- Both branches may succeed on the same `i`. `"226"` at `i = 3` takes both: the last digit `6` extends `dp[2]`, and the last two digits `26` extend `dp[1]`.
- The answer is `dp[n]`, the whole string.

### Complexity

```text
Time:  O(n)
Space: O(n)
```

### Common Mistakes

- Treating `"06"` as a valid 6.
- Allowing a chunk `0` because `0 <= 26`.
- Setting `dp[0] = 0` and getting zero ways for every string, including `"1"`.
- Forgetting that both a one-digit and a two-digit chunk can end at the same position, and writing `if / else` instead of two independent additions.

### Key Takeaway

Derive the state from the question “what does the future still need?” Here it only needs the cut position. The decisions are the legal last chunks. The base case is the empty prefix, value 1, because this is a counting DP.

---

## 25. DP Problem-Solving Workflow

What to do in a contest, in order, with a clock running.

### Step 1. Read the constraints

Before the story settles, read `n`, the value bounds, and the modulus. The constraint row in the prerequisites chapter is a menu: `n ≤ 20` suggests subsets, `n ≤ 500` and intervals suggest `O(n^3)`, `n ≤ 1e5` on a tree suggests linear tree DP, a limit of `10^18` on a number suggests digit DP. If your favorite recurrence does not fit, it is not the solution, even if it is correct.

### Step 2. Look for decisions and states

Ask what choice a solution makes last, and what it must remember afterward. One index, a capacity, two pointers, a mask, a node plus a bit. If the memory is a whole subset of a large array, this is probably not the DP.

### Step 3. Try brute force mentally

Write the exponential recursion in your head or in a comment. If you cannot, you do not understand the decisions yet. If you can, the parameters of that recursion are a draft state.

### Step 4. Identify repeated states

Call the recursion on paper for `n = 4`. If the same arguments appear twice, a cache will help. If they never repeat, DP will not beat the brute force. Look for a different algorithm.

### Step 5. Define the DP

Write four lines:

```text
state sentence
transition in words
base cases
which cell is the answer
```

Only then open the editor.

### Step 6. Estimate complexity

States × transitions per state. Compare to about `1e8` simple operations. Include the modulus and the memory. `dp[2^20][20]` of `long long` is 160 MB. Some judges allow it. Some allow 256 MB. Some allow less. Count bytes.

### Step 7. Implement

Translate the four lines. Do not “improve” the recurrence while typing. Mark impossible cells. Use `long long` if the statement did not prove the answer fits in `int`.

### Step 8. Test edge cases

Run, at least:

- the sample
- the smallest legal input
- an impossible case, if the problem has one
- a case where the 0/1 versus unbounded distinction matters
- a case where the answer is not stored in the last index (LIS-style)

If the sample fails, print the table. Use the debugging list. Do not randomly edit the transition.

---

## 26. Complete Solved Problem Set

Every problem in this list is solved earlier in the guide: statement, brute force, why it is slow, state, transition, base cases, a C++17 program, complexity, mistakes, and a takeaway. This section is the order to practice and review. Re-solve the problem from the card before you reread the chapter.

Extra problems at the end of each level are for independent practice. They are not written out here.

### Level 1 — Beginner

You can define `dp[i]`, find a base case, and evaluate a linear recurrence.

| Problem | Platform | State | Answer |
| --- | --- | --- | --- |
| Fibonacci Number | LeetCode 509 | `dp[i] = F(i)` | `dp[n]` |
| Climbing Stairs | LeetCode 70 | `dp[i]` = ways to reach stair `i` | `dp[n]` |
| Min Cost Climbing Stairs | LeetCode 746 | `dp[i]` = min cost to reach position `i` | `dp[n]` |
| House Robber | LeetCode 198 | `dp[i]` = best loot from the first `i` houses | `dp[n]` |
| Frog 1 | AtCoder Educational DP A | `dp[i]` = min cost to reach stone `i` | `dp[n-1]` |
| Dice Combinations | CSES | `dp[x]` = ordered ways to make sum `x` | `dp[n]` |
| Grid Paths / Unique Paths | CSES / LeetCode 62 | `dp[i][j]` = ways to reach the cell | `dp[n-1][m-1]` |
| Minimizing Coins | CSES / LeetCode 322 | `dp[x]` = min coins to make `x` | `dp[target]`, or impossible |

Review cards:

**Fibonacci.** Transition `dp[i] = dp[i-1] + dp[i-2]`, bases `0, 1`. Naive time `O(φ^n)`, DP time `O(n)`, compressed space `O(1)`. Mistake: using `0` as the memo sentinel.

**Climbing Stairs.** Same arithmetic, different sentence: ways to arrive, last step 1 or 2, `dp[0] = 1`. Mistake: `dp[0] = 0`.

**Min Cost Climbing Stairs.** `dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2])`, starts `dp[0] = dp[1] = 0`, answer `dp[n]`. Mistake: charging the top as if it were a stair.

**House Robber.** `dp[i] = max(dp[i-1], dp[i-2] + nums[i-1])`. Mistake: taking from `dp[i-1]` and still adding the neighbor.

**Frog 1.** `dp[i] = min(dp[i-1] + |h[i]-h[i-1]|, dp[i-2] + |h[i]-h[i-2]|)`, `dp[0] = 0`. Mistake: a sentinel of 0 on unreached stones.

**Dice Combinations.** `dp[0] = 1`, add the six previous residues, modulus `1e9+7`, amount loop outside. Mistake: counting unordered combinations.

**Unique Paths.** `dp[i][j] = dp[i-1][j] + dp[i][j-1]`, start 1, missing neighbors contribute 0. CSES Grid Paths adds blocked cells (those cells stay 0) and the same modulus. Mistake: double-counting the first row.

**Minimum coins.** `dp[0] = 0`, everything else infinity, `dp[x] = min(dp[x-c] + 1)`. Mistake: initializing the array to 0.

Further practice: AtCoder Educational DP B (Frog 2, `O(nK)`), CSES Removing Digits, LeetCode 198’s circular follow-up House Robber II (two linear passes, because the first and last house are adjacent).

### Level 2 — Intermediate

You can handle a budget, two strings, and a subsequence ending condition.

| Problem | Platform | State | Answer |
| --- | --- | --- | --- |
| Book Shop (0/1 knapsack) | CSES | `dp[w]` = best pages with budget `w` | `dp[W]`, items backward |
| Coin Combinations II | CSES / LeetCode 518 | `dp[x]` = unordered ways | coin loop outside, forward |
| Coin Combinations I | CSES | `dp[x]` = ordered ways | amount loop outside |
| Money Sums / Subset Sum | CSES | `dp[s]` reachable | backward boolean loop |
| Partition Equal Subset Sum | LeetCode 416 | subset sum to `total/2` | false if `total` is odd |
| Longest Common Subsequence | LeetCode 1143 / CSES | `dp[i][j]` LCS of two prefixes | `dp[n][m]` |
| Longest Increasing Subsequence | LeetCode 300 / CSES | `dp[i]` LIS **ending at** `i` | `max dp[i]`, or `O(n log n)` tails |
| Edit Distance | LeetCode 72 / CSES | `dp[i][j]` edits between prefixes | `dp[n][m]`, bases `i` and `j` |
| Longest Palindromic Subsequence | LeetCode 516 | `dp[l][r]` on the substring | `dp[0][n-1]`, by length |
| Best Time to Buy and Sell Stock | LeetCode 121 | best profit on a prefix, min price so far | running maximum |
| Decode Ways | LeetCode 91 | `dp[i]` ways to decode a prefix | `dp[n]`, `dp[0] = 1` |
| Distinct Subsequences | LeetCode 115 | `dp[i][j]` ways to form the target prefix | `dp[n][m]` |

Mistakes that matter at this level:

- Forward knapsack when the item is 0/1.
- Backward coins when the supply is unlimited.
- LCS reading `a[i]` instead of `a[i-1]`.
- LIS returning `dp[n-1]`.
- Edit distance base row left at 0.
- Partition attempted on an odd total.
- Decode Ways accepting a leading zero.

Further practice: CSES Rectangle Cutting, LeetCode 1143’s reconstruction (already in the LCS section), AtCoder Educational DP D (knapsack), E (knapsack on values, when `W` is huge and the values are small — swap the dimensions), S (digit DP, a bridge to level 3).

### Level 3 — Advanced

You can root a tree, order a DAG, index a subset by a mask, walk the digits of a huge integer, and recognize when a correct DP is too slow.

| Problem | Platform | State | Answer |
| --- | --- | --- | --- |
| Matrix Chain Multiplication | classical | `dp[l][r]` min cost on a subchain | `dp[0][n-1]`, `O(n^3)` |
| Burst Balloons | LeetCode 312 | `dp[l][r]` coins from bursting inside `(l, r)`, `k` last | `dp[0][n+1]` with sentinels |
| Maximum Independent Set on a tree | classical tree DP | `dp[u][0/1]` take or skip `u` | `max` at the root |
| Tree Matching | CSES | `dp[u][0/1]` matched downward or not | `max` at the root |
| Traveling Salesman | classical Held–Karp, `n ≤ 16` | `dp[mask][i]` min cost, subset done, end at `i` | full mask, plus the edge home |
| Count numbers `≤ R` with digit sum `S` | classical digit DP | `dp[pos][tight][sum]` | call at `(0, 1, 0)` |
| Count numbers `≤ R` with no zero digit | classical digit DP | `dp[pos][tight][started]` | base returns `started` |
| Longest and shortest paths | any DAG problem, e.g. CSES course-schedule style graphs | `dp[u]` best distance from the source | relax in topological order |
| Subtraction game | classical game DP | `dp[i]` player to move wins | `dp[0] = false` |
| Stone Game on a row | LeetCode 877 | `dp[l][r]` forced score difference | `dp[0][n-1] > 0` |
| Subset sums with a bitset | CSES Money Sums when the boolean loop is tight | `bitset` of reachable sums | `dp \|= dp << x` |
| Gap-limited maximum subsequence | monotonic queue | `dp[i]` best subsequence ending at `i` | `max dp[i]` |
| Optimal BST | Knuth | `dp[l][r]`, `opt` monotone | `dp[0][n-1]` |
| Partition into K squared-sum segments | divide-and-conquer opt | `dp[g][i]` | `dp[K][n]` |
| Minimum of lines | convex hull trick | `dp[i] = min_j dp[j] + slope[j] * x[i]` | hull query |
| Landing on `n` | probability DP | `reach[i]` | `reach[n]` |
| Expected die rolls to reach `n` | expected-value DP | `E[s]` extra rolls from sum `s` | `E[0]`, fill downward |

Further practice, by family:

- **Interval:** AtCoder Educational DP N (slimes), LeetCode 1039 (minimum score triangulation), palindrome partition minimum cuts.
- **Tree:** CSES Tree Diameter is not the DP above, but Tree Matching is. Also independent-set variants with an extra color, and rerooting DP once the single-root version feels mechanical.
- **Bitmask:** CSES Hamiltonian Flights (count paths with `dp[mask][i]`), assignment problems, TSP on small complete graphs from Codeforces.
- **Digit:** AtCoder Educational DP S (Digit Sum). Any Codeforces problem that asks for a count in `[L, R]` with `R` up to `10^18`.
- **DAG:** CSES Longest Flight Route (longest path in a DAG), Course Schedule (topological order).
- **Games:** CSES Nim Game (Grundy numbers, the next step after win/loss DP), subtraction games with a custom set of moves.
- **Optimization:** only after the `O(n^2)` or `O(n^3)` solution is correct on small tests. Compare the fast version to the slow version on random `n ≤ 10` before you trust it.

---

## 27. DP Pattern Cheat Sheet

| Pattern | State | Typical transition | Example |
| --- | --- | --- | --- |
| 1D DP | `dp[i]` | previous states | Climbing Stairs |
| Knapsack | `dp[i][w]` | take or skip | 0/1 Knapsack |
| Grid DP | `dp[i][j]` | from the top and from the left | Grid Paths |
| String DP | `dp[i][j]` | compare the ends of two prefixes | LCS |
| Interval DP | `dp[l][r]` | split the interval, shorter first | Matrix Chain |
| Tree DP | `dp[u][state]` | combine children in postorder | Independent set |
| Bitmask DP | `dp[mask][i]` | add one element to the subset | TSP |
| Digit DP | `dp[pos][tight][state]` | choose the next digit under the cap | Digit sum count |
| DAG DP | `dp[u]` | relax outgoing edges in topological order | Longest path |
| Game DP | `dp[state]` | a move into a losing position for the opponent | Subtraction game |

---

## 28. DP State Recognition Cheat Sheet

```text
dp[i]
dp[i][j]
dp[l][r]
dp[node][state]
dp[mask]
dp[mask][i]
dp[pos][tight][state]
dp[i][capacity]
```

### `dp[i]`

Usually the answer for a prefix of length `i`, for the position `i`, or for the sum `i`.

Used by stair problems, house robber, coin counts, dice sums, one-dimensional games.

Example: `dp[i]` = ways to make sum `i` with ordered dice rolls. `dp[0] = 1`.

Watch the answer cell. If the sentence says “ending at `i`”, take a max or a sum over `i`.

### `dp[i][j]`

Two independent facts. On a grid they are coordinates. On strings they are prefix lengths. On a schedule they might be “day `i`, `j` transactions used.”

Example: `dp[i][j]` = edit distance between the first `i` characters of `a` and the first `j` of `b`.

The loop order must follow the arrows. If both indices only decrease in the transition, increasing nested loops are safe.

### `dp[l][r]`

The subarray or subchain from `l` to `r` inclusive, or the open interval between two walls.

Used by matrix chain, burst balloons, palindromic subsequence, optimal BST, stone games on a row.

Example: `dp[l][r]` = minimum multiplication cost of matrices `l` through `r`.

Always fill by increasing `r - l`. A single cell is the base.

### `dp[node][state]`

The subtree of `node`, plus the bit the parent needs: taken or not, matched or not, colored or not.

Used by independent set, tree matching, and most “choose a subset of a tree” problems.

Example: `dp[u][1] = weight[u] + sum of dp[child][0]`.

Compute children before the parent. Pass the parent id so the undirected edge is not a cycle.

### `dp[mask]`

A subset of a set with `n ≤ 20` elements, and nothing else about the subset matters.

Used by subset enumeration when the score of a subset depends only on smaller subsets. “Sum over all submasks” is a related technique, `O(3^n)` or `O(2^n * n)` depending on the loop.

Example: reachable subsets, or a minimum cost to cover exactly the tasks in `mask` when the last task does not matter.

If the last task *does* matter, this state is too small. Use the next one.

### `dp[mask][i]`

The subset has been handled, and `i` is the special element: the end of the path, the last city, the person who took the last job.

Used by TSP, Hamiltonian paths, and assignments along a permutation.

Example: `dp[mask][i]` = minimum cost of a path that starts at 0, visits each city in `mask` once, and ends at `i`.

`i` must be inside `mask`. Cells that break that rule stay at infinity.

### `dp[pos][tight][state]`

You are writing an integer digit by digit, at digit position `pos`. `tight` says whether you are still copying the upper bound. `state` is the property: digit sum, remainder, last digit, “has the number started.”

Used when the range goes up to `10^18` and the property is about digits.

Example: `dp[pos][tight][sum]` = ways to finish a number whose digits so far sum to `sum`.

Do not add a leading-zero flag unless the written form matters. Do not forget it when the written form matters.

### `dp[i][capacity]`

The first `i` items, and a remaining or used budget.

Used by 0/1 knapsack, subset sum, and bounded counts.

Example: `dp[i][w]` = maximum value using the first `i` items with capacity `w`.

Compress to `dp[w]` only when you can explain why the loop direction preserves the “at most once” or “unlimited” rule. If you cannot explain the direction, keep the second dimension. Memory is cheaper than a wrong answer.

---

## 29. Final DP Learning Roadmap

```text
Beginner
   ↓
Recursion
   ↓
Memoization
   ↓
Tabulation
   ↓
1D DP
   ↓
2D DP
   ↓
Knapsack
   ↓
Grid DP
   ↓
String DP
   ↓
LIS
   ↓
Tree DP
   ↓
DAG DP
   ↓
Bitmask DP
   ↓
Digit DP
   ↓
Game DP
   ↓
DP Optimization
```

**Beginner.** You can say what a state, a transition, a base case, and an answer cell are, on the staircase example, without code.

**Recursion.** You can write naive Fibonacci and draw the repeated calls. You can state the exponential cost.

**Memoization.** You can add a cache, explain the sentinel, and argue the complexity dropped to the number of distinct states.

**Tabulation.** You can turn that recursion into a loop, name the order, and compare time and space with the memoized version.

**1D DP.** You can solve climbing stairs, house robber, frog, dice combinations, and minimum coins, including the impossible-state and modulus details.

**2D DP.** You can justify each dimension, fill cells in a legal order, and compute memory before allocating.

**Knapsack.** You can explain take versus skip, implement the backward 0/1 loop and the forward unbounded loop, and say what goes wrong if the direction flips. Subset sum and partition are included.

**Grid DP.** You can count paths and minimize path sums with right and down moves, and you know four-direction movement is a different algorithm.

**String DP.** You can write LCS, edit distance, distinct subsequences, and longest palindromic subsequence, and reconstruct an LCS if asked.

**LIS.** You can write the `O(n^2)` ending-at-`i` DP and the `O(n log n)` tails method, and you can say why `tails` is sorted and why it is not always the subsequence itself.

**Tree DP.** You can root a tree, DFS in postorder, and keep one or two states per node for independent set and matching.

**DAG DP.** You can topologically sort and relax longest and shortest paths, and you recognize ordinary DP as the special case with a hidden DAG.

**Bitmask DP.** You can index subsets, write TSP in `O(2^n n^2)`, and stay inside the shift limits of the integer type.

**Digit DP.** You can count integers up to `R` under a digit property, with a tight flag, and you know when a leading-zero flag is required. Range `[L, R]` is `count(R) - count(L-1)`.

**Game DP.** You can label winning and losing positions, and you can turn an interval take-from-the-ends game into a difference DP.

**DP optimization.** You can compress memory, replace a range sum with a prefix or a window, and *recognize* monotone queues, divide-and-conquer optimization, Knuth, convex hull trick, and bitsets. You do not apply them until the slow DP is correct and the extra structure is actually there.

At that last stage you are ready for the DP sections of CSES, the AtCoder Educational DP contest, and Div. 2 problems whose constraints are a hint about the state. The work that remains is repetition: read a statement, write the four lines (state, transition, base, answer), then code.
