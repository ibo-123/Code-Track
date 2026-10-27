import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  BarChart3,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  Code2,
  Bell,
  Search,
  ChevronDown,
  Clock,
  ExternalLink,
  CheckCheck,
  FileCode2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import ThemeToggle from "../components/ui/ThemeToggle";
import { getUpcomingContests } from "../services/contestService";
import { getRatingColorClass } from "../lib/codeforces";
import { toast } from "sonner";

const NOTIF_SEEN_KEY = "codetrack-notif-seen";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: ["home", "overview", "stats"] },
  { name: "Profile", href: "/profile", icon: User, keywords: ["account", "codeforces", "leetcode", "avatar"] },
  { name: "Analytics", href: "/analytics", icon: BarChart3, keywords: ["charts", "heatmap", "performance"] },
  { name: "Contests", href: "/contests", icon: Trophy, keywords: ["competition", "upcoming", "rating"] },
  { name: "Submissions", href: "/submissions", icon: FileCode2, keywords: ["code", "leetcode", "verdict", "attempts"] },
  { name: "Settings", href: "/settings", icon: Settings, keywords: ["preferences", "password", "theme"] },
];

function formatRelativeTime(date) {
  if (!date) return "";
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  if (mins < 60) return diff >= 0 ? `in ${mins}m` : `${mins}m ago`;
  if (hours < 48) return diff >= 0 ? `in ${hours}h` : `${hours}h ago`;
  return diff >= 0 ? `in ${days}d` : `${days}d ago`;
}

