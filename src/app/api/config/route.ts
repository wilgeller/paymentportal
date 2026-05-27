import { NextResponse } from "next/server";
import { getWhopConfig } from "@/lib/whop/config";

export async function GET() {
  const { apiKey, companyId } = getWhopConfig();
  return NextResponse.json({
    configured: Boolean(apiKey && companyId),
    companyId: companyId ? `${companyId.slice(0, 8)}…` : null,
  });
}
