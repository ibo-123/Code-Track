import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Code2,
  Link2,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Trophy,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { useAuthOptional } from "../../context/AuthContext";
import { getLeetCodeStatus } from "../../services/leetcodeService";

const PROVIDERS = [
  {
    id: "codeforces",
    name: "Codeforces",
    icon: Code2,
    color: "blue",
    description: "Rating, contests, and full submission sync",
    getProfileUrl: (handle) => `https://codeforces.com/profile/${handle}`,
  },
  {
    id: "leetcode",
    name: "LeetCode",
    icon: Trophy,
    color: "amber",
    description: "Public profile + recent submissions (Phase 2)",
    getProfileUrl: (handle) => `https://leetcode.com/${handle}/`,
  },
];

const COLOR_MAP = {
  blue: {
    bg: "from-blue-500/10 to-blue-600/5 dark:from-blue-500/15",
    border: "border-blue-300/50 dark:border-blue-500/20",
    icon: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/15",
  },
  amber: {
    bg: "from-amber-500/10 to-amber-600/5 dark:from-amber-500/15",
    border: "border-amber-300/50 dark:border-amber-500/20",
    icon: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/15",
  },
};

function ConnectedAccounts({ className = "" }) {
  const navigate = useNavigate();
  const auth = useAuthOptional();
  const user = auth?.user;
  const [lc, setLc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getLeetCodeStatus()
      .then((data) => {
        if (!cancelled) setLc(data);
      })
      .catch(() => {
        if (!cancelled) setLc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.leetcodeUsername]);

  const accounts = {
    codeforces: user?.codeforcesHandle
      ? {
          handle: user.codeforcesHandle,
          meta:
            user.codeforcesRating != null
              ? `${user.codeforcesRating} · ${user.codeforcesRank || "unrated"}`
              : null,
        }
      : null,
    leetcode: lc?.connected
      ? {
          handle: lc.handle,
          meta:
            lc.profile?.solved?.all != null
              ? `${lc.profile.solved.all} solved · public recent import`
              : "Public profile connected",
          capability: lc.submissionImportCapability,
        }
      : user?.leetcodeUsername
        ? {
            handle: user.leetcodeUsername,
            meta: "Username saved — open Profile to connect",
          }
        : null,
  };

  return (
    <Card
      className={`overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 ${className}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Link2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Platforms
              </h3>
              <p className="text-xs text-slate-500">
                Codeforces + LeetCode integration
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
            <Shield className="w-3 h-3" />
            Secure
          </span>
        </div>

        <div className="space-y-3">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const scheme = COLOR_MAP[provider.color];
            const account = accounts[provider.id];
            const isConnected = !!account?.handle;

            return (
              <div
                key={provider.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r ${scheme.bg} border ${scheme.border}`}
              >
                <div className={`p-2 rounded-lg ${scheme.iconBg}`}>
                  <Icon className={`w-4 h-4 ${scheme.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {provider.name}
                    </p>
                    {isConnected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {isConnected
                      ? account.meta || account.handle
                      : provider.description}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isConnected && account.handle && (
                    <a
                      href={provider.getProfileUrl(account.handle)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5"
                      title="Open profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {isConnected ? "Manage" : "Connect"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {lc?.connected && (
          <p className="mt-3 text-[11px] text-amber-700 dark:text-amber-300/90">
            LeetCode import mode:{" "}
            <span className="font-semibold">
              {lc.submissionImportCapability || "public_recent_only"}
            </span>
            . Source code:{" "}
            <span className="font-semibold">
              {lc.sourceCodeCapability || "unsupported"}
            </span>
            .{" "}
            <button
              type="button"
              className="underline font-medium"
              onClick={() => navigate("/submissions?platform=leetcode")}
            >
              View submissions
            </button>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default ConnectedAccounts;
