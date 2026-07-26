import {
  Code2,
  Trophy,
  Flame,
  TrendingUp,
  CalendarDays,
} from "lucide-react";

function DashboardPreview() {
  return (
    <section
      id="dashboard"
      className="py-24 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}

        <div className="text-center max-w-3xl mx-auto">

          <span className="text-blue-600 font-semibold uppercase tracking-wider">
            Dashboard
          </span>

          <h2 className="text-4xl lg:text-5xl font-bold mt-4">
            Everything In
            <span className="text-blue-600">
              {" "}One Dashboard
            </span>
          </h2>

          <p className="mt-6 text-lg text-slate-600">
            Track ratings, contests, solved problems,
            upcoming competitions, and performance
            trends from one beautiful interface.
          </p>

        </div>

        {/* Browser Window */}

        <div className="mt-20 rounded-3xl shadow-2xl border overflow-hidden">

          {/* Browser Header */}

          <div className="bg-slate-900 px-6 py-4 flex items-center gap-2">

            <div className="w-3 h-3 rounded-full bg-red-500" />

            <div className="w-3 h-3 rounded-full bg-yellow-500" />

            <div className="w-3 h-3 rounded-full bg-green-500" />

            <div className="ml-6 bg-slate-700 rounded-full px-4 py-1 text-slate-300 text-sm">
              codetrack.app/dashboard
            </div>

          </div>

          <div className="bg-slate-50 p-8">

            {/* Welcome */}

            <div className="mb-8">

              <h3 className="text-3xl font-bold">
                Welcome Back, Ibrahim 👋
              </h3>

              <p className="text-slate-500 mt-2">
                Here's your latest programming progress.
              </p>

            </div>

            {/* Stat Cards */}

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

              <div className="bg-white rounded-2xl p-6 shadow-sm border">

                <Code2
                  className="text-blue-600"
                  size={30}
                />

                <p className="mt-4 text-slate-500">
                  Problems Solved
                </p>

                <h3 className="text-3xl font-bold">
                  1280
                </h3>

              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border">

                <Trophy
                  className="text-yellow-500"
                  size={30}
                />

                <p className="mt-4 text-slate-500">
                  Rating
                </p>

                <h3 className="text-3xl font-bold">
                  1825
                </h3>

              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border">

                <Flame
                  className="text-red-500"
                  size={30}
                />

                <p className="mt-4 text-slate-500">
                  Contribution
                </p>

                <h3 className="text-3xl font-bold">
                  +154
                </h3>

              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border">

                <TrendingUp
                  className="text-green-600"
                  size={30}
                />

                <p className="mt-4 text-slate-500">
                  Max Rating
                </p>

                <h3 className="text-3xl font-bold">
                  1910
                </h3>

              </div>

            </div>

            {/* Bottom */}

            <div className="grid lg:grid-cols-3 gap-8 mt-10">

              {/* Fake Chart */}

              <div className="lg:col-span-2 bg-white rounded-2xl border p-6">

                <h4 className="font-bold text-xl mb-6">
                  Rating Progress
                </h4>

                <div className="h-64 relative">

                  <svg
                    viewBox="0 0 600 250"
                    className="w-full h-full"
                  >
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="5"
                      points="
                      20,220
                      100,180
                      180,160
                      260,140
                      340,120
                      420,90
                      500,70
                      580,45
                    "
                    />

                    <line
                      x1="20"
                      y1="220"
                      x2="580"
                      y2="220"
                      stroke="#cbd5e1"
                    />

                    <line
                      x1="20"
                      y1="20"
                      x2="20"
                      y2="220"
                      stroke="#cbd5e1"
                    />

                  </svg>

                </div>

              </div>

              {/* Recent Contests */}

              <div className="bg-white rounded-2xl border p-6">

                <div className="flex items-center gap-2 mb-6">

                  <CalendarDays
                    className="text-blue-600"
                  />

                  <h4 className="font-bold">
                    Recent Contests
                  </h4>

                </div>

                <div className="space-y-5">

                  <div className="border-b pb-4">

                    <p className="font-semibold">
                      Codeforces Round #1052
                    </p>

                    <span className="text-green-600">
                      +85 Rating
                    </span>

                  </div>

                  <div className="border-b pb-4">

                    <p className="font-semibold">
                      Educational Round #181
                    </p>

                    <span className="text-green-600">
                      +32 Rating
                    </span>

                  </div>

                  <div>

                    <p className="font-semibold">
                      CodeTON Round 11
                    </p>

                    <span className="text-red-600">
                      -18 Rating
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default DashboardPreview;