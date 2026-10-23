import {
  Activity,
  Target,
  Flame,
  Trophy,
  Award,
  Medal,
  Layers,
  Code2,
} from "lucide-react";

const TYPES = {
  problem: {
    iconBg: "bg-blue-500/15 dark:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200/70 dark:border-blue-500/25",
    bg: "from-blue-500/10 to-transparent dark:from-blue-500/15",
  },
  streak: {
    iconBg: "bg-amber-500/15 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200/70 dark:border-amber-500/25",
    bg: "from-amber-500/10 to-transparent dark:from-amber-500/15",
  },
  contest: {
    iconBg: "bg-violet-500/15 dark:bg-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
    border: "border-violet-200/70 dark:border-violet-500/25",
    bg: "from-violet-500/10 to-transparent dark:from-violet-500/15",
  },
  achievement: {
    iconBg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200/70 dark:border-emerald-500/25",
    bg: "from-emerald-500/10 to-transparent dark:from-emerald-500/15",
  },
};

function ActivityCard({
  data: propData,
  title = "Activity Overview",
  className = "",
}) {
  if (!propData) {
    return (
      <div
        className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 ${className}`}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-blue-500/15">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-500">Sync Codeforces to see stats</p>
          </div>
        </div>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
            <Code2 className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            No activity data yet
          </p>
        </div>
      </div>
    );
  }

  const {
    problemsThisWeek = 0,
    problemsThisMonth = 0,
    currentStreak = 0,
    longestStreak = 0,
    contestsParticipated = 0,
    achievements = 0,
    weeklyGoal = 25,
  } = propData;

  const progressPct = Math.min(
    100,
    Math.round((problemsThisWeek / Math.max(weeklyGoal, 1)) * 100)
  );

  const items = [
    {
      type: "problem",
      label: "Problems This Week",
      value: problemsThisWeek,
      subtitle: `Goal: ${weeklyGoal}`,
      icon: Target,
      pct: progressPct,
    },
    {
      type: "problem",
      label: "Problems This Month",
      value: problemsThisMonth,
      subtitle: "Solved this month",
      icon: Layers,
    },
    {
      type: "streak",
      label: "Current Streak",
      value: currentStreak > 0 ? `${currentStreak}d` : "0",
      subtitle: currentStreak >= 7 ? "On fire!" : "Keep going",
      icon: Flame,
    },
    {
      type: "streak",
      label: "Longest Streak",
      value: longestStreak > 0 ? `${longestStreak}d` : "0",
      subtitle: "Personal best",
      icon: Medal,
    },
    {
      type: "contest",
      label: "Contests Entered",
      value: contestsParticipated,
      subtitle: "Rated rounds",
      icon: Trophy,
    },
    {
      type: "achievement",
      label: "Achievements",
      value: achievements,
      subtitle: "Unlocked",
      icon: Award,
    },
  ];

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-500">Performance at a glance</p>
          </div>
        </div>
        {problemsThisMonth > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          const cfg = TYPES[item.type];
          return (
            <div
              key={item.label}
              className={`rounded-xl p-3.5 border bg-gradient-to-br ${cfg.bg} ${cfg.border}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 truncate">
                    {item.label}
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {item.value}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {item.subtitle}
                  </p>
                </div>
                <div className={`p-1.5 rounded-lg ${cfg.iconBg}`}>
                  <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                </div>
              </div>
              {item.pct != null && (
                <div className="mt-2 w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" />
          Weekly goal: {problemsThisWeek}/{weeklyGoal}
        </span>
        <span className="font-medium text-slate-600 dark:text-slate-300">
          {progressPct}%
        </span>
      </div>
    </div>
  );
}

export default ActivityCard;
