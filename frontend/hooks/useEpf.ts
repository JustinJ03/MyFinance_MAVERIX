import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { EpfTransaction, EpfOverview, StoreEpfTransactionPayload } from '@/types/epf';

export function useEpfOverview() {
  return useQuery<EpfOverview>({
    queryKey: ['epf', 'overview'],
    queryFn: () => api.get('/epf').then((r) => r.data.data),
  });
}

export function useEpfTransactions(filters?: { account?: number; type?: string }) {
  return useQuery<EpfTransaction[]>({
    queryKey: ['epf', 'transactions', filters],
    queryFn: () => api.get('/epf/transactions', { params: filters }).then((r) => r.data.data),
  });
}

export function useEpfAnalytics() {
  return useQuery({
    queryKey: ['epf', 'analytics'],
    queryFn: () => api.get('/epf/analytics').then((r) => r.data.data),
  });
}

export function useEpfRetirementCalculator(params: {
  current_age: number;
  retirement_age: number;
  current_balance: number;
  monthly_contribution: number;
  annual_dividend_rate: number;
}) {
  return useQuery({
    queryKey: ['epf', 'calculator', 'retirement', params],
    queryFn: () => api.get('/epf/calculator/retirement', { params }).then((r) => r.data.data),
    enabled: Object.values(params).every((v) => v !== undefined && v !== null),
  });
}

export function useEpfSustainabilityCalculator(params: { monthly_withdrawal: number }) {
  return useQuery({
    queryKey: ['epf', 'calculator', 'sustainability', params],
    queryFn: () => api.get('/epf/calculator/sustainability', { params }).then((r) => r.data.data),
    enabled: !!params.monthly_withdrawal,
  });
}

export function useEpfComfortCalculator(params: { monthly_expenses: number }) {
  return useQuery({
    queryKey: ['epf', 'calculator', 'comfort', params],
    queryFn: () => api.get('/epf/calculator/comfort', { params }).then((r) => r.data.data),
    enabled: !!params.monthly_expenses,
  });
}

export function useCreateEpfTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StoreEpfTransactionPayload) => api.post('/epf/transactions', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epf'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateEpfTransaction(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<StoreEpfTransactionPayload>) => api.put(`/epf/transactions/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['epf'] }),
  });
}

export function useDeleteEpfTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/epf/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epf'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
