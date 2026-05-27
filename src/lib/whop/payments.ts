import { assertWhopConfig } from "./config";
import { whopRequest } from "./client";
import { paymentPaidAt } from "./date-utils";
import {
  shouldIncludeInTotalVolume,
  shouldIncludePayment,
  shouldIncludeSubscriptionSignupPayment,
} from "./filters";
import { getPlan, planLabel, type PlanDetails } from "./plans";
import type { PaginatedResponse, Payment } from "./types";

async function fetchPaymentPage(options: {
  from: string;
  to: string;
  after?: string;
  first?: number;
}) {
  const { companyId } = assertWhopConfig();
  return whopRequest<PaginatedResponse<Payment>>("/payments", {
    params: {
      company_id: companyId,
      "statuses[]": "paid",
      created_after: options.from,
      created_before: options.to,
      first: String(options.first ?? 100),
      order: "created_at",
      direction: "desc",
      ...(options.after ? { after: options.after } : {}),
    },
  });
}

async function fetchPaidPaymentsByPaidAt(options: {
  after?: string;
  first?: number;
  billingReasons?: string[];
}) {
  const { companyId } = assertWhopConfig();
  return whopRequest<PaginatedResponse<Payment>>("/payments", {
    params: {
      company_id: companyId,
      "statuses[]": "paid",
      first: String(options.first ?? 100),
      order: "paid_at",
      direction: "desc",
      ...(options.billingReasons?.length
        ? { "billing_reasons[]": options.billingReasons }
        : {}),
      ...(options.after ? { after: options.after } : {}),
    },
  });
}

function isBeforeRange(iso: string, from: string): boolean {
  return new Date(iso).getTime() < new Date(from).getTime();
}

function signupDedupeKey(payment: Payment): string {
  return payment.membership?.id ?? payment.id;
}

export async function paginateFilteredPayments(options: {
  from: string;
  to: string;
  after?: string;
  first?: number;
}): Promise<PaginatedResponse<Payment>> {
  const targetCount = options.first ?? 25;
  const planCache = new Map<string, PlanDetails>();
  const results: Payment[] = [];
  let cursor = options.after;
  let endCursor: string | null = null;
  let hasNextPage = false;

  while (results.length < targetCount) {
    const page = await fetchPaymentPage({
      from: options.from,
      to: options.to,
      after: cursor,
      first: 100,
    });

    endCursor = page.page_info.end_cursor;
    hasNextPage = page.page_info.has_next_page;

    for (const payment of page.data) {
      if (!(await shouldIncludePayment(payment, planCache, getPlan))) {
        continue;
      }

      results.push(payment);
      if (results.length >= targetCount) {
        break;
      }
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
  };
}

export async function listPayments(options: {
  from: string;
  to: string;
  after?: string;
  first?: number;
}) {
  return paginateFilteredPayments(options);
}

export async function sumTotalVolumePayments(
  from: string,
  to: string,
): Promise<number> {
  const planCache = new Map<string, PlanDetails>();
  let after: string | undefined;
  let total = 0;

  do {
    const page = await fetchPaidPaymentsByPaidAt({ after, first: 100 });
    let reachedOlderPayments = false;

    for (const payment of page.data) {
      if (isBeforeRange(paymentPaidAt(payment), from)) {
        reachedOlderPayments = true;
        break;
      }

      if (await shouldIncludeInTotalVolume(payment, planCache, getPlan, from, to)) {
        total += Number(payment.total) || 0;
      }
    }

    if (reachedOlderPayments) {
      break;
    }

    after = page.page_info.has_next_page
      ? (page.page_info.end_cursor ?? undefined)
      : undefined;
  } while (after);

  return total;
}

export async function fetchSubscriptionSignups(
  from: string,
  to: string,
): Promise<Array<{ planId: string; label: string }>> {
  const planCache = new Map<string, PlanDetails>();
  let after: string | undefined;
  const seen = new Set<string>();
  const signups: Array<{ planId: string; label: string }> = [];

  do {
    const page = await fetchPaidPaymentsByPaidAt({
      after,
      first: 100,
      billingReasons: ["subscription_create"],
    });
    let reachedOlderPayments = false;

    for (const payment of page.data) {
      if (isBeforeRange(paymentPaidAt(payment), from)) {
        reachedOlderPayments = true;
        break;
      }

      if (
        !(await shouldIncludeSubscriptionSignupPayment(
          payment,
          planCache,
          getPlan,
          from,
          to,
        ))
      ) {
        continue;
      }

      const key = signupDedupeKey(payment);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const plan = planCache.get(payment.plan!.id);
      signups.push({
        planId: payment.plan!.id,
        label: plan ? planLabel(plan) : payment.product?.title || payment.plan!.id,
      });
    }

    if (reachedOlderPayments) {
      break;
    }

    after = page.page_info.has_next_page
      ? (page.page_info.end_cursor ?? undefined)
      : undefined;
  } while (after);

  return signups;
}

export async function countSubscriptionSignups(
  from: string,
  to: string,
): Promise<number> {
  const signups = await fetchSubscriptionSignups(from, to);
  return signups.length;
}

export async function sumFilteredSubscriptionPayments(
  from: string,
  to: string,
): Promise<number> {
  const planCache = new Map<string, PlanDetails>();
  let after: string | undefined;
  let total = 0;

  do {
    const page = await fetchPaymentPage({ from, to, after, first: 100 });

    for (const payment of page.data) {
      if (await shouldIncludePayment(payment, planCache, getPlan)) {
        total += Number(payment.total) || 0;
      }
    }

    after = page.page_info.has_next_page
      ? (page.page_info.end_cursor ?? undefined)
      : undefined;
  } while (after);

  return total;
}

export async function getPayment(id: string) {
  return whopRequest<Payment>(`/payments/${id}`);
}

export async function refundPayment(id: string, amount?: number) {
  return whopRequest<Payment>(`/payments/${id}/refund`, {
    method: "POST",
    body: amount != null ? { amount } : {},
  });
}
