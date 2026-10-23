import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Trophy,
  CalendarDays,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import {
  getUpcomingContests,
  getContestHistory,
} from "../services/contestService";
import UpcomingContests from "../components/contests/UpcomingContests";
import ContestHistory from "../components/contests/ContestHistory";
import { toast } from "sonner";

function Contests() {
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async (soft = false) => {
    if (soft) setRefreshing(true);
    else setLoading(true);
    setError("");

    // Load independently so one slow CF call doesn't blank the whole page
    const [upcomingResult, historyResult] = await Promise.allSettled([
      getUpcomingContests(),
      getContestHistory(),
    ]);

    if (upcomingResult.status === "fulfilled") {
      setUpcoming(
        Array.isArray(upcomingResult.value) ? upcomingResult.value : []
      );
    } else {
      console.error(upcomingResult.reason);
      setError(
        upcomingResult.reason?.response?.data?.message ||
          upcomingResult.reason?.message ||
          "Unable to load upcoming contests."
      );
      if (!soft) toast.error("Failed to load upcoming contests");
    }

    if (historyResult.status === "fulfilled") {
      setHistory(
        Array.isArray(historyResult.value) ? historyResult.value : []
      );
    } else {
      console.error(historyResult.reason);
      // Keep prior history; don't block the page
      if (!soft) toast.error("Failed to load contest history");
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    const changes = history.map((c) => c.newRating - c.oldRating);
    const next = upcoming[0];
    const nextInMs = next
      ? next.startTimeSeconds * 1000 - Date.now()
      : null;

    return {
      upcomingCount: upcoming.length,
      historyCount: history.length,
      ratingDelta: changes.reduce((a, b) => a + b, 0),
      wins: changes.filter((c) => c > 0).length,
      nextLabel: next
        ? nextInMs > 0
          ? nextInMs < 86400000
            ? `${Math.max(1, Math.round(nextInMs / 3600000))}h`
            : `${Math.round(nextInMs / 86400000)}d`
          : "Soon"
        : "—",
    };
  }, [upcoming, history]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px]">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
        <p className="mt-4 text-sm text-slate-500">Loading contests…</p>
      </div>
    );
  }

  if (error && upcoming.length === 0 && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-center px-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 mb-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {error}
        </h2>
        <button
          type="button"
          onClick={() => loadData()}
          className="mt-4 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-500"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = [
    {
      label: "Upcoming",
      value: summary.upcomingCount,
      icon: CalendarDays,
      tone: "text-sky-600 dark:text-sky-400 bg-sky-500/15",
    },
    {
      label: "Next starts",
      value: summary.nextLabel,
      icon: Clock,
      tone: "text-amber-600 dark:text-amber-400 bg-amber-500/15",
    },
    {
      label: "Your contests",
      value: summary.historyCount,
      icon: Trophy,
      tone: "text-violet-600 dark:text-violet-400 bg-violet-500/15",
    },
    {
      label: "Net rating",
      value: `${summary.ratingDelta > 0 ? "+" : ""}${summary.ratingDelta || 0}`,
      icon: TrendingUp,
      tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-gradient-to-br from-white via-sky-50 to-white dark:from-slate-900 dark:via-sky-950/20 dark:to-slate-900 p-6 md:p-8 shadow-sm">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-sky-400/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                Contests
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Codeforces
              </span>
            </div>
            <p className="mt-1.5 text-slate-500 dark:text-slate-400 text-sm">
              Track upcoming rounds and your rated contest performance
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              loadData(true);
              toast.info("Refreshing contests…");
            }}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 self-start"
            title="Refresh"
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${tone}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  {label}
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <UpcomingContests contests={upcoming} loading={refreshing && !upcoming.length} />
      <ContestHistory history={history} loading={refreshing && !history.length} />

      <p className="text-center text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4">
        Contest data provided by the Codeforces API
      </p>
    </div>
  );
}

export default Contests;
