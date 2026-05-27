"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { apiFetch } from "@/lib/api-client";
import type { Membership } from "@/lib/whop/types";

export function CancelMembershipModal({
  membership,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: {
  membership: Membership | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (membership: Membership) => void;
  onError: (message: string) => void;
}) {
  const [immediate, setImmediate] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!membership) return;
    setLoading(true);
    try {
      const updated = await apiFetch<Membership>(
        `/api/memberships/${membership.id}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({ cancel_immediately: immediate }),
        },
      );
      onSuccess(updated);
      onOpenChange(false);
      setImmediate(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to cancel membership");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Cancel membership"
      description={
        membership
          ? `Cancel ${membership.user?.name ?? membership.user?.email ?? membership.id}?`
          : undefined
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Keep active
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={loading}>
            {loading ? "Canceling…" : "Confirm cancel"}
          </Button>
        </>
      }
    >
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 bg-brand-muted/60 p-4">
        <input
          type="checkbox"
          checked={immediate}
          onChange={(e) => setImmediate(e.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-medium text-black">
            Cancel immediately
          </span>
          <span className="mt-1 block text-sm text-black/60">
            When unchecked, the membership cancels at the end of the current billing period.
          </span>
        </span>
      </label>
    </Modal>
  );
}
