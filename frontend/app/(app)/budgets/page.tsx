'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { formatRM } from '@/lib/formatters';
import { useUiStore } from '@/store/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Trash2, ShieldAlert, CheckCircle2, TrendingUp } from 'lucide-react';

const STATUS_COLORS = {
  on_track: 'text-green-400 border-green-500/20 bg-green-500/10',
  approaching: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10',
  exceeded: 'text-red-400 border-red-500/20 bg-red-500/10',
};

const PROGRESS_COLORS = {
  on_track: '#22c55e',
  approaching: '#eab308',
  exceeded: '#ef4444',
};

export default function BudgetsPage() {
  const qc = useQueryClient();
  const { balanceVisible } = useUiStore();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: {
      category_id: '',
      amount_limit: '',
      period_type: 'monthly',
      rollover: false,
    }
  });

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.get('/budgets/overview').then((r) => r.data.data ?? []),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data ?? []),
  });

  // Filter only parent categories and child categories that are expense types
  const expenseCategories = categories.filter((c: any) => c.type === 'expense');

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/budgets', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setOpen(false);
      reset();
      toast.success('Budget created successfully!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to create budget'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/budgets/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Budget deleted');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to delete budget'),
  });

  const balance = (v: number) => balanceVisible ? formatRM(v) : 'RM •••••';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Budget Tracker</h2>
          <p className="text-slate-400 text-sm mt-1">Set monthly or weekly limits per category</p>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
              <Plus size={16} /> Add Budget
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="text-white">Create Budget</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit((d) => createMutation.mutate({
              ...d,
              category_id: parseInt(d.category_id),
              amount_limit: parseFloat(d.amount_limit),
            }))} className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Category</Label>
                <Controller name="category_id" control={control} rules={{ required: true }} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {expenseCategories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.parent ? `${c.parent.name} → ` : ''}{c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300">Budget Limit (RM)</Label>
                <Input {...register('amount_limit', { required: true })} type="number" step="0.01" placeholder="0.00"
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300">Period Type</Label>
                <Controller name="period_type" control={control} rules={{ required: true }} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" {...register('rollover')} id="rollover" className="rounded border-slate-700 text-indigo-600 bg-slate-800 focus:ring-indigo-500 focus:ring-offset-slate-900" />
                <Label htmlFor="rollover" className="text-slate-300 text-sm cursor-pointer select-none">
                  Rollover remaining budget to next period
                </Label>
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Budget'}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : budgets.length === 0 ? (
          <Card className="col-span-full bg-slate-900 border-slate-800 py-16 text-center">
            <CardContent>
              <p className="text-4xl mb-4">🎯</p>
              <p className="font-semibold text-slate-300">No active budgets set</p>
              <p className="text-sm text-slate-500 mt-1">Create limits to keep your spending in check</p>
            </CardContent>
          </Card>
        ) : (
          budgets.map((b: any) => {
            const statusColor = STATUS_COLORS[b.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.on_track;
            const progressColor = PROGRESS_COLORS[b.status as keyof typeof PROGRESS_COLORS] ?? PROGRESS_COLORS.on_track;

            return (
              <Card key={b.budget_id} className="bg-slate-900 border-slate-800 hover:border-slate-700/60 transition-all flex flex-col justify-between">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-base text-slate-100 font-bold">{b.category}</CardTitle>
                    <span className="text-xs text-slate-500 capitalize">{b.period_type ?? 'monthly'} budget</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this budget?')) {
                        deleteMutation.mutate(b.budget_id);
                      }
                    }}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    title="Delete budget"
                  >
                    <Trash2 size={16} />
                  </button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-2xl font-black text-white">{balance(b.spent)}</span>
                      <span className="text-xs text-slate-500 ml-1">spent</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-300">Limit: {balance(b.limit)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Progress value={Math.min(b.percentage, 100)} className="h-2 bg-slate-800"
                      style={{ '--progress-color': progressColor } as any}
                    />
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{b.percentage.toFixed(0)}% used</span>
                      <span>{b.limit - b.spent >= 0 ? `${balance(b.limit - b.spent)} left` : `${balance(Math.abs(b.limit - b.spent))} over limit`}</span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold select-none ${statusColor}`}>
                    {b.status === 'exceeded' ? <ShieldAlert size={14} /> :
                     b.status === 'approaching' ? <ShieldAlert size={14} /> :
                     <CheckCircle2 size={14} />}
                    <span className="capitalize">{b.status.replace('_', ' ')}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
