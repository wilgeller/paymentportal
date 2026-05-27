import { NextRequest, NextResponse } from "next/server";
import { toApiJsonError } from "@/lib/whop/client";
import { listPayments } from "@/lib/whop/payments";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const after = request.nextUrl.searchParams.get("after") ?? undefined;

  if (!from || !to) {
    return NextResponse.json(
      { error: { type: "invalid_request", message: "from and to are required" } },
      { status: 400 },
    );
  }

  try {
    const result = await listPayments({ from, to, after });
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toApiJsonError(error);
    return NextResponse.json(body, { status });
  }
}
