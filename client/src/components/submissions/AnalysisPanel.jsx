import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  analyzeSubmission,
  getSubmissionAnalysis,
  retryAnalysis,
} from "../../services/analysisService";
import {
  fetchSubmissionSourceFromPlatform,
  getSubmissionSource,
  saveSubmissionSource,
} from "../../services/submissionService";
import {
  REVIEW_TYPES,
  getAiStatus,
  getSubmissionReview,
  requestAiReview,
} from "../../services/reviewService";

const severityClass = {
  error:
    "border-red-300 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100",
  warning:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100",
  info: "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200",
};

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-200">
      {children}
    </span>
  );
}

function ComplexityBlock({ title, data }) {
  if (!data) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-500">
        {title}: unknown
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-1.5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="text-lg font-semibold text-slate-900 dark:text-white">
        {data.worstCase || data.auxiliary || "unknown"}
      </p>
      <p className="text-xs text-slate-500">
        Confidence:{" "}
        {typeof data.confidence === "number"
          ? `${Math.round(data.confidence * 100)}%`
          : "—"}
        {data.includesInputStorage === false
          ? " · auxiliary (excludes input)"
          : ""}
      </p>
      {data.assumptions?.length > 0 && (
        <ul className="text-xs text-slate-500 list-disc pl-4 space-y-0.5">
          {data.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Analysis detail + source load/paste + run/retry for one submission.
 */
export default function AnalysisPanel({ submission, onClose, onSourceSaved }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sourceLoading, setSourceLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [storedSource, setStoredSource] = useState(null);
  const [sourceDraft, setSourceDraft] = useState("");
  const [langDraft, setLangDraft] = useState(
    submission?.language ||
      submission?.programmingLanguage ||
      "GNU C++17"
  );
  const [submissionUrl, setSubmissionUrl] = useState(null);
  const [showPaste, setShowPaste] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [reviewType, setReviewType] = useState("explain");
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRunning, setAiRunning] = useState(false);

  const hasUsableSource =
    Boolean(storedSource?.sourceCode) || Boolean(sourceDraft.trim());

  const loadSource = useCallback(async () => {
    if (!submission?._id) return;
    setSourceLoading(true);
    try {
      const src = await getSubmissionSource(submission._id);
      if (src.ok && src.sourceCode) {
        setStoredSource(src);
        setLangDraft(
          src.programmingLanguage ||
            submission.language ||
            submission.programmingLanguage ||
            "GNU C++17"
        );
        setShowPaste(false);
        setSubmissionUrl(null);
      } else {
        setStoredSource(null);
        setSubmissionUrl(src.submissionUrl || null);
        if (src.programmingLanguage) setLangDraft(src.programmingLanguage);
        setShowPaste(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load source");
      setShowPaste(true);
    } finally {
      setSourceLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission?._id]);

  const loadAnalysis = useCallback(async () => {
    if (!submission?._id) return;
    setLoading(true);
    try {
      const a = await getSubmissionAnalysis(submission._id);
      setAnalysis(a || null);
    } catch {
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [submission?._id]);

  const loadAiReview = useCallback(async () => {
    if (!submission?._id) return;
    setAiLoading(true);
    try {
      const [status, review] = await Promise.all([
        getAiStatus().catch(() => null),
        getSubmissionReview(submission._id, reviewType),
      ]);
      setAiStatus(status);
      setAiReview(review);
    } catch {
      setAiReview(null);
    } finally {
      setAiLoading(false);
    }
  }, [submission?._id, reviewType]);

  useEffect(() => {
    loadSource();
    loadAnalysis();
  }, [loadSource, loadAnalysis]);

  useEffect(() => {
    loadAiReview();
  }, [loadAiReview]);

  const runAiReview = async () => {
    if (!hasUsableSource && !storedSource?.sourceCode) {
      toast.error("Save source code before requesting an AI review");
      setShowPaste(true);
      return;
    }
    // Ensure pasted source is saved first
    if (!storedSource?.sourceCode && sourceDraft.trim()) {
      try {
        await saveSubmissionSource(submission._id, {
          sourceCode: sourceDraft,
          programmingLanguage: langDraft,
        });
        const refreshed = await getSubmissionSource(submission._id);
        if (refreshed.ok) {
          setStoredSource(refreshed);
          setShowPaste(false);
          onSourceSaved?.();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to save source");
        return;
      }
    }

    setAiRunning(true);
    try {
      const data = await requestAiReview(submission._id, reviewType);
      setAiReview(data.review);
      toast.success(
        data.providerId === "mock"
          ? "Mock review ready (configure GEMINI_API_KEY for live AI)"
          : "AI review complete"
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "AI review failed");
    } finally {
      setAiRunning(false);
    }
  };

  const importFromPlatform = async () => {
    setImporting(true);
    try {
      const result = await fetchSubmissionSourceFromPlatform(submission._id);
      if (result.ok && result.sourceCode) {
        setStoredSource(result);
        setShowPaste(false);
        setSourceDraft("");
        onSourceSaved?.();
        toast.success(
          result.fetched ? "Source imported from Codeforces" : "Source ready"
        );
      } else {
        if (result.submissionUrl) setSubmissionUrl(result.submissionUrl);
        setShowPaste(true);
        toast.message(
          result.message ||
            "Could not import source — paste it from the platform page"
        );
      }
    } finally {
      setImporting(false);
    }
  };

  const runAnalyze = async () => {
    setRunning(true);
    try {
      let ready = Boolean(storedSource?.sourceCode);

      // Persist pasted source before analyzing
      if (!ready && sourceDraft.trim()) {
        await saveSubmissionSource(submission._id, {
          sourceCode: sourceDraft,
          programmingLanguage: langDraft,
        });
        const refreshed = await getSubmissionSource(submission._id);
        if (refreshed.ok && refreshed.sourceCode) {
          setStoredSource(refreshed);
          setShowPaste(false);
          setSourceDraft("");
          onSourceSaved?.();
          ready = true;
        }
      }

      if (!ready) {
        toast.error("Add source code before running analysis");
        setShowPaste(true);
        return;
      }

      const data = await analyzeSubmission(submission._id);
      setAnalysis(data.analysis);
      toast.success(
        data.cached ? "Reused cached analysis" : "Analysis complete"
      );
    } catch (err) {
      const msg = err.response?.data?.message || "Analysis failed";
      toast.error(msg);
      if (
        err.response?.data?.code === "SOURCE_UNAVAILABLE" ||
        err.response?.status === 404
      ) {
        setShowPaste(true);
      }
    } finally {
      setRunning(false);
    }
  };

  const onRetry = async () => {
    if (!analysis?._id) return;
    setRunning(true);
    try {
      const data = await retryAnalysis(analysis._id);
      setAnalysis(data.analysis);
      toast.success("Retry complete");
    } catch (err) {
      toast.error(err.response?.data?.message || "Retry failed");
    } finally {
      setRunning(false);
    }
  };

  const status = analysis?.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <BrainCircuit className="w-5 h-5 text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                Code analysis ·{" "}
                {submission?.problemTitle ||
                  submission?.problemName ||
                  "Submission"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                Static heuristics — does not execute your code
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-8" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Source section */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Submitted source
              </p>
              <div className="flex flex-wrap gap-2">
                {submission?.platform === "codeforces" && !storedSource?.sourceCode && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8"
                    disabled={importing || sourceLoading}
                    onClick={importFromPlatform}
                  >
                    {importing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Import from CF
                  </Button>
                )}
                {submissionUrl && (
                  <a
                    href={submissionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Open on CF <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {storedSource?.sourceCode && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8"
                    onClick={() => setShowPaste((v) => !v)}
                  >
                    {showPaste ? "Hide editor" : "Replace source"}
                  </Button>
                )}
              </div>
            </div>

            {sourceLoading ? (
              <div className="flex items-center text-sm text-slate-400 py-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading source…
              </div>
            ) : storedSource?.sourceCode && !showPaste ? (
              <pre className="max-h-48 overflow-auto rounded-md bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {storedSource.sourceCode}
              </pre>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-amber-800 dark:text-amber-100/90">
                  Source is not stored yet. Paste your submitted code (copy from
                  the platform submission page), then run analysis.
                </p>
                <input
                  className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                  value={langDraft}
                  onChange={(e) => setLangDraft(e.target.value)}
                  placeholder="Language (e.g. GNU C++17, Python 3, JavaScript)"
                />
                <textarea
                  className="w-full min-h-[160px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs font-mono"
                  value={sourceDraft}
                  onChange={(e) => setSourceDraft(e.target.value)}
                  placeholder="Paste source code here…"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="h-9"
              disabled={running || sourceLoading || !hasUsableSource}
              onClick={runAnalyze}
            >
              {running ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {analysis ? "Re-analyze" : "Run analysis"}
            </Button>
            {(status === "failed" || status === "partial") && analysis?._id && (
              <Button
                type="button"
                variant="outline"
                className="h-9"
                disabled={running}
                onClick={onRetry}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading analysis…
            </div>
          ) : !analysis ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-2">
              <AlertCircle className="w-8 h-8 opacity-50" />
              <p className="text-sm">No analysis yet for this submission</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 items-center">
                <Chip>Status: {analysis.status}</Chip>
                <Chip>Lang: {analysis.language || "—"}</Chip>
                <Chip>Support: {analysis.languageSupport}</Chip>
                <Chip>Syntax: {analysis.syntaxStatus || "—"}</Chip>
                <Chip>v{analysis.analyzerVersion}</Chip>
              </div>

              {analysis.errorCode && (
                <div className="rounded-lg border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-100">
                  {analysis.errorCode}
                  {analysis.errorMessage ? `: ${analysis.errorMessage}` : ""}
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                  Detected algorithms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(analysis.detectedAlgorithms || []).map((d) => (
                    <Chip key={`${d.name}-${d.confidence}`}>
                      {d.name}
                      {d.confidence > 0
                        ? ` (${Math.round(d.confidence * 100)}%)`
                        : ""}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                  Detected data structures
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(analysis.detectedDataStructures || []).length === 0 ? (
                    <span className="text-sm text-slate-500">None detected</span>
                  ) : (
                    analysis.detectedDataStructures.map((d) => (
                      <Chip key={`${d.name}-${d.confidence}`}>
                        {d.name} ({Math.round(d.confidence * 100)}%)
                      </Chip>
                    ))
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <ComplexityBlock
                  title="Time complexity"
                  data={analysis.timeComplexity}
                />
                <ComplexityBlock
                  title="Auxiliary space"
                  data={
                    analysis.spaceComplexity
                      ? {
                          ...analysis.spaceComplexity,
                          worstCase:
                            analysis.spaceComplexity.auxiliary ||
                            analysis.spaceComplexity.worstCase,
                        }
                      : null
                  }
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                  Findings
                </h3>
                {(analysis.findings || []).length === 0 ? (
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    No rule-based issues reported
                  </p>
                ) : (
                  <div className="space-y-2">
                    {analysis.findings.map((f) => (
                      <div
                        key={f.ruleId + (f.evidence || "")}
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          severityClass[f.severity] || severityClass.info
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">
                              [{f.severity}] {f.title}
                            </p>
                            <p className="text-xs opacity-90 mt-0.5">
                              {f.explanation}
                            </p>
                            {f.suggestedFix && (
                              <p className="text-xs mt-1 opacity-80">
                                Fix: {f.suggestedFix}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                  Optimization suggestions
                </h3>
                {(analysis.suggestions || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No suggestions</p>
                ) : (
                  <div className="space-y-2">
                    {analysis.suggestions.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm"
                      >
                        <p className="font-medium text-slate-900 dark:text-white">
                          {s.proposedImprovement}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Current: {s.currentPattern}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {s.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(analysis.limitations || []).length > 0 && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 px-3 py-2">
                  <h3 className="text-sm font-semibold mb-1 text-slate-900 dark:text-white">
                    Limitations
                  </h3>
                  <ul className="text-xs text-slate-500 list-disc pl-4 space-y-0.5">
                    {analysis.limitations.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Phase 4 — AI review (Gemini) */}
          <div className="rounded-lg border border-violet-200 dark:border-violet-500/30 bg-violet-50/40 dark:bg-violet-500/5 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-600 dark:text-violet-300" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  AI code review
                </p>
                {aiStatus?.providerId && (
                  <span className="text-[10px] uppercase tracking-wide text-violet-600 dark:text-violet-300">
                    {aiStatus.providerId}
                    {aiStatus.model ? ` · ${aiStatus.model}` : ""}
                  </span>
                )}
              </div>
              <select
                value={reviewType}
                onChange={(e) => setReviewType(e.target.value)}
                className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 text-xs"
              >
                {REVIEW_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500">
              Uses Gemini to discuss your code. Static only — never executes
              submissions.
            </p>
            <Button
              type="button"
              className="h-9"
              disabled={aiRunning || sourceLoading || !hasUsableSource}
              onClick={runAiReview}
            >
              {aiRunning ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Bot className="w-4 h-4 mr-2" />
              )}
              {aiReview ? "Re-run AI review" : "Run AI review"}
            </Button>

            {aiLoading ? (
              <div className="flex items-center text-sm text-slate-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading AI
                review…
              </div>
            ) : aiReview ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-800 dark:text-slate-100">
                  {aiReview.summary}
                </p>
                <div className="space-y-2">
                  {(aiReview.comments || []).map((c, idx) => (
                    <div
                      key={`${c.topic}-${idx}`}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        severityClass[c.severity] || severityClass.info
                      }`}
                    >
                      <p className="font-medium">
                        {c.severity ? `[${c.severity}] ` : ""}
                        {c.topic}
                      </p>
                      <p className="text-xs mt-0.5 opacity-90">{c.body}</p>
                    </div>
                  ))}
                </div>
                {(aiReview.limitations || []).length > 0 && (
                  <ul className="text-xs text-slate-500 list-disc pl-4 space-y-0.5">
                    {aiReview.limitations.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No AI review yet for this type
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