function UserAvatar({ user, size = "md", className = "" }) {
  const [imgFailed, setImgFailed] = useState(false);
  const sizeClass =
    size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base";
  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();
  const src = user?.avatarUrl || "";

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={user?.name || "User"}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-purple-500/20 flex-shrink-0 ${className}`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
      style={{
        background: `linear-gradient(135deg, var(--accent-from), var(--accent-to))`,
      }}
    >
      {initial}
    </div>
  );
}

function DashboardLayout({ children }) {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [seenIds, setSeenIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(NOTIF_SEEN_KEY) || "[]"));
    } catch {
      return new Set();
    }
  });

  const searchInputRef = useRef(null);
  const searchPanelRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const displayName = user?.name?.trim() || "User";
  const displayEmail = user?.email?.trim() || "";

  // Keep profile fresh for sidebar/navbar
  useEffect(() => {
    refreshUser?.();
  }, [refreshUser]);

  // Build notifications from upcoming contests + account status
  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      const items = [];

      if (user?.codeforcesHandle) {
        items.push({
          id: `cf-connected-${user.codeforcesHandle}`,
          title: "Codeforces connected",
          message: `Tracking @${user.codeforcesHandle}${
            user.codeforcesRating ? ` · ${user.codeforcesRating} (${user.codeforcesRank || "unrated"})` : ""
          }`,
          time: "Account",
          href: "/profile",
          type: "account",
        });
      } else if (user) {
        items.push({
          id: "cf-connect-prompt",
          title: "Connect Codeforces",
          message: "Link your handle to sync rating, contests, and submissions.",
          time: "Action needed",
          href: "/profile",
          type: "action",
        });
      }

      try {
        const contests = await getUpcomingContests();
        const soon = (contests || [])
          .filter((c) => c.startTimeSeconds)
          .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
          .slice(0, 5);

        soon.forEach((c) => {
          const start = new Date(c.startTimeSeconds * 1000);
          items.push({
            id: `contest-${c.id}`,
            title: c.name,
            message: `Starts ${formatRelativeTime(start)}`,
            time: start.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            href: "/contests",
            type: "contest",
            external: `https://codeforces.com/contest/${c.id}`,
          });
        });
      } catch {
        // Contests optional — keep account notifications
      }

      if (!cancelled) setNotifications(items);
    };

    loadNotifications();
    const id = setInterval(loadNotifications, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user?.codeforcesHandle, user?.codeforcesRating, user?.codeforcesRank, user]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !seenIds.has(n.id)).length,
    [notifications, seenIds]
  );

  const persistSeen = (next) => {
    setSeenIds(next);
    localStorage.setItem(NOTIF_SEEN_KEY, JSON.stringify([...next]));
  };

  const markAllSeen = () => {
    const next = new Set(seenIds);
    notifications.forEach((n) => next.add(n.id));
    persistSeen(next);
  };

  const markSeen = (id) => {
    const next = new Set(seenIds);
    next.add(id);
    persistSeen(next);
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return NAV_ITEMS;
    return NAV_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q)) ||
        item.href.includes(q)
    );
  }, [searchQuery]);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
    setIsNotifOpen(false);
    setIsProfileMenuOpen(false);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const goTo = (href) => {
    navigate(href);
    closeSearch();
    setIsNotifOpen(false);
    setIsProfileMenuOpen(false);
    setIsSidebarOpen(false);
  };

  // ⌘K / Ctrl+K search shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isSearchOpen) closeSearch();
        else openSearch();
      }
      if (e.key === "Escape") {
        closeSearch();
        setIsNotifOpen(false);
        setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSearchOpen, openSearch]);

  // Click outside to close panels
  useEffect(() => {
    const onDown = (e) => {
      if (searchPanelRef.current && !searchPanelRef.current.contains(e.target)) {
        closeSearch();
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Failed to logout");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-40 transform transition-transform duration-300
          bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-800
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div
                className="p-2 rounded-xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, var(--accent-from), var(--accent-to))`,
                  boxShadow: `0 10px 24px rgb(var(--accent-rgb) / 0.3)`,
                }}
              >
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <span
                className="text-xl font-bold bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(90deg, var(--accent-from), var(--accent-to))`,
                }}
              >
                CodeTrack
              </span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? "font-medium"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: "var(--accent-bg)",
                          color: "var(--accent)",
                        }
                      : undefined
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {active && (
                    <div
                      className="ml-auto w-1.5 h-8 rounded-full"
                      style={{ backgroundColor: "var(--accent)" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Dynamic user card — CF rating when connected */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => goTo("/profile")}
              className="w-full flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <UserAvatar user={user} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {displayName}
                </p>
                {user?.codeforcesHandle ? (
                  <p className="text-xs truncate flex items-center gap-1.5">
                    <span className="text-slate-500 dark:text-slate-400">
                      @{user.codeforcesHandle}
                    </span>
                    {typeof user.codeforcesRating === "number" && (
                      <span
                        className={`cf-mono font-semibold ${getRatingColorClass(
                          user.codeforcesRating
                        )}`}
                      >
                        {user.codeforcesRating}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {displayEmail || "Connect Codeforces"}
                  </p>
                )}
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white hidden sm:block">
                {NAV_ITEMS.find((item) => isActive(item.href))?.name || "Dashboard"}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle
                variant="icon"
                className="!bg-slate-100 !border-slate-200 !text-slate-600 hover:!bg-slate-200 hover:!text-slate-900 dark:!bg-white/5 dark:!border-white/10 dark:!text-slate-300 dark:hover:!bg-white/10 dark:hover:!text-white"
              />

              {/* Search */}
              <div className="relative" ref={searchPanelRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openSearch}
                  className="rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  aria-label="Search (Ctrl+K)"
                  title="Search (Ctrl+K)"
                >
                  <Search className="w-5 h-5" />
                </Button>

                {isSearchOpen && (
                  <div className="absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-slate-800">
                      <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input
                        ref={searchInputRef}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && searchResults[0]) {
                            goTo(searchResults[0].href);
                          }
                        }}
                        placeholder="Search pages…"
                        className="flex-1 bg-transparent text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                      <kbd className="hidden sm:inline text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
                        Esc
                      </kbd>
                    </div>
                    <ul className="max-h-64 overflow-y-auto py-1">
                      {searchResults.length === 0 ? (
                        <li className="px-4 py-6 text-center text-sm text-slate-500">
                          No matches for “{searchQuery}”
                        </li>
                      ) : (
                        searchResults.map((item) => {
                          const Icon = item.icon;
                          return (
                            <li key={item.href}>
                              <button
                                type="button"
                                onClick={() => goTo(item.href)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Icon className="w-4 h-4 text-slate-400" />
                                <span className="flex-1 text-left">{item.name}</span>
                                {isActive(item.href) && (
                                  <span className="text-[10px] text-purple-500 font-medium">
                                    Current
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsNotifOpen((o) => !o);
                    setIsProfileMenuOpen(false);
                    closeSearch();
                  }}
                  className="rounded-lg relative text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[0.5rem] h-2 px-0.5 bg-red-500 rounded-full" />
                  )}
                </Button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllSeen}
                          className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const unread = !seenIds.has(n.id);
                          return (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => {
                                markSeen(n.id);
                                if (n.href) goTo(n.href);
                              }}
                              className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                                unread ? "bg-purple-50/60 dark:bg-purple-500/5" : ""
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span
                                  className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                    unread ? "bg-purple-500" : "bg-slate-300 dark:bg-slate-600"
                                  }`}
                                />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`text-sm truncate ${
                                      unread
                                        ? "font-semibold text-slate-900 dark:text-white"
                                        : "text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    {n.title}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                    {n.message}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {n.time}
                                  </p>
                                </div>
                                {n.external && (
                                  <a
                                    href={n.external}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 text-slate-400 hover:text-purple-500"
                                    title="Open on Codeforces"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => goTo("/contests")}
                      className="w-full px-4 py-2.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-t border-slate-200 dark:border-slate-800"
                    >
                      View contests
                    </button>
                  </div>
                )}
              </div>

              {/* Profile menu */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen((o) => !o);
                    setIsNotifOpen(false);
                    closeSearch();
                  }}
                  className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="User menu"
                >
                  <UserAvatar user={user} size="sm" />
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${
                      isProfileMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {displayEmail || "No email"}
                      </p>
                      {user?.codeforcesHandle && (
                        <p className="text-[11px] mt-1 truncate flex items-center gap-1.5">
                          <span className="text-orange-500">
                            CF · {user.codeforcesHandle}
                          </span>
                          {typeof user.codeforcesRating === "number" && (
                            <span
                              className={`cf-mono font-semibold ${getRatingColorClass(
                                user.codeforcesRating
                              )}`}
                            >
                              {user.codeforcesRating}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <hr className="my-1 border-slate-200 dark:border-slate-800" />
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>

      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default DashboardLayout;
