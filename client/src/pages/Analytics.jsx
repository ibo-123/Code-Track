import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";

import { getAnalytics } from "../services/analyticsService";

import AnalyticsStats from "../components/analytics/AnalyticsStats";
import RatingChart from "../components/dashboard/RatingChart";
import ActivityCard from "../components/analytics/ActivityCard";
import ContestTable from "../components/analytics/ContestTable";

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load analytics"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-600">Loading analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-red-600 font-medium">{error}</p>
        <button
          type="button"
          onClick={loadAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const connected =
    Boolean(analytics?.history?.length) ||
    Boolean(analytics?.problemsSolved) ||
    Boolean(analytics?.contestCount) ||
    Boolean(analytics?.currentRating);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-slate-500">Analyze your Codeforces performance</p>
      </div>

      {!connected && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800">
          Connect Codeforces on your{" "}
          <Link to="/profile" className="underline font-medium">
            Profile
          </Link>{" "}
          page to populate analytics.
        </div>
      )}

      <AnalyticsStats stats={analytics} />

      <RatingChart history={analytics?.history || []} />

      <div className="grid lg:grid-cols-2 gap-6">
        <ActivityCard
          problemsSolved={analytics?.problemsSolved}
          contestCount={analytics?.contestCount}
          history={analytics?.history || []}
        />
        <ContestTable history={analytics?.history || []} />
      </div>
    </div>
  );
}

export default Analytics;
