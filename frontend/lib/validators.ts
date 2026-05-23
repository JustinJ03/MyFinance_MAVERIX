import { z } from 'zod';

// --- Auth ---
export const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

export const registerSchema = z.object({
  name:                  z.string().min(2, 'Name must be at least 2 characters'),
  email:                 z.string().email('Enter a valid email address'),
  password:              z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path:    ['password_confirmation'],
});

// --- Bank Account ---
export const bankAccountSchema = z.object({
  nickname:        z.string().min(1, 'Nickname is required'),
  bank_name:       z.string().min(1, 'Bank name is required'),
  account_type:    z.enum(['savings', 'current', 'credit_card', 'e_wallet', 'digital_bank']),
  last_four_digits: z.string().max(4).optional(),
  initial_balance: z.number().min(0),
  color:           z.string().optional(),
});

// --- Transaction ---
export const transactionSchema = z.object({
  type:        z.enum(['expense', 'income', 'transfer']),
  name:        z.string().min(1, 'Name is required'),
  amount:      z.number().positive('Amount must be positive'),
  category_id: z.number().optional(),
  account_id:  z.number(),
  to_account_id: z.number().optional(),
  actual_date: z.string().min(1, 'Date is required'),
  remarks:     z.string().optional(),
  epf_account_number: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  asb_fund_id: z.number().optional(),
});

// --- Recurring Template ---
export const recurringSchema = z.object({
  type:           z.enum(['expense', 'income']),
  name:           z.string().min(1, 'Name is required'),
  default_amount: z.number().positive('Amount must be positive'),
  category_id:    z.number(),
  account_id:     z.number(),
  frequency:      z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  scheduled_day:  z.number().min(1).max(31).optional(),
  start_date:     z.string().min(1, 'Start date is required'),
  end_date:       z.string().optional(),
  remarks:        z.string().optional(),
});

// --- Budget ---
export const budgetSchema = z.object({
  category_id:  z.number(),
  period_type:  z.enum(['monthly', 'weekly']),
  amount_limit: z.number().positive('Limit must be positive'),
  rollover:     z.boolean().optional(),
});

// --- EPF Transaction ---
export const epfTransactionSchema = z.object({
  transaction_type:  z.enum(['contribution', 'withdrawal', 'dividend']),
  contribution_type: z.enum(['mandatory', 'voluntary']).optional(),
  epf_account_number: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  date:              z.string().min(1, 'Date is required'),
  employee_amount:   z.number().optional(),
  employer_amount:   z.number().optional(),
  total_amount:      z.number().optional(),
  remarks:           z.string().optional(),
});

// --- ASB Transaction ---
export const asbTransactionSchema = z.object({
  transaction_type: z.enum(['deposit', 'withdrawal']),
  date:             z.string().min(1, 'Date is required'),
  amount:           z.number().positive('Amount must be positive'),
  remarks:          z.string().optional(),
});

// --- ASB Dividend ---
export const asbDividendSchema = z.object({
  year:            z.number().int().min(2000).max(2100),
  dividend_rate:   z.number().min(0).max(1),
  dividend_amount: z.number().min(0),
  bonus_rate:      z.number().optional(),
  bonus_amount:    z.number().optional(),
});

export type LoginFormData        = z.infer<typeof loginSchema>;
export type RegisterFormData     = z.infer<typeof registerSchema>;
export type BankAccountFormData  = z.infer<typeof bankAccountSchema>;
export type TransactionFormData  = z.infer<typeof transactionSchema>;
export type RecurringFormData    = z.infer<typeof recurringSchema>;
export type BudgetFormData       = z.infer<typeof budgetSchema>;
export type EpfFormData          = z.infer<typeof epfTransactionSchema>;
export type AsbTransactionData   = z.infer<typeof asbTransactionSchema>;
export type AsbDividendData      = z.infer<typeof asbDividendSchema>;
