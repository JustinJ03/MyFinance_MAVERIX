export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurringStatus = 'active' | 'paused' | 'ended';

export interface RecurringTemplate {
  id: number;
  user_id: number;
  type: 'expense' | 'income';
  name: string;
  default_amount: number;
  category_id: number;
  account_id: number;
  frequency: RecurringFrequency;
  scheduled_day: number | null;
  next_due_date: string;
  start_date: string;
  end_date: string | null;
  status: RecurringStatus;
  remarks: string | null;
  category?: { id: number; name: string };
  account?: { id: number; nickname: string };
  created_at: string;
  updated_at: string;
}

export interface StoreRecurringPayload {
  type: 'expense' | 'income';
  name: string;
  default_amount: number;
  category_id: number;
  account_id: number;
  frequency: RecurringFrequency;
  scheduled_day?: number;
  start_date: string;
  end_date?: string;
  remarks?: string;
}
