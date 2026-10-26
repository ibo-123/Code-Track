import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { MAX_SOURCE_BYTES } from "../src/analysis/version.js";
import {
  AI_ERROR,
  REVIEW_LIMITS,
  REVIEW_RESULT_FIELDS,
  assertReviewResult,
  validateReviewRequest,
} from "../src/ai/provider.js";
import { generateCodeReview } from "../src/ai/mockProvider.js";

const SOURCE = "int main(){return 0;}\n";

const input = (overrides = {}) => ({
  sourceCode: SOURCE,
  reviewType: "explain",
  ...overrides,
});

const limitation = () =>
  "Fixed mock data for tests. The submitted code was not executed, tested, or verified.";

const result = (overrides = {}) => ({
  contractVersion: "1",
  providerId: "mock",
  mock: true,
  deterministic: true,
  generatedByModel: false,
  executed: false,
  verified: false,
  reviewType: "explain",
  programmingLanguage: null,
  problemTitle: null,
  summary: "Mock summary for contract tests.",
  comments: [{ topic: "explanation", body: "A fixed comment." }],
  limitations: [limitation()],
  sourceBytes: Buffer.byteLength(SOURCE),
  hasProblemStatement: false,
  hasAnalysisContext: false,
  ...overrides,
});

const secretFree = (error, secret) => {
  assert.equal(error.message.includes(secret), false);
  assert.equal(String(error.stack || "").includes(secret), false);
};

const assertError = (fn, { code, status, secret }) => {
  assert.throws(fn, (error) => {
    assert.equal(error.name, "AiProviderError");
    assert.equal(error.code, code);
    if (status != null) assert.equal(error.status, status);
    if (secret != null) secretFree(error, secret);
    return true;
  });
};

const bytes = (marker, total) => {
  const markerBytes = Buffer.byteLength(marker);
  assert.ok(markerBytes <= total);
  return marker + "a".repeat(total - markerBytes);
};

