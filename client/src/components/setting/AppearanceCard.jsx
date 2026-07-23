import { Card, CardContent } from "../ui/card";
import { Moon } from "lucide-react";

function AppearanceCard() {
  return (
    <Card>

      <CardContent className="p-6">

        <div className="flex items-center gap-3 mb-6">

          <Moon className="text-indigo-600" />

          <h2 className="text-xl font-bold">
            Appearance
          </h2>

        </div>

        <div className="flex justify-between items-center">

          <span>
            Dark Mode
          </span>

          <button className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700">
            Coming Soon
          </button>

        </div>

      </CardContent>

    </Card>
  );
}

export default AppearanceCard;