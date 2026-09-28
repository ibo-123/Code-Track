import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  AlertTriangle,
  Shield,
  XCircle,
  CheckCircle,
  Loader2,
  User,
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

function LogoutCard({
  user,
  onLogout,
  title = "Sign out",
  subtitle = "End your current CodeTrack session",
  buttonText = "Sign Out",
  className = "",
}) {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      if (onLogout) {
        await onLogout();
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      setShowDialog(false);
      toast.success("Logged out successfully", {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      });
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
        className={`p-6 bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        {(displayName || displayEmail) && (
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-sm font-semibold text-slate-800">{displayName}</p>
            {displayEmail && (
              <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
            )}
          </div>
        )}

        <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200/50">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            You will need to sign in again to access your dashboard.
          </p>
        </div>

        <Button
          variant="destructive"
          onClick={() => setShowDialog(true)}
          disabled={isLoggingOut}
          className="w-full h-12 gap-2"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing Out...
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5" />
              {buttonText}
            </>
          )}
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirm Sign Out
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out of CodeTrack?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
              <Shield className="w-4 h-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">
                Your session will end immediately.
                {displayEmail ? ` Signed in as ${displayEmail}.` : ""}
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isLoggingOut}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing Out...
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
