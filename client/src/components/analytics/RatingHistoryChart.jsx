import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { Card, CardContent } from "../ui/card";

function RatingHistoryChart({ history = [] }) {

  const data = history.map((item) => ({
    contest: item.contestName,
    rating: item.newRating,
  }));

  return (
    <Card>

      <CardContent className="p-6">

        <h2 className="text-xl font-bold mb-6">
          Rating History
        </h2>

        {data.length === 0 ? (
          <div className="flex items-center justify-center h-96 text-slate-500">
            No rating history available
          </div>
        ) : (
          <div className="h-96">

            <ResponsiveContainer width="100%" height="100%">

              <LineChart data={data}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="contest"
                  hide
                />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>
        )}

      </CardContent>

    </Card>
  );
}

export default RatingHistoryChart;