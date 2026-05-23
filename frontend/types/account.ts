export type AccountType = 'savings' | 'current' | 'credit_card' | 'e_wallet' | 'digital_bank';
export type AccountStatus = 'active' | 'archived';

export interface BankAccount {
  id: number;
  user_id: number;
  nickname: string;
  bank_name: string;
  account_type: AccountType;
  last_four_digits: string | null;
  initial_balance: number;
  current_balance: number;
  color: string | null;
  hide_balance: boolean;
  bank_statement_path: string | null;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface StoreBankAccountPayload {
  nickname: string;
  bank_name: string;
  account_type: AccountType;
  last_four_digits?: string;
  initial_balance: number;
  color?: string;
}
