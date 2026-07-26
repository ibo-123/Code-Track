import { Link } from "react-router-dom";
import { ArrowRight, Trophy, Code2, BarChart3 } from "lucide-react";

function Hero() {
  return (
    <section className="relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 -z-10">

        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="absolute bottom-10 right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />

      </div>

      <div className="max-w-7xl mx-auto px-6 py-24">

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}

          <div>

            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-medium">

              <Trophy size={18} />

              Competitive Programming Dashboard

            </div>

            <h1 className="mt-8 text-5xl lg:text-6xl font-extrabold leading-tight">

              Track Your

              <span className="block text-blue-600">

                Coding Journey

              </span>

            </h1>

            <p className="mt-8 text-lg text-slate-600 leading-8">

              Connect your Codeforces account, analyze your contests,
              monitor rating progress, discover strengths and weaknesses,
              and become a better competitive programmer.

            </p>

            <div className="mt-10 flex flex-wrap gap-4">

              <Link
                to="/register"
                className="
                  bg-blue-600
                  text-white
                  px-7
                  py-4
                  rounded-xl
                  flex
                  items-center
                  gap-2
                  hover:bg-blue-700
                  transition
                "
              >
                Get Started

                <ArrowRight size={18} />

              </Link>

              <Link
                to="/login"
                className="
                  border
                  px-7
                  py-4
                  rounded-xl
                  hover:bg-slate-100
                  transition
                "
              >
                Login
              </Link>

            </div>

          </div>

          {/* Right */}

          <div className="relative">

            {/* Main Dashboard Card */}

            <div className="bg-white rounded-3xl shadow-2xl border p-8">

              <div className="flex justify-between items-center mb-8">

                <h2 className="font-bold text-xl">
                  Dashboard Overview
                </h2>

                <span className="text-green-600 font-semibold">
                  ● Online
                </span>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div className="bg-blue-50 rounded-xl p-5">

                  <Code2
                    className="text-blue-600"
                    size={32}
                  />

                  <p className="mt-3 text-slate-500">
                    Problems
                  </p>

                  <h3 className="text-3xl font-bold">
                    1280
                  </h3>

                </div>

                <div className="bg-yellow-50 rounded-xl p-5">

                  <Trophy
                    className="text-yellow-500"
                    size={32}
                  />

                  <p className="mt-3 text-slate-500">
                    Rating
                  </p>

                  <h3 className="text-3xl font-bold">
                    1825
                  </h3>

                </div>

              </div>

              <div className="mt-6 h-40 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">

                <BarChart3
                  size={90}
                  className="text-white opacity-90"
                />

              </div>

            </div>

            {/* Floating Card */}

            <div className="absolute -left-8 top-20 bg-white shadow-lg rounded-xl p-4 hidden lg:block">

              <p className="text-slate-500 text-sm">
                Today's Goal
              </p>

              <h3 className="font-bold text-xl">
                Solve 5 Problems
              </h3>

            </div>

            {/* Floating Card */}

            <div className="absolute -right-8 bottom-10 bg-white shadow-lg rounded-xl p-4 hidden lg:block">

              <p className="text-slate-500 text-sm">
                Rating Change
              </p>

              <h3 className="font-bold text-green-600 text-xl">
                +97
              </h3>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;