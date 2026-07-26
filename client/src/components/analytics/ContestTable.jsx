import { Card, CardContent } from "../ui/card";

function ContestTable({ history = [] }) {
  return (
    <Card>
      <CardContent className="p-6">

        <h2 className="text-xl font-bold mb-6">
          Recent Contests
        </h2>

        {history.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            No contest history available.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b">

                  <th className="text-left py-3">
                    Contest
                  </th>

                  <th className="text-left py-3">
                    Rank
                  </th>

                  <th className="text-left py-3">
                    Rating Change
                  </th>

                </tr>

              </thead>

              <tbody>

                {history
                  .slice(-10)
                  .reverse()
                  .map((contest) => {

                    const change =
                      contest.newRating - contest.oldRating;

                    return (
                      <tr
                        key={contest.contestId}
                        className="border-b hover:bg-slate-50 transition"
                      >

                        <td className="py-3">
                          {contest.contestName}
                        </td>

                        <td>
                          {contest.rank}
                        </td>

                        <td
                          className={
                            change >= 0
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {change >= 0 ? "+" : ""}
                          {change}
                        </td>

                      </tr>
                    );

                  })}

              </tbody>

            </table>

          </div>
        )}

      </CardContent>
    </Card>
  );
}

export default ContestTable;