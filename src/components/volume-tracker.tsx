"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RefreshCw } from "lucide-react";
import { apiFetch, ClientApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/error-banner";
import { useToast } from "@/components/toast";
import { formatCurrency } from "@/lib/utils";
import { presetToRange } from "@/lib/date-range";
import type { VolumeSeriesResponse } from "@/lib/whop/volume-series";

const REFRESH_INTERVAL_MS = 2 * 60 * 1000;

function trackerKey(from: string, to: string) {
  return `/api/tracker?from=${from}&to=${to}&bucket=day`;
}

function formatRelative(updatedAt?: string, _now?: number): string {
  if (!updatedAt) return "—";
  const seconds = Math.max(
    0,
    Math.round((Date.now() - new Date(updatedAt).getTime()) / 1000),
  );
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function formatAxisDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTooltipDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function useAnimatedNumber(target: number, durationMs = 800) {
  const [value, setValue] = useState(target);
  const prevTarget = useRef(target);
  const startValue = useRef(target);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (target === prevTarget.current) return;
    startValue.current = value;
    prevTarget.current = target;
    startTime.current = null;

    const step = (t: number) => {
      if (startTime.current === null) startTime.current = t;
      const elapsed = t - startTime.current;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = startValue.current + (target - startValue.current) * eased;
      setValue(next);
      if (progress < 1) {
        rafId.current = requestAnimationFrame(step);
      }
    };

    rafId.current = requestAnimationFrame(step);
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [target, durationMs, value]);

  return value;
}

export function VolumeTracker() {
  const [now, setNow] = useState(() => Date.now());
  const { showToast } = useToast();
  const [banner, setBanner] = useState<{
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const range = useMemo(() => presetToRange("30d"), []);
  const swrKey = trackerKey(range.from, range.to);
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<VolumeSeriesResponse>(
      swrKey,
      () => apiFetch<VolumeSeriesResponse>(swrKey),
      {
        refreshInterval: REFRESH_INTERVAL_MS,
        revalidateOnFocus: true,
        keepPreviousData: true,
        onError: (err) => {
          if (err instanceof ClientApiError) {
            if (err.status === 401 || err.payload.error?.invalidKey) {
              setBanner({
                title: "Invalid API key",
                message:
                  "Check WHOP_API_KEY in .env.local and restart the dev server.",
              });
              return;
            }
            if (err.status === 403) {
              setBanner({
                title: "Missing permission",
                message: err.payload.error?.scope
                  ? `Missing permission: ${err.payload.error.scope}`
                  : err.message,
              });
              return;
            }
            showToast(err.message);
          }
        },
      },
    );

  const target = data?.totalVolume ?? 0;
  const animatedValue = useAnimatedNumber(target);
  const points = data?.points ?? [];
  const maxBucketVolume = points.reduce((m, p) => Math.max(m, p.volume), 0);

  return (
    <div className="flex flex-col gap-6">
      {banner ? (
        <ErrorBanner
          title={banner.title}
          message={banner.message}
          onDismiss={() => setBanner(null)}
        />
      ) : null}

      <section className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-black/50">
            Live total volume
          </p>
          <Button
            variant="secondary"
            onClick={() => mutate()}
            disabled={isValidating}
          >
            <RefreshCw
              className={`h-4 w-4 ${isValidating ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <p className="mt-6 font-mono text-6xl font-semibold tracking-tight text-black tabular-nums sm:text-7xl lg:text-8xl">
          {formatCurrency(animatedValue)}
        </p>

        <p className="mt-4 flex items-center gap-2 text-sm text-black/60">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isValidating ? "animate-pulse bg-brand-dark" : "bg-brand-dark/60"
            }`}
          />
          Updated {formatRelative(data?.updatedAt, now)} · auto-refreshes every
          2 minutes
        </p>

        {error && !data ? (
          <p className="mt-4 text-sm text-red-600">
            Couldn&rsquo;t load tracker data. Try refresh.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-black">Volume over time</h2>
          <p className="text-sm text-black/60">
            Cumulative volume across the last 30 days
          </p>
        </div>

        {isLoading && !data ? (
          <div className="h-80 animate-pulse rounded-xl bg-brand-muted" />
        ) : points.length === 0 ? (
          <p className="py-16 text-center text-sm text-black/60">
            No payments in this range yet.
          </p>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={points}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#93c9a9" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#93c9a9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#000"
                  strokeOpacity={0.06}
                  vertical={false}
                />
                <XAxis
                  dataKey="ts"
                  tickFormatter={(v) => formatAxisDate(v)}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#000", fillOpacity: 0.5, fontSize: 12 }}
                  minTickGap={32}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#000", fillOpacity: 0.5, fontSize: 12 }}
                  tickFormatter={(v) =>
                    v >= 1000
                      ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`
                      : `$${v}`
                  }
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    fontSize: 12,
                  }}
                  labelFormatter={(label) => formatTooltipDate(String(label))}
                  formatter={(value, _name, item) => {
                    const numericValue =
                      typeof value === "number" ? value : Number(value) || 0;
                    const payload = (item as { payload?: { volume?: number } })
                      ?.payload;
                    return [
                      <span key="row" className="font-medium text-black">
                        {formatCurrency(numericValue)}
                        <span className="ml-2 text-black/50">
                          (+{formatCurrency(payload?.volume ?? 0)})
                        </span>
                      </span>,
                      "Cumulative",
                    ];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#5aa874"
                  strokeWidth={2}
                  fill="url(#volumeFill)"
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {maxBucketVolume > 0 && points.length > 0 ? (
          <p className="mt-3 text-xs text-black/50">
            Peak day: {formatCurrency(maxBucketVolume)}
          </p>
        ) : null}
      </section>
    </div>
  );
}
