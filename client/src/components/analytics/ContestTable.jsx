import { useMemo, useState } from "react";
import {
  Trophy,
  Minus,
  Medal,
  Star,
  Calendar,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import {
  getRatingColorClass,
  formatRatingDelta,
  ratingDeltaClass,
} from "../../lib/codeforces";

function ContestTable({
  history = [],
  maxItems = 10,
  showAll = false,
  className = "",
}) {
  const [sortField, setSortField] = useState("ratingUpdateTimeSeconds");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const processedData = useMemo(() => {
    if (!history?.length) return [];

    let data = [...history];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter((c) =>
        (c.contestName || "").toLowerCase().includes(q)
      );
    }

    if (filterType === "positive") {
      data = data.filter((c) => c.newRating > c.oldRating);
    } else if (filterType === "negative") {
      data = data.filter((c) => c.newRating < c.oldRating);
    } else if (filterType === "neutral") {
      data = data.filter((c) => c.newRating === c.oldRating);
    }

    data.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "change") {
        aVal = a.newRating - a.oldRating;
        bVal = b.newRating - b.oldRating;
      }
      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    if (!showAll && maxItems > 0) data = data.slice(0, maxItems);
    return data;
  }, [history, searchTerm, filterType, sortField, sortDirection, showAll, maxItems]);

  const stats = useMemo(() => {
    if (!history?.length) return null;
    const changes = history.map((c) => c.newRating - c.oldRating);
    return {
      total: history.length,
      positive: changes.filter((c) => c > 0).length,
      negative: changes.filter((c) => c < 0).length,
      neutral: changes.filter((c) => c === 0).length,
      totalChange: changes.reduce((a, b) => a + b, 0),
    };
  }, [history]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  const getChangeInfo = (change) => {
    if (change > 0) {
      return {
        color: ratingDeltaClass(change),
        bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
        icon: ArrowUp,
        label: formatRatingDelta(change),
      };
    }
    if (change < 0) {
      return {
        color: ratingDeltaClass(change),
        bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
        icon: ArrowDown,
        label: formatRatingDelta(change),
      };
    }
    return {
      color: "text-slate-500",
      bg: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      icon: Minus,
      label: "0",
    };
  };

  if (!history?.length) {
    return (
      <div
        className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 ${className}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-violet-500/15 dark:bg-violet-500/20">
            <Trophy className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Contests
            </h3>
            <p className="text-xs text-slate-500">Your contest history</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <Trophy className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
            No contest history yet
          </p>
          <p className="text-slate-500 text-xs mt-1 max-w-xs">
            Join a rated Codeforces contest and sync your account to see results
            here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/15 dark:bg-violet-500/20">
            <Trophy className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Contests
            </h3>
            <p className="text-xs text-slate-500">
              {history.length} contests ·{" "}
              {stats?.totalChange > 0 ? "+" : ""}
              {stats?.totalChange || 0} rating
            </p>
          </div>
        </div>
        {stats && (
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <ArrowUp className="w-3 h-3" />
              {stats.positive}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
              <ArrowDown className="w-3 h-3" />
              {stats.negative}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              <Minus className="w-3 h-3" />
              {stats.neutral}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search contests…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500/30"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: "all", label: "All" },
            { id: "positive", label: "Up" },
            { id: "negative", label: "Down" },
            { id: "neutral", label: "Flat" },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setFilterType(type.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filterType === type.id
                  ? "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-500/30"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {[
                { field: "contestName", label: "Contest" },
                { field: "rank", label: "Rank" },
                { field: "change", label: "Change" },
                { field: "newRating", label: "Rating" },
              ].map((col) => (
                <th
                  key={col.field}
                  onClick={() => handleSort(col.field)}
                  className="text-left py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon field={col.field} />
                  </span>
                </th>
              ))}
              <th className="text-right py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Link
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-slate-500 text-sm"
                >
                  No contests match your filters
                </td>
              </tr>
            ) : (
              processedData.map((contest, index) => {
                const change = contest.newRating - contest.oldRating;
                const changeInfo = getChangeInfo(change);
                const ChangeIcon = changeInfo.icon;
                const date = contest.ratingUpdateTimeSeconds
                  ? new Date(contest.ratingUpdateTimeSeconds * 1000)
                  : null;

                return (
                  <tr
                    key={contest.contestId || index}
                    className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[220px]">
                            {contest.contestName || "Contest"}
                          </p>
                          {date && (
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {date.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {contest.rank <= 10 && (
                          <Medal className="w-3 h-3 text-amber-500" />
                        )}
                        #{contest.rank}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${changeInfo.bg} ${changeInfo.color}`}
                      >
                        <ChangeIcon className="w-3 h-3" />
                        {changeInfo.label}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`cf-mono text-sm font-bold ${getRatingColorClass(
                          contest.newRating
                        )}`}
                      >
                        {contest.newRating}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">
                        ({contest.oldRating})
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      {contest.contestId && (
                        <a
                          href={`https://codeforces.com/contest/${contest.contestId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-500/10 transition-colors"
                          title="Open on Codeforces"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!showAll && history.length > maxItems && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {Math.min(processedData.length, maxItems)} of {history.length}
          </p>
          <a
            href="/contests"
            className="text-xs text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
          >
            View all
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

export default ContestTable;
