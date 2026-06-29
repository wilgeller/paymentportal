"use client";

import { useState } from "react";
import type { CategorySummary } from "@/lib/brex/types";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  categories: CategorySummary[];
  totalSpend: number;
}

export function SpendByCategory({ categories, totalSpend }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-black">
        Spend by Category
      </h2>
      <div className="flex flex-col gap-1">
        {categories.map((cat) => {
          const pct = totalSpend > 0 ? (cat.total / totalSpend) * 100 : 0;
          const isOpen = expanded === cat.category;

          return (
            <div key={cat.category}>
              <button
                onClick={() =>
                  setExpanded(isOpen ? null : cat.category)
                }
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-black/[0.02]"
              >
                <span className="text-black/30">
                  {isOpen ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </span>
                <span className="flex-1 text-sm font-medium text-black">
                  {cat.category}
                </span>
                <span className="text-xs text-black/40">
                  {cat.count} txn{cat.count !== 1 ? "s" : ""}
                </span>
                <span className="w-16 text-right text-xs text-black/40">
                  {pct.toFixed(1)}%
                </span>
                <span className="w-24 text-right text-sm font-medium tabular-nums text-black">
                  {formatCurrency(cat.total)}
                </span>
              </button>

              {isOpen && (
                <div className="mb-2 ml-9 flex flex-col gap-0.5">
                  {cat.transactions
                    .sort(
                      (a, b) =>
                        Math.abs(b.amount.amount) - Math.abs(a.amount.amount),
                    )
                    .slice(0, 50)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 rounded-md px-3 py-1.5"
                      >
                        <span className="flex-1 truncate text-xs text-black/60">
                          {t.merchant?.raw_descriptor ?? t.description}
                        </span>
                        <span className="text-xs text-black/40">
                          {new Date(t.posted_at_date).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                        <span className="w-24 text-right text-xs tabular-nums text-black/70">
                          {formatCurrency(Math.abs(t.amount.amount) / 100)}
                        </span>
                      </div>
                    ))}
                  {cat.transactions.length > 50 && (
                    <p className="px-3 py-1 text-xs text-black/40">
                      +{cat.transactions.length - 50} more
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
