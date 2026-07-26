import {
  UserPlus,
  Link2,
  BarChart3,
  Trophy,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description:
      "Sign up in seconds using your email address and access your personal dashboard.",
    icon: UserPlus,
    color: "bg-blue-100 text-blue-600",
  },
  {
    number: "02",
    title: "Connect Codeforces",
    description:
      "Link your Codeforces handle to automatically import your contests, ratings, and submissions.",
    icon: Link2,
    color: "bg-purple-100 text-purple-600",
  },
  {
    number: "03",
    title: "Analyze Performance",
    description:
      "Explore detailed charts, rating history, solved problems, and topic-wise insights.",
    icon: BarChart3,
    color: "bg-green-100 text-green-600",
  },
  {
    number: "04",
    title: "Improve Every Contest",
    description:
      "Use personalized statistics and progress tracking to steadily increase your rating.",
    icon: Trophy,
    color: "bg-yellow-100 text-yellow-600",
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 bg-slate-50"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center max-w-3xl mx-auto">

          <span className="text-blue-600 font-semibold uppercase tracking-wider">
            How It Works
          </span>

          <h2 className="text-4xl lg:text-5xl font-bold mt-4">
            Get Started in
            <span className="text-blue-600">
              {" "}Four Simple Steps
            </span>
          </h2>

          <p className="mt-6 text-lg text-slate-600">
            From registration to detailed analytics, everything
            is designed to be simple and automatic.
          </p>

        </div>

        <div className="mt-20 grid lg:grid-cols-4 gap-8">

          {steps.map((step, index) => {

            const Icon = step.icon;

            return (

              <div
                key={step.number}
                className="relative"
              >

                <div className="bg-white rounded-3xl p-8 shadow-sm border h-full hover:shadow-xl transition">

                  <span className="text-sm font-bold text-blue-600">
                    STEP {step.number}
                  </span>

                  <div
                    className={`
                      w-16
                      h-16
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      mt-6
                      ${step.color}
                    `}
                  >
                    <Icon size={30} />
                  </div>

                  <h3 className="text-2xl font-bold mt-8">
                    {step.title}
                  </h3>

                  <p className="text-slate-600 mt-4 leading-7">
                    {step.description}
                  </p>

                </div>

                {index !== steps.length - 1 && (
                  <ArrowRight
                    className="
                      hidden
                      lg:block
                      absolute
                      -right-6
                      top-1/2
                      text-slate-300
                    "
                    size={28}
                  />
                )}

              </div>

            );

          })}

        </div>

      </div>
    </section>
  );
}

export default HowItWorks;