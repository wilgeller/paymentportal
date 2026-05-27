import { whopRequest } from "./client";

export interface PlanDetails {
  id: string;
  title: string | null;
  description: string | null;
  internal_notes: string | null;
  plan_type: string;
  renewal_price: number;
  billing_period: number | null;
  currency: string;
  product: {
    id: string;
    title: string;
  } | null;
}

export async function getPlan(id: string): Promise<PlanDetails> {
  return whopRequest<PlanDetails>(`/plans/${id}`);
}

export function monthlyRenewalAmount(plan: PlanDetails): number {
  if (plan.plan_type !== "renewal" || !plan.renewal_price) {
    return 0;
  }

  const periodDays = plan.billing_period && plan.billing_period > 0
    ? plan.billing_period
    : 30;

  return (plan.renewal_price * 30) / periodDays;
}

export function planLabel(plan: PlanDetails): string {
  return plan.title?.trim() || plan.product?.title || plan.id;
}
