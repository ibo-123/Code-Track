import {
  Trophy,
  BarChart3,
  Code2,
  CalendarDays,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Trophy,
    title: "Contest History",
    description:
      "Review every contest you've participated in with ranking, rating changes, and detailed statistics.",
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    icon: BarChart3,
    title: "Rating Analytics",
    description:
      "Visualize your rating progress through interactive charts and monitor your improvement over time.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Code2,
    title: "Problem Statistics",
    description:
      "Track solved problems, identify strengths, and discover which topics need more practice.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: CalendarDays,
    title: "Upcoming Contests",
    description:
      "Never miss a contest. View upcoming Codeforces contests with schedules and countdowns.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "Monitor your growth with daily, weekly, and monthly performance insights.",
    color: "bg-red-100 text-red-600",
  },
  {
    icon: ShieldCheck,
    title: "Secure Account",
    description:
      "Your account is protected with secure authentication while your competitive programming data stays safe.",
    color: "bg-indigo-100 text-indigo-600",
  },
];

function Features() {
  return (
    <section
      id="features"
      className="py-24 bg-slate-50"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center max-w-3xl mx-auto">

          <span className="text-blue-600 font-semibold uppercase tracking-wider">
            Features
          </span>

          <h2 className="text-4xl lg:text-5xl font-bold mt-4">
            Everything You Need
            <span className="text-blue-600"> to Improve</span>
          </h2>

          <p className="mt-6 text-lg text-slate-600 leading-8">
            CodeTrack provides powerful tools for tracking your
            competitive programming journey from beginner to expert.
          </p>

        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 mt-20">

          {features.map((feature) => {

            const Icon = feature.icon;

            return (

              <div
                key={feature.title}
                className="
                  group
                  bg-white
                  rounded-3xl
                  p-8
                  border
                  shadow-sm
                  hover:shadow-2xl
                  hover:-translate-y-2
                  transition-all
                  duration-300
                "
              >

                <div
                  className={`
                    w-16
                    h-16
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    ${feature.color}
                  `}
                >
                  <Icon size={32} />
                </div>

                <h3 className="mt-8 text-2xl font-bold">
                  {feature.title}
                </h3>

                <p className="mt-4 text-slate-600 leading-7">
                  {feature.description}
                </p>

                <div className="mt-8">

                  <button
                    className="
                      text-blue-600
                      font-semibold
                      group-hover:translate-x-2
                      transition
                    "
                  >
                    Learn More →
                  </button>

                </div>

              </div>

            );

          })}

        </div>

      </div>
    </section>
  );
}

export default Features;