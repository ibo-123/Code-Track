import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Code2,
  Shield,
  Fingerprint,
  Loader2,
  BarChart3,
  Trophy,
  Flame,
} from "lucide-react";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import ThemeToggle from "../components/ui/ThemeToggle";

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL || "";
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || "";
const HAS_DEMO = Boolean(DEMO_EMAIL && DEMO_PASSWORD);

const REMEMBER_EMAIL_KEY = "rememberedEmail";
const LAST_NAME_KEY = "lastLoginName";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, saveToken, isAuthenticated, loading: authLoading } = useAuth();

  const redirectTo = location.state?.from?.pathname || "/dashboard";
  const flashMessage = location.state?.message || "";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [touched, setTouched] = useState({});
  const [lastName, setLastName] = useState("");

  // Restore remembered email + greeting name
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    const savedName = localStorage.getItem(LAST_NAME_KEY);
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
    if (savedName) setLastName(savedName);
    if (flashMessage) {
      toast.info(flashMessage);
    }
  }, [flashMessage]);

  // Already signed in → leave login
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, redirectTo]);

  const greeting = useMemo(() => {
    if (lastName) return `Welcome back, ${lastName}`;
    return "Welcome back";
  }, [lastName]);

  const emailValid = useMemo(() => {
    if (!form.email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  }, [form.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    if (name === "email") setEmailError("");
    if (name === "password") setPasswordError("");
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (name === "email" && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setEmailError("Please enter a valid email address");
      }
    }
  };

  const validate = () => {
    const errors = {};
    if (!form.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!form.password) {
      errors.password = "Password is required";
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setTouched({ email: true, password: true });
    const { isValid, errors } = validate();
    if (!isValid) {
      setEmailError(errors.email || "");
      setPasswordError(errors.password || "");
      toast.error("Please fix the errors before continuing");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (typeof login === "function") {
        login(data.token, data.user);
      } else {
        saveToken(data.token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      }

      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, form.email.trim().toLowerCase());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      const name = data.user?.name;
      if (name) localStorage.setItem(LAST_NAME_KEY, name);

      toast.success(
        name ? `Welcome back, ${name.split(" ")[0]}!` : "Welcome back!"
      );
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const message =
        err.response?.data?.message ||
        (status === 500
          ? "Server error. Please try again later."
          : "Login failed. Please try again.");

      // Unverified → send to OTP with email prefilled
      if (status === 403 && /verify/i.test(message)) {
        toast.info("Verify your email to continue");
        navigate("/verify-email", {
          state: { email: form.email.trim().toLowerCase() },
          replace: true,
        });
        return;
      }

      setError(message);
      toast.error(message);
      setForm((prev) => ({ ...prev, password: "" }));
      setPasswordError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    if (!HAS_DEMO) {
      toast.message("No demo account configured", {
        description: "Create an account to start tracking contests and rating.",
      });
      return;
    }
    setForm({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    setTouched({ email: true, password: true });
    setEmailError("");
    setPasswordError("");
    setError("");
    toast.info("Demo credentials loaded — hit Sign in");
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast.message("Password reset coming soon", {
      description:
        "For now, register a new account or contact support if you're locked out.",
      action: {
        label: "Register",
        onClick: () => navigate("/register"),
      },
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10 overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.25]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(148 163 184 / 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(148 163 184 / 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[320px] rounded-full blur-3xl opacity-40 dark:opacity-30"
        style={{
          background: `radial-gradient(ellipse, rgb(var(--accent-rgb) / 0.35), transparent 70%)`,
        }}
      />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:opacity-80 transition-opacity"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{ background: "var(--accent)" }}
          >
            <Code2 className="w-4 h-4" />
          </span>
          <span className="tracking-tight">
            Code<span style={{ color: "var(--accent)" }}>Track</span>
          </span>
        </Link>
        <ThemeToggle variant="icon" />
      </div>

      <div className="relative w-full max-w-md z-10">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-900/5 dark:shadow-black/40 p-8">
          {/* Header */}
          <div className="text-center mb-7">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #0f172a))`,
                boxShadow: `0 12px 28px rgb(var(--accent-rgb) / 0.35)`,
              }}
            >
              <LogIn className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {greeting}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Sign in to track rating, contests, and streaks
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex gap-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Login failed
                </p>
                <p className="text-xs text-red-600/90 dark:text-red-400 mt-0.5">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Demo — only when env is set */}
          {HAS_DEMO ? (
            <button
              type="button"
              onClick={fillDemoCredentials}
              disabled={loading}
              className="mb-5 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:border-[var(--accent)]/40 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <span>Use demo credentials</span>
              <ArrowRight className="w-4 h-4 opacity-60" />
            </button>
          ) : (
            <div className="mb-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-3 py-2.5 text-center text-xs text-slate-500 dark:text-slate-400">
              New here?{" "}
              <Link
                to="/register"
                className="font-medium hover:underline"
                style={{ color: "var(--accent)" }}
              >
                Create an account
              </Link>{" "}
              to sync Codeforces
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <Input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                  disabled={loading}
                  autoFocus
                  className={`pl-10 h-11 bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 ${
                    touched.email && emailError
                      ? "border-red-400 focus-visible:ring-red-400/30"
                      : touched.email && emailValid
                        ? "border-emerald-400 focus-visible:ring-emerald-400/30"
                        : ""
                  }`}
                />
                {touched.email && emailValid && !emailError && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-emerald-500" />
                )}
              </div>
              {touched.email && emailError && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="w-3 h-3" />
                  {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                  className={`pl-10 pr-11 h-11 bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 ${
                    touched.password && passwordError
                      ? "border-red-400 focus-visible:ring-red-400/30"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
              {touched.password && passwordError && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="w-3 h-3" />
                  {passwordError}
                </p>
              )}
            </div>

            {/* Remember */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 accent-[var(--accent)]"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Remember me
                </span>
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <Shield className="w-3 h-3" />
                JWT secured
              </span>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-white shadow-md disabled:opacity-50"
              style={{
                background: "var(--accent)",
                boxShadow: `0 8px 20px rgb(var(--accent-rgb) / 0.35)`,
              }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* After login — what you get (replaces dead social buttons) */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="mb-3 text-center text-[11px] uppercase tracking-wider text-slate-400">
              After you sign in
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: BarChart3, label: "Analytics" },
                { icon: Trophy, label: "Contests" },
                { icon: Flame, label: "Streaks" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-2 py-2.5 text-center"
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: "var(--accent)" }}
                  />
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold hover:underline"
              style={{ color: "var(--accent)" }}
            >
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Shield className="w-3 h-3" />
          Credentials stay on your device &amp; our API — never shared
        </p>
      </div>
    </div>
  );
}

export default Login;
