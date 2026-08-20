"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "#131318",
  border: "1px solid #26262e",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#f4f4f5",
};

export function LeadsAreaChart({ data }: { data: Array<{ label: string; leads: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#232329" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#9b9ba8", fontSize: 11 }}
          axisLine={{ stroke: "#232329" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#9b9ba8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#26262e" }} />
        <Area
          type="monotone"
          dataKey="leads"
          stroke="#8b5cf6"
          strokeWidth={2}
          fill="url(#leadGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ["#8b5cf6", "#22d3ee", "#34d399", "#fbbf24", "#fb7185", "#38bdf8"];

export function CategoryPieChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          stroke="#09090b"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}