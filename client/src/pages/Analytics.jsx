function Analytics() {
  const upcomingFeatures = [
    "📈 Codeforces Rating History",
    "🏆 Contest Performance",
    "📊 Problems Solved Statistics",
    "🔥 Daily Solving Streak",
    "📅 Monthly Progress",
    "🥧 Topic-wise Distribution",
    "🎯 Difficulty Breakdown",
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Analytics
        </h1>

        <p className="text-slate-500 mt-2">
          Analyze your competitive programming performance and monitor your growth.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border shadow-sm p-10">
        <div className="flex flex-col items-center text-center">

          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-5xl">
            📊
          </div>

          <h2 className="mt-6 text-3xl font-bold text-slate-800">
            Analytics Coming Soon
          </h2>

          <p className="mt-3 text-slate-500 max-w-xl">
            We're building a powerful analytics dashboard to help you track
            your competitive programming journey across Codeforces and
            LeetCode.
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

export default Analytics;