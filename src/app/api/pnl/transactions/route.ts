import { NextRequest, NextResponse } from "next/server";
import { fetchTransactions } from "@/lib/brex/client";
import { analyze } from "@/lib/brex/analyze";

const PNL_PASSWORD = process.env.PNL_PASSWORD ?? "whop-pnl-2026";

export async function GET(request: NextRequest) {
  const password = request.headers.get("x-pnl-password");
  if (password !== PNL_PASSWORD) {
    return NextResponse.json(
      { error: { type: "unauthorized", message: "Invalid password" } },
      { status: 401 },
    );
  }

  const monthsBack = 3;
  const start = new Date();
  start.setMonth(start.getMonth() - monthsBack);
  start.setDate(1);
  const postedAtStart = start.toISOString().split("T")[0] + "T00:00:00.000";

  const transactions = await fetchTransactions(postedAtStart);
  const data = analyze(transactions);

  return NextResponse.json(data);
}
