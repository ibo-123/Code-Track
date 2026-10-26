import {
  AI_ERROR,
  CONTRACT_VERSION,
  assertReviewResult,
  guardProviderCall,
  validateReviewRequest,
} from "./provider.js";

/**
 * In-process mock provider.
 *
 * Returns a fixed review for tests and local learning. It does not call an
 * LLM, read credentials, or open a socket. The wording is intentionally
 * generic: the same summary is reused for every submission of a given
 * review type, so it must not be read as a judgment of the user's code.
 */

export const MOCK_PROVIDER_ID = "mock";

const MOCK_LIMITATIONS = Object.freeze([
  "Fixed mock data for tests. The submitted code was not executed, tested, or verified.",
  "This response was not produced by a language model.",
]);

const MOCK_COPY = Object.freeze({
  explain: Object.freeze({
    summary:
      "Mock explain review. This fixed text is the same for every submission and does not describe the submitted code.",
    comments: Object.freeze([
      Object.freeze({
        topic: "explanation",
        body: "A future provider would explain the program in plain language. This mock does not read the source to produce that explanation.",
      }),
    ]),
  }),
  line_by_line: Object.freeze({
    summary:
      "Mock line-by-line review. No line of the submission was inspected or annotated.",
    comments: Object.freeze([
      Object.freeze({
        topic: "lines",
        body: "A future provider would walk through the program line by line. This mock does not attach comments to source lines.",
      }),
    ]),
  }),
  correctness: Object.freeze({
    summary:
      "Mock correctness review. Nothing here proves the program is correct or incorrect.",
    comments: Object.freeze([
      Object.freeze({
        topic: "correctness",
        body: "A future provider would discuss whether the program matches the problem. This mock did not test the program.",
      }),
    ]),
  }),
  complexity: Object.freeze({
    summary:
      "Mock complexity review. No complexity was measured or derived from the submission.",
    comments: Object.freeze([
      Object.freeze({
        topic: "complexity",
        body: "A future provider would discuss time and space. This mock does not estimate either one.",
      }),
    ]),
  }),
  optimization: Object.freeze({
    summary:
      "Mock optimization review. No faster approach was derived from the submission.",
    comments: Object.freeze([
      Object.freeze({
        topic: "optimization",
        body: "A future provider would suggest a concrete improvement. This mock does not propose one.",
      }),
    ]),
  }),
  edge_cases: Object.freeze({
    summary:
      "Mock edge-case review. No input was tried against the submission.",
    comments: Object.freeze([
      Object.freeze({
        topic: "edge-cases",
        body: "A future provider would list inputs worth trying. This mock did not invent or run those inputs.",
      }),
    ]),
  }),
});

const createMockReview = (request) => {
  const copy = MOCK_COPY[request.reviewType];
  return {
    contractVersion: CONTRACT_VERSION,
    providerId: MOCK_PROVIDER_ID,
    mock: true,
    deterministic: true,
    generatedByModel: false,
    executed: false,
    verified: false,
    reviewType: request.reviewType,
    programmingLanguage: request.programmingLanguage,
    problemTitle: request.problemTitle,
    summary: copy.summary,
    comments: copy.comments.map((comment) => ({ ...comment })),
    limitations: [...MOCK_LIMITATIONS],
    sourceBytes: request.sourceBytes,
    hasProblemStatement: request.problemStatement != null,
    hasAnalysisContext: request.analysisContext != null,
  };
};

/**
 * @param {object} input
 * @param {object} [options]
 * @returns {Promise<object>}
 */
export const generateCodeReview = async (input, options) =>
  guardProviderCall(
    () => {
      const request = validateReviewRequest(input, options);
      return assertReviewResult(createMockReview(request), request);
    },
    "Code review could not be completed",
    AI_ERROR.INVALID_RESULT,
    500
  );

export const mockProvider = Object.freeze({
  id: MOCK_PROVIDER_ID,
  generateCodeReview,
});
