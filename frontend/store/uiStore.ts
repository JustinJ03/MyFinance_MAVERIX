import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  balanceVisible: boolean;
  toggleSidebar: () => void;
  toggleBalanceVisibility: () => void;
  setBalanceVisible: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      balanceVisible: true,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleBalanceVisibility: () => set((s) => ({ balanceVisible: !s.balanceVisible })),
      setBalanceVisible: (v) => set({ balanceVisible: v }),
    }),
    { name: 'myfinance-ui' }
  )
);
