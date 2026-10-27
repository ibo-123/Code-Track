import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Code2,
  ExternalLink,
  Filter,
  Loader2,
  AlertCircle,
  FileCode2,
  BrainCircuit,
} from "lucide-react";
import {
  listSubmissions,
  getSubmissionSource,
  saveSubmissionSource,
  fetchSubmissionSource,
} from "../services/submissionService";
import { getLeetCodeStatus } from "../services/leetcodeService";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import AnalysisPanel from "../components/submissions/AnalysisPanel";

const PLATFORMS = [
  { value: "", label: "All platforms" },
  { value: "codeforces", label: "Codeforces" },
  { value: "leetcode", label: "LeetCode" },
];

function formatWhen(sub) {
  const ts = sub.submittedAt
    ? new Date(sub.submittedAt)
    : sub.creationTimeSeconds
      ? new Date(sub.creationTimeSeconds * 1000)
      : null;
  if (!ts || Number.isNaN(ts.getTime())) return "—";
  return ts.toLocaleString();
}

function verdictClass(verdict, normalized) {
  const v = (normalized || verdict || "").toUpperCase();
  if (v === "ACCEPTED" || v === "OK")
    return "text-emerald-600 dark:text-emerald-400";
  if (v.includes("WRONG") || v.includes("ERROR") || v.includes("LIMIT"))
    return "text-red-600 dark:text-red-400";
  return "text-slate-600 dark:text-slate-300";
}

