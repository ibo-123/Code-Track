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
  UserCircle,
  BadgeCheck,
  Link2,
  Unlink,
  RefreshCw,
  Calendar,
  Award,
  Star,
  GitBranch,
  Shield,
  Clock,
  Settings,
  Bell,
  LogOut,
  ArrowRight,
  X
} from "lucide-react";
import { connectCodeforces } from "../services/codeforcesService";
import { getProfile, updateProfile } from "../services/userService";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

function Profile({ 
  userId,
  onProfileUpdate,
  onConnectCodeforces,
  onDisconnectCodeforces,
  onLogout,
  readOnly = false,
  showStats = true,
  showSocialLinks = true,
  className = ""
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    codeforcesHandle: "",
    leetcodeUsername: "",
    bio: "",
    location: "",
    website: "",
    github: "",
    twitter: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [cfStatus, setCfStatus] = useState(null);
  const [cfData, setCfData] = useState(null);
  const [leetcodeData, setLeetcodeData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('profile');

  const loadProfile = useCallback(async () => {
    try {
      const data = await getProfile(userId);
      
      setForm({
        name: data.user.name || "",
        email: data.user.email || "",
        codeforcesHandle: data.user.codeforcesHandle || "",
        leetcodeUsername: data.user.leetcodeUsername || "",
        bio: data.user.bio || "",
        location: data.user.location || "",
        website: data.user.website || "",
        github: data.user.github || "",
        twitter: data.user.twitter || "",
        joinedAt: data.user.joinedAt
      });

      if (data.user.codeforcesHandle) {
        setCfStatus('connected');
        setCfData({ 
          handle: data.user.codeforcesHandle,
          rating: data.user.codeforcesRating,
          maxRating: data.user.codeforcesMaxRating,
          rank: data.user.codeforcesRank
        });
      } else {
        setCfStatus('disconnected');
      }

      if (data.user.leetcodeUsername) {
        setLeetcodeData({
          username: data.user.leetcodeUsername,
          totalSolved: data.user.leetcodeSolved
        });
      }

    } catch (error) {
      console.error('Profile load error:', error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (form.name.trim().length > 50) {
      newErrors.name = "Name must be less than 50 characters";
    }

    if (form.website && !form.website.match(/^https?:\/\/.+/)) {
      newErrors.website = "Please enter a valid URL";
    }

    return newErrors;
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
    setSuccessMessage("");

    try {
      const updateData = {
        name: form.name.trim(),
        codeforcesHandle: form.codeforcesHandle,
        leetcodeUsername: form.leetcodeUsername,
        bio: form.bio,
        location: form.location,
        website: form.website,
        github: form.github,
        twitter: form.twitter
      };

      await updateProfile(updateData, userId);
      
      setSuccessMessage("Profile updated successfully!");
      toast.success("Profile updated successfully!");
      onProfileUpdate?.(form);
      setIsEditing(false);
      
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleConnectCodeforces = async () => {
    if (!form.codeforcesHandle) {
      toast.error("Please enter a Codeforces handle first");
      return;
    }

    try {
      setConnecting(true);
      setCfStatus('connecting');

      if (onConnectCodeforces) {
        await onConnectCodeforces(form.codeforcesHandle);
      } else {
        const response = await connectCodeforces(form.codeforcesHandle);
        toast.success(response.message || "Codeforces account connected successfully!");
      }
      
      setCfStatus('connected');
      setCfData({ handle: form.codeforcesHandle });
      await loadProfile();

    } catch (error) {
      const message = error.response?.data?.message || "Connection failed. Please try again.";
      toast.error(message);
      setCfStatus('disconnected');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectCodeforces = async () => {
    if (!confirm("Are you sure you want to disconnect your Codeforces account?")) {
      return;
    }

    try {
      if (onDisconnectCodeforces) {
        await onDisconnectCodeforces();
      }
      setCfStatus('disconnected');
      setCfData(null);
      setForm(prev => ({ ...prev, codeforcesHandle: "" }));
      toast.success("Codeforces account disconnected");
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadProfile();
    setErrors({});
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`min-h-[60vh] flex flex-col items-center justify-center ${className}`}>
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-600">Loading Profile...</h2>
        <p className="text-sm text-slate-400 mt-2">Please wait while we fetch your data</p>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 ${className}`}>
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mb-8">
        <div className="relative h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          <div className="absolute -bottom-16 left-8 flex items-end gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-2xl overflow-hidden">
                {form.avatar ? (
                  <img src={form.avatar} alt={form.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">
                      {form.name ? form.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
              </div>
              {cfStatus === 'connected' && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                  <BadgeCheck className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="pb-4">
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                {form.name || "User"}
              </h1>
              <p className="text-white/90 text-sm drop-shadow flex items-center gap-2">
                <span>Competitive Programmer</span>
                {form.location && (
                  <>
                    <span className="text-white/50">•</span>
                    <span>{form.location}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="pt-20 px-8 pb-6 grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Mail className="w-5 h-5 text-blue-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-sm font-medium text-slate-700 truncate">{form.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Code2 className="w-5 h-5 text-orange-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">Codeforces</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {form.codeforcesHandle || "Not connected"}
                </p>
                {cfStatus === 'connected' && (
                  <BadgeCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">LeetCode</p>
              <p className="text-sm font-medium text-slate-700 truncate">
                {form.leetcodeUsername || "Not connected"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">Joined</p>
              <p className="text-sm font-medium text-slate-700 truncate">
                {formatDate(form.joinedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'profile'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'connections'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Link2 className="w-4 h-4 inline mr-2" />
          Connections
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'security'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Security
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {activeTab === 'profile' ? 'Personal Information' : 
               activeTab === 'connections' ? 'Platform Connections' :
               'Security Settings'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {activeTab === 'profile' ? 'Update your personal details and bio' :
               activeTab === 'connections' ? 'Connect your competitive programming accounts' :
               'Manage your account security'}
            </p>
          </div>
          {!readOnly && activeTab === 'profile' && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title={isEditing ? "Cancel editing" : "Edit profile"}
            >
              {isEditing ? (
                <X className="w-5 h-5 text-red-400 hover:text-red-600" />
              ) : (
                <Edit2 className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              )}
            </button>
          )}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <>
            {/* Name Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4" />
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={readOnly || !isEditing || saving}
                placeholder="Enter your full name"
                className={`h-12 ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <Input
                value={form.email}
                readOnly
                disabled
                className="h-12 bg-slate-50 text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Email cannot be changed. Contact support for assistance.
              </p>
            </div>

            {/* Bio Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <UserCircle className="w-4 h-4" />
                Bio
              </label>
              <textarea
                name="bio"
                value={form.bio || ""}
                onChange={handleChange}
                disabled={readOnly || !isEditing || saving}
                placeholder="Tell us about yourself..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
              <p className="mt-1 text-xs text-slate-400">
                {form.bio?.length || 0}/500 characters
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <Input
                name="location"
                value={form.location || ""}
                onChange={handleChange}
                disabled={readOnly || !isEditing || saving}
                placeholder="City, Country"
                className="h-12"
              />
            </div>

            {/* Social Links */}
            {showSocialLinks && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-700">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Website</label>
                    <Input
                      name="website"
                      value={form.website || ""}
                      onChange={handleChange}
                      disabled={readOnly || !isEditing || saving}
                      placeholder="https://yourwebsite.com"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">GitHub</label>
                    <Input
                      name="github"
                      value={form.github || ""}
                      onChange={handleChange}
                      disabled={readOnly || !isEditing || saving}
                      placeholder="username"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Twitter</label>
                    <Input
                      name="twitter"
                      value={form.twitter || ""}
                      onChange={handleChange}
                      disabled={readOnly || !isEditing || saving}
                      placeholder="username"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <>
            {/* Codeforces Section */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Code2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Codeforces Handle
                    </label>
                    {cfStatus === 'connected' && (
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Connected
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {cfStatus === 'connected' ? (
                    <button
                      type="button"
                      onClick={handleDisconnectCodeforces}
                      className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                    >
                      <Unlink className="w-3 h-3 inline mr-1" />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectCodeforces}
                      disabled={connecting || !form.codeforcesHandle}
                      className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3 h-3 inline mr-1" />
                          Connect
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Input
                  name="codeforcesHandle"
                  value={form.codeforcesHandle}
                  onChange={handleChange}
                  disabled={readOnly || saving || cfStatus === 'connected'}
                  placeholder="Enter Codeforces handle (e.g., tourist)"
                  className="h-11 flex-1"
                />
                {form.codeforcesHandle && cfStatus !== 'connected' && (
                  <Button
                    type="button"
                    onClick={handleConnectCodeforces}
                    disabled={connecting}
                    className="bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap"
                  >
                    {connecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>

              {cfStatus === 'connected' && cfData && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          @{cfData.handle}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <span>Connected and verified</span>
                          {cfData.rating && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>Rating: {cfData.rating}</span>
                            </>
                          )}
                          {cfData.rank && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>Rank: {cfData.rank}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://codeforces.com/profile/${cfData.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      View Profile
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* LeetCode Section */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-5 border border-yellow-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500 rounded-lg">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      LeetCode Username
                    </label>
                    {leetcodeData && (
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Connected
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Input
                  name="leetcodeUsername"
                  value={form.leetcodeUsername}
                  onChange={handleChange}
                  disabled={readOnly || !isEditing || saving}
                  placeholder="Enter LeetCode username"
                  className="h-12 flex-1"
                />
                {form.leetcodeUsername && (
                  <a
                    href={`https://leetcode.com/${form.leetcodeUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                )}
              </div>

              {leetcodeData && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        @{leetcodeData.username}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <span>Connected and verified</span>
                        {leetcodeData.totalSolved && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>Solved: {leetcodeData.totalSolved}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="mt-2 text-xs text-slate-400">
                Connect your LeetCode account to track your progress
              </p>
            </div>
          </>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Account Security</p>
                  <p className="text-xs text-slate-400">Manage your password and security settings</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left"
                onClick={() => {/* Navigate to change password */}}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Lock className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Change Password</p>
                    <p className="text-xs text-slate-400">Update your password</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                </div>
              </button>

              <button
                type="button"
                className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left"
                onClick={() => {/* Navigate to 2FA settings */}}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Shield className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-400">Add an extra layer of security</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                </div>
              </button>

              <button
                type="button"
                className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left"
                onClick={() => {/* Navigate to sessions */}}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Clock className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Active Sessions</p>
                    <p className="text-xs text-slate-400">Manage your active sessions</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                </div>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-4 bg-white border border-red-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-700">Sign Out</p>
                      <p className="text-xs text-red-400">Sign out of your account</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-red-400 ml-auto" />
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        {!readOnly && activeTab === 'profile' && isEditing && (
          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <Button
              type="submit"
              disabled={saving}
              className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="h-12"
            >
              Cancel
            </Button>
          </div>
        )}
      </form>

      {/* Stats Cards */}
      {showStats && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Award className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Solved</p>
                <p className="text-lg font-bold text-slate-700">
                  {cfData?.solved || leetcodeData?.totalSolved || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Star className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Rating</p>
                <p className="text-lg font-bold text-slate-700">
                  {cfData?.rating || leetcodeData?.rating || '-'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <GitBranch className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Contests</p>
                <p className="text-lg font-bold text-slate-700">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <BadgeCheck className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Rank</p>
                <p className="text-lg font-bold text-slate-700">
                  {cfData?.rank || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;