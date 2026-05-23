import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (payload: {
      name?: string;
      current_password?: string;
      password?: string;
      password_confirmation?: string;
    }) => api.put('/auth/me', payload).then((r) => r.data),
    onSuccess: (data) => {
      if (data?.data) setUser(data.data);
    },
  });
}
