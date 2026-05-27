"use client";

import { formatCurrency } from "@/lib/utils";
import type { KpiResponse } from "@/lib/whop/types";

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-black/50">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-black">
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm text-black/60">{hint}</p> : null}
    </div>
  );
}

function normalizeKpis(data: Partial<KpiResponse>): KpiResponse {
  return {
    mrr: data.mrr ?? 0,
    totalVolume: data.totalVolume ?? 0,
    newSignups: data.newSignups ?? 0,
    churn: data.churn ?? 0,
    churnRate: data.churnRate ?? null,
    pausedAccounts: data.pausedAccounts ?? 0,
  };
}

export function KpiCards({
  data,
  loading,
}: {
  data?: KpiResponse;
  loading?: boolean;
}) {
  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[120px] animate-pulse rounded-2xl border border-black/10 bg-white"
          />
        ))}
      </div>
    );
  }

  const kpis = normalizeKpis(data);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KpiCard label="MRR" value={formatCurrency(kpis.mrr)} />
      <KpiCard
        label="Total volume"
        value={formatCurrency(kpis.totalVolume)}
        hint="All paid charges in range, excluding tests"
      />
      <KpiCard
        label="New signups"
        value={kpis.newSignups.toLocaleString()}
        hint="New subscription signups in range"
      />
      <KpiCard
        label="Paused accounts"
        value={kpis.pausedAccounts.toLocaleString()}
        hint="Active subscriptions with billing paused"
      />
      <KpiCard
        label="Churn"
        value={kpis.churn.toLocaleString()}
        hint={
          kpis.churnRate != null
            ? `${kpis.churnRate.toFixed(1)}% of active at period start`
            : undefined
        }
      />
    </div>
  );
}
