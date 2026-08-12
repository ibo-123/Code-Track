import { useEffect, useState, useCallback } from "react";
import { 
  Code2, 
  Trophy, 
  Flame, 
  User, 
  RefreshCw, 
  AlertCircle,
  Loader2,
  TrendingUp,
  Award,
  Target,
  Calendar,
  Clock,
  Zap,
  BarChart3,
  Users,
  Star
} from "lucide-react";
import { getDashboard } from "../services/dashboardService";
import { getRatingHistory } from "../services/codeforcesService";
import RecentActivity from "../components/dashboard/RecentActivity";
import StatCard from "../components/dashboard/StatCard";
import ProgressCard from "../components/dashboard/ProgressCard";
import RatingChart from "../components/dashboard/RatingChart";
import { toast } from "sonner";

function Dashboard({ 
  userId,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  onError,
  onLoad,
  className = ""
}) {
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError("");

    try {
      const dashboardData = await getDashboard(userId);
      setDashboard(dashboardData);
      setLastUpdated(new Date());
      onLoad?.(dashboardData);

      // Load rating history if available
      if (dashboardData?.user?.codeforcesHandle) {
        try {
          const ratingHistory = await getRatingHistory(
            dashboardData.user.codeforcesHandle
          );
          setHistory(ratingHistory.history || []);
        } catch (err) {
          console.warn("Rating history unavailable:", err);
          // Don't set error for rating history failure
        }
      }

      // Reset retry count on success
      setRetryCount(0);

    } catch (err) {
      console.error("Dashboard Error:", err);
      
      const errorMessage = err.response?.status === 401
        ? "Your session has expired. Please log in again."
        : err.response?.status === 404
        ? "Dashboard data not found."
        : err.response?.status === 429
        ? "Too many requests. Please try again later."
        : err.message || "Unable to load dashboard.";

      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      onError?.(err);

      // Show toast for user feedback
      toast.error(errorMessage);

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, onError, onLoad]);

  // Initial load
  useEffect(() => {
    loadDashboard();

    // Auto-refresh setup
    if (autoRefresh && refreshInterval > 0) {
      const intervalId = setInterval(() => {
        loadDashboard(true);
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [loadDashboard, autoRefresh, refreshInterval]);

  // Keyboard shortcut for refresh (Ctrl+R or Cmd+R)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleRefresh();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Loading State
  if (loading) {
    return (
      <div className={`flex flex-col justify-center items-center h-64 ${className}`}>
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">
          Loading Dashboard...
        </h2>
        <p className="text-sm text-slate-400 mt-2">
          Fetching your latest data
        </p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="text-center max-w-md">
          <div className="p-4 bg-red-50 rounded-full inline-block mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-600">
            {error}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            {retryCount >= 3 
              ? "Multiple retry attempts failed. Please try again later."
              : "Please try reloading the page or contact support if the issue persists."}
          </p>
          <div className="mt-5 space-x-3">
            <button
              onClick={handleRetry}
              disabled={retryCount >= 3}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {retryCount >= 3 ? "Too Many Attempts" : "Retry"}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Reload Page
            </button>
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-slate-400 mt-3">
              Attempt {retryCount} of 3
            </p>
          )}
        </div>
      </div>
    );
  }

  // No Data State
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
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Connect Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back, {dashboard?.user?.name || "User"} 👋
            </h1>
            {dashboard?.streak && dashboard.streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium text-orange-700">
                  {dashboard.streak} day streak
                </span>
              </div>
            )}
          </div>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span>Track your competitive programming progress</span>
            {lastUpdated && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh dashboard (Ctrl+R)"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Print dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-xs text-slate-500">Problems</p>
            <p className="text-sm font-bold text-slate-700">{dashboard?.problemsSolved || 0}</p>
          </div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg flex items-center gap-2">
          <Trophy className="w-4 h-4 text-purple-500" />
          <div>
            <p className="text-xs text-slate-500">Rating</p>
            <p className="text-sm font-bold text-slate-700">{dashboard?.codeforces?.rating || "N/A"}</p>
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
          <Star className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-xs text-slate-500">Rank</p>
            <p className="text-sm font-bold text-slate-700">{dashboard?.codeforces?.rank || "N/A"}</p>
          </div>
        </div>
        <div className="p-3 bg-orange-50 rounded-lg flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-500" />
          <div>
            <p className="text-xs text-slate-500">Streak</p>
            <p className="text-sm font-bold text-slate-700">{dashboard?.streak || 0} days</p>
          </div>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Problems Solved"
          value={dashboard?.problemsSolved || 0}
          description="Codeforces"
          icon={Code2}
          trend={dashboard?.problemsSolved > 0 ? "+12 this month" : undefined}
        />

        <StatCard
          title="Codeforces Rating"
          value={dashboard?.codeforces?.rating || "N/A"}
          description={
            dashboard?.user?.codeforcesHandle || "Not Connected"
          }
          icon={Trophy}
          subtitle={dashboard?.codeforces?.maxRating ? `Max: ${dashboard.codeforces.maxRating}` : undefined}
        />

        <StatCard
          title="Contribution"
          value={dashboard?.codeforces?.contribution || 0}
          description="Community Contribution"
          icon={Flame}
        />
      </div>

      {/* Rating Chart */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-700">Rating History</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{history.length} contests</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>Last {new Date(history[history.length - 1]?.ratingUpdateTimeSeconds * 1000).toLocaleDateString()}</span>
            </div>
          </div>
          <RatingChart history={history} />
        </div>
      )}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProgressCard />
        </div>
        <RecentActivity />
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 border-t border-slate-200 pt-4">
        <p>
          Dashboard data provided by Codeforces API • 
          {dashboard?.user?.codeforcesHandle && (
            <span className="ml-1">Connected as @{dashboard.user.codeforcesHandle}</span>
          )}
        </p>
        {autoRefresh && (
          <p className="mt-1">
            Auto-refreshes every {Math.floor(refreshInterval / 60000)} minutes
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;