'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Link from 'next/link';

const schema = z.object({
  name:             z.string().min(2, 'Name must be at least 2 characters'),
  email:            z.string().email('Enter a valid email'),
  password:         z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      setAuth(res.data.data.user, res.data.data.token);
      toast.success('Account created! Welcome to MyFinance 🎉');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-sm shadow-2xl">
      <CardHeader>
        <CardTitle className="text-white text-xl">Create Account</CardTitle>
        <CardDescription className="text-slate-400">Set up your MyFinance account in seconds</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-slate-300">Full Name</Label>
            <Input id="name" placeholder="Ahmad Bin Ali" {...register('name')}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500" />
            {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500" />
            {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input id="password" type="password" placeholder="Min 8 characters" {...register('password')}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500" />
            {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password_confirmation" className="text-slate-300">Confirm Password</Label>
            <Input id="password_confirmation" type="password" placeholder="Re-enter password" {...register('password_confirmation')}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500" />
            {errors.password_confirmation && <p className="text-red-400 text-xs">{errors.password_confirmation.message}</p>}
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>

          <p className="text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
