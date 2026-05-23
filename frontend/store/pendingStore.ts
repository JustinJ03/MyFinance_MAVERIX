import { create } from 'zustand';

interface PendingState {
  count: number;
  setCount: (n: number) => void;
  increment: () => void;
  decrement: () => void;
}

export const usePendingStore = create<PendingState>((set) => ({
  count: 0,
  setCount: (n) => set({ count: n }),
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}));
