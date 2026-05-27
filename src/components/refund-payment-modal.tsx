"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import type { Payment } from "@/lib/whop/types";

export function RefundPaymentModal({
  payment,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (payment: Payment) => void;
  onError: (message: string) => void;
}) {
  const [partial, setPartial] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!payment) return;
    setLoading(true);
    try {
      const body =
        partial && amount
          ? { amount: Number.parseFloat(amount) }
          : {};
      const updated = await apiFetch<Payment>(
        `/api/payments/${payment.id}/refund`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
      onSuccess(updated);
      onOpenChange(false);
      setPartial(false);
      setAmount("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to refund payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Refund payment"
      description={
        payment
          ? `Refund ${formatCurrency(payment.total, payment.currency ?? "USD")} for ${payment.user?.name ?? payment.user?.email ?? "customer"}?`
          : undefined
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={loading}>
            {loading ? "Processing…" : "Confirm refund"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-black/60">
          Full refund is selected by default. Enable partial refund to specify an amount.
        </p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 bg-brand-muted/60 p-4">
          <input
            type="checkbox"
            checked={partial}
            onChange={(e) => setPartial(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm font-medium text-black">Partial refund</span>
        </label>
        {partial ? (
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-brand"
          />
        ) : null}
      </div>
    </Modal>
  );
}
