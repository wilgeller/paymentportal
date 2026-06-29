"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Props {
  monthlyTotals: { month: string; total: number }[];
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function MonthlyChart({ monthlyTotals }: Props) {
  const chartData = monthlyTotals.map((m) => ({
    name: formatMonth(m.month),
    spend: m.total,
  }));

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-black">Monthly Spend</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0000000a" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#00000080" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#00000080" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), "Spend"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid rgba(0,0,0,0.1)",
                fontSize: "13px",
              }}
            />
            <Bar dataKey="spend" fill="#afd9bc" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
