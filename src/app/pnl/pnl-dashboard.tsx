"use client";

import { useEffect, useMemo, useState } from "react";
import type { PnlData } from "@/lib/brex/types";
import { filterByMonth } from "@/lib/brex/analyze";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { SpendByCategory } from "./spend-by-category";
import { RecurringTransactions } from "./recurring-transactions";
import { MonthlyChart } from "./monthly-chart";

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function PnlDashboard({
  password,
  onAuthError,
}: {
  password: string;
  onAuthError: () => void;
}) {
  const [data, setData] = useState<PnlData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetch("/api/pnl/transactions", {
      headers: { "x-pnl-password": password },
    })
      .then(async (res) => {
        if (res.status === 401) {
          onAuthError();
          return;
        }
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        return res.json();
      })
      .then((d) => {
        if (!cancelled && d) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [password, onAuthError]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm text-black/50">
            Loading transactions from Brex...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const filtered = useMemo(
    () => (data ? filterByMonth(data, selectedMonth) : null),
    [data, selectedMonth],
  );

  if (!data || !filtered) return null;

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 bg-background px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/70">
            Whop
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">
            P&L Viewer
          </h1>
          <p className="mt-2 text-sm text-black/60">
            {selectedMonth ? formatMonthLabel(selectedMonth) : "Last 3 months"}{" "}
            &middot; {filtered.transactionCount} transactions
          </p>
        </div>
        <div className="flex rounded-lg border border-black/10 bg-white p-1">
          <button
            onClick={() => setSelectedMonth(null)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              !selectedMonth
                ? "bg-brand text-black"
                : "text-black/60 hover:text-black",
            )}
          >
            All
          </button>
          {data.months.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                selectedMonth === m
                  ? "bg-brand text-black"
                  : "text-black/60 hover:text-black",
              )}
            >
              {formatMonthLabel(m)}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Spend" value={formatCurrency(filtered.totalSpend)} />
        <StatCard
          label={selectedMonth ? "Transactions" : "Avg / Month"}
          value={
            selectedMonth
              ? String(filtered.transactionCount)
              : formatCurrency(
                  data.monthlyTotals.length
                    ? data.totalSpend / data.monthlyTotals.length
                    : 0,
                )
          }
        />
        <StatCard
          label="Recurring / Month"
          value={formatCurrency(
            data.recurring
              .filter((r) => r.category !== "Collabs")
              .reduce((s, r) => s + r.amount, 0),
          )}
        />
      </div>

      {!selectedMonth && <MonthlyChart monthlyTotals={data.monthlyTotals} />}
      <SpendByCategory categories={filtered.byCategory} totalSpend={filtered.totalSpend} />
      <RecurringTransactions recurring={data.recurring.filter((r) => r.category !== "Collabs")} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-6">
      <p className="text-sm font-medium text-black/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-black">
        {value}
      </p>
    </div>
  );
}
