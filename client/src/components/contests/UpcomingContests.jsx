import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  Search,
  Timer,
  Zap,
} from "lucide-react";

const formatDuration = (seconds = 0) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatCountdown = (startSeconds) => {
  const diff = startSeconds * 1000 - Date.now();
  if (diff <= 0) return "Starting soon";

  const totalMin = Math.floor(diff / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const contestTypeLabel = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("div. 1") || n.includes("div.1")) return "Div. 1";
  if (n.includes("div. 2") || n.includes("div.2")) return "Div. 2";
  if (n.includes("div. 3") || n.includes("div.3")) return "Div. 3";
  if (n.includes("div. 4") || n.includes("div.4")) return "Div. 4";
  if (n.includes("educational")) return "Edu";
  if (n.includes("global")) return "Global";
  if (n.includes("kotlin")) return "Kotlin";
  return "Round";
};

function UpcomingContests({ contests = [], loading = false }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [, setTick] = useState(0);

  // Refresh countdowns every 30s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (contests || []).filter((c) => {
      const type = contestTypeLabel(c.name);
      if (filter !== "all" && type !== filter) return false;
      if (!q) return true;
      return (c.name || "").toLowerCase().includes(q);
    });
  }, [contests, query, filter]);

  const typeFilters = useMemo(() => {
    const set = new Set((contests || []).map((c) => contestTypeLabel(c.name)));
    return ["all", ...Array.from(set).slice(0, 6)];
  }, [contests]);

  const nextContest = contests?.[0];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-sm">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Upcoming Contests
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {contests.length} scheduled on Codeforces
            </p>
          </div>
        </div>

        {nextContest && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/25 text-sm">
            <Timer className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="text-slate-600 dark:text-slate-300">Next in</span>
            <span className="font-semibold text-sky-700 dark:text-sky-300">
              {formatCountdown(nextContest.startTimeSeconds)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contests…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {typeFilters.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === t
                  ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/30"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <CalendarDays className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            No upcoming contests found
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Try clearing filters or check back later
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {filtered.map((contest, index) => {
            const start = new Date(contest.startTimeSeconds * 1000);
            const countdown = formatCountdown(contest.startTimeSeconds);
            const soon =
              contest.startTimeSeconds * 1000 - Date.now() < 24 * 3600 * 1000;

            return (
              <div
                key={contest.id}
                className={`group relative rounded-xl border p-4 transition-all hover:shadow-sm ${
                  index === 0
                    ? "border-sky-300 dark:border-sky-500/40 bg-gradient-to-r from-sky-50/80 to-transparent dark:from-sky-500/10 dark:to-transparent"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {contestTypeLabel(contest.name)}
                      </span>
                      {soon && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25">
                          <Zap className="w-3 h-3" />
                          Soon
                        </span>
                      )}
                      {index === 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500 text-white">
                          Next up
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {contest.name}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {start.toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(contest.durationSeconds)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-col sm:items-end flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">
                        Starts in
                      </p>
                      <p className="text-sm font-bold text-sky-700 dark:text-sky-300 tabular-nums">
                        {countdown}
                      </p>
                    </div>
                    <a
                      href={`https://codeforces.com/contest/${contest.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                    >
                      Open
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UpcomingContests;
