"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorBanner({
  title,
  message,
  onDismiss,
}: {
  title: string;
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-black">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-black/70">{message}</p>
      </div>
      {onDismiss ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
