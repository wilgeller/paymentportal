"use client";

import useSWR from "swr";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { apiFetch, ClientApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import type { DateRange } from "@/lib/date-range";
import type { PlanBreakdownItem, PlanMetricsResponse } from "@/lib/whop/types";

function planMetricsKey(range: DateRange) {
  return `/api/plan-metrics?from=${range.from}&to=${range.to}`;
}

function MrrByPlanTable({
  items,
  loading,
}: {
  items?: PlanBreakdownItem[];
  loading?: boolean;
}) {
  if (loading || !items) {
    return (
      <div className="space-y-3 p-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-brand-muted" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-black/60">
        No active recurring plans found.
      </p>
    );
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-black/10 bg-brand-muted/60 text-xs uppercase tracking-wide text-black/50">
          <tr>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Active subs</th>
            <th className="px-4 py-3 font-medium">MRR</th>
            <th className="px-4 py-3 font-medium">Share</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.planId}
              className="border-b border-black/5 text-black/80"
            >
              <td className="px-4 py-3">
                <div className="font-medium text-black">{item.label}</div>
                <div className="font-mono text-xs text-black/40">{item.planId}</div>
              </td>
              <td className="px-4 py-3">{item.count.toLocaleString()}</td>
              <td className="px-4 py-3 font-medium text-black">
                {formatCurrency(item.value)}
              </td>
              <td className="px-4 py-3">
                <div className="flex min-w-[140px] items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(item.value / maxValue) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-black/60">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CHART_COLORS = [
  "#afd9bc",
  "#93c9a9",
  "#7fb896",
  "#bfe3ca",
  "#6bb585",
  "#dcf4e3",
  "#5aa874",
  "#c9ebd4",
];

function SignupsPieChart({
  items,
  loading,
}: {
  items?: PlanBreakdownItem[];
  loading?: boolean;
}) {
  if (loading || !items) {
    return (
      <div className="mx-auto h-72 animate-pulse rounded-2xl bg-brand-muted" />
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-black/60">
        No signups in this date range.
      </p>
    );
  }

  const chartData = items.map((item) => ({
    name: item.label,
    value: item.count,
    percentage: item.percentage,
  }));

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
      <div className="mx-auto h-72 w-full max-w-sm">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={92}
              paddingAngle={2}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => {
                const payload = item?.payload as { percentage?: number } | undefined;
                const count = typeof value === "number" ? value : 0;
                const pct = payload?.percentage?.toFixed(1) ?? "0.0";
                return [`${count} signups (${pct}%)`, "Signups"];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full flex-1 space-y-3">
        {items.map((item, index) => (
          <div key={item.planId} className="flex items-start gap-3">
            <span
              className="mt-1 h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-black">{item.label}</div>
              <div className="text-sm text-black/60">
                {item.count} signup{item.count === 1 ? "" : "s"} · {item.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlanMetricsSection({
  range,
  onApiError,
}: {
  range: DateRange;
  onApiError: (error: ClientApiError) => void;
}) {
  const { data, isLoading } = useSWR(
    planMetricsKey(range),
    () => apiFetch<PlanMetricsResponse>(planMetricsKey(range)),
    {
      onError: (err) => {
        if (err instanceof ClientApiError) onApiError(err);
      },
    },
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-black">MRR by plan</h2>
          <p className="text-sm text-black/60">
            Current monthly recurring revenue from active subscriptions
          </p>
        </div>
        <MrrByPlanTable items={data?.mrrByPlan} loading={isLoading} />
      </section>

      <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-black">Signups by plan</h2>
          <p className="text-sm text-black/60">
            New subscription signups in the selected date range
          </p>
        </div>
        <div className="px-5 py-6">
          <SignupsPieChart items={data?.signupsByPlan} loading={isLoading} />
        </div>
      </section>
    </div>
  );
}
