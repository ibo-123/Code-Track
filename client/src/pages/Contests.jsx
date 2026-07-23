import { Trophy } from "lucide-react";

function Contests() {
  const upcomingFeatures = [
    "🏆 Upcoming Contests",
    "📅 Contest Calendar",
    "📈 Contest Performance",
    "🥇 Contest Rankings",
    "⚡ Virtual Contests",
    "📊 Contest Statistics",
    "🎯 Rating Changes",
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Contests
        </h1>

        <p className="text-slate-500 mt-2">
          Participate in contests and monitor your competitive programming journey.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border shadow-sm p-10">
        <div className="flex flex-col items-center text-center">

          <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
            <Trophy size={40} className="text-yellow-600" />
          </div>

          <h2 className="mt-6 text-3xl font-bold text-slate-800">
            Contests Coming Soon
          </h2>

          <p className="mt-3 text-slate-500 max-w-xl">
            Soon you'll be able to browse upcoming contests, analyze your contest
            history, and monitor rating changes from Codeforces and other
            competitive programming platforms.
          </p>

        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">

          {upcomingFeatures.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border"
            >
              <span className="text-lg">{feature}</span>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}

export default Contests;