import { useEffect, useState } from "react";

import { getAnalytics } from "../services/analyticsService";

import AnalyticsStats from "../components/analytics/AnalyticsStats";
import RatingChart from "../components/dashboard/RatingChart";
import ActivityCard from "../components/analytics/ActivityCard";
import ContestTable from "../components/analytics/ContestTable";

function Analytics() {

  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {

    try {

      const data = await getAnalytics();

      setAnalytics(data);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }

  };

  if (loading) {

    return (
      <h2 className="text-xl">
        Loading...
      </h2>
    );

  }

  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          Analytics
        </h1>

        <p className="text-slate-500">
          Analyze your performance
        </p>

      </div>

      <AnalyticsStats stats={analytics} />

      <RatingChart history={analytics?.history || []} />

      <div className="grid lg:grid-cols-2 gap-6">

        <ActivityCard />

        <ContestTable history={analytics?.history || []} />

      </div>

    </div>

  );

}

export default Analytics;