import type { PlanDetails } from "./plans";
import type { Membership, Payment } from "./types";
import { inRange, membershipJoinedAt, paymentPaidAt } from "./date-utils";

const INCOMPLETE_MEMBERSHIP_STATUSES = new Set(["drafted", "unresolved"]);

const SUBSCRIPTION_BILLING_REASONS = new Set([
  "subscription_create",
  "subscription_cycle",
  "subscription_update",
]);

export function isCollabOneTimePayment(
  payment: Pick<Payment, "billing_reason">,
): boolean {
  return payment.billing_reason === "one_time";
}

export function isSubscriptionBillingReason(
  reason: string | null | undefined,
): boolean {
  return !!reason && SUBSCRIPTION_BILLING_REASONS.has(reason);
}

export function matchesTestPattern(text: string | null | undefined): boolean {
  if (!text) return false;
  return text.trim().toLowerCase().includes("test");
}

export function isTestPlan(
  plan: Pick<PlanDetails, "title" | "description" | "product" | "plan_type"> & {
    internal_notes?: string | null;
  },
): boolean {
  return (
    matchesTestPattern(plan.title) ||
    matchesTestPattern(plan.description) ||
    matchesTestPattern(plan.internal_notes) ||
    matchesTestPattern(plan.product?.title)
  );
}

export function isSubscriptionPlan(plan: Pick<PlanDetails, "plan_type">): boolean {
  return plan.plan_type === "renewal";
}

export async function getCachedPlan<T>(
  planId: string | undefined,
  cache: Map<string, T>,
  fetchPlan: (id: string) => Promise<T>,
): Promise<T | undefined> {
  if (!planId) return undefined;

  const cached = cache.get(planId);
  if (cached) return cached;

  try {
    const plan = await fetchPlan(planId);
    cache.set(planId, plan);
    return plan;
  } catch {
    return undefined;
  }
}

export async function shouldIncludePayment(
  payment: Payment,
  planCache: Map<string, PlanDetails>,
  getPlan: (id: string) => Promise<PlanDetails>,
): Promise<boolean> {
  if (isCollabOneTimePayment(payment)) return false;
  if (!isSubscriptionBillingReason(payment.billing_reason)) return false;
  if (matchesTestPattern(payment.product?.title)) return false;

  const plan = await getCachedPlan(payment.plan?.id, planCache, getPlan);
  if (plan && isTestPlan(plan)) return false;

  return true;
}

export async function shouldIncludeInTotalVolume(
  payment: Payment,
  planCache: Map<string, PlanDetails>,
  getPlan: (id: string) => Promise<PlanDetails>,
  from: string,
  to: string,
): Promise<boolean> {
  if (!inRange(paymentPaidAt(payment), from, to)) return false;
  if (matchesTestPattern(payment.product?.title)) return false;

  const plan = await getCachedPlan(payment.plan?.id, planCache, getPlan);
  if (plan && isTestPlan(plan)) return false;

  return true;
}

export function shouldIncludeMembershipSignup(
  membership: Membership,
  plan: PlanDetails | undefined,
  from: string,
  to: string,
): boolean {
  if (INCOMPLETE_MEMBERSHIP_STATUSES.has(membership.status)) return false;
  if (matchesTestPattern(membership.product.title)) return false;

  const joinedAt = membershipJoinedAt(membership);
  if (!joinedAt || !inRange(joinedAt, from, to)) return false;
  if (!plan) return false;
  if (isTestPlan(plan)) return false;
  if (!isSubscriptionPlan(plan)) return false;

  return true;
}

export async function shouldIncludeSubscriptionSignupPayment(
  payment: Payment,
  planCache: Map<string, PlanDetails>,
  getPlan: (id: string) => Promise<PlanDetails>,
  from: string,
  to: string,
): Promise<boolean> {
  if (!isSubscriptionBillingReason(payment.billing_reason)) return false;
  if (payment.billing_reason !== "subscription_create") return false;
  if (!inRange(paymentPaidAt(payment), from, to)) return false;
  if (matchesTestPattern(payment.product?.title)) return false;
  if (
    payment.membership &&
    INCOMPLETE_MEMBERSHIP_STATUSES.has(payment.membership.status)
  ) {
    return false;
  }

  const plan = await getCachedPlan(payment.plan?.id, planCache, getPlan);
  if (!plan) return false;
  if (isTestPlan(plan)) return false;
  if (!isSubscriptionPlan(plan)) return false;

  return true;
}

export function shouldIncludeMembershipMrr(
  membership: Membership,
  plan?: PlanDetails,
): boolean {
  if (matchesTestPattern(membership.product.title)) return false;
  if (!plan) return true;
  if (isTestPlan(plan)) return false;
  if (!isSubscriptionPlan(plan)) return false;
  return true;
}
