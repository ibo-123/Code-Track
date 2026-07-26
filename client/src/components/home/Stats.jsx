import {
  Trophy,
  Code2,
  Users,
  BarChart3,
} from "lucide-react";

const stats = [
  {
    title: "Problems Solved",
    value: "500K+",
    icon: Code2,
    color: "text-blue-600",
  },
  {
    title: "Contests Tracked",
    value: "20K+",
    icon: Trophy,
    color: "text-yellow-500",
  },
  {
    title: "Active Users",
    value: "5K+",
    icon: Users,
    color: "text-green-600",
  },
  {
    title: "Performance Reports",
    value: "100K+",
    icon: BarChart3,
    color: "text-purple-600",
  },
];

function Stats() {
  return (
    <section className="py-20 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center">

          <h2 className="text-4xl font-bold">
            Trusted by Competitive Programmers
          </h2>

          <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
            CodeTrack helps programmers analyze their
            performance, monitor contests, and improve
            consistently through detailed insights.
          </p>

        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16">

          {stats.map((item) => {

            const Icon = item.icon;

            return (

              <div
                key={item.title}
                className="
                  bg-slate-50
                  rounded-2xl
                  p-8
                  text-center
                  border
                  hover:shadow-xl
                  hover:-translate-y-2
                  transition
                  duration-300
                "
              >

                <div className="flex justify-center">

                  <div className="w-16 h-16 rounded-full bg-white shadow flex items-center justify-center">

                    <Icon
                      className={item.color}
                      size={32}
                    />

                  </div>

                </div>

                <h3 className="text-4xl font-extrabold mt-6">

                  {item.value}

                </h3>

                <p className="text-slate-500 mt-3">

                  {item.title}

                </p>

              </div>

            );

          })}

        </div>

      </div>

    </section>
  );
}

export default Stats;