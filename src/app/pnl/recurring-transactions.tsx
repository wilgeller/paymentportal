"use client";

import type { MonthlyRecurring } from "@/lib/brex/types";
import { formatCurrency } from "@/lib/utils";

interface Props {
  recurring: MonthlyRecurring[];
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}

export function RecurringTransactions({ recurring }: Props) {
  if (recurring.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold text-black">
          Recurring Transactions
        </h2>
        <p className="mt-2 text-sm text-black/50">
          No recurring transactions detected.
        </p>
      </div>
    );
  }

  const totalRecurring = recurring.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-black">
          Recurring Transactions
        </h2>
        <p className="text-sm text-black/50">
          ~{formatCurrency(totalRecurring)}/mo
        </p>
      </div>
      <p className="mb-4 text-xs text-black/40">
        Merchants that appear in 2+ months. Amount shown is the monthly average.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs text-black/40">
              <th className="pb-2 pr-4 font-medium">Merchant</th>
              <th className="pb-2 pr-4 font-medium">Category</th>
              <th className="pb-2 pr-4 font-medium">Months</th>
              <th className="pb-2 text-right font-medium">Avg / Mo</th>
            </tr>
          </thead>
          <tbody>
            {recurring.map((r) => (
              <tr
                key={r.merchant}
                className="border-b border-black/[0.03] last:border-0"
              >
                <td className="max-w-[200px] truncate py-2.5 pr-4 font-medium text-black">
                  {r.merchant}
                </td>
                <td className="py-2.5 pr-4 text-black/60">{r.category}</td>
                <td className="py-2.5 pr-4">
                  <div className="flex gap-1">
                    {r.months.map((m) => (
                      <span
                        key={m}
                        className="rounded bg-brand-muted px-1.5 py-0.5 text-xs text-black/60"
                      >
                        {formatMonth(m)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 text-right tabular-nums text-black">
                  {formatCurrency(r.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
