import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Transaction, StoreTransactionPayload, TransactionFilters } from '@/types/transaction';

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => api.get('/transactions', { params: filters }).then((r) => r.data),
  });
}

export function usePendingTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ['transactions', 'pending'],
    queryFn: () => api.get('/transactions/pending').then((r) => r.data.data),
  });
}

export function useTransactionSummary(month?: string) {
  return useQuery({
    queryKey: ['transactions', 'summary', month],
    queryFn: () => api.get('/transactions/summary', { params: month ? { month } : {} }).then((r) => r.data.data),
  });
}

export function useTransaction(id: number) {
  return useQuery<Transaction>({
    queryKey: ['transactions', id],
    queryFn: () => api.get(`/transactions/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StoreTransactionPayload) => api.post('/transactions', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useUpdateTransaction(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<StoreTransactionPayload>) => api.put(`/transactions/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useConfirmTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; actual_date?: string; amount?: number; account_id?: number }) =>
      api.patch(`/transactions/${id}/confirm`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useSkipTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/transactions/${id}/skip`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
