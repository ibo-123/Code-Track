import { useMemo, useState } from "react";
import {
  Trophy,
  Star,
  Code2,
  Medal,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
} from "lucide-react";
import { getRatingColorClass } from "../../lib/codeforces";

const COLOR_SCHEMES = {
  blue: {
    bg: "from-blue-500/15 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-500/5",
    border: "border-blue-200/80 dark:border-blue-500/30",
    iconBg: "bg-blue-500/15 dark:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    bg: "from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/5",
    border: "border-amber-200/80 dark:border-amber-500/30",
    iconBg: "bg-amber-500/15 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  emerald: {
    bg: "from-emerald-500/15 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/5",
    border: "border-emerald-200/80 dark:border-emerald-500/30",
    iconBg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  purple: {
    bg: "from-violet-500/15 via-violet-500/5 to-transparent dark:from-violet-500/20 dark:via-violet-500/5",
    border: "border-violet-200/80 dark:border-violet-500/30",
    iconBg: "bg-violet-500/15 dark:bg-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
};

function AnalyticsStats({ stats, className = "", showTrends = true }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const cards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        id: "current-rating",
        title: "Current Rating",
        value: stats.currentRating ?? 0,
        icon: Trophy,
        color: "blue",
        description: stats.ratingChange
          ? `${stats.ratingChange > 0 ? "+" : ""}${stats.ratingChange} last contest`
          : "Live Codeforces rating",
        change: stats.ratingChange || 0,
        badge: stats.rank || "Unrated",
        isRating: true,
      },
      {
        id: "max-rating",
        title: "Max Rating",
        value: stats.maxRating ?? 0,
        icon: Star,
        color: "amber",
        description: "Your peak performance",
        change: (stats.maxRating || 0) - (stats.currentRating || 0),
        badge: "Peak",
        isRating: true,
      },
      {
        id: "problems-solved",
        title: "Problems Solved",
        value: stats.problemsSolved ?? 0,
        icon: Code2,
        color: "emerald",
        description: "Accepted uniquely",
        change: 0,
        badge: (stats.problemsSolved || 0) > 100 ? "Pro" : "Learning",
        suffix: "problems",
      },
      {
        id: "contests",
        title: "Contests",
        value: stats.contestCount ?? stats.history?.length ?? 0,
        icon: Medal,
        color: "purple",
        description: "Rated contests entered",
        change: 0,
        badge: (stats.contestCount || 0) > 10 ? "Regular" : "Beginner",
        suffix: "contests",
      },
    ];
  }, [stats]);

  if (!stats) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24 mb-3" />
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ${className}`}>
      {cards.map((item, index) => {
        const Icon = item.icon;
        const scheme = COLOR_SCHEMES[item.color];
        const trendUp = item.change > 0;
        const trendDown = item.change < 0;
        const TrendIcon = trendUp ? ArrowUp : trendDown ? ArrowDown : Minus;

        return (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`
              relative overflow-hidden rounded-2xl border p-5
              bg-white dark:bg-slate-900
              bg-gradient-to-br ${scheme.bg} ${scheme.border}
              shadow-sm hover:shadow-md hover:scale-[1.01]
              transition-all duration-300
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {item.title}
                  </p>
                  {item.badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-end gap-1.5">
                  <h2
                    className={`text-3xl font-bold tracking-tight ${
                      item.isRating
                        ? `cf-mono ${getRatingColorClass(item.value)}`
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {typeof item.value === "number"
                      ? item.value.toLocaleString()
                      : item.value}
                  </h2>
                  {item.suffix && (
                    <span className="text-xs text-slate-500 mb-1">{item.suffix}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {item.description}
                </p>
              </div>
              <div
                className={`p-2.5 rounded-xl ${scheme.iconBg} ${
                  hoveredIndex === index ? "scale-110" : ""
                } transition-transform`}
              >
                <Icon className={`w-5 h-5 ${scheme.iconColor}`} />
              </div>
            </div>

            {showTrends && item.change !== 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border
                bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10">
                <TrendIcon
                  className={`w-3 h-3 ${
                    trendUp
                      ? "text-emerald-500"
                      : trendDown
                      ? "text-rose-500"
                      : "text-slate-400"
                  }`}
                />
                <span
                  className={
                    trendUp
                      ? "text-emerald-600 dark:text-emerald-400"
                      : trendDown
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-500"
                  }
                >
                  {item.change > 0 ? "+" : ""}
                  {item.change}
                </span>
                {trendUp && (
                  <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AnalyticsStats;
