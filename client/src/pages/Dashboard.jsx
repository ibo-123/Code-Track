import { useEffect, useState } from "react";
import { Code2, Trophy, Flame } from "lucide-react";

import { getDashboard } from "../services/dashboardService";
import { getRatingHistory } from "../services/codeforcesService";
import RecentActivity from "../components/dashboard/RecentActivity";
import StatCard from "../components/dashboard/StatCard";
import ProgressCard from "../components/dashboard/ProgressCard";
import RatingChart from "../components/dashboard/RatingChart";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await getDashboard();

      setDashboard(dashboardData);

      if (dashboardData?.user?.codeforcesHandle) {
        try {
          const ratingHistory = await getRatingHistory();
          setHistory(ratingHistory.history || []);
        } catch (err) {
          console.log("Rating history unavailable", err);
        }
      }
    } catch (err) {
      console.error("Dashboard Error:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError("Unable to load dashboard.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <h2 className="text-xl font-semibold">
          Loading Dashboard...
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">
            {error}
          </h2>

          <button
            onClick={loadDashboard}
            className="mt-5 px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex justify-center items-center h-64">
        <h2 className="text-xl">
          No dashboard data available.
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {dashboard?.user?.name || "User"} 👋
        </h1>

        <p className="text-slate-500 mt-2">
          Track your competitive programming progress
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Problems Solved"
          value={dashboard?.problemsSolved || 0}
          description="Codeforces"
          icon={Code2}
        />

        <StatCard
          title="Codeforces Rating"
          value={dashboard?.codeforces?.rating || "N/A"}
          description={
            dashboard?.user?.codeforcesHandle || "Not Connected"
          }
          icon={Trophy}
        />

        <StatCard
          title="Contribution"
          value={dashboard?.codeforces?.contribution || 0}
          description="Community Contribution"
          icon={Flame}
        />
      </div>

      {/* Rating Chart */}
      <RatingChart history={history} />

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProgressCard />
        </div>

        <RecentActivity />
      </div>
    </div>
  );
}

export default Dashboard;