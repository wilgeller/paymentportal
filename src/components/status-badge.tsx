import { cn } from "@/lib/utils";

const membershipStyles: Record<string, string> = {
  active: "bg-brand-muted text-black ring-brand/40",
  trialing: "bg-brand-light text-black ring-brand/30",
  past_due: "bg-amber-50 text-black ring-amber-200",
  canceled: "bg-red-50 text-black ring-red-200",
  expired: "bg-red-50 text-black ring-red-200",
  completed: "bg-black/5 text-black/70 ring-black/10",
  canceling: "bg-orange-50 text-black ring-orange-200",
  unresolved: "bg-amber-50 text-black ring-amber-200",
  drafted: "bg-black/5 text-black/60 ring-black/10",
};

const paymentStyles: Record<string, string> = {
  succeeded: "bg-brand-muted text-black ring-brand/40",
  pending: "bg-amber-50 text-black ring-amber-200",
  failed: "bg-red-50 text-black ring-red-200",
  refunded: "bg-black/5 text-black/70 ring-black/10",
  partially_refunded: "bg-orange-50 text-black ring-orange-200",
  past_due: "bg-amber-50 text-black ring-amber-200",
  canceled: "bg-red-50 text-black ring-red-200",
  dispute_needs_response: "bg-red-50 text-black ring-red-200",
};

export function StatusBadge({
  value,
  paused,
  kind = "membership",
}: {
  value: string;
  paused?: boolean;
  kind?: "membership" | "payment";
}) {
  if (paused) {
    return (
      <span
        className={cn(
          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
          "bg-black/5 text-black/70 ring-black/10",
        )}
      >
        paused
      </span>
    );
  }

  const styles =
    kind === "payment" ? paymentStyles : membershipStyles;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[value] ?? "bg-black/5 text-black/70 ring-black/10",
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
