import {
  Mail,
  Code2,
} from "lucide-react";

import {
  FaGithub,
  FaLinkedin,
} from "react-icons/fa";
// FaGithub
function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300">

      <div className="max-w-7xl mx-auto px-6 py-20">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Logo */}

          <div>

            <div className="flex items-center gap-3">

              <div className="
                w-12
                h-12
                rounded-xl
                bg-blue-600
                flex
                items-center
                justify-center
              ">

                <Code2
                  className="text-white"
                  size={26}
                />

              </div>

              <div>

                <h2 className="text-2xl font-bold text-white">
                  CodeTrack
                </h2>

                <p className="text-sm text-slate-400">
                  Competitive Programming Tracker
                </p>

              </div>

            </div>

            <p className="mt-6 leading-7 text-slate-400">

              CodeTrack helps competitive programmers
              monitor Codeforces ratings, contest
              history, solved problems, and overall
              performance through a modern dashboard.

            </p>

          </div>

          {/* Quick Links */}

          <div>

            <h3 className="text-lg font-semibold text-white mb-6">
              Quick Links
            </h3>

            <ul className="space-y-4">

              <li>
                <a
                  href="#"
                  className="hover:text-blue-400 transition"
                >
                  Home
                </a>
              </li>

              <li>
                <a
                  href="#features"
                  className="hover:text-blue-400 transition"
                >
                  Features
                </a>
              </li>

              <li>
                <a
                  href="#dashboard"
                  className="hover:text-blue-400 transition"
                >
                  Dashboard
                </a>
              </li>

              <li>
                <a
                  href="#faq"
                  className="hover:text-blue-400 transition"
                >
                  FAQ
                </a>
              </li>

            </ul>

          </div>

          {/* Features */}

          <div>

            <h3 className="text-lg font-semibold text-white mb-6">
              Features
            </h3>

            <ul className="space-y-4">

              <li>Codeforces Integration</li>

              <li>Rating Analytics</li>

              <li>Contest History</li>

              <li>Upcoming Contests</li>

              <li>Performance Dashboard</li>

            </ul>

          </div>

          {/* Contact */}

          <div>

            <h3 className="text-lg font-semibold text-white mb-6">
              Contact
            </h3>

            <div className="space-y-5">

              <a
                href="mailto:contact@codetrack.dev"
                className="
                  flex
                  items-center
                  gap-3
                  hover:text-blue-400
                  transition
                "
              >

                <Mail size={20} />

                contact@codetrack.dev

              </a>

              <a
                href="https://Github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex
                  items-center
                  gap-3
                  hover:text-blue-400
                  transition
                "
              >

                <FaGithub size={20} />

                Github

              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex
                  items-center
                  gap-3
                  hover:text-blue-400
                  transition
                "
              >

                <FaLinkedin size={20} />

                LinkedIn

              </a>

            </div>

          </div>

        </div>

        {/* Divider */}

        <div className="border-t border-slate-800 mt-16 pt-8">

          <div className="
            flex
            flex-col
            md:flex-row
            justify-between
            items-center
            gap-4
          ">

            <p className="text-slate-500">

              © {year} CodeTrack.
              All rights reserved.

            </p>

            <p className="text-slate-500">

              Made with ❤️ for Competitive Programmers

            </p>

          </div>

        </div>

      </div>

    </footer>
  );
}

export default Footer;