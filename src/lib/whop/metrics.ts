import { assertWhopConfig } from "./config";
import { whopRequest } from "./client";
import { inRange } from "./date-utils";
import { shouldIncludeMembershipMrr } from "./filters";
import { countFilteredSignups, fetchPlanMetrics } from "./plan-metrics";
import { getPlan, type PlanDetails } from "./plans";
import { sumTotalVolumePayments } from "./payments";
import type {
  KpiResponse,
  Membership,
  PaginatedResponse,
} from "./types";

export async function countChurnedMemberships(
  from: string,
  to: string,
): Promise<number> {
  const { companyId } = assertWhopConfig();
  let after: string | undefined;
  let count = 0;

  do {
    const page = await whopRequest<PaginatedResponse<Membership>>("/memberships", {
      params: {
        company_id: companyId,
        "statuses[]": ["canceled", "expired"],
        first: "100",
        ...(after ? { after } : {}),
      },
    });

    for (const membership of page.data) {
      if (inRange(membership.canceled_at, from, to)) {
        count += 1;
      }
    }

    after = page.page_info.has_next_page
      ? (page.page_info.end_cursor ?? undefined)
      : undefined;
  } while (after);

  return count;
}

async function countActiveAtStart(from: string): Promise<number> {
  const { companyId } = assertWhopConfig();
  let after: string | undefined;
  let count = 0;
  const cutoff = new Date(from).getTime();

  do {
    const page = await whopRequest<PaginatedResponse<Membership>>("/memberships", {
      params: {
        company_id: companyId,
        "statuses[]": ["active", "trialing", "past_due", "canceling"],
        first: "100",
        ...(after ? { after } : {}),
      },
    });

    for (const membership of page.data) {
      const joined = membership.joined_at ?? membership.created_at;
      if (new Date(joined).getTime() <= cutoff) {
        count += 1;
      }
    }

    after = page.page_info.has_next_page
      ? (page.page_info.end_cursor ?? undefined)
      : undefined;
  } while (after);

  return count;
}

async function countPausedAccounts(): Promise<number> {
  const { companyId } = assertWhopConfig();
  let after: string | undefined;
  let count = 0;
  const planCache = new Map<string, PlanDetails | null>();

  do {
    const page = await whopRequest<PaginatedResponse<Membership>>("/memberships", {
      params: {
        company_id: companyId,
        "statuses[]": ["active", "trialing", "past_due", "canceling"],
        first: "100",
        ...(after ? { after } : {}),
      },
    });

    const planIds = [...new Set(page.data.map((membership) => membership.plan.id))];
    await Promise.all(
      planIds.map(async (planId) => {
        if (planCache.has(planId)) return;
        try {
          planCache.set(planId, await getPlan(planId));
        } catch {
          planCache.set(planId, null);
        }
      }),
    );

    for (const membership of page.data) {
      if (!membership.payment_collection_paused) continue;

      const plan = planCache.get(membership.plan.id) ?? undefined;
      if (shouldIncludeMembershipMrr(membership, plan)) {
        count += 1;
      }
    }

    after = page.page_info.has_next_page
      ? (page.page_info.end_cursor ?? undefined)
      : undefined;
  } while (after);

  return count;
}

export async function fetchKpis(from: string, to: string): Promise<KpiResponse> {
  let mrr = 0;
  let totalVolume = 0;
  let newSignups = 0;
  let churn = 0;
  let pausedAccounts = 0;

  try {
    const { mrrByPlan } = await fetchPlanMetrics(from, to);
    mrr = mrrByPlan.reduce((sum, plan) => sum + plan.value, 0);
  } catch {
    mrr = 0;
  }

  try {
    totalVolume = await sumTotalVolumePayments(from, to);
  } catch {
    totalVolume = 0;
  }

  try {
    newSignups = await countFilteredSignups(from, to);
  } catch {
    newSignups = 0;
  }

  churn = await countChurnedMemberships(from, to);

  try {
    pausedAccounts = await countPausedAccounts();
  } catch {
    pausedAccounts = 0;
  }

  let churnRate: number | null = null;
  try {
    const activeAtStart = await countActiveAtStart(from);
    if (activeAtStart > 0) {
      churnRate = (churn / activeAtStart) * 100;
    }
  } catch {
    churnRate = null;
  }

  return { mrr, totalVolume, newSignups, churn, churnRate, pausedAccounts };
}
