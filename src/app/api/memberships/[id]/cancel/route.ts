import { NextRequest, NextResponse } from "next/server";
import { toApiJsonError } from "@/lib/whop/client";
import { cancelMembership } from "@/lib/whop/memberships";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let cancelImmediately = false;
  try {
    const body = (await request.json()) as { cancel_immediately?: boolean };
    cancelImmediately = Boolean(body.cancel_immediately);
  } catch {
    cancelImmediately = false;
  }

  try {
    const membership = await cancelMembership(id, cancelImmediately);
    return NextResponse.json(membership);
  } catch (error) {
    const { status, body } = toApiJsonError(error);
    return NextResponse.json(body, { status });
  }
}
