'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RatingDataPoint {
  date: string;
  rating: number;
}

interface RatingChartProps {
  data: RatingDataPoint[];
  height?: number;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400">{label}</p>
      <p className="font-bold text-blue-400 text-base mt-0.5">{payload[0].value}</p>
      <p className="text-slate-500">rating</p>
    </div>
  );
}

export function RatingChart({ data, height = 200 }: RatingChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-600 text-sm bg-slate-900 rounded-xl border border-slate-800"
        style={{ height }}
      >
        No rating history yet
      </div>
    );
  }

  const minRating = Math.min(...data.map((d) => d.rating));
  const maxRating = Math.max(...data.map((d) => d.rating));
  const padding = Math.max(50, Math.round((maxRating - minRating) * 0.15));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
      >
        <defs>
          <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1e293b"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => v.slice(5)} // MM-DD
        />
        <YAxis
          domain={[minRating - padding, maxRating + padding]}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
        <Line
          type="monotone"
          dataKey="rating"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
