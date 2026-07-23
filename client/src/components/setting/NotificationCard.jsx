import { Card, CardContent } from "../ui/card";
import { Bell } from "lucide-react";

function NotificationCard() {
  return (
    <Card>

      <CardContent className="p-6">

        <div className="flex items-center gap-3 mb-6">

          <Bell className="text-yellow-500" />

          <h2 className="text-xl font-bold">
            Notifications
          </h2>

        </div>

        <div className="space-y-4">

          <label className="flex justify-between">

            <span>Email Notifications</span>

            <input type="checkbox" defaultChecked />

          </label>

          <label className="flex justify-between">

            <span>Contest Reminders</span>

            <input type="checkbox" defaultChecked />

          </label>

          <label className="flex justify-between">

            <span>Practice Reminder</span>

            <input type="checkbox" />

          </label>

        </div>

      </CardContent>

    </Card>
  );
}

export default NotificationCard;