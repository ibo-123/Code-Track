import { Link } from "react-router-dom";
import { Code2 } from "lucide-react";

function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link
          to="/"
          className="flex items-center gap-2"
        >
          <Code2
            className="text-blue-600"
            size={32}
          />

          <span className="font-bold text-2xl">
            CodeTrack
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">

          <a href="#features">Features</a>

          <a href="#dashboard">Dashboard</a>

          <a href="#faq">FAQ</a>

        </nav>

        <div className="flex items-center gap-3">

          <Link
            to="/login"
            className="px-5 py-2 rounded-lg border"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Get Started
          </Link>

        </div>

      </div>

    </header>
  );
}

export default Navbar;