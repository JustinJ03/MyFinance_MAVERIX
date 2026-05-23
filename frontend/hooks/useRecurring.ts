import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { RecurringTemplate, StoreRecurringPayload } from '@/types/recurring';

export function useRecurring() {
  return useQuery<RecurringTemplate[]>({
    queryKey: ['recurring'],
    queryFn: () => api.get('/recurring').then((r) => r.data.data),
  });
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StoreRecurringPayload) => api.post('/recurring', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });
}

export function useUpdateRecurring(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<StoreRecurringPayload>) => api.put(`/recurring/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });
}

export function usePauseRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/recurring/${id}/pause`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });
}

export function useResumeRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/recurring/${id}/resume`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/recurring/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });
}
