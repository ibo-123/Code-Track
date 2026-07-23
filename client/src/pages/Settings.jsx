import AccountCard from "../components/setting/AccountCard";
import AppearanceCard from "../components/setting/AppearanceCard";
import NotificationCard from "../components/setting/NotificationCard";
import LogoutCard from "../components/setting/LogoutCard";

function Settings() {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold">
          Settings
        </h1>

        <p className="text-slate-500 mt-2">
          Manage your account and application preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <AccountCard />

        <AppearanceCard />

        <NotificationCard />

        <LogoutCard />

      </div>

    </div>
  );
}

export default Settings;