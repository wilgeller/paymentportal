import { assertWhopConfig } from "./config";
import { whopRequest } from "./client";
import { paymentPaidAt } from "./date-utils";
import { shouldIncludeInTotalVolume } from "./filters";
import { getPlan, type PlanDetails } from "./plans";
import type { PaginatedResponse, Payment } from "./types";

export type Bucket = "hour" | "day";

export interface VolumePoint {
  ts: string;
  volume: number;
  cumulative: number;
}

export interface VolumeSeriesResponse {
  totalVolume: number;
  points: VolumePoint[];
  updatedAt: string;
  from: string;
  to: string;
  bucket: Bucket;
  firstPaymentAt: string | null;
}

async function fetchPaidPage(after?: string) {
  const { companyId } = assertWhopConfig();
  return whopRequest<PaginatedResponse<Payment>>("/payments", {
    params: {
      company_id: companyId,
      "statuses[]": "paid",
      first: "100",
      order: "paid_at",
      direction: "desc",
      ...(after ? { after } : {}),
    },
  });
}

function bucketStart(iso: string, bucket: Bucket): number {
  const d = new Date(iso);
  if (bucket === "hour") {
    d.setUTCMinutes(0, 0, 0);
  } else {
    d.setUTCHours(0, 0, 0, 0);
  }
  return d.getTime();
}

function bucketStepMs(bucket: Bucket): number {
  return bucket === "hour" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
}

export async function fetchVolumeSeries(
  from: string | null,
  to: string,
  bucket: Bucket,
): Promise<VolumeSeriesResponse> {
  const fromMs = from ? new Date(from).getTime() : Number.NEGATIVE_INFINITY;
  const toMs = new Date(to).getTime();
  const planCache = new Map<string, PlanDetails>();
  const bucketTotals = new Map<number, number>();
  let totalVolume = 0;
  let firstPaymentMs: number | null = null;
  let after: string | undefined;
  const lowerBoundForFilter = from ?? new Date(0).toISOString();

  do {
    const page = await fetchPaidPage(after);
    let reachedOlderPayments = false;

    for (const payment of page.data) {
      const paidAt = paymentPaidAt(payment);
      const paidMs = new Date(paidAt).getTime();

      if (paidMs < fromMs) {
        reachedOlderPayments = true;
        break;
      }

      if (paidMs > toMs) {
        continue;
      }

      if (
        !(await shouldIncludeInTotalVolume(
          payment,
          planCache,
          getPlan,
          lowerBoundForFilter,
          to,
        ))
      ) {
        continue;
      }

      const amount = Number(payment.total) || 0;
      totalVolume += amount;
      if (firstPaymentMs === null || paidMs < firstPaymentMs) {
        firstPaymentMs = paidMs;
      }

      const key = bucketStart(paidAt, bucket);
      bucketTotals.set(key, (bucketTotals.get(key) ?? 0) + amount);
    }

    if (reachedOlderPayments) break;

    after = page.page_info.has_next_page
      ? (page.page_info.end_cursor ?? undefined)
      : undefined;
  } while (after);

  const step = bucketStepMs(bucket);
  const seriesFromMs = from
    ? new Date(from).getTime()
    : firstPaymentMs ?? toMs;
  const firstBucket = bucketStart(new Date(seriesFromMs).toISOString(), bucket);
  const lastBucket = bucketStart(new Date(toMs).toISOString(), bucket);
  const points: VolumePoint[] = [];
  let cumulative = 0;

  for (let ts = firstBucket; ts <= lastBucket; ts += step) {
    const volume = bucketTotals.get(ts) ?? 0;
    cumulative += volume;
    points.push({
      ts: new Date(ts).toISOString(),
      volume,
      cumulative,
    });
  }

  return {
    totalVolume,
    points,
    updatedAt: new Date().toISOString(),
    from: from ?? new Date(seriesFromMs).toISOString(),
    to,
    bucket,
    firstPaymentAt: firstPaymentMs ? new Date(firstPaymentMs).toISOString() : null,
  };
}
