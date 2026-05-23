import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { AsbFund, AsbTransaction, AsbDividend, StoreAsbFundPayload, StoreAsbTransactionPayload, StoreAsbDividendPayload } from '@/types/asb';

export function useAsbFunds() {
  return useQuery<AsbFund[]>({
    queryKey: ['asb'],
    queryFn: () => api.get('/asb').then((r) => r.data.data),
  });
}

export function useAsbFund(fundId: number) {
  return useQuery<AsbFund>({
    queryKey: ['asb', fundId],
    queryFn: () => api.get(`/asb/${fundId}`).then((r) => r.data.data),
    enabled: !!fundId,
  });
}

export function useCreateAsbFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StoreAsbFundPayload) => api.post('/asb', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asb'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteAsbFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fundId: number) => api.delete(`/asb/${fundId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asb'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAsbTransactions(fundId: number) {
  return useQuery<AsbTransaction[]>({
    queryKey: ['asb', fundId, 'transactions'],
    queryFn: () => api.get(`/asb/${fundId}/transactions`).then((r) => r.data.data),
    enabled: !!fundId,
  });
}

export function useCreateAsbTransaction(fundId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StoreAsbTransactionPayload) => api.post(`/asb/${fundId}/transactions`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asb', fundId] });
      qc.invalidateQueries({ queryKey: ['asb', fundId, 'transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteAsbTransaction(fundId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (txId: number) => api.delete(`/asb/${fundId}/transactions/${txId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asb', fundId] });
      qc.invalidateQueries({ queryKey: ['asb', fundId, 'transactions'] });
    },
  });
}

export function useAsbDividends(fundId: number) {
  return useQuery<AsbDividend[]>({
    queryKey: ['asb', fundId, 'dividends'],
    queryFn: () => api.get(`/asb/${fundId}/dividends`).then((r) => r.data.data),
    enabled: !!fundId,
  });
}

export function useCreateAsbDividend(fundId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StoreAsbDividendPayload) => api.post(`/asb/${fundId}/dividends`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asb', fundId, 'dividends'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteAsbDividend(fundId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (divId: number) => api.delete(`/asb/${fundId}/dividends/${divId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asb', fundId, 'dividends'] }),
  });
}

export function useAsbAnalytics(fundId: number) {
  return useQuery({
    queryKey: ['asb', fundId, 'analytics'],
    queryFn: () => api.get(`/asb/${fundId}/analytics`).then((r) => r.data.data),
    enabled: !!fundId,
  });
}

export function useAsbCalculator(fundId: number, params: {
  current_balance: number;
  monthly_topup: number;
  annual_dividend_rate: number;
  years: number;
}) {
  return useQuery({
    queryKey: ['asb', fundId, 'calculator', params],
    queryFn: () => api.get(`/asb/${fundId}/calculator`, { params }).then((r) => r.data.data),
    enabled: !!fundId && Object.values(params).every((v) => v !== undefined),
  });
}
