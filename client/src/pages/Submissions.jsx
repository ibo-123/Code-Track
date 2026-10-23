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
import { listSubmissions, getSubmissionSource } from "../services/submissionService";
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
  const [sourcePreview, setSourcePreview] = useState(null);
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

  const openSource = async (id) => {
    try {
      const src = await getSubmissionSource(id);
      setSourcePreview(src);
    } catch (err) {
      toast.message(
        err.response?.data?.message || "Source code is not available"
      );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Submissions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Unified Codeforces and LeetCode attempts from your synced history
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

      {/* Truthful LeetCode capability banner */}
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
              <span className="font-semibold">{lcStatus.handle}</span>. Import
              mode is{" "}
              <span className="font-semibold">
                {lcStatus.submissionImportCapability}
              </span>{" "}
              (~{lcStatus.notes?.recentImportLimit || 20} recent). Source code:{" "}
              <span className="font-semibold">
                {lcStatus.sourceCodeCapability}
              </span>
              . This is not a full history dump.
            </>
          )}
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
                      {sub.sourceAvailable ? (
                        <button
                          type="button"
                          onClick={() => openSource(sub._id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <FileCode2 className="w-3.5 h-3.5" /> View
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {sub.sourceStatus || "unavailable"}
                        </span>
                      )}
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

      {sourcePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold">
                Source · {sourcePreview.programmingLanguage || "code"}
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-8"
                onClick={() => setSourcePreview(null)}
              >
                Close
              </Button>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs font-mono bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
              {sourcePreview.sourceCode}
            </pre>
          </div>
        </div>
      )}

      {analysisTarget && (
        <AnalysisPanel
          submission={analysisTarget}
          onClose={() => {
            setAnalysisTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export default Submissions;
