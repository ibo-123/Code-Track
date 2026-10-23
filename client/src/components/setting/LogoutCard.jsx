import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  AlertTriangle,
  Shield,
  Clock,
  User,
  Settings,
  HelpCircle,
  Loader2,
  CheckCircle,
  UserX,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useAuthOptional } from "../../context/AuthContext";

function LogoutCard({
  user: userProp,
  onLogout,
  className = "",
}) {
  const navigate = useNavigate();
  // Prefer props from Settings; fall back to auth context when available.
  // useAuthOptional avoids hard crashes during Vite HMR context remounts.
  const auth = useAuthOptional();
  const user = userProp || auth?.user || {};
  const logout = onLogout || auth?.logout;

  const [showDialog, setShowDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionTime, setSessionTime] = useState(() =>
    new Date().toLocaleString()
  );

  useEffect(() => {
    const tick = () => setSessionTime(new Date().toLocaleString());
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const displayName = user.name || "User";
  const displayEmail = user.email || "";
  const role = user.role || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (typeof logout === "function") {
        await logout();
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      toast.success("Logged out successfully", {
        icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      });
      setShowDialog(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <div
        className={`p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Account
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Sign out of your account
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>

        {/* User */}
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-100 dark:border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {displayEmail || "No email"}
              </p>
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] font-medium rounded-full capitalize">
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* Session */}
        <div className="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
          <Shield className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              You’re currently signed in
            </p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last active: {sessionTime}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            You will be redirected to the login page after signing out.
          </p>
        </div>

        {/* Sign out */}
        <Button
          variant="destructive"
          onClick={() => setShowDialog(true)}
          disabled={isLoggingOut}
          className="w-full h-11 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-xl gap-2"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing Out…
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5" />
              Sign Out
            </>
          )}
        </Button>

        {/* Quick links */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="p-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <UserX className="w-3.5 h-3.5" />
            Switch Account
          </button>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="p-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            Security
          </button>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="p-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </button>
          <button
            type="button"
            onClick={() =>
              toast.info("Help", {
                description: "Visit Profile → connect Codeforces, or open Contests for upcoming rounds.",
              })
            }
            className="p-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Help
          </button>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Confirm Sign Out
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Are you sure you want to sign out? You’ll need to sign in again to
              access your dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Security notice
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Your session will end immediately. Unsaved work may be lost.
              </p>
              {displayEmail && (
                <p className="mt-2 text-xs text-red-600/90 dark:text-red-400">
                  Account: <span className="font-medium">{displayEmail}</span>
                </p>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5" />
              This action cannot be undone
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isLoggingOut}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing Out…
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Confirm Sign Out
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default LogoutCard;
