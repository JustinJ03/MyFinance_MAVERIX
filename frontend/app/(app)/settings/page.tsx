'use client';

import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">Settings</h2>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-300 text-sm">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-slate-500">Full Name</p>
            <p className="text-slate-200 font-medium">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Email</p>
            <p className="text-slate-200 font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Member Since</p>
            <p className="text-slate-200 font-medium">{user?.created_at?.split('T')[0]}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6 text-center py-10">
          <p className="text-slate-500 text-sm">More settings coming soon — password change, notification preferences, and more.</p>
        </CardContent>
      </Card>
    </div>
  );
}
