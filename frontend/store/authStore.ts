import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('auth_token', token);
        set({ user, token });
      },
      clearAuth: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null });
      },
      isAuthenticated: () => !!get().token,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'myfinance-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
