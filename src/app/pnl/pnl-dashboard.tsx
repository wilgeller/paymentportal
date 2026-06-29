"use client";

import { useEffect, useState } from "react";
import type { PnlData } from "@/lib/brex/types";
import { formatCurrency } from "@/lib/utils";
import { SpendByCategory } from "./spend-by-category";
import { RecurringTransactions } from "./recurring-transactions";
import { MonthlyChart } from "./monthly-chart";

export function PnlDashboard({
  password,
  onAuthError,
}: {
  password: string;
  onAuthError: () => void;
}) {
  const [data, setData] = useState<PnlData | null>(null);
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

  if (!data) return null;

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 bg-background px-6 py-10">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/70">
          Whop
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">
          P&L Viewer
        </h1>
        <p className="mt-2 text-sm text-black/60">
          Last 3 months &middot; {data.transactionCount} transactions
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Spend" value={formatCurrency(data.totalSpend)} />
        <StatCard
          label="Avg / Month"
          value={formatCurrency(
            data.monthlyTotals.length
              ? data.totalSpend / data.monthlyTotals.length
              : 0,
          )}
        />
        <StatCard
          label="Recurring / Month"
          value={formatCurrency(
            data.recurring.reduce((s, r) => s + r.amount, 0),
          )}
        />
      </div>

      <MonthlyChart monthlyTotals={data.monthlyTotals} />
      <SpendByCategory categories={data.byCategory} totalSpend={data.totalSpend} />
      <RecurringTransactions recurring={data.recurring} />
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
