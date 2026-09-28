import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";

import {
  getUpcomingContests,
  getContestHistory,
} from "../services/contestService";

import UpcomingContests from "../components/contests/UpcomingContests";
import ContestHistory from "../components/contests/ContestHistory";

function Contests() {
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [upcomingData, historyData] = await Promise.all([
        getUpcomingContests(),
        getContestHistory(),
      ]);

      setUpcoming(Array.isArray(upcomingData) ? upcomingData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load contests"
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-600">Loading contests…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-sm text-slate-500 max-w-md">
          Contest history requires a connected Codeforces account. Upcoming
          contests come from the public Codeforces API.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Retry
          </button>
          <Link
            to="/profile"
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
          >
            Open Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Contests</h1>
        <p className="text-slate-500 mt-1">
          Upcoming Codeforces contests and your rated history
        </p>
      </div>

      <UpcomingContests contests={upcoming} />
      <ContestHistory history={history} />
    </div>
  );
}

export default Contests;
