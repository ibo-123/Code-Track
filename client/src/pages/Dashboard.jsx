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

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
  try {

    const dashboardData = await getDashboard();

    setDashboard(dashboardData);


    if (dashboardData.user?.codeforcesHandle) {

      try {

        const ratingHistory = await getRatingHistory();

        setHistory(ratingHistory.history || []);

      } catch(error){

        console.log(
          "Rating history unavailable"
        );

      }

    }


  } catch(error) {

    console.error(
      "Dashboard Error:",
      error
    );

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

  return (
    <div className="space-y-8">

      {/* Welcome */}

      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {dashboard.user?.name} 👋
        </h1>

        <p className="text-slate-500 mt-2">
          Track your competitive programming progress
        </p>
      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <StatCard
          title="Problems Solved"
          value={dashboard.problemsSolved || 0}
          description="Codeforces"
          icon={Code2}
        />

        <StatCard
          title="Codeforces Rating"
          value={dashboard.codeforces?.rating || "N/A"}
          description={
            dashboard.user?.codeforcesHandle || "Not Connected"
          }
          icon={Trophy}
        />

        <StatCard
          title="Contribution"
          value={dashboard.codeforces?.contribution || 0}
          description="Community contribution"
          icon={Flame}
        />

      </div>

      {/* Rating Chart */}

      <RatingChart history={history} />
      {/* Bottom Section */}

      <div
        className="
        grid
        grid-cols-1
        lg:grid-cols-3
        gap-6
        "
      >

        <div className="lg:col-span-2">
          <ProgressCard />
        </div>

        <RecentActivity />

      </div>

    </div>
  );
}

export default Dashboard;