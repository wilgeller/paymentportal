"use client";

import * as React from "react";
import useSWR from "swr";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { CancelMembershipModal } from "@/components/cancel-membership-modal";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { apiFetch, ClientApiError } from "@/lib/api-client";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { DateRange } from "@/lib/date-range";
import type { Membership, PaginatedResponse } from "@/lib/whop/types";

const TERMINAL_STATUSES = new Set(["canceled", "expired", "completed"]);

function membershipsKey(range: DateRange, after?: string) {
  const params = new URLSearchParams({
    from: range.from,
    to: range.to,
  });
  if (after) params.set("after", after);
  return `/api/memberships?${params.toString()}`;
}

export function MembershipTable({
  range,
  onApiError,
}: {
  range: DateRange;
  onApiError: (error: ClientApiError) => void;
}) {
  const rangeKey = `${range.from}|${range.to}`;
  const [extraRowsByRange, setExtraRowsByRange] = useState<
    Record<string, Membership[]>
  >({});
  const [cursorByRange, setCursorByRange] = useState<
    Record<string, string | null>
  >({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Membership | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const extraRows = extraRowsByRange[rangeKey] ?? [];
  const storedCursor = cursorByRange[rangeKey] ?? null;

  const { data, isLoading, mutate } = useSWR(
    membershipsKey(range),
    () => apiFetch<PaginatedResponse<Membership>>(membershipsKey(range)),
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
      const result = await apiFetch<PaginatedResponse<Membership>>(
        membershipsKey(range, cursor),
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

  async function refreshRow(id: string) {
    try {
      const updated = await apiFetch<Membership>(`/api/memberships/${id}`);
      await mutate(
        (current) =>
          current
            ? {
                ...current,
                data: current.data.map((row) => (row.id === id ? updated : row)),
              }
            : current,
        false,
      );
      setExtraRowsByRange((prev) => ({
        ...prev,
        [rangeKey]: (prev[rangeKey] ?? []).map((row) =>
          row.id === id ? updated : row,
        ),
      }));
      setRowError((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh membership";
      setRowError((prev) => ({ ...prev, [id]: message }));
    }
  }

  async function runAction(id: string, action: "pause" | "resume" | "uncancel") {
    setActionId(id);
    try {
      await apiFetch<Membership>(`/api/memberships/${id}/${action}`, {
        method: "POST",
      });
      await refreshRow(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      setRowError((prev) => ({ ...prev, [id]: message }));
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-black">Memberships</h2>
        <p className="text-sm text-black/60">
          Active memberships created within the selected date range
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-brand-muted/60 text-xs uppercase tracking-wide text-black/60">
            <tr>
              {[
                "User",
                "Product",
                "Plan",
                "Status",
                "Billing period",
                "Currency",
                "Paused",
                "Joined",
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
              const canPause =
                row.status === "active" && !row.payment_collection_paused;
              const canResume = row.payment_collection_paused;
              const canCancel = !TERMINAL_STATUSES.has(row.status);
              const canUncancel = row.cancel_at_period_end;
              const hasActions = canPause || canResume || canCancel || canUncancel;

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
                  <td className="px-4 py-3">{row.product.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-black/60">
                    {row.plan.id}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      value={row.status}
                      paused={row.payment_collection_paused}
                    />
                  </td>
                  <td className="px-4 py-3 text-black/60">
                    {formatDate(row.renewal_period_start)} →{" "}
                    {formatDate(row.renewal_period_end)}
                  </td>
                  <td className="px-4 py-3">{row.currency ?? "—"}</td>
                  <td className="px-4 py-3">
                    {row.payment_collection_paused ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 text-black/60">
                    {formatDateTime(row.joined_at ?? row.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {rowError[row.id] ? (
                      <p className="text-xs text-red-600">{rowError[row.id]}</p>
                    ) : null}
                    {hasActions ? (
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={actionId === row.id}
                            aria-label="Membership actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="z-50 min-w-[160px] rounded-lg border border-black/10 bg-white p-1 shadow-xl"
                            align="end"
                          >
                            {canPause ? (
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm text-black/80 outline-none hover:bg-brand-muted"
                                onSelect={() => void runAction(row.id, "pause")}
                              >
                                Pause
                              </DropdownMenu.Item>
                            ) : null}
                            {canResume ? (
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm text-black/80 outline-none hover:bg-brand-muted"
                                onSelect={() => void runAction(row.id, "resume")}
                              >
                                Resume
                              </DropdownMenu.Item>
                            ) : null}
                            {canCancel ? (
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 outline-none hover:bg-red-50"
                                onSelect={() => setCancelTarget(row)}
                              >
                                Cancel
                              </DropdownMenu.Item>
                            ) : null}
                            {canUncancel ? (
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-md px-3 py-2 text-sm text-black/80 outline-none hover:bg-brand-muted"
                                onSelect={() => void runAction(row.id, "uncancel")}
                              >
                                Uncancel
                              </DropdownMenu.Item>
                            ) : null}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
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
          Loading memberships…
        </div>
      ) : null}

      {!isLoading && rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-black/60">
          No memberships in this range.
        </div>
      ) : null}

      {hasNext && cursor ? (
        <div className="border-t border-black/10 px-5 py-4">
          <Button variant="secondary" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}

      <CancelMembershipModal
        membership={cancelTarget}
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
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
          if (cancelTarget) {
            setRowError((prev) => ({ ...prev, [cancelTarget.id]: message }));
          }
        }}
      />
    </section>
  );
}
