import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { BankAccount, StoreBankAccountPayload } from '@/types/account';

export function useAccounts() {
  return useQuery<BankAccount[]>({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then((r) => r.data.data),
  });
}

export function useArchivedAccounts() {
  return useQuery<BankAccount[]>({
    queryKey: ['accounts', 'archived'],
    queryFn: () => api.get('/accounts/archived').then((r) => r.data.data),
  });
}

export function useAccount(id: number) {
  return useQuery<BankAccount>({
    queryKey: ['accounts', id],
    queryFn: () => api.get(`/accounts/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StoreBankAccountPayload) => api.post('/accounts', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateAccount(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<StoreBankAccountPayload>) => api.put(`/accounts/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['accounts', id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useArchiveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/accounts/${id}/archive`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRestoreAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/accounts/${id}/restore`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useAccountTransactions(accountId: number, params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['accounts', accountId, 'transactions', params],
    queryFn: () => api.get(`/accounts/${accountId}/transactions`, { params }).then((r) => r.data),
    enabled: !!accountId,
  });
}
