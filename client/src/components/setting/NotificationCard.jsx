import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Mail,
  Trophy,
  Check,
  Settings2,
  Volume2,
  BellOff,
  BellRing,
  Loader2,
  Clock,
  Search,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { toast } from "sonner";

const STORAGE_KEY = "codetrack-notification-prefs";

const GROUPS = [
  {
    title: "Channels",
    icon: Mail,
    items: [
      {
        key: "email",
        label: "Email Notifications",
        description: "Digest of contests and progress",
      },
      {
        key: "push",
        label: "In-app Alerts",
        description: "Bell notifications in the dashboard",
      },
      {
        key: "sound",
        label: "Sound Alerts",
        description: "Play a sound for important events",
      },
    ],
  },
  {
    title: "Competitive Programming",
    icon: Trophy,
    items: [
      {
        key: "contests",
        label: "Upcoming Contests",
        description: "Reminders before Codeforces contests start",
      },
      {
        key: "rating",
        label: "Rating Changes",
        description: "Notify when your rating updates after a contest",
      },
      {
        key: "streak",
        label: "Streak Reminders",
        description: "Nudge you to keep your solving streak",
      },
    ],
  },
  {
    title: "Account",
    icon: Settings2,
    items: [
      {
        key: "security",
        label: "Security Alerts",
        description: "Login and password change notices",
      },
      {
        key: "marketing",
        label: "Product Updates",
        description: "New CodeTrack features and tips",
      },
    ],
  },
];

const DEFAULT_PREFS = {
  email: true,
  push: true,
  sound: false,
  contests: true,
  rating: true,
  streak: true,
  security: true,
  marketing: false,
};

const readPrefs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

function NotificationCard({ className = "" }) {
  const [preferences, setPreferences] = useState(readPrefs);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(() => new Date());
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const allKeys = Object.keys(preferences);
  const activeCount = Object.values(preferences).filter(Boolean).length;
  const inactiveCount = allKeys.length - activeCount;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return GROUPS.map((group) => {
      const items = group.items.filter((item) => {
        if (preferences[item.key] === undefined) return false;
        if (activeTab === "active" && !preferences[item.key]) return false;
        if (activeTab === "inactive" && preferences[item.key]) return false;
        if (!q) return true;
        return (
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          group.title.toLowerCase().includes(q)
        );
      });
      return { ...group, items };
    }).filter((g) => g.items.length > 0);
  }, [preferences, activeTab, searchQuery]);

  const updatePref = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 350));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setLastSaved(new Date());
      setDirty(false);
      toast.success("Notification preferences saved");
    } finally {
      setSaving(false);
    }
  };

  const enableAll = () => {
    const next = allKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setPreferences(next);
    setDirty(true);
    toast.success("All notifications enabled");
  };

  const disableAll = () => {
    const next = allKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {});
    setPreferences(next);
    setDirty(true);
    toast.success("All notifications disabled");
  };

  const resetDefaults = () => {
    setPreferences({ ...DEFAULT_PREFS });
    setDirty(true);
    toast.info("Reset to recommended defaults");
  };

  const testNotification = () => {
    if (!preferences.push) {
      toast.error("Enable In-app Alerts first");
      return;
    }
    toast.message("Test alert", {
      description: preferences.contests
        ? "Upcoming contest reminder would look like this."
        : "This is how CodeTrack notifications appear.",
      icon: <BellRing className="w-4 h-4 text-emerald-500" />,
    });
    if (preferences.sound) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.05;
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } catch {
        // Audio optional
      }
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Notifications
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Control how you receive updates
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            activeCount > inactiveCount
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }`}
        >
          {activeCount} active
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notifications…"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-center border border-blue-100 dark:border-blue-500/20">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {activeCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center border border-slate-100 dark:border-slate-700">
          <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">
            {inactiveCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Inactive</p>
        </div>
        <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-center border border-violet-100 dark:border-violet-500/20">
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {allKeys.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { id: "all", label: `All (${allKeys.length})` },
          { id: "active", label: `Active (${activeCount})` },
          { id: "inactive", label: `Inactive (${inactiveCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Groups */}
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <BellOff className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No notifications found</p>
          </div>
        ) : (
          filtered.map((group) => {
            const Icon = group.icon;
            const groupActive = group.items.filter(
              (i) => preferences[i.key]
            ).length;
            return (
              <div
                key={group.title}
                className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {group.title}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {groupActive}/{group.items.length} on
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.items.map((item) => (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between gap-3 p-3 ${
                        preferences[item.key]
                          ? "bg-emerald-50/40 dark:bg-emerald-500/5"
                          : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.description}
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(preferences[item.key])}
                        onCheckedChange={(checked) =>
                          updatePref(item.key, checked)
                        }
                        className="data-[state=checked]:bg-emerald-500 flex-shrink-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Advanced */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((o) => !o)}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          {showAdvanced ? "▼" : "▶"} Advanced options
        </button>
        {showAdvanced && (
          <div className="mt-2 grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={enableAll}
              className="p-2 text-xs rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:opacity-90"
            >
              Enable all
            </button>
            <button
              type="button"
              onClick={disableAll}
              className="p-2 text-xs rounded-lg bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 hover:opacity-90"
            >
              Disable all
            </button>
            <button
              type="button"
              onClick={resetDefaults}
              className="p-2 text-xs rounded-lg bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:opacity-90 col-span-2"
            >
              Reset to defaults
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
        <Button
          onClick={handleSave}
          disabled={saving || !dirty}
          size="sm"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Preferences
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={enableAll}
          className="gap-1"
        >
          <BellRing className="w-3.5 h-3.5" />
          Enable All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={disableAll}
          className="gap-1"
        >
          <BellOff className="w-3.5 h-3.5" />
          Disable All
        </Button>
        <Button
          size="sm"
          onClick={testNotification}
          className="ml-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white gap-2"
        >
          <Volume2 className="w-3.5 h-3.5" />
          Test
        </Button>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
        <Clock className="w-3 h-3" />
        <span>Last saved: {lastSaved.toLocaleString()}</span>
        {dirty && (
          <span className="text-amber-500 font-medium">· Unsaved changes</span>
        )}
      </div>
    </div>
  );
}

export default NotificationCard;
