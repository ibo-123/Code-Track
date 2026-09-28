import { Link } from "react-router-dom";
import { Code2, Trophy, TrendingUp } from "lucide-react";

function RecentActivity({ history = [], connected = false }) {
  if (!connected) {
    return (
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-3">Recent Contests</h2>
        <p className="text-sm text-slate-500 mb-3">
          Contest rating changes will appear here after you connect Codeforces.
        </p>
        <Link to="/profile" className="text-sm text-blue-600 hover:underline">
          Connect Codeforces
        </Link>
      </div>
    );
  }

  const recent = [...history]
    .sort(
      (a, b) =>
        (b.ratingUpdateTimeSeconds || 0) - (a.ratingUpdateTimeSeconds || 0)
    )
    .slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-3">Recent Contests</h2>
        <p className="text-sm text-slate-500">
          No rated contest history found for this handle yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-6">Recent Contests</h2>
      <div className="space-y-5">
        {recent.map((item, index) => {
          const delta =
            item.newRating != null && item.oldRating != null
              ? item.newRating - item.oldRating
              : null;
          const Icon = delta != null && delta >= 0 ? TrendingUp : Trophy;

          return (
            <div key={`${item.contestId || index}`} className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {item.contestName || `Contest ${item.contestId || ""}`}
                </p>
                <p className="text-sm text-slate-500">
                  {item.ratingUpdateTimeSeconds
                    ? new Date(
                        item.ratingUpdateTimeSeconds * 1000
                      ).toLocaleDateString()
                    : "Date unknown"}
                  {delta != null && (
                    <span className="ml-2">
                      {delta >= 0 ? "+" : ""}
                      {delta} ({item.newRating})
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <Link
        to="/contests"
        className="inline-flex items-center gap-1 mt-5 text-sm text-blue-600 hover:underline"
      >
        <Code2 className="w-3.5 h-3.5" />
        View all contests
      </Link>
    </div>
  );
}

export default RecentActivity;