function SourceModal({ submission, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [sourceCode, setSourceCode] = useState("");
  const [lang, setLang] = useState(
    submission?.language || submission?.programmingLanguage || ""
  );
  const [submissionUrl, setSubmissionUrl] = useState(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const src = await getSubmissionSource(submission._id);
        if (cancelled) return;
        if (src?.ok && src.sourceCode) {
          setSourceCode(src.sourceCode);
          setAvailable(true);
          if (src.programmingLanguage) setLang(src.programmingLanguage);
        } else {
          setAvailable(false);
          setSourceCode("");
          setSubmissionUrl(src?.submissionUrl || null);
          if (src?.programmingLanguage) setLang(src.programmingLanguage);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err.response?.data?.message || "Failed to load source");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [submission._id]);

  const handleSave = async () => {
    if (!sourceCode.trim()) {
      toast.error("Paste source code first");
      return;
    }
    setSaving(true);
    try {
      await saveSubmissionSource(submission._id, {
        sourceCode,
        programmingLanguage: lang,
      });
      setAvailable(true);
      onSaved?.();
      toast.success("Source saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save source");
    } finally {
      setSaving(false);
    }
  };

  const handleFetch = async () => {
    setFetching(true);
    try {
      const data = await fetchSubmissionSource(submission._id);
      if (data?.ok && data.sourceCode) {
        setSourceCode(data.sourceCode);
        setAvailable(true);
        if (data.programmingLanguage) setLang(data.programmingLanguage);
        onSaved?.();
        toast.success(
          data.fetched ? "Imported from Codeforces" : "Source already stored"
        );
      } else {
        if (data?.submissionUrl) setSubmissionUrl(data.submissionUrl);
        toast.message(
          data?.message ||
            "Could not import — paste from the submission page"
        );
      }
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              Source · {submission.problemTitle || submission.problemName || "Problem"}
            </p>
            <p className="text-xs text-slate-500">
              {available ? "Stored source" : "Not stored yet — paste or import"}
            </p>
          </div>
          <Button type="button" variant="outline" className="h-8 shrink-0" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading source…
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {submission.platform === "codeforces" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8"
                    disabled={fetching}
                    onClick={handleFetch}
                  >
                    {fetching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : null}
                    Import from CF
                  </Button>
                )}
                {submissionUrl && (
                  <a
                    href={submissionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700"
                  >
                    Open submission <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <Button
                  type="button"
                  className="h-8"
                  disabled={saving || !sourceCode.trim()}
                  onClick={handleSave}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Save source
                </Button>
              </div>
              <input
                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                placeholder="Language"
              />
              <textarea
                className="w-full min-h-[320px] rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono text-slate-800 dark:text-slate-200"
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                placeholder="Paste your submitted source code here…"
                spellCheck={false}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Submissions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const platformFromUrl = searchParams.get("platform") || "";
  const [platform, setPlatform] = useState(
    ["codeforces", "leetcode"].includes(platformFromUrl) ? platformFromUrl : ""
  );
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ submissions: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [lcStatus, setLcStatus] = useState(null);
  const [sourceTarget, setSourceTarget] = useState(null);
  const [analysisTarget, setAnalysisTarget] = useState(null);

  useEffect(() => {
    const p = searchParams.get("platform") || "";
    if (["codeforces", "leetcode", ""].includes(p) && p !== platform) {
      setPlatform(p);
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listSubmissions({
        platform: platform || undefined,
        page,
        limit: 25,
        sort: "desc",
      });
      setData(result);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load submissions");
      setData({ submissions: [], pagination: null });
    } finally {
      setLoading(false);
    }
  }, [platform, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getLeetCodeStatus()
      .then(setLcStatus)
      .catch(() => setLcStatus(null));
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Submissions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Unified Codeforces and LeetCode attempts — view source and run static
            analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={platform}
            onChange={(e) => {
              const next = e.target.value;
              setPage(1);
              setPlatform(next);
              if (next) setSearchParams({ platform: next });
              else setSearchParams({});
            }}
            className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
          >
            {PLATFORMS.map((p) => (
              <option key={p.value || "all"} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {platform === "leetcode" && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100/90">
          {!lcStatus?.connected ? (
            <>
              LeetCode is not connected. Connect a public username from Profile
              to import recent submissions.
            </>
          ) : (
            <>
              Showing imported LeetCode rows for{" "}
              <span className="font-semibold">{lcStatus.handle}</span>. Source
              code is not available from the public API — use{" "}
              <span className="font-semibold">View / Attach</span> to paste
              code before analyzing.
            </>
          )}
        </div>
      )}

      {platform === "codeforces" && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
          Codeforces sync stores submission metadata by default. Use{" "}
          <span className="font-semibold">View / Attach</span> to paste source,
          or <span className="font-semibold">Import from CF</span> when{" "}
          <code className="text-xs">CF_API_KEY</code> /{" "}
          <code className="text-xs">CF_API_SECRET</code> are configured for your
          handle. Then click <span className="font-semibold">Analyze</span>.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
          </div>
        ) : !data.submissions?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
            <AlertCircle className="w-8 h-8 opacity-50" />
            <p className="text-sm">No submissions for this filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Platform</th>
                  <th className="px-4 py-3 font-semibold">Problem</th>
                  <th className="px-4 py-3 font-semibold">Verdict</th>
                  <th className="px-4 py-3 font-semibold">Language</th>
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.submissions.map((sub) => (
                  <tr
                    key={sub._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 opacity-60" />
                        {sub.platform || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sub.problemUrl ? (
                        <a
                          href={sub.problemUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-slate-900 dark:text-white hover:underline inline-flex items-center gap-1"
                        >
                          {sub.problemTitle || sub.problemName || "Problem"}
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                      ) : (
                        <span className="font-medium text-slate-900 dark:text-white">
                          {sub.problemTitle || sub.problemName || "Problem"}
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 font-medium ${verdictClass(
                        sub.verdict,
                        sub.normalizedVerdict
                      )}`}
                    >
                      {sub.verdict || sub.normalizedVerdict || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {sub.language || sub.programmingLanguage || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatWhen(sub)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSourceTarget(sub)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <FileCode2 className="w-3.5 h-3.5" />
                        {sub.sourceAvailable ? "View" : "View / Attach"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setAnalysisTarget(sub)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        <BrainCircuit className="w-3.5 h-3.5" /> Analyze
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Page {data.pagination.page} of {data.pagination.totalPages} ·{" "}
              {data.pagination.total} total
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8"
                disabled={!data.pagination.hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {sourceTarget && (
        <SourceModal
          submission={sourceTarget}
          onClose={() => setSourceTarget(null)}
          onSaved={load}
        />
      )}

      {analysisTarget && (
        <AnalysisPanel
          submission={analysisTarget}
          onClose={() => {
            setAnalysisTarget(null);
            load();
          }}
          onSourceSaved={load}
        />
      )}
    </div>
  );
}

export default Submissions;
