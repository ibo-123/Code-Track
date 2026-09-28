import { useEffect, useState } from "react";
import { toast } from "sonner";

import AccountCard from "../components/setting/AccountCard";
import ChangePassword from "../components/setting/ChangePassword";
import LogoutCard from "../components/setting/LogoutCard";
import { getProfile } from "../services/userService";
import { updateProfile } from "../services/profileService";
import { useAuth } from "../context/AuthContext";
import { resolveMediaUrl } from "../lib/utils";

function mapUserToCard(user) {
  if (!user) {
    return {
      name: "",
      email: "",
      phone: "",
      location: "",
      avatar: "",
      joined: "",
    };
  }

  return {
    name: user.name || "",
    email: user.email || "",
    phone: user.phoneNumber || "",
    location: user.location || "",
    avatar: resolveMediaUrl(user.avatar || user.avater || ""),
    joined: user.createdAt
      ? new Date(user.createdAt).toLocaleDateString()
      : "",
  };
}

function Settings() {
  const { user, setUser, refreshUser, logout } = useAuth();
  const [userData, setUserData] = useState(() => mapUserToCard(user));
  const [avatarFile, setAvatarFile] = useState(null);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingProfile(true);
      setLoadError("");
      try {
        const data = await getProfile();
        if (cancelled) return;
        setUserData(mapUserToCard(data.user));
        setUser(data.user);
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error.response?.data?.message || "Failed to load account settings"
        );
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  const handleAccountEdit = () => {
    setIsEditingAccount(true);
  };

  const handleAccountCancel = () => {
    setIsEditingAccount(false);
    setAvatarFile(null);
  };

  const handleAccountSave = async (updatedData) => {
    const response = await updateProfile(
      {
        name: updatedData.name,
        phone: updatedData.phone,
        location: updatedData.location,
      },
      avatarFile
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to update profile");
    }

    setUserData(mapUserToCard(response.user));
    setUser(response.user);
    setAvatarFile(null);
    setIsEditingAccount(false);
    await refreshUser();
    toast.success("Account updated successfully");
    return response;
  };

  const handleAvatarChange = async (file) => {
    setAvatarFile(file);
    return true;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">
          Manage your CodeTrack account and security
        </p>
      </div>

      {loadingProfile ? (
        <p className="text-sm text-slate-500">Loading account…</p>
      ) : loadError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {loadError}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AccountCard
            userData={userData}
            isEditing={isEditingAccount}
            onEdit={handleAccountEdit}
            onCancel={handleAccountCancel}
            onSave={handleAccountSave}
            onAvatarChange={handleAvatarChange}
            editableFields={["name", "phone", "location"]}
            showJoined
          />

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <ChangePassword />
          </div>

          <LogoutCard user={user} onLogout={logout} />
        </div>
      )}
    </div>
  );
}

export default Settings;
