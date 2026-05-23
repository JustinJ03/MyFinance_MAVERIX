export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionStatus = 'pending' | 'confirmed' | 'skipped';

export interface Transaction {
  id: number;
  user_id: number;
  type: TransactionType;
  name: string;
  amount: number;
  category_id: number | null;
  account_id: number;
  to_account_id: number | null;
  recurring_template_id: number | null;
  scheduled_date: string | null;
  actual_date: string;
  status: TransactionStatus;
  remarks: string | null;
  attachment_path: string | null;
  epf_account_number: 1 | 2 | 3 | null;
  asb_fund_id: number | null;
  category?: { id: number; name: string; parent?: { id: number; name: string } };
  account?: { id: number; nickname: string; bank_name: string; color: string | null };
  created_at: string;
  updated_at: string;
}

export interface StoreTransactionPayload {
  type: TransactionType;
  name: string;
  amount: number;
  category_id?: number;
  account_id: number;
  to_account_id?: number;
  actual_date: string;
  remarks?: string;
  epf_account_number?: 1 | 2 | 3;
  asb_fund_id?: number;
}

export interface TransactionFilters {
  type?: TransactionType;
  account_id?: number;
  category_id?: number;
  from?: string;
  to?: string;
  status?: TransactionStatus;
  page?: number;
}
