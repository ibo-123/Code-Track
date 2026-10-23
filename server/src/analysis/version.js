/** Bump when detection rules or estimator semantics change. */
export const ANALYZER_VERSION = "3.0.0";

/** Max source size accepted for analysis (bytes). */
export const MAX_SOURCE_BYTES = Number(process.env.ANALYSIS_MAX_SOURCE_BYTES) || 200_000;
