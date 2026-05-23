export type EpfAccountNumber = 1 | 2 | 3;
export type EpfTransactionType = 'contribution' | 'withdrawal' | 'dividend';
export type EpfContributionType = 'mandatory' | 'voluntary';

export interface EpfTransaction {
  id: number;
  user_id: number;
  epf_account_number: EpfAccountNumber;
  transaction_type: EpfTransactionType;
  contribution_type: EpfContributionType | null;
  date: string;
  employee_amount: number;
  employer_amount: number;
  total_amount: number;
  linked_transaction_id: number | null;
  remarks: string | null;
  attachment_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface EpfOverview {
  account_1: number;
  account_2: number;
  account_3: number;
  total: number;
  last_contribution_date: string | null;
}

export interface EpfRetirementResult {
  projected_balance: number;
  years_to_retirement: number;
  total_contributions: number;
  total_dividends: number;
}

export interface StoreEpfTransactionPayload {
  epf_account_number?: EpfAccountNumber;
  transaction_type: EpfTransactionType;
  contribution_type?: EpfContributionType;
  date: string;
  employee_amount?: number;
  employer_amount?: number;
  total_amount?: number;
  remarks?: string;
}
