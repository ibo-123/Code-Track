import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  AI_ERROR,
  REVIEW_TYPE_VALUES,
  assertProvider,
} from "../src/ai/provider.js";
import {
  MOCK_PROVIDER_ID,
  generateCodeReview,
  mockProvider,
} from "../src/ai/mockProvider.js";

const serverRoot = fileURLToPath(new URL("..", import.meta.url));
const preloadHref = pathToFileURL(
  fileURLToPath(new URL("./helpers/block-network.js", import.meta.url))
).href;

const SAMPLE = {
  sourceCode: "int main(){return 0;}\n",
  programmingLanguage: "GNU C++17",
  reviewType: "explain",
  problemTitle: "A. Watermelon",
  problemStatement: "Split the weight into two even positive integers.",
};

const importSpecifiers = (relativePath) => {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  return [
    ...source.matchAll(/^import[\s\S]+?from\s+["']([^"']+)["'];/gm),
  ].map((match) => match[1]);
};

const runBlocked = (evalSource) =>
  spawnSync(
    process.execPath,
    ["--import", preloadHref, "--input-type=module", "--eval", evalSource],
    {
      cwd: serverRoot,
      encoding: "utf8",
      timeout: 15_000,
    }
  );

describe("Phase 4 — mock AI provider", () => {
  it("implements generateCodeReview on the provider object", () => {
    assertProvider(mockProvider);
    assert.equal(mockProvider.id, MOCK_PROVIDER_ID);
    assert.equal(mockProvider.generateCodeReview, generateCodeReview);
  });

  it("returns the structured mock review for valid input", async () => {
    const review = await generateCodeReview(SAMPLE);

    assert.equal(review.contractVersion, "1");
    assert.equal(review.providerId, "mock");
    assert.equal(review.reviewType, "explain");
    assert.equal(review.programmingLanguage, "GNU C++17");
    assert.equal(review.problemTitle, "A. Watermelon");
    assert.equal(review.hasProblemStatement, true);
    assert.equal(review.hasAnalysisContext, false);
    assert.equal(review.sourceBytes, Buffer.byteLength(SAMPLE.sourceCode));
    assert.equal(typeof review.summary, "string");
    assert.ok(review.summary.length > 0);
    assert.equal(review.comments.length, 1);
    assert.equal(typeof review.comments[0].topic, "string");
    assert.equal(typeof review.comments[0].body, "string");
    assert.ok(review.limitations.length >= 2);
  });

  it("is deterministic for the same input", async () => {
    const first = await generateCodeReview(SAMPLE, { timeoutMs: 1000 });
    const second = await generateCodeReview(
      { ...SAMPLE },
      { timeoutMs: 1000 }
    );

    assert.notEqual(first, second);
    assert.deepEqual(first, second);
    assert.equal(first.deterministic, true);
  });

  it("preserves each supported review type", async () => {
    for (const reviewType of REVIEW_TYPE_VALUES) {
      const review = await generateCodeReview({ ...SAMPLE, reviewType });
      assert.equal(review.reviewType, reviewType);
      assert.match(review.summary.toLowerCase(), /mock/);
    }
  });

  it("rejects missing source code", async () => {
    const cases = [
      {},
      { sourceCode: "" },
      { sourceCode: "   \n" },
      { sourceCode: null },
    ];

    for (const input of cases) {
      await assert.rejects(
        () => generateCodeReview({ ...input, reviewType: "explain" }),
        (error) => {
          assert.equal(error.code, AI_ERROR.SOURCE_MISSING);
          assert.equal(error.status, 400);
          assert.equal(error.message.includes("int main"), false);
          return true;
        }
      );
    }
  });

  it("rejects unsupported review types", async () => {
    for (const reviewType of ["hint", "Explain", "", "debug"]) {
      await assert.rejects(
        () => generateCodeReview({ ...SAMPLE, reviewType }),
        (error) => {
          assert.equal(error.code, AI_ERROR.UNSUPPORTED_REVIEW_TYPE);
          assert.equal(error.status, 400);
          return true;
        }
      );
    }
  });

  it("marks the result as mock data and not a model judgment", async () => {
    const review = await generateCodeReview(SAMPLE);
    const text = JSON.stringify(review);

    assert.equal(review.mock, true);
    assert.match(review.summary, /^Mock /);
    assert.match(text, /Fixed mock data/);
    assert.equal(review.generatedByModel, false);
    assert.match(
      review.limitations.join("\n"),
      /not produced by a language model/
    );
  });

  it("does not claim the submission was executed or verified", async () => {
    const review = await generateCodeReview(SAMPLE, {
      timeoutMs: 500,
    });

    assert.equal(review.executed, false);
    assert.equal(review.verified, false);
    assert.match(
      review.limitations.join("\n"),
      /not executed, tested, or verified/
    );
    assert.doesNotMatch(
      JSON.stringify(review),
      /tests passed|execution succeeded|verified the submitted/i
    );
  });

  it("accepts optional problem text and Phase 3 context without echoing them", async () => {
    const marker = "PHASE3_SENTINEL_should_not_appear";
    const sourceMarker = "SOURCE_SENTINEL_should_not_appear";
    const review = await generateCodeReview({
      sourceCode: `// ${sourceMarker}\nint main(){return 0;}\n`,
      programmingLanguage: "cpp",
      reviewType: "complexity",
      problemTitle: "A. Watermelon",
      problemStatement: `Statement ${marker}`,
      analysisContext: {
        analyzerVersion: "3.0.0",
        status: "partial",
        note: marker,
      },
    });

    assert.equal(review.hasProblemStatement, true);
    assert.equal(review.hasAnalysisContext, true);
    assert.equal(review.reviewType, "complexity");
    const text = JSON.stringify(review);
    assert.equal(text.includes(marker), false);
    assert.equal(text.includes(sourceMarker), false);
  });

  it("does not require provider credentials", async () => {
    const keys = [
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
      "GEMINI_API_KEY",
      "CF_API_KEY",
      "CF_API_SECRET",
    ];
    const saved = new Map(keys.map((key) => [key, process.env[key]]));
    for (const key of keys) delete process.env[key];

    try {
      const review = await generateCodeReview(SAMPLE);
      assert.equal(review.providerId, "mock");
      assert.equal(review.mock, true);
    } finally {
      for (const [key, value] of saved) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }

    const mockSource = fs.readFileSync(
      new URL("../src/ai/mockProvider.js", import.meta.url),
      "utf8"
    );
    assert.equal(mockSource.includes("process.env"), false);

    await assert.rejects(
      () => generateCodeReview(SAMPLE, { apiKey: "not-a-real-key" }),
      (error) => {
        assert.equal(error.code, AI_ERROR.CREDENTIALS_NOT_ACCEPTED);
        assert.equal(error.message.includes("not-a-real-key"), false);
        return true;
      }
    );
  });

  it("does not make network requests", () => {
    assert.deepEqual(importSpecifiers("../src/ai/mockProvider.js"), [
      "./provider.js",
    ]);
    assert.deepEqual(importSpecifiers("../src/ai/provider.js"), [
      "../analysis/version.js",
    ]);

    const reviewRun = runBlocked(`
      import { generateCodeReview } from "./src/ai/mockProvider.js";
      const review = await generateCodeReview({
        sourceCode: "int main(){return 0;}",
        programmingLanguage: "cpp",
        reviewType: "edge_cases",
      });
      if (review.mock !== true || review.executed !== false || review.reviewType !== "edge_cases") {
        process.exit(3);
      }
      process.stdout.write("ok");
    `);

    assert.equal(
      reviewRun.status,
      0,
      reviewRun.stderr || reviewRun.stdout || "mock child failed"
    );
    assert.equal(reviewRun.stdout, "ok");

    const probe = runBlocked(`
      try {
        await fetch("http://127.0.0.1:9/");
        process.exit(0);
      } catch (error) {
        if (error && error.code === "NETWORK_BLOCKED") process.exit(2);
        console.error(error && (error.code || error.message));
        process.exit(1);
      }
    `);

    assert.equal(
      probe.status,
      2,
      probe.stderr || probe.stdout || "network preload did not block fetch"
    );
  });

  it("does not log source code", async () => {
    const sourceMarker = "LOG_SENTINEL_should_not_print";
    const calls = [];
    const methods = ["log", "info", "warn", "error", "debug"];
    const originals = new Map(
      methods.map((method) => [method, console[method]])
    );

    for (const method of methods) {
      console[method] = (...args) => {
        calls.push(args.map(String).join(" "));
      };
    }

    try {
      await generateCodeReview({
        sourceCode: `// ${sourceMarker}\nprint(1)\n`,
        programmingLanguage: "python",
        reviewType: "explain",
      });
    } finally {
      for (const [method, original] of originals) {
        console[method] = original;
      }
    }

    assert.equal(
      calls.some((line) => line.includes(sourceMarker)),
      false
    );
  });
});
