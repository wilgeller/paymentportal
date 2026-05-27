import { NextRequest, NextResponse } from "next/server";
import { toApiJsonError } from "@/lib/whop/client";
import { fetchVolumeSeries, type Bucket } from "@/lib/whop/volume-series";

export const dynamic = "force-dynamic";

const VALID_BUCKETS: Bucket[] = ["hour", "day"];

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const bucketParam = request.nextUrl.searchParams.get("bucket") ?? "day";
  const bucket = (VALID_BUCKETS.includes(bucketParam as Bucket)
    ? bucketParam
    : "day") as Bucket;

  if (!from || !to) {
    return NextResponse.json(
      { error: { type: "invalid_request", message: "from and to are required" } },
      { status: 400 },
    );
  }

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
