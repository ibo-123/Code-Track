import { useEffect, useState } from "react";

import {
  Bell,
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
import { updateProfile } from "@/services/userService";

function Settings() {
  const [activeSection, setActiveSection] =
    useState(null);

  /*
   * IMPORTANT
   * Settings owns the AccountCard edit state.
   */
  const [isEditingAccount, setIsEditingAccount] = useState(false);

  /*
   * User data
   */
  const [userData, setUserData] = useState({
    name: "User",
    email: "",
    phone: "",
    location: "",
    avatar: "",
    joined: "",
    bio: "",
  });

  /*
   * --------------------------------------------------
   * ACCOUNT EDIT
   * --------------------------------------------------
   */

  const handleAccountEdit = () => {
    console.log(
      "Settings.jsx: Account edit clicked"
    );

    setIsEditingAccount(true);
    setActiveSection("account");
  };

  useEffect(() => {
    console.log(
      "Settings.jsx: isEditingAccount",
      isEditingAccount
    );
  }, [isEditingAccount]);

  /*
   * --------------------------------------------------
   * ACCOUNT CANCEL
   * --------------------------------------------------
   */

  const handleAccountCancel = () => {
    console.log(
      "Settings.jsx: Account edit cancelled"
    );

    setIsEditingAccount(false);
    setActiveSection(null);
  };

  /*
   * --------------------------------------------------
   * ACCOUNT SAVE
   * --------------------------------------------------
   */

  const handleAccountSave = async (
    updatedData
  ) => {
    try {
      const response = await updateProfile(updatedData);
      console.log(
        "Settings.jsx: Saving account:",
        updatedData
      );

      /*
       * For now update local state.
       *
       * Later you can replace this with:
       *
       * await updateProfile(updatedData);
       */

      setUserData((previous) => ({
        ...previous,
        ...updatedData,
      }));

      /*
       * Exit edit mode.
       */
      setIsEditingAccount(false);
      setActiveSection(null);

      return true;
    } catch (error) {
      console.error(
        "Settings.jsx: Failed to update account:",
        error
      );

      throw error;
    }
  };

  /*
   * --------------------------------------------------
   * AVATAR
   * --------------------------------------------------
   */

  const handleAvatarChange = async (file) => {
    try {
      console.log(
        "Settings.jsx: Avatar selected:",
        file
      );

      /*
       * Temporary local preview.
       *
       * Later upload the file to your backend.
       */

      const reader = new FileReader();

      reader.onloadend = () => {
        setUserData((previous) => ({
          ...previous,
          avatar: reader.result,
        }));
      };

      reader.readAsDataURL(file);

      return true;
    } catch (error) {
      console.error(
        "Settings.jsx: Avatar update failed:",
        error
      );

      throw error;
    }
  };

  /*
   * --------------------------------------------------
   * RENDER
   * --------------------------------------------------
   */
  // In Settings.jsx, add this before the return statement
console.log("Settings: Rendering with isEditingAccount =", isEditingAccount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Settings
              </h1>

              <p className="text-slate-500 mt-2">
                Manage your account and application
                preferences
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

        {/* SETTINGS GRID */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ACCOUNT */}

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <AccountCard
              userData={userData}

              /*
               * IMPORTANT:
               * Settings controls this state.
               */
              isEditing={isEditingAccount}

              onEdit={handleAccountEdit}

              onCancel={handleAccountCancel}

              onSave={handleAccountSave}

              onAvatarChange={
                handleAvatarChange
              }

              successMessage="Account updated successfully!"

              errorMessage="Failed to update account. Please try again."
            />
          </div>

          {/* APPEARANCE */}

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <AppearanceCard />
          </div>

          {/* NOTIFICATIONS */}

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

        {/* QUICK ACTIONS */}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* MOBILE */}

          <button
            type="button"
            onClick={() =>
              setActiveSection("mobile")
            }
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all"
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

          {/* HELP */}

          <button
            type="button"
            onClick={() =>
              setActiveSection("help")
            }
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all"
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

          {/* SECURITY */}

          <button
            type="button"
            onClick={() =>
              setActiveSection("security")
            }
            className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-green-200 hover:shadow-md transition-all"
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

        {/* FOOTER */}

        <div className="mt-8 pt-6 border-t border-slate-200/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              © 2026 Your App. All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Privacy Policy
              </button>

              <button
                type="button"
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Terms of Service
              </button>

              <button
                type="button"
                className="text-xs text-slate-400 hover:text-slate-600"
              >
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