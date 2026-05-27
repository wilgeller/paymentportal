import { NextRequest, NextResponse } from "next/server";
import { toApiJsonError } from "@/lib/whop/client";
import { fetchKpis } from "@/lib/whop/metrics";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: { type: "invalid_request", message: "from and to are required" } },
      { status: 400 },
    );
  }

  try {
    const kpis = await fetchKpis(from, to);
    return NextResponse.json(kpis);
  } catch (error) {
    const { status, body } = toApiJsonError(error);
    return NextResponse.json(body, { status });
  }
}
