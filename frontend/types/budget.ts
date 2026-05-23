export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  period_type: 'monthly' | 'weekly';
  amount_limit: number;
  rollover: boolean;
  is_active: boolean;
  category?: { id: number; name: string; parent?: { id: number; name: string } };
  current_period?: BudgetPeriod;
  created_at: string;
  updated_at: string;
}

export interface BudgetPeriod {
  id: number;
  budget_id: number;
  period_start: string;
  period_end: string;
  amount_limit: number;
  amount_spent: number;
  percentage: number;
}

export interface BudgetOverview extends Budget {
  spent: number;
  limit: number;
  percentage: number;
  status: 'on_track' | 'warning' | 'exceeded';
}

export interface StoreBudgetPayload {
  category_id: number;
  period_type: 'monthly' | 'weekly';
  amount_limit: number;
  rollover?: boolean;
}
