import { useEffect, useState, useCallback } from "react";
import {
  User,
  Mail,
  MapPin,
  Code2,
  Trophy,
  Save,
  Edit2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  BadgeCheck,
  Link2,
  Unlink,
  Calendar,
  Shield,
  Lock,
  X,
  Globe,
  GitBranch,
  RefreshCw,
} from "lucide-react";
import { connectCodeforces } from "../services/codeforcesService";
import {
  getProfile,
  updateProfile,
  getAvatarUrl,
} from "../services/userService";
import {
  connectLeetCode,
  disconnectLeetCode,
  getLeetCodeStatus,
  syncLeetCodeProfile,
  syncLeetCodeSubmissions,
  waitForSyncJob,
} from "../services/leetcodeService";
import { useAuth } from "../context/AuthContext";
import { getRatingColorClass } from "../lib/codeforces";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

function Profile({
  userId,
  onProfileUpdate,
  onConnectCodeforces,
  onDisconnectCodeforces,
  readOnly = false,
  showStats = true,
  showSocialLinks = true,
  className = "",
}) {
  const { updateUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    avatar: "",
    codeforcesHandle: "",
    leetcodeUsername: "",
    bio: "",
    location: "",
    website: "",
    github: "",
    twitter: "",
    joinedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [cfStatus, setCfStatus] = useState(null);
  const [cfData, setCfData] = useState(null);
  const [lcStatus, setLcStatus] = useState(null);
  const [lcBusy, setLcBusy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("profile");
  const [imgFailed, setImgFailed] = useState(false);

  const loadLeetCodeStatus = useCallback(async () => {
    try {
      const data = await getLeetCodeStatus();
      setLcStatus(data);
      if (data?.handle) {
        setForm((prev) => ({
          ...prev,
          leetcodeUsername: data.handle,
        }));
      }
    } catch {
      setLcStatus(null);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getProfile(userId);
      const user = data.user || data;
      const avatarUrl = getAvatarUrl(
        user.avatar || user.avater || user.codeforcesAvatar || ""
      );

      setForm({
        name: user.name || "",
        email: user.email || "",
        avatar: avatarUrl,
        codeforcesHandle: user.codeforcesHandle || "",
        leetcodeUsername: user.leetcodeUsername || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        github: user.github || "",
        twitter: user.twitter || "",
        joinedAt: user.joinedAt || user.createdAt || null,
      });
      setImgFailed(false);

      if (user.codeforcesHandle) {
        setCfStatus("connected");
        setCfData({
          handle: user.codeforcesHandle,
          rating: user.codeforcesRating,
          maxRating: user.codeforcesMaxRating,
          rank: user.codeforcesRank,
          maxRank: user.codeforcesMaxRank,
        });
      } else {
        setCfStatus("disconnected");
        setCfData(null);
      }

      updateUser?.(user);
    } catch (error) {
      console.error("[PROFILE] Profile load error:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userId, updateUser]);

  useEffect(() => {
    loadProfile();
    loadLeetCodeStatus();
  }, [loadProfile, loadLeetCodeStatus]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    else if (form.name.trim().length < 2)
      next.name = "Name must be at least 2 characters";
    else if (form.name.trim().length > 50)
      next.name = "Name must be less than 50 characters";
    if (form.website && !/^https?:\/\/.+/.test(form.website))
      next.website = "Please enter a valid URL (https://…)";
    if (form.bio && form.bio.length > 500)
      next.bio = "Bio must be 500 characters or less";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      toast.error("Please fix the errors");
      return;
    }

    setSaving(true);
    setSuccessMessage("");
    try {
      const response = await updateProfile(
        {
          name: form.name.trim(),
          bio: form.bio,
          location: form.location,
          website: form.website,
          github: form.github,
          twitter: form.twitter,
          leetcodeUsername: form.leetcodeUsername,
        },
        null
      );

      if (response.success && response.user) {
        const u = response.user;
        updateUser?.(u);
        setForm((prev) => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
          avatar: getAvatarUrl(u.avatar) || prev.avatar,
          bio: u.bio ?? prev.bio,
          location: u.location ?? prev.location,
          website: u.website ?? prev.website,
          github: u.github ?? prev.github,
          twitter: u.twitter ?? prev.twitter,
          leetcodeUsername: u.leetcodeUsername ?? prev.leetcodeUsername,
        }));
      }

      setSuccessMessage("Profile updated successfully!");
      toast.success("Profile updated successfully!");
      onProfileUpdate?.(form);
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleConnectCodeforces = async () => {
    if (!form.codeforcesHandle?.trim()) {
      toast.error("Please enter a Codeforces handle first");
      return;
    }
    try {
      setConnecting(true);
      setCfStatus("connecting");
      let response;
      if (onConnectCodeforces) {
        response = await onConnectCodeforces(form.codeforcesHandle.trim());
      } else {
        response = await connectCodeforces(form.codeforcesHandle.trim());
      }
      toast.success(
        response?.message || "Codeforces account connected successfully!"
      );
      const cf = response?.codeforces;
      setCfStatus("connected");
      setCfData(
        cf
          ? {
              handle: cf.handle,
              rating: cf.rating,
              maxRating: cf.maxRating,
              rank: cf.rank,
              maxRank: cf.maxRank,
            }
          : { handle: form.codeforcesHandle }
      );
      if (cf?.handle) {
        setForm((prev) => ({ ...prev, codeforcesHandle: cf.handle }));
      }
      if (response?.user) updateUser?.(response.user);
      else if (cf) {
        updateUser?.({
          codeforcesHandle: cf.handle,
          codeforcesRating: cf.rating,
          codeforcesRank: cf.rank,
          codeforcesAvatar: cf.avatar,
        });
      }
      loadProfile().catch(() => {});
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Connection failed. Please try again."
      );
      setCfStatus("disconnected");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectCodeforces = async () => {
    if (!confirm("Disconnect your Codeforces account?")) return;
    try {
      if (onDisconnectCodeforces) {
        await onDisconnectCodeforces();
      } else {
        await updateProfile({ codeforcesHandle: "" }, null);
      }
      setCfStatus("disconnected");
      setCfData(null);
      setForm((prev) => ({ ...prev, codeforcesHandle: "" }));
      updateUser?.({
        codeforcesHandle: null,
        codeforcesRating: null,
        codeforcesRank: null,
      });
      toast.success("Codeforces account disconnected");
    } catch {
      toast.error("Failed to disconnect");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    loadProfile();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        className={`min-h-[360px] flex flex-col items-center justify-center ${className}`}
      >
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
        <p className="text-sm text-slate-500">Loading profile…</p>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "connections", label: "Connections", icon: Link2 },
    { id: "security", label: "Security", icon: Shield },
  ];

  const showAvatar = form.avatar && !imgFailed;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-violet-500/20 bg-white dark:bg-slate-900 shadow-sm">
        <div className="h-28 md:h-32 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 relative">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_15%_20%,white,transparent_40%),radial-gradient(circle_at_85%_0%,#93c5fd,transparent_35%)]" />
        </div>

        <div className="px-6 md:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-lg ring-1 ring-black/5">
                {showAvatar ? (
                  <img
                    src={form.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white tracking-wide">
                      {getInitials(form.name)}
                    </span>
                  </div>
                )}
              </div>
              {cfStatus === "connected" && (
                <span className="absolute bottom-1 right-1 p-1 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900">
                  <BadgeCheck className="w-3.5 h-3.5 text-white" />
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white truncate">
                  {form.name || "User"}
                </h1>
                {cfStatus === "connected" && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
                    CF linked
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate">{form.email || "No email"}</span>
                {form.location && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {form.location}
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => loadProfile()}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {!readOnly && activeTab === "profile" && (
                <Button
                  type="button"
                  onClick={() =>
                    isEditing ? handleCancel() : setIsEditing(true)
                  }
                  className={
                    isEditing
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                      : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
                  }
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4 mr-1.5" /> Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Quick facts */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: Mail,
                label: "Email",
                value: form.email || "—",
                tone: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
              },
              {
                icon: Code2,
                label: "Codeforces",
                value: form.codeforcesHandle || "Not connected",
                tone: "text-orange-600 dark:text-orange-400 bg-orange-500/10",
                check: cfStatus === "connected",
              },
              {
                icon: Trophy,
                label: "LeetCode",
                value: form.leetcodeUsername || "Not connected",
                tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
              },
              {
                icon: Calendar,
                label: "Joined",
                value: formatDate(form.joinedAt),
                tone: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800"
              >
                <div className={`p-2 rounded-lg ${item.tone}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate flex items-center gap-1">
                    {item.value}
                    {item.check && (
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {successMessage}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm space-y-6"
      >
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {activeTab === "profile"
              ? "Personal Information"
              : activeTab === "connections"
              ? "Platform Connections"
              : "Security Settings"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeTab === "profile"
              ? "Update your personal details and bio"
              : activeTab === "connections"
              ? "Link competitive programming accounts"
              : "Manage account security"}
          </p>
        </div>

        {activeTab === "profile" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <User className="w-4 h-4" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={readOnly || !isEditing || saving}
                  placeholder="Your full name"
                  className={`h-11 ${errors.name ? "border-red-400" : ""}`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <Input
                  value={form.email}
                  readOnly
                  disabled
                  className="h-11 bg-slate-50 dark:bg-slate-950 text-slate-500"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Email can’t be changed here for security.
                </p>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={form.bio || ""}
                onChange={handleChange}
                disabled={readOnly || !isEditing || saving}
                placeholder="Tell us about yourself…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50 resize-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {form.bio?.length || 0}/500
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <Input
                name="location"
                value={form.location || ""}
                onChange={handleChange}
                disabled={readOnly || !isEditing || saving}
                placeholder="City, Country"
                className="h-11"
              />
            </div>

            {showSocialLinks && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                  Social Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      name: "website",
                      label: "Website",
                      icon: Globe,
                      placeholder: "https://…",
                    },
                    {
                      name: "github",
                      label: "GitHub",
                      icon: GitBranch,
                      placeholder: "username",
                    },
                    {
                      name: "twitter",
                      label: "Twitter / X",
                      icon: Globe,
                      placeholder: "username",
                    },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                        <field.icon className="w-3.5 h-3.5" />
                        {field.label}
                      </label>
                      <Input
                        name={field.name}
                        value={form[field.name] || ""}
                        onChange={handleChange}
                        disabled={readOnly || !isEditing || saving}
                        placeholder={field.placeholder}
                        className={`h-10 ${
                          errors[field.name] ? "border-red-400" : ""
                        }`}
                      />
                      {errors[field.name] && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors[field.name]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "connections" && (
          <div className="space-y-5">
            {/* Codeforces */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/10">
                    <Code2 className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Codeforces
                    </p>
                    <p className="text-xs text-slate-500">
                      Sync rating, contests, and submissions
                    </p>
                  </div>
                </div>
                {cfStatus === "connected" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" /> Connected
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    Not connected
                  </span>
                )}
              </div>

              {cfStatus === "connected" && cfData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Handle",
                      value: cfData.handle || form.codeforcesHandle,
                    },
                    {
                      label: "Rating",
                      value: cfData.rating ?? "—",
                      rating: true,
                    },
                    { label: "Max", value: cfData.maxRating ?? "—" },
                    { label: "Rank", value: cfData.rank ?? "—" },
                  ].map(({ label, value, rating }) => (
                    <div
                      key={label}
                      className="rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-3"
                    >
                      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                        {label}
                      </p>
                      <p
                        className={`text-sm font-semibold mt-0.5 truncate ${
                          rating
                            ? `cf-mono ${getRatingColorClass(value)}`
                            : "text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <Input
                  name="codeforcesHandle"
                  value={form.codeforcesHandle || ""}
                  onChange={handleChange}
                  disabled={
                    readOnly ||
                    saving ||
                    connecting ||
                    cfStatus === "connected"
                  }
                  placeholder="Codeforces handle"
                  className="h-10 flex-1 min-w-[200px]"
                />
                {cfStatus !== "connected" ? (
                  <Button
                    type="button"
                    onClick={handleConnectCodeforces}
                    disabled={connecting || !form.codeforcesHandle}
                    className="h-10 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        Connecting…
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                ) : (
                  <>
                    <a
                      href={`https://codeforces.com/profile/${
                        cfData?.handle || form.codeforcesHandle
                      }`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Profile
                    </a>
                    <Button
                      type="button"
                      onClick={handleDisconnectCodeforces}
                      variant="outline"
                      className="h-10 text-red-500 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Unlink className="w-4 h-4 mr-1.5" />
                      Disconnect
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* LeetCode — public profile + recent submissions (Phase 2) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10">
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      LeetCode
                    </p>
                    <p className="text-xs text-slate-500">
                      Public profile + recent submissions (no session cookies)
                    </p>
                  </div>
                </div>
                {lcStatus?.connected ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" /> Connected
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    Not connected
                  </span>
                )}
              </div>

              {lcStatus?.connected && lcStatus.profile && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Ranking",
                        value:
                          lcStatus.profile.ranking != null
                            ? `#${lcStatus.profile.ranking}`
                            : "—",
                      },
                      {
                        label: "Solved",
                        value:
                          lcStatus.profile.solved?.all != null
                            ? lcStatus.profile.solved.all
                            : "—",
                      },
                      {
                        label: "Easy / Med / Hard",
                        value: [
                          lcStatus.profile.solved?.easy ?? "—",
                          lcStatus.profile.solved?.medium ?? "—",
                          lcStatus.profile.solved?.hard ?? "—",
                        ].join(" / "),
                      },
                      {
                        label: "Last profile sync",
                        value: lcStatus.lastProfileSyncAt
                          ? new Date(
                              lcStatus.lastProfileSyncAt
                            ).toLocaleString()
                          : "—",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-3"
                      >
                        <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                          {s.label}
                        </p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-1 truncate">
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-200/90">
                    Import mode:{" "}
                    <span className="font-semibold">
                      {lcStatus.submissionImportCapability ||
                        "public_recent_only"}
                    </span>
                    . Source code:{" "}
                    <span className="font-semibold">
                      {lcStatus.sourceCodeCapability || "unsupported"}
                    </span>
                    . Full history is not available without private auth (not
                    collected).
                    {lcStatus.lastSubmissionSyncAt && (
                      <>
                        {" "}
                        Last submission sync:{" "}
                        {new Date(
                          lcStatus.lastSubmissionSyncAt
                        ).toLocaleString()}
                      </>
                    )}
                  </div>
                  {lcStatus.profile.profileUrl && (
                    <a
                      href={lcStatus.profile.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline"
                    >
                      Open LeetCode profile <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {lcStatus?.lastSyncError && (
                <p className="text-xs text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {lcStatus.lastSyncError}
                </p>
              )}

              <div className="flex gap-3 flex-wrap">
                {!lcStatus?.connected ? (
                  <>
                    <Input
                      name="leetcodeUsername"
                      value={form.leetcodeUsername || ""}
                      onChange={handleChange}
                      disabled={readOnly || lcBusy}
                      placeholder="LeetCode username"
                      className="h-10 flex-1 min-w-[200px]"
                    />
                    <Button
                      type="button"
                      disabled={lcBusy || readOnly || !form.leetcodeUsername}
                      onClick={async () => {
                        try {
                          setLcBusy(true);
                          const res = await connectLeetCode(
                            form.leetcodeUsername
                          );
                          toast.success(
                            res.message || "LeetCode connected"
                          );
                          if (res.warnings?.[0]) toast.message(res.warnings[0]);
                          await loadLeetCodeStatus();
                          updateUser?.({
                            leetcodeUsername: res.connection?.handle,
                            leetcodeSolved: res.profile?.solved?.all,
                          });
                        } catch (err) {
                          toast.error(
                            err.response?.data?.message ||
                              "Failed to connect LeetCode"
                          );
                        } finally {
                          setLcBusy(false);
                        }
                      }}
                      className="h-10"
                    >
                      {lcBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      ) : (
                        <Link2 className="w-4 h-4 mr-1.5" />
                      )}
                      Connect
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={lcBusy || readOnly}
                      onClick={async () => {
                        try {
                          setLcBusy(true);
                          const { jobId } = await syncLeetCodeProfile();
                          const job = await waitForSyncJob(jobId);
                          if (job.status === "failed") {
                            toast.error(job.error || "Profile sync failed");
                          } else {
                            toast.success("LeetCode profile refreshed");
                          }
                          await loadLeetCodeStatus();
                        } catch (err) {
                          toast.error(
                            err.response?.data?.message ||
                              err.message ||
                              "Profile sync failed"
                          );
                        } finally {
                          setLcBusy(false);
                        }
                      }}
                      className="h-10"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-1.5 ${
                          lcBusy ? "animate-spin" : ""
                        }`}
                      />
                      Refresh profile
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={lcBusy || readOnly}
                      onClick={async () => {
                        try {
                          setLcBusy(true);
                          const { jobId } = await syncLeetCodeSubmissions();
                          const job = await waitForSyncJob(jobId);
                          if (job.status === "failed") {
                            toast.error(job.error || "Submission sync failed");
                          } else {
                            toast.success(
                              job.progress?.message ||
                                `Imported recent submissions (${
                                  job.progress?.imported ?? 0
                                } new)`
                            );
                          }
                          await loadLeetCodeStatus();
                        } catch (err) {
                          toast.error(
                            err.response?.data?.message ||
                              err.message ||
                              "Submission sync failed"
                          );
                        } finally {
                          setLcBusy(false);
                        }
                      }}
                      className="h-10"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-1.5 ${
                          lcBusy ? "animate-spin" : ""
                        }`}
                      />
                      Import recent
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={lcBusy || readOnly}
                      onClick={async () => {
                        try {
                          setLcBusy(true);
                          await disconnectLeetCode();
                          toast.success("LeetCode disconnected");
                          await loadLeetCodeStatus();
                        } catch (err) {
                          toast.error(
                            err.response?.data?.message || "Disconnect failed"
                          );
                        } finally {
                          setLcBusy(false);
                        }
                      }}
                      className="h-10 text-red-500 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Unlink className="w-4 h-4 mr-1.5" />
                      Disconnect
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Shield className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Account Security
                  </p>
                  <p className="text-xs text-slate-500">
                    Credentials and membership
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-4">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                    Registered Email
                  </p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-1 truncate">
                    {form.email}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-4">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                    Member Since
                  </p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-1">
                    {formatDate(form.joinedAt)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 p-4 flex items-start gap-3">
                <Lock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Password
                  </p>
                  <p className="text-xs text-blue-700/80 dark:text-blue-400 mt-1">
                    Change your password from Settings → Account, or use the
                    login page recovery flow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!readOnly && activeTab === "profile" && isEditing && (
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="submit"
              disabled={saving}
              className="h-11 px-6 bg-gradient-to-r from-violet-600 to-blue-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="h-11"
            >
              Cancel
            </Button>
          </div>
        )}
      </form>

      {showStats && cfData && cfStatus === "connected" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-orange-500" />
              Codeforces Statistics
            </h2>
            <a
              href={`https://codeforces.com/profile/${
                cfData.handle || form.codeforcesHandle
              }`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline"
            >
              View on Codeforces
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Current Rating",
                value: cfData.rating ?? "—",
                rating: true,
              },
              { label: "Max Rating", value: cfData.maxRating ?? "—" },
              { label: "Rank", value: cfData.rank ?? "—" },
              { label: "Max Rank", value: cfData.maxRank ?? "—" },
            ].map(({ label, value, rating }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4"
              >
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                  {label}
                </p>
                <p
                  className={`text-2xl font-bold mt-1 truncate ${
                    rating
                      ? `cf-mono ${getRatingColorClass(value)}`
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
