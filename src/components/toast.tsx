"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ToastContext = createContext<{
  showToast: (message: string, action?: { label: string; onClick: () => void }) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (
      message: string,
      action?: { label: string; onClick: () => void },
    ) => {
      const id = Date.now();
      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          actionLabel: action?.label,
          onAction: action?.onClick,
        },
      ]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border border-black/10",
              "bg-white px-4 py-3 text-sm text-black shadow-xl",
            )}
          >
            <span className="flex-1">{toast.message}</span>
            {toast.actionLabel && toast.onAction ? (
              <Button size="sm" variant="secondary" onClick={toast.onAction}>
                {toast.actionLabel}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
