import { NextRequest, NextResponse } from "next/server";
import { toApiJsonError } from "@/lib/whop/client";
import { refundPayment } from "@/lib/whop/payments";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let amount: number | undefined;
  try {
    const body = (await request.json()) as { amount?: number };
    if (body.amount != null && !Number.isNaN(body.amount)) {
      amount = body.amount;
    }
  } catch {
    amount = undefined;
  }

  try {
    const payment = await refundPayment(id, amount);
    return NextResponse.json(payment);
  } catch (error) {
    const { status, body } = toApiJsonError(error);
    return NextResponse.json(body, { status });
  }
}
