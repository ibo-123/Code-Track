import { Link } from "react-router-dom";
import { Card, CardContent } from "../ui/card";

function ProgressCard({
  problemsSolved = 0,
  contestCount = 0,
  rating,
  maxRating,
  connected = false,
}) {
  if (!connected) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-2">Progress Overview</h2>
          <p className="text-sm text-slate-500 mb-4">
            Connect Codeforces to see solved problems, contests, and rating progress.
          </p>
          <Link
            to="/profile"
            className="inline-flex text-sm font-medium text-blue-600 hover:underline"
          >
            Connect Codeforces
          </Link>
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      name: "Problems solved",
      value: String(problemsSolved),
      detail: "Accepted unique problems from Codeforces submissions",
    },
    {
      name: "Rated contests",
      value: String(contestCount),
      detail: "Contests with recorded rating updates",
    },
    {
      name: "Current rating",
      value: rating != null ? String(rating) : "Unrated",
      detail:
        maxRating != null ? `Peak rating ${maxRating}` : "Peak rating unavailable",
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-6">Progress Overview</h2>
        <div className="space-y-5">
          {items.map((item) => (
            <div key={item.name}>
              <div className="flex justify-between mb-1">
                <span className="font-medium">{item.name}</span>
                <span className="text-slate-700 font-semibold">{item.value}</span>
              </div>
              <p className="text-xs text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProgressCard;
