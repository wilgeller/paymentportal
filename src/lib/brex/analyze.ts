import { categorize } from "./categories";
import type {
  BrexTransaction,
  CategorizedTransaction,
  CategorySummary,
  MonthlyRecurring,
  PnlData,
} from "./types";

function toMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeMerchant(raw: string): string {
  return raw
    .replace(/\s*(#\d+|SQ\s*\*|TST\s*\*)/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .split(/\s{2,}|\/\//)[0]
    .trim();
}

export function filterByMonth(
  data: PnlData,
  month: string | null,
): PnlData {
  if (!month) return data;

  const filtered = data.transactions.filter((t) => {
    const d = new Date(t.posted_at_date);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return m === month;
  });

  const totalSpend =
    filtered.reduce((s, t) => s + Math.abs(t.amount.amount), 0) / 100;

  const categoryMap = new Map<string, CategorizedTransaction[]>();
  for (const t of filtered) {
    const list = categoryMap.get(t.category) ?? [];
    list.push(t);
    categoryMap.set(t.category, list);
  }

  const byCategory: CategorySummary[] = Array.from(categoryMap.entries())
    .map(([category, txns]) => ({
      category,
      total: txns.reduce((s, t) => s + Math.abs(t.amount.amount), 0) / 100,
      count: txns.length,
      transactions: txns,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    ...data,
    totalSpend,
    transactionCount: filtered.length,
    byCategory,
  };
}

export function analyze(transactions: BrexTransaction[]): PnlData {
  const purchases = transactions.filter(
    (t) => t.type === "PURCHASE" || t.type === "REFUND",
  );

  const categorized: CategorizedTransaction[] = purchases.map((t) => ({
    ...t,
    category: categorize(t.merchant?.raw_descriptor, t.merchant?.mcc),
  }));

  const totalSpend = categorized.reduce(
    (sum, t) => sum + Math.abs(t.amount.amount),
    0,
  ) / 100;

  const categoryMap = new Map<string, CategorizedTransaction[]>();
  for (const t of categorized) {
    const list = categoryMap.get(t.category) ?? [];
    list.push(t);
    categoryMap.set(t.category, list);
  }

  const byCategory: CategorySummary[] = Array.from(categoryMap.entries())
    .map(([category, txns]) => ({
      category,
      total:
        txns.reduce((s, t) => s + Math.abs(t.amount.amount), 0) / 100,
      count: txns.length,
      transactions: txns,
    }))
    .sort((a, b) => b.total - a.total);

  const months = [
    ...new Set(categorized.map((t) => toMonth(t.posted_at_date))),
  ].sort();

  const monthlyTotals = months.map((month) => ({
    month,
    total:
      categorized
        .filter((t) => toMonth(t.posted_at_date) === month)
        .reduce((s, t) => s + Math.abs(t.amount.amount), 0) / 100,
  }));

  const merchantByMonth = new Map<string, Map<string, number>>();
  const merchantCategory = new Map<string, string>();
  for (const t of categorized) {
    const name = t.merchant
      ? normalizeMerchant(t.merchant.raw_descriptor)
      : t.description.toLowerCase();
    const month = toMonth(t.posted_at_date);
    const mMap = merchantByMonth.get(name) ?? new Map<string, number>();
    mMap.set(month, (mMap.get(month) ?? 0) + Math.abs(t.amount.amount) / 100);
    merchantByMonth.set(name, mMap);
    if (!merchantCategory.has(name)) merchantCategory.set(name, t.category);
  }

  const recurring: MonthlyRecurring[] = [];
  for (const [merchant, monthMap] of merchantByMonth) {
    if (monthMap.size >= 2) {
      const amounts = [...monthMap.values()];
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      recurring.push({
        merchant,
        amount: Math.round(avg * 100) / 100,
        months: [...monthMap.keys()].sort(),
        category: merchantCategory.get(merchant) ?? "Other",
      });
    }
  }
  recurring.sort((a, b) => b.amount - a.amount);

  return {
    totalSpend,
    transactionCount: categorized.length,
    byCategory,
    recurring,
    months,
    monthlyTotals,
    transactions: categorized,
  };
}
