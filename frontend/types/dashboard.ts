export interface DashboardData {
  net_worth: NetWorthData;
  cashflow: CashflowSummary;
  recent_transactions: RecentTransaction[];
  pending_count: number;
  budget_health: BudgetHealthItem[];
  epf_snapshot: EpfSnapshot | null;
  asb_snapshot: AsbSnapshot[];
}

export interface NetWorthData {
  total: number;
  by_type: { type: string; total: number }[];
  accounts: { id: number; nickname: string; bank_name: string; current_balance: number; color: string | null; account_type: string }[];
}

export interface CashflowSummary {
  income: number;
  expenses: number;
  net: number;
  month: string;
}

export interface CashflowChartPoint {
  month: string;
  income: number;
  expenses: number;
}

export interface SpendingBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface RecentTransaction {
  id: number;
  name: string;
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  actual_date: string;
  category?: { name: string };
  account?: { nickname: string };
}

export interface BudgetHealthItem {
  id: number;
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  status: 'on_track' | 'warning' | 'exceeded';
}

export interface EpfSnapshot {
  account_1: number;
  account_2: number;
  account_3: number;
  total: number;
  last_contribution_date: string | null;
}

export interface AsbSnapshot {
  fund_id: number;
  fund_name: string;
  units_held: number;
  last_dividend_year: number | null;
}
