import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Code2,
  Trophy,
  Flame,
  RefreshCw,
  AlertCircle,
  Loader2,
  TrendingUp,
  Target,
  Clock,
  Zap,
  BarChart3,
} from "lucide-react";
import { getDashboard } from "../services/dashboardService";
import { getRatingHistory } from "../services/codeforcesService";
import RecentActivity from "../components/dashboard/RecentActivity";
import StatCard from "../components/dashboard/StatCard";
import ProgressCard from "../components/dashboard/ProgressCard";
import RatingChart from "../components/dashboard/RatingChart";
import { toast } from "sonner";

function Dashboard({
  autoRefresh = false,
  refreshInterval = 300000,
  className = "",
}) {
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const dashboardData = await getDashboard();
      setDashboard(dashboardData);
      setLastUpdated(new Date());

      if (dashboardData?.user?.codeforcesHandle) {
        try {
          const ratingHistory = await getRatingHistory();
          setHistory(ratingHistory.history || []);
        } catch {
          setHistory([]);
        }
      } else {
        setHistory([]);
      }

      setRetryCount(0);
    } catch (err) {
      const errorMessage =
        err.response?.status === 401
          ? "Your session has expired. Please log in again."
          : err.response?.status === 404
            ? "Dashboard data not found."
            : err.message || "Unable to load dashboard.";

      setError(errorMessage);
      setRetryCount((prev) => prev + 1);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    if (autoRefresh && refreshInterval > 0) {
      const intervalId = setInterval(() => loadDashboard(true), refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [loadDashboard, autoRefresh, refreshInterval]);

  const handleRefresh = () => {
    loadDashboard(true);
    toast.info("Refreshing dashboard...");
  };

  const handleRetry = () => {
    if (retryCount >= 3) {
      toast.error("Please wait a moment before trying again.");
      return;
    }
    loadDashboard();
  };

  if (loading) {
    return (
      <div className={`flex flex-col justify-center items-center h-64 ${className}`}>
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Loading Dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="text-center max-w-md">
          <div className="p-4 bg-red-50 rounded-full inline-block mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-600">{error}</h2>
          <div className="mt-5 space-x-3">
            <button
              onClick={handleRetry}
              disabled={retryCount >= 3}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="text-center">
          <div className="p-4 bg-slate-100 rounded-full inline-block mb-4">
            <BarChart3 className="w-12 h-12 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700">
            No Dashboard Data Available
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Connect your Codeforces account to start tracking your progress.
          </p>
          <Link
            to="/profile"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Connect Account
          </Link>
        </div>
      </div>
    );
  }

  const connected = Boolean(dashboard?.user?.codeforcesHandle);

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {dashboard?.user?.name || "User"}
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>Track your competitive programming progress</span>
            {lastUpdated && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
          title="Refresh dashboard"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!connected && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-amber-800">
            Connect a Codeforces handle to unlock rating history, contests, and analytics.
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700"
          >
            Connect Codeforces
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-xs text-slate-500">Problems</p>
            <p className="text-sm font-bold text-slate-700">
              {dashboard?.problemsSolved || 0}
            </p>
          </div>
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg flex items-center gap-2">
          <Trophy className="w-4 h-4 text-indigo-500" />
          <div>
            <p className="text-xs text-slate-500">Rating</p>
            <p className="text-sm font-bold text-slate-700">
              {dashboard?.codeforces?.rating ?? "N/A"}
            </p>
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
          <Zap className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-xs text-slate-500">Rank</p>
            <p className="text-sm font-bold text-slate-700">
              {dashboard?.codeforces?.rank || "N/A"}
            </p>
          </div>
        </div>
        <div className="p-3 bg-orange-50 rounded-lg flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <div>
            <p className="text-xs text-slate-500">Contests</p>
            <p className="text-sm font-bold text-slate-700">
              {dashboard?.contestCount || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Problems Solved"
          value={dashboard?.problemsSolved || 0}
          description="Codeforces"
          icon={Code2}
        />
        <StatCard
          title="Codeforces Rating"
          value={dashboard?.codeforces?.rating ?? "N/A"}
          description={dashboard?.user?.codeforcesHandle || "Not Connected"}
          icon={Trophy}
          subtitle={
            dashboard?.codeforces?.maxRating
              ? `Max: ${dashboard.codeforces.maxRating}`
              : undefined
          }
        />
        <StatCard
          title="Contribution"
          value={dashboard?.codeforces?.contribution ?? 0}
          description="Community Contribution"
          icon={Flame}
        />
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-700">Rating History</h3>
            <span className="text-xs text-slate-400 ml-auto">
              {history.length} contests
            </span>
          </div>
          <RatingChart history={history} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProgressCard
            problemsSolved={dashboard?.problemsSolved || 0}
            contestCount={dashboard?.contestCount || 0}
            rating={dashboard?.codeforces?.rating}
            maxRating={dashboard?.codeforces?.maxRating}
            connected={connected}
          />
        </div>
        <RecentActivity history={history} connected={connected} />
      </div>
    </div>
  );
}

export default Dashboard;