describe("Phase 4 — review contract validation", () => {
  it("accepts source exactly at the configured byte limit", async () => {
    const marker = "LIMIT_MARKER_";
    const sourceCode = bytes(marker, MAX_SOURCE_BYTES);
    assert.equal(Buffer.byteLength(sourceCode), MAX_SOURCE_BYTES);

    const review = await generateCodeReview({
      sourceCode,
      reviewType: "explain",
    });

    assert.equal(review.sourceBytes, MAX_SOURCE_BYTES);
    assert.equal(JSON.stringify(review).includes(marker), false);
  });

  it("rejects source one byte over the limit", () => {
    const marker = "LIMIT_MARKER_";
    const sourceCode = `${bytes(marker, MAX_SOURCE_BYTES)}b`;
    assert.equal(Buffer.byteLength(sourceCode), MAX_SOURCE_BYTES + 1);

    assertError(
      () => validateReviewRequest({ sourceCode, reviewType: "explain" }),
      { code: AI_ERROR.SOURCE_TOO_LARGE, status: 413, secret: marker }
    );
  });

  it("counts unicode source in UTF-8 bytes", async () => {
    const emoji = "😀";
    const emojiBytes = Buffer.byteLength(emoji);
    assert.equal(emoji.length, 2);
    assert.equal(emojiBytes, 4);

    const one = await generateCodeReview({
      sourceCode: emoji,
      reviewType: "explain",
    });
    assert.equal(one.sourceBytes, 4);

    const count = Math.floor(MAX_SOURCE_BYTES / emojiBytes);
    const exact =
      emoji.repeat(count) + "a".repeat(MAX_SOURCE_BYTES - count * emojiBytes);
    assert.ok(exact.length < MAX_SOURCE_BYTES);
    assert.equal(Buffer.byteLength(exact), MAX_SOURCE_BYTES);
    const exactReview = await generateCodeReview({
      sourceCode: exact,
      reviewType: "complexity",
    });
    assert.equal(exactReview.sourceBytes, MAX_SOURCE_BYTES);

    const over = `${exact}${emoji}`;
    assert.ok(over.length < MAX_SOURCE_BYTES);
    assert.ok(Buffer.byteLength(over) > MAX_SOURCE_BYTES);
    assertError(
      () => validateReviewRequest({ sourceCode: over, reviewType: "explain" }),
      { code: AI_ERROR.SOURCE_TOO_LARGE, status: 413 }
    );
  });

  it("preserves source whitespace and trims only metadata", () => {
    const sourceCode = "\n  int main(){return 0;}\n";
    const request = validateReviewRequest({
      sourceCode,
      reviewType: "explain",
      programmingLanguage: "  GNU C++17  ",
      problemTitle: "  A. Watermelon  ",
      problemStatement: "   ",
    });

    assert.equal(request.sourceCode, sourceCode);
    assert.equal(request.sourceBytes, Buffer.byteLength(sourceCode));
    assert.equal(request.programmingLanguage, "GNU C++17");
    assert.equal(request.problemTitle, "A. Watermelon");
    assert.equal(request.problemStatement, null);
  });

  it("rejects wrong input types and malformed objects", () => {
    const cases = [null, undefined, [], "int main", 1, new Date()];
    for (const value of cases) {
      assertError(() => validateReviewRequest(value), {
        code: AI_ERROR.INVALID_INPUT,
        status: 400,
      });
    }

    assertError(
      () => validateReviewRequest(input({ programmingLanguage: 17 })),
      { code: AI_ERROR.INVALID_INPUT, status: 400 }
    );
    assertError(
      () => validateReviewRequest(input({ problemTitle: { name: "A" } })),
      { code: AI_ERROR.INVALID_INPUT, status: 400 }
    );
    assertError(
      () => validateReviewRequest(input({ analysisContext: ["partial"] })),
      { code: AI_ERROR.INVALID_INPUT, status: 400 }
    );
    assertError(() => validateReviewRequest(input(), []), {
      code: AI_ERROR.INVALID_INPUT,
      status: 400,
    });
    assertError(() => validateReviewRequest(input(), "fast"), {
      code: AI_ERROR.INVALID_INPUT,
      status: 400,
    });

    const nullProto = Object.create(null);
    nullProto.sourceCode = SOURCE;
    nullProto.reviewType = "explain";
    const accepted = validateReviewRequest(nullProto);
    assert.equal(accepted.sourceCode, SOURCE);
    assert.equal(accepted.reviewType, "explain");
  });

  it("rejects unknown input properties and unsupported option names", () => {
    const secret = "507f1f77bcf86cd799439011";
    assertError(
      () => validateReviewRequest(input({ submissionId: secret })),
      { code: AI_ERROR.INVALID_INPUT, status: 400, secret }
    );

    assertError(
      () => validateReviewRequest(input(), { temperature: 0.2 }),
      { code: AI_ERROR.INVALID_INPUT, status: 400, secret: "0.2" }
    );

    const request = validateReviewRequest(input(), { timeoutMs: 1000 });
    assert.deepEqual(request.options, { timeoutMs: 1000 });

    for (const timeoutMs of [0, -1, 1.5, 120_001, Number.POSITIVE_INFINITY]) {
      assertError(() => validateReviewRequest(input(), { timeoutMs }), {
        code: AI_ERROR.INVALID_INPUT,
        status: 400,
      });
    }
  });

  it("rejects oversized problem metadata and analysis context", () => {
    const title = "é".repeat(Math.floor(REVIEW_LIMITS.TITLE_BYTES / 2) + 1);
    assert.ok(title.length <= REVIEW_LIMITS.TITLE_BYTES);
    assert.ok(Buffer.byteLength(title) > REVIEW_LIMITS.TITLE_BYTES);
    assertError(() => validateReviewRequest(input({ problemTitle: title })), {
      code: AI_ERROR.INVALID_INPUT,
      status: 400,
      secret: title.slice(0, 8),
    });

    const statement = "a".repeat(REVIEW_LIMITS.STATEMENT_BYTES + 1);
    assertError(
      () => validateReviewRequest(input({ problemStatement: statement })),
      { code: AI_ERROR.INVALID_INPUT, status: 400, secret: "aaaaa" }
    );

    const longString = "b".repeat(REVIEW_LIMITS.ANALYSIS_MAX_STRING_BYTES + 1);
    assertError(
      () =>
        validateReviewRequest(
          input({ analysisContext: { note: longString } })
        ),
      { code: AI_ERROR.INVALID_INPUT, status: 400, secret: "bbbbb" }
    );

    const chunk = "c".repeat(REVIEW_LIMITS.ANALYSIS_MAX_STRING_BYTES);
    const analysisContext = {
      a: chunk,
      b: chunk,
      c: chunk,
      d: chunk,
      e: chunk,
      f: chunk,
    };
    assertError(() => validateReviewRequest(input({ analysisContext })), {
      code: AI_ERROR.INVALID_INPUT,
      status: 400,
      secret: "ccccc",
    });

    const original = {
      analyzerVersion: "3.0.0",
      status: "partial",
      timeComplexity: { worstCase: "O(n)", confidence: 0.5 },
    };
    const fitting = validateReviewRequest(
      input({ analysisContext: original })
    );
    assert.deepEqual(fitting.analysisContext, original);
    assert.notEqual(fitting.analysisContext, original);
    original.status = "changed";
    assert.equal(fitting.analysisContext.status, "partial");
  });

  it("rejects circular context and stores a clone of a shared graph", () => {
    const loop = { status: "partial" };
    loop.self = loop;
    assertError(
      () => validateReviewRequest(input({ analysisContext: loop })),
      { code: AI_ERROR.INVALID_INPUT, status: 400 }
    );

    let deep = { leaf: true };
    for (let level = 1; level < REVIEW_LIMITS.ANALYSIS_MAX_DEPTH + 1; level += 1) {
      deep = { child: deep };
    }
    assertError(
      () => validateReviewRequest(input({ analysisContext: deep })),
      { code: AI_ERROR.INVALID_INPUT, status: 400 }
    );

    const shared = { name: "map" };
    const analysisContext = { left: shared, right: shared };
    const request = validateReviewRequest(input({ analysisContext }));
    assert.equal(analysisContext.left, analysisContext.right);
    assert.deepEqual(request.analysisContext, analysisContext);
    assert.notEqual(request.analysisContext.left, request.analysisContext.right);
    assert.equal(analysisContext.left.name, "map");
  });

  it("rejects values that cannot be stored without calling toJSON", () => {
    const secret = "TOJSON_SECRET_VALUE";
    const analysisContext = {
      status: "partial",
      toJSON() {
        throw new Error(secret);
      },
    };

    assertError(
      () => validateReviewRequest(input({ analysisContext })),
      { code: AI_ERROR.INVALID_INPUT, status: 400, secret }
    );

    assertError(
      () =>
        validateReviewRequest(
          input({ analysisContext: { when: new Date() } })
        ),
      { code: AI_ERROR.INVALID_INPUT, status: 400 }
    );
  });

  it("rejects credential-like options and context keys without echoing values", () => {
    const secret = "sk-live-do-not-echo";
    const names = [
      "apiKey",
      "api_key",
      "api-key",
      "token",
      "password",
      "secret",
      "authorization",
      "credentials",
      "accessToken",
    ];

    for (const name of names) {
      assertError(() => validateReviewRequest(input(), { [name]: secret }), {
        code: AI_ERROR.CREDENTIALS_NOT_ACCEPTED,
        status: 400,
        secret,
      });
    }

    assertError(
      () => validateReviewRequest(input({ apiKey: secret })),
      { code: AI_ERROR.CREDENTIALS_NOT_ACCEPTED, status: 400, secret }
    );

    let read = false;
    const options = {};
    Object.defineProperty(options, "apiKey", {
      enumerable: true,
      get() {
        read = true;
        throw new Error(secret);
      },
    });
    assertError(() => validateReviewRequest(input(), options), {
      code: AI_ERROR.CREDENTIALS_NOT_ACCEPTED,
      status: 400,
      secret,
    });
    assert.equal(read, false);

    const analysisContext = {};
    Object.defineProperty(analysisContext, "token", {
      enumerable: true,
      get() {
        read = true;
        return secret;
      },
    });
    assertError(
      () => validateReviewRequest(input({ analysisContext })),
      { code: AI_ERROR.CREDENTIALS_NOT_ACCEPTED, status: 400, secret }
    );
    assert.equal(read, false);
  });

  it("rejects missing required output fields", () => {
    for (const field of REVIEW_RESULT_FIELDS) {
      const payload = result();
      delete payload[field];
      assertError(() => assertReviewResult(payload), {
        code: AI_ERROR.INVALID_RESULT,
        status: 500,
      });
    }
  });

  it("rejects invalid review types and provider identifiers", () => {
    const secret = "sk-provider-secret";
    for (const providerId of ["", "Mock", "not a provider", "x".repeat(40), secret]) {
      assertError(() => assertReviewResult(result({ providerId })), {
        code: AI_ERROR.INVALID_RESULT,
        status: 500,
        secret,
      });
    }

    assertError(() => assertReviewResult(result({ reviewType: "hint" })), {
      code: AI_ERROR.INVALID_RESULT,
      status: 500,
    });

    const request = validateReviewRequest(input());
    assertError(
      () => assertReviewResult(result({ reviewType: "complexity" }), request),
      { code: AI_ERROR.INVALID_RESULT, status: 500 }
    );
    assertError(
      () => assertReviewResult(result({ sourceBytes: request.sourceBytes - 1 }), request),
      { code: AI_ERROR.INVALID_RESULT, status: 500 }
    );
  });

  it("rejects invalid execution or verification flags", () => {
    for (const executed of [true, "false", 0, null]) {
      assertError(() => assertReviewResult(result({ executed })), {
        code: AI_ERROR.INVALID_RESULT,
        status: 500,
      });
    }
    for (const verified of [true, "false", 1]) {
      assertError(() => assertReviewResult(result({ verified })), {
        code: AI_ERROR.INVALID_RESULT,
        status: 500,
      });
    }
  });

  it("rejects results that contain source code", () => {
    const secret = "SOURCE_ECHO_SECRET_int_main";
    const sourceCode = `${secret}\nint main(){return 0;}\n`;
    const request = validateReviewRequest({
      sourceCode,
      reviewType: "explain",
    });
    const aligned = result({
      sourceBytes: request.sourceBytes,
      summary: "Mock summary for contract tests.",
    });

    for (const key of ["sourceCode", "source", "code", "submissionSource"]) {
      assertError(
        () => assertReviewResult({ ...aligned, [key]: sourceCode }, request),
        { code: AI_ERROR.INVALID_RESULT, status: 500, secret }
      );
    }

    assertError(
      () =>
        assertReviewResult(
          {
            ...aligned,
            comments: [{ topic: "explanation", body: sourceCode }],
          },
          request
        ),
      { code: AI_ERROR.INVALID_RESULT, status: 500, secret }
    );

    assertError(
      () =>
        assertReviewResult(
          {
            ...aligned,
            comments: [{ topic: "explanation", body: "ok", sourceCode }],
          },
          request
        ),
      { code: AI_ERROR.INVALID_RESULT, status: 500, secret }
    );

    const shortRequest = validateReviewRequest({
      sourceCode: "ab",
      reviewType: "explain",
    });
    assertError(
      () =>
        assertReviewResult(
          result({
            sourceBytes: shortRequest.sourceBytes,
            summary: "ab",
          }),
          shortRequest
        ),
      { code: AI_ERROR.INVALID_RESULT, status: 500 }
    );

    const nested = assertReviewResult(
      result({
        sourceBytes: shortRequest.sourceBytes,
        summary: "A label about abstractions.",
      }),
      shortRequest
    );
    assert.equal(nested.summary.includes("ab"), true);
  });

  it("rejects oversized output fields and arrays", () => {
    assertError(
      () =>
        assertReviewResult(
          result({
            summary: "s".repeat(REVIEW_LIMITS.SUMMARY_BYTES + 1),
          })
        ),
      { code: AI_ERROR.INVALID_RESULT, status: 500, secret: "sssss" }
    );

    const comments = Array.from(
      { length: REVIEW_LIMITS.MAX_COMMENTS + 1 },
      () => ({ topic: "explanation", body: "A fixed comment." })
    );
    assertError(() => assertReviewResult(result({ comments })), {
      code: AI_ERROR.INVALID_RESULT,
      status: 500,
    });

    assertError(
      () =>
        assertReviewResult(
          result({
            comments: [
              {
                topic: "explanation",
                body: "b".repeat(REVIEW_LIMITS.COMMENT_BODY_BYTES + 1),
              },
            ],
          })
        ),
      { code: AI_ERROR.INVALID_RESULT, status: 500, secret: "bbbbb" }
    );

    assertError(
      () =>
        assertReviewResult(
          result({
            limitations: [
              `${limitation()} ${"L".repeat(REVIEW_LIMITS.LIMITATION_BYTES)}`,
            ],
          })
        ),
      { code: AI_ERROR.INVALID_RESULT, status: 500, secret: "LLLLL" }
    );

    assertError(
      () =>
        assertReviewResult(
          result({
            limitations: Array.from(
              { length: REVIEW_LIMITS.MAX_LIMITATIONS + 1 },
              () => limitation()
            ),
          })
        ),
      { code: AI_ERROR.INVALID_RESULT, status: 500 }
    );
  });

  it("checks optional comment severity and confidence when present", () => {
    const accepted = assertReviewResult(
      result({
        comments: [
          {
            topic: "explanation",
            body: "A fixed comment.",
            severity: "warning",
            confidence: 0.5,
          },
        ],
      })
    );
    assert.equal(accepted.comments[0].severity, "warning");
    assert.equal(accepted.comments[0].confidence, 0.5);

    assertError(
      () =>
        assertReviewResult(
          result({
            comments: [
              { topic: "explanation", body: "A fixed comment.", severity: "critical" },
            ],
          })
        ),
      { code: AI_ERROR.INVALID_RESULT, status: 500 }
    );
    assertError(
      () =>
        assertReviewResult(
          result({
            comments: [
              { topic: "explanation", body: "A fixed comment.", confidence: 1.2 },
            ],
          })
        ),
      { code: AI_ERROR.INVALID_RESULT, status: 500 }
    );
  });

  it("accepts a well-formed result that is still not proof of correctness", () => {
    const accepted = assertReviewResult(
      result({
        mock: false,
        deterministic: false,
        generatedByModel: true,
        summary: "This program is definitely correct.",
      })
    );

    assert.equal(accepted.executed, false);
    assert.equal(accepted.verified, false);
    assert.equal(accepted.generatedByModel, true);
    assert.match(
      accepted.limitations.join("\n"),
      /not executed, tested, or verified/
    );
  });

  it("handles unexpected exceptions without leaking secrets", async () => {
    const secret = "GETTER_SECRET_VALUE";
    const hostileInput = {
      sourceCode: SOURCE,
      reviewType: "explain",
      get analysisContext() {
        throw new Error(secret);
      },
    };

    await assert.rejects(
      () => generateCodeReview(hostileInput),
      (error) => {
        assert.equal(error.name, "AiProviderError");
        assert.equal(error.code, AI_ERROR.INVALID_INPUT);
        assert.equal(error.status, 400);
        secretFree(error, secret);
        return true;
      }
    );

    const hostileResult = result();
    Object.defineProperty(hostileResult, "summary", {
      enumerable: true,
      get() {
        throw new Error(secret);
      },
    });
    assertError(() => assertReviewResult(hostileResult), {
      code: AI_ERROR.INVALID_RESULT,
      status: 500,
      secret,
    });
  });
});
