import { assertWhopConfig } from "./config";
import { whopRequest } from "./client";
import { shouldIncludeMembershipMrr } from "./filters";
import { fetchSubscriptionSignups } from "./payments";
import { getPlan, monthlyRenewalAmount, planLabel } from "./plans";
import type { Membership, PaginatedResponse } from "./types";

export interface PlanBreakdownItem {
  planId: string;
  label: string;
  value: number;
  count: number;
  percentage: number;
}

export interface PlanMetricsResponse {
  mrrByPlan: PlanBreakdownItem[];
  signupsByPlan: PlanBreakdownItem[];
}

interface PlanAccumulator {
  planId: string;
  label: string;
  count: number;
}

async function paginateMemberships(
  params: Record<string, string | string[] | undefined>,
): Promise<Membership[]> {
  const { companyId } = assertWhopConfig();
  const rows: Membership[] = [];
  let after: string | undefined;

  do {
    const page = await whopRequest<PaginatedResponse<Membership>>("/memberships", {
      params: {
        company_id: companyId,
        first: "100",
        ...params,
        ...(after ? { after } : {}),
      },
    });

    rows.push(...page.data);
    after = page.page_info.has_next_page
      ? (page.page_info.end_cursor ?? undefined)
      : undefined;
  } while (after);

  return rows;
}

function membershipLabel(membership: Membership): string {
  return membership.product.title || membership.plan.id;
}

function accumulateByPlan(
  memberships: Membership[],
): Map<string, PlanAccumulator> {
  const map = new Map<string, PlanAccumulator>();

  for (const membership of memberships) {
    const planId = membership.plan.id;
    const existing = map.get(planId);

    if (existing) {
      existing.count += 1;
      continue;
    }

    map.set(planId, {
      planId,
      label: membershipLabel(membership),
      count: 1,
    });
  }

  return map;
}

function accumulateSignupsByPlan(
  signups: Array<{ planId: string; label: string }>,
): Map<string, PlanAccumulator> {
  const map = new Map<string, PlanAccumulator>();

  for (const signup of signups) {
    const existing = map.get(signup.planId);

    if (existing) {
      existing.count += 1;
      continue;
    }

    map.set(signup.planId, {
      planId: signup.planId,
      label: signup.label,
      count: 1,
    });
  }

  return map;
}

function toBreakdown(
  items: Array<{ planId: string; label: string; value: number; count: number }>,
): PlanBreakdownItem[] {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return items
    .map((item) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

async function loadPlanDetails(planIds: string[]) {
  const planDetails = new Map<string, Awaited<ReturnType<typeof getPlan>>>();

  await Promise.all(
    planIds.map(async (planId) => {
      try {
        const plan = await getPlan(planId);
        planDetails.set(planId, plan);
      } catch {
        /* ignore missing plan metadata */
      }
    }),
  );

  return planDetails;
}

async function fetchMrrByPlan(): Promise<PlanBreakdownItem[]> {
  const activeMemberships = await paginateMemberships({
    "statuses[]": ["active", "trialing", "past_due", "canceling"],
  });

  const planDetails = await loadPlanDetails([
    ...new Set(activeMemberships.map((membership) => membership.plan.id)),
  ]);

  const eligibleMemberships = activeMemberships.filter((membership) =>
    shouldIncludeMembershipMrr(
      membership,
      planDetails.get(membership.plan.id),
    ),
  );

  const grouped = accumulateByPlan(eligibleMemberships);
  const items = [...grouped.values()].map((entry) => {
    const plan = planDetails.get(entry.planId);
    const monthlyAmount = plan ? monthlyRenewalAmount(plan) : 0;
    const label = plan ? planLabel(plan) : entry.label;

    return {
      planId: entry.planId,
      label,
      count: entry.count,
      value: monthlyAmount * entry.count,
    };
  });

  return toBreakdown(items.filter((item) => item.value > 0));
}

async function fetchSignupsByPlan(
  from: string,
  to: string,
): Promise<PlanBreakdownItem[]> {
  const signups = await fetchSubscriptionSignups(from, to);
  const grouped = accumulateSignupsByPlan(signups);
  const items = [...grouped.values()].map((entry) => ({
    planId: entry.planId,
    label: entry.label,
    count: entry.count,
    value: entry.count,
  }));

  return toBreakdown(items);
}

export async function fetchPlanMetrics(
  from: string,
  to: string,
): Promise<PlanMetricsResponse> {
  const [mrrByPlan, signupsByPlan] = await Promise.all([
    fetchMrrByPlan(),
    fetchSignupsByPlan(from, to),
  ]);

  return { mrrByPlan, signupsByPlan };
}

export async function countFilteredSignups(from: string, to: string): Promise<number> {
  const signups = await fetchSubscriptionSignups(from, to);
  return signups.length;
}
