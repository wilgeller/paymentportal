import { NextRequest, NextResponse } from "next/server";
import { toApiJsonError } from "@/lib/whop/client";
import { getPayment } from "@/lib/whop/payments";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const payment = await getPayment(id);
    return NextResponse.json(payment);
  } catch (error) {
    const { status, body } = toApiJsonError(error);
    return NextResponse.json(body, { status });
  }
}
