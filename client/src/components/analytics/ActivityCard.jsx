import { Card, CardContent } from "../ui/card";

function ActivityCard() {
  return (
    <Card>

      <CardContent className="p-6">

        <h2 className="text-xl font-bold mb-6">
          Activity
        </h2>

        <div className="space-y-4">

          <div className="flex justify-between">
            <span>Problems This Week</span>
            <strong>18</strong>
          </div>

          <div className="flex justify-between">
            <span>Problems This Month</span>
            <strong>64</strong>
          </div>

          <div className="flex justify-between">
            <span>Current Streak</span>
            <strong>9 Days</strong>
          </div>

          <div className="flex justify-between">
            <span>Longest Streak</span>
            <strong>31 Days</strong>
          </div>

        </div>

      </CardContent>

    </Card>
  );
}

export default ActivityCard;