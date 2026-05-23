// Malaysian banks
export const BANK_NAMES = [
  'Maybank', 'CIMB', 'RHB', 'Hong Leong Bank', 'Public Bank',
  'AmBank', 'Bank Islam', 'Bank Muamalat', 'Affin Bank', 'Alliance Bank',
  'Touch n Go eWallet', 'Boost', 'GXBank', 'BigPay', 'Setel',
  'Other',
] as const;

export const ACCOUNT_TYPES = [
  { value: 'savings',      label: 'Savings Account' },
  { value: 'current',      label: 'Current Account' },
  { value: 'credit_card',  label: 'Credit Card' },
  { value: 'e_wallet',     label: 'E-Wallet' },
  { value: 'digital_bank', label: 'Digital Bank' },
] as const;

export const ASB_FUNDS = [
  { value: 'ASB',          label: 'ASB (Amanah Saham Bumiputera)',    ceiling: 200000, bumiOnly: true  },
  { value: 'ASB2',         label: 'ASB 2 (Amanah Saham Bumiputera 2)',ceiling: 200000, bumiOnly: true  },
  { value: 'ASM',          label: 'Amanah Saham Malaysia (ASM)',       ceiling: 200000, bumiOnly: false },
  { value: 'ASM2_Wawasan', label: 'ASM 2 — Wawasan',                  ceiling: 200000, bumiOnly: false },
  { value: 'ASM3',         label: 'Amanah Saham Malaysia 3',           ceiling: 200000, bumiOnly: false },
] as const;

export const EPF_ACCOUNTS = [
  { value: 1, label: 'Account 1 — Akaun Persaraan (Retirement, 75%)' },
  { value: 2, label: 'Account 2 — Akaun Sejahtera (Flexible, 15%)' },
  { value: 3, label: 'Account 3 — Akaun Fleksibel (Liquid, 10%)' },
] as const;

export const TRANSACTION_TYPES = ['expense', 'income', 'transfer'] as const;
export const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export const BUDGET_PERIODS = ['monthly', 'weekly'] as const;

export const ACCOUNT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
] as const;
