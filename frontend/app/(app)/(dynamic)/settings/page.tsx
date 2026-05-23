'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Lock, Calendar } from 'lucide-react';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [nameEdit, setNameEdit] = useState(false);

  const nameForm = useForm({ defaultValues: { name: user?.name ?? '' } });
  const pwForm = useForm<{ current_password: string; password: string; password_confirmation: string }>();

  const updateName = useMutation({
    mutationFn: (d: { name: string }) => api.put('/auth/me', d).then((r) => r.data),
    onSuccess: (data) => {
      if (data?.data) setUser(data.data);
      setNameEdit(false);
      toast.success('Name updated');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const updatePw = useMutation({
    mutationFn: (d: any) => api.put('/auth/me', d).then((r) => r.data),
    onSuccess: () => {
      pwForm.reset();
      toast.success('Password changed successfully');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const onPwSubmit = (d: any) => {
    if (d.password !== d.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }
    updatePw.mutate(d);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-slate-400 text-sm mt-1">Manage your profile and account security</p>
      </div>

      {/* Profile */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-slate-300 text-sm flex items-center gap-2">
            <User size={14} /> Profile
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNameEdit(!nameEdit)}
            className="text-indigo-400 hover:text-indigo-300 text-xs h-7"
          >
            {nameEdit ? 'Cancel' : 'Edit'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {nameEdit ? (
            <form onSubmit={nameForm.handleSubmit((d) => updateName.mutate(d))} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Full Name</Label>
                <Input
                  {...nameForm.register('name', { required: true })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white" disabled={updateName.isPending}>
                {updateName.isPending ? 'Saving…' : 'Save Name'}
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Full Name</p>
                <p className="text-slate-200 font-medium">{user?.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-slate-200 font-medium">{user?.email}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-500" />
                <p className="text-xs text-slate-500">Member since {user?.created_at?.split('T')[0]}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-300 text-sm flex items-center gap-2">
            <Lock size={14} /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={pwForm.handleSubmit(onPwSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Current Password</Label>
              <Input
                type="password"
                {...pwForm.register('current_password', { required: true })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">New Password</Label>
              <Input
                type="password"
                {...pwForm.register('password', { required: true, minLength: 8 })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Confirm New Password</Label>
              <Input
                type="password"
                {...pwForm.register('password_confirmation', { required: true })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white w-full" disabled={updatePw.isPending}>
              {updatePw.isPending ? 'Changing…' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
