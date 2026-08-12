import { useState } from "react";
import {
  ChevronRight,
  Shield,
  Globe,
  Smartphone,
  HelpCircle,
} from "lucide-react";

import AccountCard from "../components/setting/AccountCard";
import AppearanceCard from "../components/setting/AppearanceCard";
import NotificationCard from "../components/setting/NotificationCard";
import LogoutCard from "../components/setting/LogoutCard";

function Settings() {
  const [activeSection, setActiveSection] = useState(null);
  const [isAccountEditing, setIsAccountEditing] = useState(false);

  const [userData, setUserData] = useState({
    name: "User",
    email: "",
    phone: "",
    location: "",
    avatar: "",
    joined: "",
    bio: "",
  });

  // Save account information
  const handleAccountSave = async (updatedData) => {
    try {
      console.log("Saving account data:", updatedData);

      /*
       * TODO:
       * Replace this with your actual backend API call.
       *
       * Example:
       *
       * const response = await api.put("/users/profile", updatedData);
       * const updatedUser = response.data.user;
       */

      setUserData((prev) => ({
        ...prev,
        ...updatedData,
      }));

      setIsAccountEditing(false);
      setActiveSection(null);

      return true;
    } catch (error) {
      console.error("Failed to update account:", error);
      throw error;
    }
  };

  // Start editing
  const handleAccountEdit = () => {
    console.log("Account edit clicked");

    setActiveSection("account");
    setIsAccountEditing(true);
  };

  // Cancel editing
  const handleAccountCancel = () => {
    console.log("Account edit cancelled");

    setIsAccountEditing(false);
    setActiveSection(null);
  };

  // Avatar
  const handleAvatarChange = async (file) => {
    try {
      console.log("Avatar file:", file);

      /*
       * TODO:
       * Upload avatar to backend.
       */

      return true;
    } catch (error) {
      console.error("Failed to update avatar:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Settings
              </h1>

              <p className="text-slate-500 mt-2 flex items-center gap-2">
                <span className="inline-block w-1 h-1 rounded-full bg-blue-500" />
                Manage your account and application preferences
              </p>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-100">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-slate-700">
                  Secure
                </span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-100">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-700">
                  v2.0.1
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ACCOUNT */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <AccountCard
              userData={userData}

              /* IMPORTANT */
              isEditing={isAccountEditing}

              onEdit={handleAccountEdit}
              onCancel={handleAccountCancel}
              onSave={handleAccountSave}
              onAvatarChange={handleAvatarChange}

              editableFields={[
                "name",
                "email",
                "phone",
                "location",
              ]}

              successMessage="Account updated successfully!"
              errorMessage="Failed to update account. Please try again."
            />
          </div>

          {/* APPEARANCE */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <AppearanceCard />
          </div>

          {/* NOTIFICATION */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <NotificationCard />
          </div>

          {/* LOGOUT */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <LogoutCard />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">

          <button
            type="button"
            onClick={() => setActiveSection("mobile")}
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>

              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">
                  Mobile App
                </p>

                <p className="text-xs text-slate-400">
                  Download the app
                </p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("help")}
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <HelpCircle className="w-5 h-5 text-purple-600" />
              </div>

              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">
                  Help & Support
                </p>

                <p className="text-xs text-slate-400">
                  Get assistance
                </p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("security")}
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-green-200 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>

              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">
                  Privacy & Security
                </p>

                <p className="text-xs text-slate-400">
                  Manage your data
                </p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              © 2026 Your App. All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              <button className="text-xs text-slate-400 hover:text-slate-600">
                Privacy Policy
              </button>

              <button className="text-xs text-slate-400 hover:text-slate-600">
                Terms of Service
              </button>

              <button className="text-xs text-slate-400 hover:text-slate-600">
                Cookie Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;