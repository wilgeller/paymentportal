export interface PageInfo {
  end_cursor: string | null;
  start_cursor: string | null;
  has_next_page: boolean;
  has_previous_page: boolean;
}

export interface WhopUser {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
}

export interface WhopProduct {
  id: string;
  title: string;
}

export interface WhopPlan {
  id: string;
  metadata?: Record<string, unknown> | null;
}

export interface Membership {
  id: string;
  status: string;
  created_at: string;
  joined_at: string | null;
  renewal_period_start: string | null;
  renewal_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  currency: string | null;
  payment_collection_paused: boolean;
  user: WhopUser | null;
  product: WhopProduct;
  plan: WhopPlan;
}

export interface PaymentMembership {
  id: string;
  status: string;
}

export interface Payment {
  id: string;
  total: number;
  currency: string | null;
  substatus: string;
  billing_reason: string | null;
  payment_method_type: string | null;
  card_last4: string | null;
  paid_at: string | null;
  created_at: string;
  refundable: boolean;
  user: WhopUser | null;
  product: WhopProduct | null;
  plan: WhopPlan | null;
  membership: PaymentMembership | null;
}

export interface MetricStatsResponse {
  columns: string[] | null;
  data: Record<string, unknown>[] | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  page_info: PageInfo;
}

export interface ApiErrorBody {
  error?: {
    type?: string;
    message?: string;
    code?: string;
    param?: string | null;
  };
}

export interface KpiResponse {
  mrr: number;
  totalVolume: number;
  newSignups: number;
  churn: number;
  churnRate: number | null;
  pausedAccounts: number;
}

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
