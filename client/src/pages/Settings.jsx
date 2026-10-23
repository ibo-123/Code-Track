import { useEffect, useState, useCallback } from "react";
import {
  ChevronRight,
  Globe,
  HelpCircle,
  Shield,
  Smartphone,
} from "lucide-react";

import AccountCard from "../components/setting/AccountCard";
import AppearanceCard from "../components/setting/AppearanceCard";
import NotificationCard from "../components/setting/NotificationCard";
import LogoutCard from "../components/setting/LogoutCard";
import { getProfile, updateProfile } from "../services/profileService";
import { getAvatarUrl } from "../services/userService";
import { useAuth } from "../context/AuthContext";

function mapUserToCard(user = {}) {
  const avatarPath = user.avatar || user.avater || user.codeforcesAvatar || "";
  return {
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || user.phoneNumber || "",
    location: user.location || "",
    avatar: getAvatarUrl(avatarPath),
    joined: user.createdAt || user.joinedAt || user.joined || "",
    bio: user.bio || "",
  };
}

function Settings() {
  const { user: authUser, updateUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState(null);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [userData, setUserData] = useState(mapUserToCard());

  const loadProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      setProfileError("");
      const response = await getProfile();
      const user = response.user || response;
      setUserData(mapUserToCard(user));
      updateUser?.(user);
      setAvatarFile(null);
    } catch (error) {
      setProfileError(
        error.response?.data?.message ||
          "Failed to load profile. Please refresh the page."
      );
    } finally {
      setIsLoadingProfile(false);
    }
  }, [updateUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleAccountEdit = () => {
    setIsEditingAccount(true);
    setActiveSection("account");
    setAvatarFile(null);
  };

  const handleAccountCancel = () => {
    setIsEditingAccount(false);
    setAvatarFile(null);
    setActiveSection(null);
  };

  const handleAccountSave = async (updatedData, avatarFileParam) => {
    const fileToUpload = avatarFileParam || avatarFile;
    const payload = {
      name: updatedData.name,
      phone: updatedData.phone,
      phoneNumber: updatedData.phone,
      location: updatedData.location,
      bio: updatedData.bio,
    };

    const response = await updateProfile(payload, fileToUpload);
    const updatedUser = response.user || response;
    setUserData(mapUserToCard(updatedUser));
    updateUser?.(updatedUser);
    setAvatarFile(null);
    setIsEditingAccount(false);
    setActiveSection(null);
    return response;
  };

  const handleAvatarChange = async (file) => {
    setAvatarFile(file);
    return true;
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Loading settings…
          </p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-[320px] p-6">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <Shield className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Failed to Load Profile
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">{profileError}</p>
          <button
            onClick={loadProfile}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your account and application preferences
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Secure
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <Globe className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              v2.0.1
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountCard
          userData={userData}
          isEditing={isEditingAccount}
          onEdit={handleAccountEdit}
          onCancel={handleAccountCancel}
          onSave={handleAccountSave}
          onAvatarChange={handleAvatarChange}
          editableFields={["name", "phone", "location", "bio"]}
          showJoined
          showBio
        />
        <AppearanceCard />
        <NotificationCard />
        <LogoutCard
          user={{
            name: userData.name || authUser?.name || "User",
            email: userData.email || authUser?.email || "",
            role: authUser?.role || "User",
          }}
          onLogout={logout}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            id: "mobile",
            icon: Smartphone,
            title: "Mobile App",
            desc: "Download the app",
            iconBg: "bg-blue-50 dark:bg-blue-500/10",
            iconColor: "text-blue-600 dark:text-blue-400",
          },
          {
            id: "help",
            icon: HelpCircle,
            title: "Help & Support",
            desc: "Get assistance",
            iconBg: "bg-violet-50 dark:bg-violet-500/10",
            iconColor: "text-violet-600 dark:text-violet-400",
          },
          {
            id: "security",
            icon: Shield,
            title: "Privacy & Security",
            desc: "Manage your data",
            iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
            iconColor: "text-emerald-600 dark:text-emerald-400",
          },
        ].map(({ id, icon: Icon, title, desc, iconBg, iconColor }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${iconBg}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {desc}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        ))}
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} CodeTrack. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          {["Privacy Policy", "Terms of Service", "Cookie Settings"].map(
            (label) => (
              <button
                key={label}
                type="button"
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
