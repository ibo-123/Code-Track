import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  analyzeSubmission,
  getSubmissionAnalysis,
  retryAnalysis,
  saveSubmissionSource,
} from "../../services/analysisService";

const severityClass = {
  error: "border-red-300 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100",
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
 * Analysis detail + run/retry controls for one submission.
 */
export default function AnalysisPanel({ submission, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [sourceDraft, setSourceDraft] = useState("");
  const [langDraft, setLangDraft] = useState(
    submission?.programmingLanguage || submission?.language || "GNU C++17"
  );
  const needsSource = !submission?.sourceAvailable;

  const load = useCallback(async () => {
    if (!submission?._id) return;
    setLoading(true);
    try {
      const a = await getSubmissionAnalysis(submission._id);
      setAnalysis(a);
    } catch {
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [submission?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAnalyze = async () => {
    setRunning(true);
    try {
      if (needsSource && sourceDraft.trim()) {
        await saveSubmissionSource(submission._id, {
          sourceCode: sourceDraft,
          programmingLanguage: langDraft,
        });
        submission.sourceAvailable = true;
      }
      const data = await analyzeSubmission(submission._id);
      setAnalysis(data.analysis);
      toast.success(data.cached ? "Reused cached analysis" : "Analysis complete");
    } catch (err) {
      toast.error(err.response?.data?.message || "Analysis failed");
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
          {needsSource && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 p-3 space-y-2">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Source code is not stored for this submission. Paste it to
                analyze.
              </p>
              <input
                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                value={langDraft}
                onChange={(e) => setLangDraft(e.target.value)}
                placeholder="Language (e.g. GNU C++17, Python 3, JavaScript)"
              />
              <textarea
                className="w-full min-h-[140px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs font-mono"
                value={sourceDraft}
                onChange={(e) => setSourceDraft(e.target.value)}
                placeholder="Paste source code here…"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="h-9"
              disabled={running || (needsSource && !sourceDraft.trim())}
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
                {(analysis.detectedAlgorithms || []).some((d) => d.evidence?.length) && (
                  <ul className="mt-2 text-xs text-slate-500 list-disc pl-4 space-y-0.5">
                    {analysis.detectedAlgorithms.flatMap((d) =>
                      (d.evidence || []).map((e) => (
                        <li key={`${d.name}-${e}`}>
                          <span className="font-medium text-slate-600 dark:text-slate-300">
                            {d.name}:
                          </span>{" "}
                          {e}
                        </li>
                      ))
                    )}
                  </ul>
                )}
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
                <ComplexityBlock title="Time complexity" data={analysis.timeComplexity} />
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
                        {s.expectedComplexityImpact && (
                          <p className="text-xs text-slate-500 mt-1">
                            Impact: {s.expectedComplexityImpact}
                          </p>
                        )}
                        {s.tradeOffs?.length > 0 && (
                          <p className="text-xs text-slate-500 mt-1">
                            Trade-offs: {s.tradeOffs.join("; ")}
                          </p>
                        )}
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
        </div>
      </div>
    </div>
  );
}
