import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  MapPin,
  Code2,
  Save,
  Edit2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Link2,
  X,
  Phone,
} from "lucide-react";
import { connectCodeforces } from "../services/codeforcesService";
import { getProfile, updateProfile } from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { resolveMediaUrl } from "../lib/utils";

function Profile() {
  const { setUser, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    location: "",
    codeforcesHandle: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [cfStatus, setCfStatus] = useState("disconnected");
  const [cfData, setCfData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("profile");

  const loadProfile = useCallback(async () => {
    try {
      const data = await getProfile();
      const user = data.user;

      setForm({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        location: user.location || "",
        codeforcesHandle: user.codeforcesHandle || "",
        createdAt: user.createdAt,
        avatar: resolveMediaUrl(user.avatar || user.avater || ""),
      });

      setUser(user);

      if (user.codeforcesHandle) {
        setCfStatus("connected");
        setCfData({
          handle: user.codeforcesHandle,
          rating: user.codeforcesRating,
          maxRating: user.codeforcesMaxRating,
          rank: user.codeforcesRank,
        });
      } else {
        setCfStatus("disconnected");
        setCfData(null);
      }
    } catch (error) {
      console.error("Profile load error:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    else if (form.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors");
      return;
    }

    setSaving(true);
    try {
      const response = await updateProfile({
        name: form.name.trim(),
        phoneNumber: form.phoneNumber,
        location: form.location,
      });

      setUser(response.user);
      await refreshUser();
      toast.success("Profile updated successfully");
      setIsEditing(false);
      await loadProfile();
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
      const response = await connectCodeforces(form.codeforcesHandle.trim());
      toast.success(response.message || "Codeforces account connected");
      setCfStatus("connected");
      setCfData(response.codeforces || { handle: form.codeforcesHandle.trim() });
      if (response.user) setUser(response.user);
      await loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || "Connection failed");
      setCfStatus("disconnected");
    } finally {
      setConnecting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    loadProfile();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-600">Loading Profile...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-blue-500 via-indigo-500 to-slate-700" />
        <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
            {form.avatar ? (
              <img src={form.avatar} alt={form.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-3xl font-bold text-white">
                {(form.name || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-slate-900">{form.name || "User"}</h1>
            <p className="text-sm text-slate-500">{form.email}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: "profile", label: "Profile", icon: User },
          { id: "connections", label: "Codeforces", icon: Link2 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4 inline mr-2" />
            {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {activeTab === "profile" ? "Personal Information" : "Platform Connection"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeTab === "profile"
                ? "Update the details stored on your CodeTrack account"
                : "Link your Codeforces handle to power dashboard and analytics"}
            </p>
          </div>
          {activeTab === "profile" && (
            <button
              type="button"
              onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              {isEditing ? (
                <X className="w-5 h-5 text-red-500" />
              ) : (
                <Edit2 className="w-5 h-5 text-slate-400" />
              )}
            </button>
          )}
        </div>

        {activeTab === "profile" && (
          <>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4" />
                Full Name
              </label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={!isEditing || saving}
                className={errors.name ? "border-red-300" : ""}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <Input value={form.email} readOnly disabled className="bg-slate-50" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Phone className="w-4 h-4" />
                Phone
              </label>
              <Input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                disabled={!isEditing || saving}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <Input
                name="location"
                value={form.location}
                onChange={handleChange}
                disabled={!isEditing || saving}
                placeholder="City, Country"
              />
            </div>

            <p className="text-sm text-slate-500">
              Password changes are available in{" "}
              <Link to="/settings" className="text-blue-600 hover:underline">
                Settings
              </Link>
              .
            </p>

            {isEditing && (
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}

        {activeTab === "connections" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Codeforces Handle</p>
                  {cfStatus === "connected" && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Connected
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  name="codeforcesHandle"
                  value={form.codeforcesHandle}
                  onChange={handleChange}
                  disabled={saving || cfStatus === "connected"}
                  placeholder="e.g. tourist"
                  className="flex-1"
                />
                {cfStatus !== "connected" && (
                  <Button
                    type="button"
                    onClick={handleConnectCodeforces}
                    disabled={connecting || !form.codeforcesHandle?.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {connecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Connect"
                    )}
                  </Button>
                )}
              </div>

              {cfStatus === "connected" && cfData && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-green-200 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">@{cfData.handle}</p>
                    <p className="text-xs text-slate-500">
                      {[
                        cfData.rating != null ? `Rating ${cfData.rating}` : null,
                        cfData.rank || null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Connected"}
                    </p>
                  </div>
                  <a
                    href={`https://codeforces.com/profile/${cfData.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 flex items-center gap-1"
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default Profile;
