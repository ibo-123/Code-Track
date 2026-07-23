import {
  LayoutDashboard,
  User,
  Trophy,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: User,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: BarChart3,
    },
    {
      name: "Contests",
      path: "/contests",
      icon: Trophy,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside
      className="
        w-64
        bg-slate-900
        text-white
        min-h-screen
        p-5
        hidden
        md:flex
        flex-col
      "
    >
      {/* Logo */}
      <h1 className="text-2xl font-bold mb-10">
        CodeTrack
      </h1>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `
                flex items-center gap-3
                px-4 py-3
                rounded-lg
                transition-all
                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-800 text-slate-300"
                }
                `
              }
            >
              <Icon size={20} />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="
          flex
          items-center
          gap-3
          mt-8
          px-4
          py-3
          rounded-lg
          bg-red-500
          hover:bg-red-600
          transition-all
          w-full
        "
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;