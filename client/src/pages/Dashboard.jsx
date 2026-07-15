import { useEffect, useState } from "react";
import {
  Code2,
  Trophy,
  Flame,
  User
} from "lucide-react";

import { getDashboard } from "../services/dashboardService";

import ProgressCard from "../components/dashboard/ProgressCard";
import StatCard from "../components/dashboard/StatCard";


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

    } catch(error) {

      console.error("Dashboard Error:", error);

    } finally {

      setLoading(false);

    }

  };


  if(loading){

    return (
      <div className="flex justify-center items-center h-64">
        <h2 className="text-xl font-semibold">
          Loading dashboard...
        </h2>
      </div>
    );

  }


  return (

    <div className="space-y-8">


      {/* Welcome */}

      <div>

        <h1 className="
          text-3xl
          font-bold
        ">
          Welcome back, {dashboard.user?.name} 👋
        </h1>


        <p className="text-slate-500 mt-2">
          Track your competitive programming progress
        </p>

      </div>




      {/* Statistics Cards */}

      <div className="
        grid
        grid-cols-1
        md:grid-cols-3
        gap-6
      ">


        <StatCard
          title="Problems Solved"
          value="320+"
          description="Codeforces + LeetCode"
          icon={Code2}
        />


        <StatCard
          title="Codeforces Rating"
          value={
            dashboard.codeforces?.rating || "N/A"
          }
          description={
            dashboard.user?.codeforcesHandle 
            || "Not Connected"
          }
          icon={Trophy}
        />


        <StatCard
          title="Contribution"
          value={
            dashboard.codeforces?.contribution || 0
          }
          description="Codeforces contribution"
          icon={Flame}
        />


      </div>




      {/* Main Content */}

      <div className="
        grid
        grid-cols-1
        lg:grid-cols-2
        gap-6
      ">


        <ProgressCard />



        {/* Profile Card */}

        <div
          className="
          bg-white
          rounded-xl
          shadow-sm
          border
          p-6
          "
        >

          <div className="flex items-center gap-4">


            <div
              className="
              w-14
              h-14
              rounded-full
              bg-blue-600
              text-white
              flex
              items-center
              justify-center
              text-xl
              font-bold
              "
            >

              {dashboard.user?.name?.[0]}

            </div>



            <div>

              <h2 className="font-bold text-xl">

                {dashboard.user?.name}

              </h2>


              <p className="text-slate-500">

                {dashboard.user?.email}

              </p>


            </div>


          </div>


          <div className="mt-6 space-y-3">


            <p>
              <strong>Codeforces:</strong>{" "}
              {
                dashboard.user?.codeforcesHandle 
                || "Not Connected"
              }
            </p>



            <p>
              <strong>Max Rating:</strong>{" "}
              {
                dashboard.codeforces?.maxRating 
                || "N/A"
              }
            </p>


            <p>
              <strong>Rank:</strong>{" "}
              {
                dashboard.codeforces?.rank 
                || "N/A"
              }
            </p>


          </div>


        </div>


      </div>


    </div>

  );
}


export default Dashboard;