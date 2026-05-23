import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardData, CashflowChartPoint, SpendingBreakdownItem, NetWorthData } from '@/types/dashboard';

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data.data),
  });
}

export function useNetWorth() {
  return useQuery<NetWorthData>({
    queryKey: ['dashboard', 'net-worth'],
    queryFn: () => api.get('/dashboard/net-worth').then((r) => r.data.data),
  });
}

export function useCashflowChart() {
  return useQuery<CashflowChartPoint[]>({
    queryKey: ['dashboard', 'cashflow'],
    queryFn: () => api.get('/dashboard/cashflow').then((r) => r.data.data),
  });
}

export function useSpendingBreakdown(month?: string) {
  return useQuery<SpendingBreakdownItem[]>({
    queryKey: ['dashboard', 'spending-breakdown', month],
    queryFn: () => api.get('/dashboard/spending-breakdown', { params: month ? { month } : {} }).then((r) => r.data.data),
  });
}
