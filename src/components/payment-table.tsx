"use client";

import * as React from "react";
import useSWR from "swr";
import { useState } from "react";
import { RefundPaymentModal } from "@/components/refund-payment-modal";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { apiFetch, ClientApiError } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { DateRange } from "@/lib/date-range";
import type { PaginatedResponse, Payment } from "@/lib/whop/types";

function paymentsKey(range: DateRange, after?: string) {
  const params = new URLSearchParams({
    from: range.from,
    to: range.to,
  });
  if (after) params.set("after", after);
  return `/api/payments?${params.toString()}`;
}

export function PaymentTable({
  range,
  onApiError,
}: {
  range: DateRange;
  onApiError: (error: ClientApiError) => void;
}) {
  const rangeKey = `${range.from}|${range.to}`;
  const [extraRowsByRange, setExtraRowsByRange] = useState<
    Record<string, Payment[]>
  >({});
  const [cursorByRange, setCursorByRange] = useState<
    Record<string, string | null>
  >({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const extraRows = extraRowsByRange[rangeKey] ?? [];
  const storedCursor = cursorByRange[rangeKey] ?? null;

  const { data, isLoading, mutate } = useSWR(
    paymentsKey(range),
    () => apiFetch<PaginatedResponse<Payment>>(paymentsKey(range)),
    {
      onError: (err) => {
        if (err instanceof ClientApiError) onApiError(err);
      },
    },
  );

  const rows = [...(data?.data ?? []), ...extraRows];
  const hasNext = storedCursor
    ? Boolean(storedCursor)
    : Boolean(data?.page_info.has_next_page);
  const cursor = storedCursor ?? data?.page_info.end_cursor ?? null;

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const result = await apiFetch<PaginatedResponse<Payment>>(
        paymentsKey(range, cursor),
      );
      setExtraRowsByRange((prev) => ({
        ...prev,
        [rangeKey]: [...(prev[rangeKey] ?? []), ...result.data],
      }));
      setCursorByRange((prev) => ({
        ...prev,
        [rangeKey]: result.page_info.has_next_page
          ? result.page_info.end_cursor
          : null,
      }));
    } catch (err) {
      if (err instanceof ClientApiError) onApiError(err);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-black">Payment feed</h2>
        <p className="text-sm text-black/60">
          Subscription payments only — excludes collab one-time charges and test payments
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-brand-muted/60 text-xs uppercase tracking-wide text-black/60">
            <tr>
              {[
                "User",
                "Product",
                "Amount",
                "Status",
                "Billing reason",
                "Payment method",
                "Date",
                "Actions",
              ].map((col) => (
                <th key={col} className="px-4 py-3 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const method = row.payment_method_type
                ? row.card_last4
                  ? `${row.payment_method_type} •••• ${row.card_last4}`
                  : row.payment_method_type
                : "—";

              return (
                <tr
                  key={row.id}
                  className="border-b border-black/5 text-black/80 hover:bg-brand-muted/60"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-black">
                      {row.user?.name ?? row.user?.username ?? "—"}
                    </div>
                    <div className="text-black/60">{row.user?.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">{row.product?.title ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-black">
                    {formatCurrency(row.total, row.currency ?? "USD")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={row.substatus} kind="payment" />
                  </td>
                  <td className="px-4 py-3 text-black/60">
                    {row.billing_reason?.replaceAll("_", " ") ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-black/60">{method}</td>
                  <td className="px-4 py-3 text-black/60">
                    {formatDateTime(row.paid_at ?? row.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {rowError[row.id] ? (
                      <p className="text-xs text-red-600">{rowError[row.id]}</p>
                    ) : null}
                    {row.refundable ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRefundTarget(row)}
                      >
                        Refund
                      </Button>
                    ) : (
                      <span className="text-black/40">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isLoading && rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-black/60">
          Loading payments…
        </div>
      ) : null}

      {!isLoading && rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-black/60">
          No payments in this range.
        </div>
      ) : null}

      {hasNext && cursor ? (
        <div className="border-t border-black/10 px-5 py-4">
          <Button variant="secondary" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}

      <RefundPaymentModal
        payment={refundTarget}
        open={Boolean(refundTarget)}
        onOpenChange={(open) => !open && setRefundTarget(null)}
        onSuccess={(updated) => {
          void mutate(
            (current) =>
              current
                ? {
                    ...current,
                    data: current.data.map((row) =>
                      row.id === updated.id ? updated : row,
                    ),
                  }
                : current,
            false,
          );
          setExtraRowsByRange((prev) => ({
            ...prev,
            [rangeKey]: (prev[rangeKey] ?? []).map((row) =>
              row.id === updated.id ? updated : row,
            ),
          }));
        }}
        onError={(message) => {
          if (refundTarget) {
            setRowError((prev) => ({ ...prev, [refundTarget.id]: message }));
          }
        }}
      />
    </section>
  );
}
