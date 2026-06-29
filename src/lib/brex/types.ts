export interface BrexTransaction {
  id: string;
  card_id: string | null;
  description: string;
  amount: {
    amount: number;
    currency: string | null;
  };
  initiated_at_date: string;
  posted_at_date: string;
  type: string | null;
  merchant: {
    raw_descriptor: string;
    mcc: string;
    country: string;
  } | null;
  card_metadata: Record<string, string> | null;
  expense_id: string | null;
}

export interface BrexListResponse {
  next_cursor: string | null;
  items: BrexTransaction[];
}

export interface CategorizedTransaction extends BrexTransaction {
  category: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  transactions: CategorizedTransaction[];
}

export interface MonthlyRecurring {
  merchant: string;
  amount: number;
  months: string[];
  category: string;
}

export interface PnlData {
  totalSpend: number;
  transactionCount: number;
  byCategory: CategorySummary[];
  recurring: MonthlyRecurring[];
  months: string[];
  monthlyTotals: { month: string; total: number }[];
  transactions: CategorizedTransaction[];
}
