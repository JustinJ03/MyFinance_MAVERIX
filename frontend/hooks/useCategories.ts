import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Category } from '@/types/category';

export function useCategories(type?: 'expense' | 'income') {
  return useQuery<Category[]>({
    queryKey: ['categories', type],
    queryFn: () => api.get('/categories', { params: type ? { type } : {} }).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000, // categories rarely change — cache for 5 min
  });
}

export function useParentCategories(type?: 'expense' | 'income') {
  return useQuery<Category[]>({
    queryKey: ['categories', 'parents', type],
    queryFn: () => api.get('/categories/parents', { params: type ? { type } : {} }).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryChildren(parentId: number) {
  return useQuery<Category[]>({
    queryKey: ['categories', parentId, 'children'],
    queryFn: () => api.get(`/categories/${parentId}/children`).then((r) => r.data.data),
    enabled: !!parentId,
    staleTime: 5 * 60 * 1000,
  });
}
