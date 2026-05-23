import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Budget, BudgetOverview, StoreBudgetPayload } from '@/types/budget';

export function useBudgets() {
  return useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: () => api.get('/budgets').then((r) => r.data.data),
  });
}

export function useBudgetOverview() {
  return useQuery<BudgetOverview[]>({
    queryKey: ['budgets', 'overview'],
    queryFn: () => api.get('/budgets/overview').then((r) => r.data.data),
  });
}

export function useBudgetHistory(budgetId: number) {
  return useQuery({
    queryKey: ['budgets', budgetId, 'history'],
    queryFn: () => api.get(`/budgets/${budgetId}/history`).then((r) => r.data.data),
    enabled: !!budgetId,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StoreBudgetPayload) => api.post('/budgets', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useUpdateBudget(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<StoreBudgetPayload>) => api.put(`/budgets/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/budgets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useToggleBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/budgets/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}
