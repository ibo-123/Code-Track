import { useEffect, useState } from "react";
import { getDashboard } from "../services/dashboardService";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>

      <hr />

      <h2>Welcome, {dashboard.user?.name}</h2>

      <p>
        <strong>Email:</strong> {dashboard.user?.email}
      </p>

      <p>
        <strong>Codeforces Handle:</strong>{" "}
        {dashboard.user?.codeforcesHandle || "Not Connected"}
      </p>

      {dashboard.codeforces && (
        <>
          <h3>Codeforces Statistics</h3>

          <p>
            <strong>Current Rating:</strong>{" "}
            {dashboard.codeforces.rating}
          </p>

          <p>
            <strong>Max Rating:</strong>{" "}
            {dashboard.codeforces.maxRating}
          </p>

          <p>
            <strong>Rank:</strong>{" "}
            {dashboard.codeforces.rank}
          </p>

          <p>
            <strong>Contribution:</strong>{" "}
            {dashboard.codeforces.contribution}
          </p>
        </>
      )}
    </div>
  );
}

export default Dashboard;