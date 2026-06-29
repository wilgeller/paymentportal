import { assertWhopConfig } from "./config";
import { whopRequest } from "./client";
import { inRange } from "./date-utils";
import type { Membership, PaginatedResponse } from "./types";

export async function listMemberships(options: {
  from: string;
  to: string;
  after?: string;
  first?: number;
}) {
  const { companyId } = assertWhopConfig();
  const targetCount = options.first ?? 25;
  const results: Membership[] = [];
  let cursor = options.after;
  let endCursor: string | null = null;
  let hasNextPage = false;

  while (results.length < targetCount) {
    const page = await whopRequest<PaginatedResponse<Membership>>(
      "/memberships",
      {
        params: {
          company_id: companyId,
          "statuses[]": "active",
          created_after: options.from,
          created_before: options.to,
          first: String(100),
          ...(cursor ? { after: cursor } : {}),
        },
      },
    );

    endCursor = page.page_info.end_cursor;
    hasNextPage = page.page_info.has_next_page;

    for (const membership of page.data) {
      const date = membership.joined_at ?? membership.created_at;
      if (!inRange(date, options.from, options.to)) continue;

      results.push(membership);
      if (results.length >= targetCount) break;
    }

    if (!page.page_info.has_next_page) {
      hasNextPage = false;
      break;
    }

    cursor = page.page_info.end_cursor ?? undefined;
  }

  return {
    data: results,
    page_info: {
      end_cursor: endCursor,
      start_cursor: null,
      has_next_page: hasNextPage,
      has_previous_page: false,
    },
  } as PaginatedResponse<Membership>;
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
