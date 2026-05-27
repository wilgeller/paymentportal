import { assertWhopConfig } from "./config";
import { whopRequest } from "./client";
import type { Membership, PaginatedResponse } from "./types";

export async function listMemberships(options: {
  from: string;
  to: string;
  after?: string;
  first?: number;
}) {
  const { companyId } = assertWhopConfig();
  return whopRequest<PaginatedResponse<Membership>>("/memberships", {
    params: {
      company_id: companyId,
      "statuses[]": "active",
      created_after: options.from,
      created_before: options.to,
      first: String(options.first ?? 25),
      ...(options.after ? { after: options.after } : {}),
    },
  });
}

export async function getMembership(id: string) {
  return whopRequest<Membership>(`/memberships/${id}`);
}

export async function pauseMembership(id: string) {
  return whopRequest<Membership>(`/memberships/${id}/pause`, { method: "POST" });
}

export async function resumeMembership(id: string) {
  return whopRequest<Membership>(`/memberships/${id}/resume`, { method: "POST" });
}

export async function cancelMembership(
  id: string,
  cancelImmediately: boolean,
) {
  return whopRequest<Membership>(`/memberships/${id}/cancel`, {
    method: "POST",
    body: { cancel_immediately: cancelImmediately },
  });
}

export async function uncancelMembership(id: string) {
  return whopRequest<Membership>(`/memberships/${id}/uncancel`, { method: "POST" });
}
