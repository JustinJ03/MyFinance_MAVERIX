export type AsbFundName = 'ASB' | 'ASB2' | 'ASM' | 'ASM2_Wawasan' | 'ASM3';

export interface AsbFund {
  id: number;
  user_id: number;
  fund_name: AsbFundName;
  units_held: number;
  unit_ceiling: number;
  created_at: string;
  updated_at: string;
}

export interface AsbTransaction {
  id: number;
  asb_fund_id: number;
  user_id: number;
  transaction_type: 'deposit' | 'withdrawal';
  date: string;
  amount: number;
  linked_transaction_id: number | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface AsbDividend {
  id: number;
  asb_fund_id: number;
  user_id: number;
  year: number;
  dividend_rate: number;
  dividend_amount: number;
  bonus_rate: number | null;
  bonus_amount: number | null;
  total_payout: number;
  created_at: string;
  updated_at: string;
}

export interface StoreAsbFundPayload {
  fund_name: AsbFundName;
  units_held?: number;
}

export interface StoreAsbTransactionPayload {
  transaction_type: 'deposit' | 'withdrawal';
  date: string;
  amount: number;
  remarks?: string;
}

export interface StoreAsbDividendPayload {
  year: number;
  dividend_rate: number;
  dividend_amount: number;
  bonus_rate?: number;
  bonus_amount?: number;
  total_payout?: number;
}
