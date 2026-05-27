export function inRange(
  iso: string | null | undefined,
  from: string,
  to: string,
): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= new Date(from).getTime() && t <= new Date(to).getTime();
}

export function paymentPaidAt(payment: {
  paid_at: string | null;
  created_at: string;
}): string {
  return payment.paid_at ?? payment.created_at;
}

export function membershipJoinedAt(membership: {
  joined_at: string | null;
  created_at: string;
}): string | null {
  return membership.joined_at;
}
