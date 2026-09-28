import { Card, CardContent } from "../ui/card";

function ActivityCard({
  problemsSolved,
  contestCount,
  history = [],
}) {
  const lastContest = [...history].sort(
    (a, b) =>
      (b.ratingUpdateTimeSeconds || 0) - (a.ratingUpdateTimeSeconds || 0)
  )[0];

  const items = [
    {
      label: "Problems solved",
      value:
        problemsSolved != null ? String(problemsSolved) : "—",
    },
    {
      label: "Rated contests",
      value: contestCount != null ? String(contestCount) : String(history.length || 0),
    },
    {
      label: "Latest contest",
      value: lastContest?.contestName || "None yet",
    },
    {
      label: "Latest rating",
      value:
        lastContest?.newRating != null
          ? String(lastContest.newRating)
          : "—",
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-6">Activity Summary</h2>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.label} className="flex justify-between gap-4">
              <span className="text-slate-600">{item.label}</span>
              <strong className="text-right text-slate-900">{item.value}</strong>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ActivityCard;
