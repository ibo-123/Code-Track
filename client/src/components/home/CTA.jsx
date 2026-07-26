import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

function CTA() {
  return (
    <section className="relative overflow-hidden py-28">

      {/* Background */}

      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700" />

      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-6 text-center text-white">

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur mb-8">

          <Sparkles size={18} />

          <span>Start improving today</span>

        </div>

        <h2 className="text-4xl lg:text-6xl font-extrabold leading-tight">

          Take Your Competitive Programming
          <br />
          To The Next Level

        </h2>

        <p className="mt-8 text-lg lg:text-xl text-blue-100 max-w-3xl mx-auto leading-8">

          Connect your Codeforces account,
          visualize your rating growth,
          monitor contests,
          and become a stronger competitive programmer.

        </p>

        <div className="flex flex-wrap justify-center gap-5 mt-12">

          <Link
            to="/register"
            className="
              bg-white
              text-blue-700
              px-8
              py-4
              rounded-xl
              font-semibold
              flex
              items-center
              gap-2
              hover:scale-105
              transition
            "
          >

            Get Started Free

            <ArrowRight size={18} />

          </Link>

          <Link
            to="/login"
            className="
              border
              border-white/40
              bg-white/10
              backdrop-blur
              px-8
              py-4
              rounded-xl
              font-semibold
              hover:bg-white/20
              transition
            "
          >

            Login

          </Link>

        </div>

        {/* Highlights */}

        <div className="grid md:grid-cols-3 gap-8 mt-20">

          <div>

            <h3 className="text-4xl font-bold">
              100%
            </h3>

            <p className="text-blue-100 mt-2">

              Free Dashboard

            </p>

          </div>

          <div>

            <h3 className="text-4xl font-bold">

              Real-Time

            </h3>

            <p className="text-blue-100 mt-2">

              Rating Analytics

            </p>

          </div>

          <div>

            <h3 className="text-4xl font-bold">

              Secure

            </h3>

            <p className="text-blue-100 mt-2">

              Authentication

            </p>

          </div>

        </div>

      </div>

    </section>
  );
}

export default CTA;