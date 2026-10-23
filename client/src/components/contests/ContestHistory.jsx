import { useMemo, useState } from "react";
import {
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  Search,
  ExternalLink,
  Medal,
  Calendar,
  TrendingUp,
} from "lucide-react";
import {
  getRatingColorClass,
  formatRatingDelta,
  ratingDeltaClass,
} from "../../lib/codeforces";

function ContestHistory({ history = [], loading = false }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const sorted = useMemo(() => {
    // Newest first
    return [...(history || [])].sort(
      (a, b) =>
        (b.ratingUpdateTimeSeconds || 0) - (a.ratingUpdateTimeSeconds || 0)
    );
  }, [history]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((item) => {
      const change = item.newRating - item.oldRating;
      if (filter === "positive" && change <= 0) return false;
      if (filter === "negative" && change >= 0) return false;
      if (filter === "neutral" && change !== 0) return false;
      if (!q) return true;
      return (item.contestName || "").toLowerCase().includes(q);
    });
  }, [sorted, query, filter]);

  const stats = useMemo(() => {
    if (!history?.length) return null;
    const changes = history.map((c) => c.newRating - c.oldRating);
    return {
      total: history.length,
      positive: changes.filter((c) => c > 0).length,
      negative: changes.filter((c) => c < 0).length,
      totalChange: changes.reduce((a, b) => a + b, 0),
      best: Math.max(...changes),
      worst: Math.min(...changes),
    };
  }, [history]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Contest History
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {stats
                ? `${stats.total} rated contests · ${
                    stats.totalChange > 0 ? "+" : ""
                  }${stats.totalChange} rating`
                : "Your rated Codeforces rounds"}
            </p>
          </div>
        </div>

        {stats && (
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <ArrowUp className="w-3 h-3" />
              {stats.positive}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
              <ArrowDown className="w-3 h-3" />
              {stats.negative}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
              <TrendingUp className="w-3 h-3" />
              Best +{stats.best}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search past contests…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: "all", label: "All" },
            { id: "positive", label: "Up" },
            { id: "negative", label: "Down" },
            { id: "neutral", label: "Flat" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === t.id
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {history.length === 0
              ? "No contest history yet"
              : "No contests match your filters"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {history.length === 0
              ? "Connect Codeforces and compete in rated rounds to track results"
              : "Try another search or filter"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {["Contest", "Date", "Rank", "Change", "Rating", ""].map(
                  (label) => (
                    <th
                      key={label || "link"}
                      className="text-left py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => {
                const change = item.newRating - item.oldRating;
                const date = item.ratingUpdateTimeSeconds
                  ? new Date(item.ratingUpdateTimeSeconds * 1000)
                  : null;
                const up = change > 0;
                const down = change < 0;
                const ChangeIcon = up ? ArrowUp : down ? ArrowDown : Minus;

                return (
                  <tr
                    key={item.contestId || index}
                    className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3.5 pr-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[240px]">
                        {item.contestName}
                      </p>
                    </td>
                    <td className="py-3.5">
                      {date ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {date.toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.rank <= 10 && (
                          <Medal className="w-3 h-3 text-amber-500" />
                        )}
                        #{item.rank}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`cf-mono inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${
                          up
                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                            : down
                            ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        } ${ratingDeltaClass(change)}`}
                      >
                        <ChangeIcon className="w-3 h-3" />
                        {formatRatingDelta(change)}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`cf-mono text-sm font-bold ${getRatingColorClass(
                          item.newRating
                        )}`}
                      >
                        {item.newRating}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">
                        ({item.oldRating})
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      {item.contestId && (
                        <a
                          href={`https://codeforces.com/contest/${item.contestId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                          title="Open on Codeforces"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ContestHistory;
