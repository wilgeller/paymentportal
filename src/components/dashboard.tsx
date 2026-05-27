"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { DateRangePicker } from "@/components/date-range-picker";
import { ErrorBanner } from "@/components/error-banner";
import { KpiCards } from "@/components/kpi-cards";
import { MembershipTable } from "@/components/membership-table";
import { PaymentTable } from "@/components/payment-table";
import { PlanMetricsSection } from "@/components/plan-metrics-section";
import { useToast } from "@/components/toast";
import { TopNav } from "@/components/top-nav";
import { apiFetch, ClientApiError } from "@/lib/api-client";
import { DEFAULT_RANGE, type DateRange } from "@/lib/date-range";
import type { KpiResponse } from "@/lib/whop/types";

function kpisKey(range: DateRange) {
  return `/api/kpis?from=${range.from}&to=${range.to}`;
}

export function Dashboard() {
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [banner, setBanner] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const { showToast } = useToast();

  const { data: config } = useSWR("/api/config", () =>
    apiFetch<{ configured: boolean }>("/api/config"),
  );

  const handleApiError = useCallback(
    (error: ClientApiError) => {
      if (error.status === 401 || error.payload.error?.invalidKey) {
        setBanner({
          title: "Invalid API key",
          message:
            "Check WHOP_API_KEY in .env.local and restart the dev server.",
        });
        return;
      }

      if (error.status === 403) {
        const scope = error.payload.error?.scope;
        setBanner({
          title: "Missing permission",
          message: scope
            ? `Missing permission: ${scope}`
            : error.message,
        });
        return;
      }

      if (error.status === 500) {
        showToast("Whop API error. Try again.", {
          label: "Retry",
          onClick: () => window.location.reload(),
        });
        return;
      }

      if (error.status >= 500 || error.message.includes("fetch")) {
        showToast("Network failure. Check your connection.", {
          label: "Retry",
          onClick: () => window.location.reload(),
        });
        return;
      }

      showToast(error.message);
    },
    [showToast],
  );

  const {
    data: kpis,
    isLoading: loadingKpis,
  } = useSWR(kpisKey(range), () => apiFetch<KpiResponse>(kpisKey(range)), {
    onError: (err) => {
      if (err instanceof ClientApiError) handleApiError(err);
    },
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 bg-background px-6 py-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/70">
            Whop
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">
            Membership dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black/60">
            Subscription metrics and membership management scoped to your company,
            powered entirely by the Whop REST API.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 lg:items-end">
          <TopNav />
          <DateRangePicker value={range} onChange={setRange} />
        </div>
      </header>

      {config?.configured === false ? (
        <ErrorBanner
          title="Configuration required"
          message="Add WHOP_API_KEY and WHOP_COMPANY_ID to .env.local, then restart the dev server."
        />
      ) : null}

      {banner ? (
        <ErrorBanner
          title={banner.title}
          message={banner.message}
          onDismiss={() => setBanner(null)}
        />
      ) : null}

      <KpiCards data={kpis} loading={loadingKpis} />
      <PlanMetricsSection range={range} onApiError={handleApiError} />
      <MembershipTable range={range} onApiError={handleApiError} />
      <PaymentTable range={range} onApiError={handleApiError} />
    </div>
  );
}
