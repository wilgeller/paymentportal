import { NextRequest, NextResponse } from "next/server";
import { toApiJsonError } from "@/lib/whop/client";
import { fetchVolumeSeries, type Bucket } from "@/lib/whop/volume-series";

export const dynamic = "force-dynamic";

const VALID_BUCKETS: Bucket[] = ["hour", "day"];

export async function GET(request: NextRequest) {
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");
  const bucketParam = request.nextUrl.searchParams.get("bucket") ?? "day";
  const bucket = (VALID_BUCKETS.includes(bucketParam as Bucket)
    ? bucketParam
    : "day") as Bucket;

  const to = toParam ?? new Date().toISOString();
  const from = fromParam && fromParam !== "all" ? fromParam : null;

  try {
    const series = await fetchVolumeSeries(from, to, bucket);
    return NextResponse.json(series, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const { status, body } = toApiJsonError(error);
    return NextResponse.json(body, { status });
  }
}
