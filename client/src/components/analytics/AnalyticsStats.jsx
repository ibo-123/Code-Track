import { Card, CardContent } from "../ui/card";
import { Trophy, Star, Code2, Medal } from "lucide-react";

function AnalyticsStats({ stats }) {
  const cards = [
    {
      title: "Current Rating",
      value: stats?.currentRating || 0,
      icon: Trophy,
      color: "text-blue-600",
    },
    {
      title: "Max Rating",
      value: stats?.maxRating || 0,
      icon: Star,
      color: "text-yellow-500",
    },
    {
      title: "Problems Solved",
      value: stats?.problemsSolved || 0,
      icon: Code2,
      color: "text-green-600",
    },
    {
      title: "Contests",
      value: stats?.contestCount || 0,
      icon: Medal,
      color: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">

                <div>
                  <p className="text-slate-500">
                    {item.title}
                  </p>

                  <h2 className="text-3xl font-bold mt-2">
                    {item.value}
                  </h2>
                </div>

                <Icon
                  className={item.color}
                  size={34}
                />

              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default AnalyticsStats;