# MyFinance 8-Hour Hackathon Sprint — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the MyFinance frontend to demo-ready state — edit forms for all entities, full EPF/ASB tracker implementations with calculators and dividends, polished UI/UX across all pages.

**Architecture:** Frontend-only sprint. All 68 backend API endpoints are complete and tested. All TanStack Query hooks (useEpf, useAsb, useRecurring, useBudgets, useAccounts, useTransactions) are already fully implemented. Pages directly inline their own query calls — the plan migrates these to hooks where easy, but prioritises shipping over refactoring. Wave order: Infrastructure → CRUD Completions (Wave 1) → UI Polish (Wave 2) → Advanced Trackers (Wave 3) → Smoke Test (Wave 4).

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query v5, Zustand, React Hook Form, Recharts, Sonner (toasts), Lucide icons

**Key facts before you start:**
- Working directory for all `npm` commands: `C:/laragon/www/MyFinance_MAVERIX/frontend`
- App runs in Docker. To restart Next.js after changes: `docker compose restart nextjs` (run from monorepo root)
- Demo login: `demo@myfinance.my` / `password`
- All shadcn/ui components already installed: button, card, dialog, sheet, input, label, select, textarea, badge, progress, tabs, separator, avatar, dropdown-menu, sonner
- `@/` maps to `frontend/` (tsconfig path alias)
- Styling convention: `bg-slate-900` cards, `bg-slate-800` inputs, `border-slate-700` input borders, `text-slate-300` labels, `text-white` values, `bg-indigo-600 hover:bg-indigo-500` primary buttons

---

## File Map

### New files
- `frontend/components/common/ConfirmDialog.tsx` — reusable confirm/delete dialog (Dialog-based)
- `frontend/hooks/useAuth.ts` — useUpdateProfile mutation

### Modified files (Wave 1)
- `frontend/store/authStore.ts` — add `setUser` method
- `frontend/app/(app)/transactions/page.tsx` — add category selector, conditional fields, edit+delete per row
- `frontend/app/(app)/accounts/page.tsx` — add edit Sheet per card
- `frontend/app/(app)/recurring/page.tsx` — add edit Sheet per template
- `frontend/app/(app)/budgets/page.tsx` — add edit Sheet + toggle button
- `frontend/app/(app)/settings/page.tsx` — add edit profile + change password forms

### Modified files (Wave 2 — polished by frontend-design skill)
- `frontend/app/(auth)/login/page.tsx`
- `frontend/app/(auth)/register/page.tsx`
- `frontend/app/(app)/dashboard/page.tsx`
- `frontend/app/(app)/accounts/page.tsx`
- `frontend/app/(app)/transactions/page.tsx`
- `frontend/app/(app)/recurring/page.tsx`
- `frontend/app/(app)/budgets/page.tsx`
- `frontend/app/(app)/epf/page.tsx`
- `frontend/app/(app)/asb/page.tsx`
- `frontend/app/(app)/settings/page.tsx`
- `frontend/components/layout/Sidebar.tsx`
- `frontend/components/layout/Topbar.tsx`

### Modified files (Wave 3)
- `frontend/app/(app)/epf/page.tsx` — full 5-tab implementation
- `frontend/app/(app)/asb/page.tsx` — add fund button + per-fund tabs

---

## PRE-SPRINT — Shared Infrastructure

### Task 1: ConfirmDialog component

**Files:**
- Create: `frontend/components/common/ConfirmDialog.tsx`

- [ ] Create the file with this exact content:

```tsx
'use client';

import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  danger = true,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-slate-400">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={danger ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}
          >
            {loading ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] Commit:
```bash
git add frontend/components/common/ConfirmDialog.tsx
git commit -m "feat: add reusable ConfirmDialog component"
```

---

### Task 2: useAuth hook + authStore.setUser

**Files:**
- Modify: `frontend/store/authStore.ts`
- Create: `frontend/hooks/useAuth.ts`

- [ ] Add `setUser` to `frontend/store/authStore.ts`. Insert into the `AuthState` interface and implementation:

In the interface, after `isAuthenticated: () => boolean;` add:
```ts
setUser: (user: User) => void;
```

In the implementation object, after `isAuthenticated: () => !!get().token,` add:
```ts
setUser: (user) => set({ user }),
```

- [ ] Create `frontend/hooks/useAuth.ts`:

```ts
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
```

- [ ] Commit:
```bash
git add frontend/store/authStore.ts frontend/hooks/useAuth.ts
git commit -m "feat: add setUser to authStore, add useAuth hook"
```

---

## WAVE 1 — Critical Fixes + Edit Forms

### Task 3: Fix transaction form — category selector + conditional fields

**Files:**
- Modify: `frontend/app/(app)/transactions/page.tsx`

The existing form is missing `category_id`, `to_account_id` (transfers), and EPF/ASB conditional fields. The categories query is already present in the file.

- [ ] In the imports at the top, add `SelectGroup, SelectLabel` to the select import:
```tsx
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
```

- [ ] Add a `useMemo` import if not present: `import { useState, useMemo } from 'react';`

- [ ] Add this computed value after the existing `const { data: categories = [] }` query (around line 43):
```tsx
const { data: asbFunds = [] } = useQuery({
  queryKey: ['asb'],
  queryFn: () => api.get('/asb').then((r) => r.data.data ?? []),
});

const groupedCategories = useMemo(() => {
  if (!txType || txType === 'transfer') return [];
  const parents = categories.filter((c: any) => c.type === txType && !c.parent_id);
  const children = categories.filter((c: any) => c.type === txType && c.parent_id);
  return parents
    .map((p: any) => ({
      parent: p,
      children: children.filter((c: any) => c.parent?.id === p.id),
    }))
    .filter((g: any) => g.children.length > 0);
}, [categories, txType]);

const watchedCategoryId = watch('category_id');
const selectedCategory = categories.find((c: any) => c.id === parseInt(watchedCategoryId));
const isEpfCategory = selectedCategory?.name?.toLowerCase().includes('epf');
const isAsbCategory = selectedCategory?.name?.toLowerCase().includes('asb');
```

- [ ] Inside the form (after the Date field, before the Remarks field), add these new fields:

```tsx
{/* Category — only for expense/income */}
{txType !== 'transfer' && (
  <div className="space-y-1.5">
    <Label className="text-slate-300">Category</Label>
    <Controller name="category_id" control={control} render={({ field }) => (
      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="Select category (optional)" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-60 overflow-y-auto">
          {groupedCategories.map((g: any) => (
            <SelectGroup key={g.parent.id}>
              <SelectLabel className="text-slate-500 text-xs px-2">{g.parent.name}</SelectLabel>
              {g.children.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    )} />
  </div>
)}

{/* To Account — transfers only */}
{txType === 'transfer' && (
  <div className="space-y-1.5">
    <Label className="text-slate-300">To Account</Label>
    <Controller name="to_account_id" control={control} rules={{ required: txType === 'transfer' }} render={({ field }) => (
      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="Destination account" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700 text-white">
          {accounts.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.nickname}</SelectItem>)}
        </SelectContent>
      </Select>
    )} />
  </div>
)}

{/* EPF account — when category matches EPF */}
{isEpfCategory && (
  <div className="space-y-1.5">
    <Label className="text-slate-300">EPF Account</Label>
    <Controller name="epf_account_number" control={control} render={({ field }) => (
      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="Select EPF account" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700 text-white">
          <SelectItem value="1">Account 1 — Akaun Persaraan</SelectItem>
          <SelectItem value="2">Account 2 — Akaun Sejahtera</SelectItem>
          <SelectItem value="3">Account 3 — Akaun Fleksibel</SelectItem>
        </SelectContent>
      </Select>
    )} />
  </div>
)}

{/* ASB fund — when category matches ASB */}
{isAsbCategory && asbFunds.length > 0 && (
  <div className="space-y-1.5">
    <Label className="text-slate-300">ASB Fund</Label>
    <Controller name="asb_fund_id" control={control} render={({ field }) => (
      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="Select ASB fund" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700 text-white">
          {asbFunds.map((f: any) => <SelectItem key={f.id} value={f.id.toString()}>{f.fund_name}</SelectItem>)}
        </SelectContent>
      </Select>
    )} />
  </div>
)}
```

- [ ] Verify in browser: open `/transactions`, click "Add Transaction", select type "Expense" — category dropdown should appear grouped by parent.

- [ ] Commit:
```bash
git add frontend/app/\(app\)/transactions/page.tsx
git commit -m "feat: add category selector and conditional fields to transaction form"
```

---

### Task 4: Transaction edit + delete per row

**Files:**
- Modify: `frontend/app/(app)/transactions/page.tsx`

- [ ] Add these state variables near the top of the component (after existing `const [open, setOpen]`):
```tsx
const [editOpen, setEditOpen] = useState(false);
const [deleteOpen, setDeleteOpen] = useState(false);
const [selectedTx, setSelectedTx] = useState<any>(null);
const { register: editReg, handleSubmit: editSubmit, control: editCtrl, reset: editReset } = useForm();
```

- [ ] Add these imports:
```tsx
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Pencil, Trash2 } from 'lucide-react';
```

- [ ] Add the edit mutation near the existing mutations:
```tsx
const updateMutation = useMutation({
  mutationFn: ({ id, ...d }: any) => api.put(`/transactions/${id}`, d),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['transactions'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['accounts'] });
    qc.invalidateQueries({ queryKey: ['budgets'] });
    setEditOpen(false);
    toast.success('Transaction updated');
  },
  onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
});

const deleteMutation = useMutation({
  mutationFn: (id: number) => api.delete(`/transactions/${id}`),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['transactions'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['accounts'] });
    qc.invalidateQueries({ queryKey: ['budgets'] });
    setDeleteOpen(false);
    toast.success('Transaction deleted');
  },
  onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
});
```

- [ ] Add a helper to open the edit sheet:
```tsx
const openEdit = (tx: any) => {
  setSelectedTx(tx);
  editReset({
    name: tx.name,
    amount: tx.amount,
    category_id: tx.category_id ?? '',
    account_id: tx.account_id,
    actual_date: tx.actual_date,
    remarks: tx.remarks ?? '',
  });
  setEditOpen(true);
};
```

- [ ] Add the edit Sheet and ConfirmDialog BEFORE the closing `</div>` of the component return:
```tsx
{/* Edit Transaction Sheet */}
<Sheet open={editOpen} onOpenChange={setEditOpen}>
  <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md overflow-y-auto">
    <SheetHeader>
      <SheetTitle className="text-white">Edit Transaction</SheetTitle>
    </SheetHeader>
    <form onSubmit={editSubmit((d) => updateMutation.mutate({ id: selectedTx?.id, ...d, amount: parseFloat(d.amount) }))} className="space-y-4 mt-6">
      <div className="space-y-1.5">
        <Label className="text-slate-300">Description</Label>
        <Input {...editReg('name', { required: true })} className="bg-slate-800 border-slate-700 text-white" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-slate-300">Amount (RM)</Label>
        <Input {...editReg('amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-slate-300">Date</Label>
        <Input {...editReg('actual_date', { required: true })} type="date" className="bg-slate-800 border-slate-700 text-white" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-slate-300">Remarks</Label>
        <Textarea {...editReg('remarks')} className="bg-slate-800 border-slate-700 text-white" rows={2} />
      </div>
      <p className="text-xs text-slate-500">Type: <span className="capitalize text-slate-400">{selectedTx?.type}</span> (cannot change)</p>
      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  </SheetContent>
</Sheet>

<ConfirmDialog
  open={deleteOpen}
  title="Delete transaction?"
  description="This will reverse any balance effect on your account."
  onConfirm={() => deleteMutation.mutate(selectedTx?.id)}
  onCancel={() => setDeleteOpen(false)}
  loading={deleteMutation.isPending}
/>
```

- [ ] In the transaction row JSX, add edit and delete buttons next to the existing confirm/skip buttons. Find the `<div className="text-right">` block inside the row map and add before its closing `</div>`:
```tsx
<div className="flex gap-1 mt-1 justify-end">
  <button onClick={() => openEdit(tx)} className="text-slate-500 hover:text-indigo-400 transition-colors" title="Edit">
    <Pencil size={13} />
  </button>
  <button onClick={() => { setSelectedTx(tx); setDeleteOpen(true); }} className="text-slate-500 hover:text-red-400 transition-colors" title="Delete">
    <Trash2 size={13} />
  </button>
</div>
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/transactions/page.tsx
git commit -m "feat: add edit and delete to transaction rows"
```

---

### Task 5: Account edit Sheet

**Files:**
- Modify: `frontend/app/(app)/accounts/page.tsx`

- [ ] Add these state variables (after existing `const [open, setOpen]`):
```tsx
const [editOpen, setEditOpen] = useState(false);
const [selectedAccount, setSelectedAccount] = useState<any>(null);
const { register: editReg, handleSubmit: editSubmit, control: editCtrl, reset: editReset } = useForm();
```

- [ ] Add `Pencil` to lucide imports.

- [ ] Add import: `import ConfirmDialog from '@/components/common/ConfirmDialog';` (not needed here but good practice — accounts use archive not delete).

- [ ] Add edit mutation after the existing `archiveMutation`:
```tsx
const updateMutation = useMutation({
  mutationFn: ({ id, ...d }: any) => api.put(`/accounts/${id}`, d),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['accounts'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    setEditOpen(false);
    toast.success('Account updated');
  },
  onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
});
```

- [ ] Add helper to open edit:
```tsx
const openEdit = (acc: any) => {
  setSelectedAccount(acc);
  editReset({
    nickname: acc.nickname,
    bank_name: acc.bank_name,
    account_type: acc.account_type,
    last_four_digits: acc.last_four_digits ?? '',
    color: acc.color ?? '#6366f1',
  });
  setEditOpen(true);
};
```

- [ ] In the AccountCard JSX (the `<div className="flex gap-2 mt-4">` block), add an edit button alongside the existing archive button:
```tsx
<button
  onClick={() => openEdit(acc)}
  className="text-slate-500 hover:text-indigo-400 transition-colors"
  title="Edit account"
>
  <Pencil size={14} />
</button>
```

- [ ] Add the edit Sheet before the closing `</div>` of the return:
```tsx
<Sheet open={editOpen} onOpenChange={setEditOpen}>
  <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md">
    <SheetHeader>
      <SheetTitle className="text-white">Edit Account</SheetTitle>
    </SheetHeader>
    <form onSubmit={editSubmit((d) => updateMutation.mutate({ id: selectedAccount?.id, ...d }))} className="space-y-4 mt-6">
      <div className="space-y-1.5">
        <Label className="text-slate-300">Nickname</Label>
        <Input {...editReg('nickname', { required: true })} className="bg-slate-800 border-slate-700 text-white" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-slate-300">Bank Name</Label>
        <Controller name="bank_name" control={editCtrl} rules={{ required: true }} render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              {BANK_NAMES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-slate-300">Account Type</Label>
        <Controller name="account_type" control={editCtrl} rules={{ required: true }} render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              {ACCOUNT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-slate-300">Last 4 Digits (optional)</Label>
        <Input {...editReg('last_four_digits')} maxLength={4} className="bg-slate-800 border-slate-700 text-white" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-slate-300">Color Tag</Label>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" {...editReg('color')} value={c} className="sr-only peer" />
              <span className="w-7 h-7 rounded-full block border-2 border-transparent peer-checked:border-white peer-checked:scale-110 transition-all" style={{ background: c }} />
            </label>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  </SheetContent>
</Sheet>
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/accounts/page.tsx
git commit -m "feat: add edit sheet to account cards"
```

---

### Task 6: Recurring template edit Sheet

**Files:**
- Modify: `frontend/app/(app)/recurring/page.tsx`

Note: `useUpdateRecurring(id)` already exists in `hooks/useRecurring.ts`.

- [ ] Add state variables after existing state:
```tsx
const [editOpen, setEditOpen] = useState(false);
const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
const { register: editReg, handleSubmit: editSubmit, control: editCtrl, reset: editReset, watch: editWatch } = useForm();
const editFrequency = editWatch('frequency');
```

- [ ] Add `Pencil` to lucide imports.

- [ ] Add the mutation (uses the hook passing selectedTemplate's id):
```tsx
const updateMutation = useMutation({
  mutationFn: (d: any) => api.put(`/recurring/${selectedTemplate?.id}`, d),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['recurring-templates'] });
    setEditOpen(false);
    toast.success('Template updated');
  },
  onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
});
```

- [ ] Add helper:
```tsx
const openEdit = (t: any) => {
  setSelectedTemplate(t);
  editReset({
    name: t.name,
    default_amount: t.default_amount,
    category_id: t.category_id?.toString() ?? '',
    account_id: t.account_id?.toString() ?? '',
    frequency: t.frequency,
    scheduled_day: t.scheduled_day?.toString() ?? '',
    end_date: t.end_date ?? '',
    remarks: t.remarks ?? '',
  });
  setEditOpen(true);
};
```

- [ ] Add edit button in each template card, inside the `<div className="flex items-center gap-2 ...">` action buttons area:
```tsx
<button
  onClick={() => openEdit(t)}
  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
  title="Edit template"
>
  <Pencil size={14} />
</button>
```

- [ ] Add edit Sheet before closing `</div>` of return:
```tsx
<Sheet open={editOpen} onOpenChange={setEditOpen}>
  <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md overflow-y-auto">
    <SheetHeader>
      <SheetTitle className="text-white">Edit Template</SheetTitle>
    </SheetHeader>
    <form onSubmit={editSubmit((d) => {
      const payload: any = {
        ...d,
        default_amount: parseFloat(d.default_amount),
        account_id: parseInt(d.account_id),
      };
      if (d.category_id) payload.category_id = parseInt(d.category_id);
      if (d.frequency === 'monthly' && d.scheduled_day) payload.scheduled_day = parseInt(d.scheduled_day);
      if (!d.end_date) delete payload.end_date;
      updateMutation.mutate(payload);
    })} className="space-y-4 mt-6">
      <div className="space-y-1.5">
        <Label className="text-slate-300">Name</Label>
        <Input {...editReg('name', { required: true })} className="bg-slate-800 border-slate-700 text-white" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-slate-300">Default Amount (RM)</Label>
        <Input {...editReg('default_amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-slate-300">Account</Label>
        <Controller name="account_id" control={editCtrl} rules={{ required: true }} render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value?.toString()}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select account" /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              {accounts.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.nickname}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-slate-300">Frequency</Label>
          <Controller name="frequency" control={editCtrl} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        {editFrequency === 'monthly' && (
          <div className="space-y-1.5">
            <Label className="text-slate-300">Day of Month</Label>
            <Input {...editReg('scheduled_day')} type="number" min={1} max={31} className="bg-slate-800 border-slate-700 text-white" />
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label className="text-slate-300">End Date (optional)</Label>
        <Input {...editReg('end_date')} type="date" className="bg-slate-800 border-slate-700 text-white" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-slate-300">Remarks</Label>
        <Textarea {...editReg('remarks')} className="bg-slate-800 border-slate-700 text-white" rows={2} />
      </div>
      <p className="text-xs text-slate-500">Type: <span className="capitalize text-slate-400">{selectedTemplate?.type}</span> (cannot change)</p>
      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  </SheetContent>
</Sheet>
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/recurring/page.tsx
git commit -m "feat: add edit sheet to recurring templates"
```

---

### Task 7: Budget edit Sheet + toggle active/inactive

**Files:**
- Modify: `frontend/app/(app)/budgets/page.tsx`

Note: `useUpdateBudget(id)` and `useToggleBudget()` already exist in `hooks/useBudgets.ts`.

- [ ] Add state and form after existing state:
```tsx
const [editOpen, setEditOpen] = useState(false);
const [selectedBudget, setSelectedBudget] = useState<any>(null);
const { register: editReg, handleSubmit: editSubmit, control: editCtrl, reset: editReset } = useForm();
```

- [ ] Add mutations:
```tsx
const updateMutation = useMutation({
  mutationFn: (d: any) => api.put(`/budgets/${selectedBudget?.budget_id}`, d),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['budgets'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    setEditOpen(false);
    toast.success('Budget updated');
  },
  onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
});

const toggleMutation = useMutation({
  mutationFn: (id: number) => api.patch(`/budgets/${id}/toggle`),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['budgets'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    toast.success('Budget toggled');
  },
});
```

- [ ] Add `Pencil, Power` to lucide imports. Add `import ConfirmDialog from '@/components/common/ConfirmDialog';`

- [ ] Add helper:
```tsx
const openEdit = (b: any) => {
  setSelectedBudget(b);
  editReset({
    amount_limit: b.limit,
    period_type: b.period_type ?? 'monthly',
    rollover: b.rollover ?? false,
  });
  setEditOpen(true);
};
```

- [ ] In each BudgetCard's `CardHeader`, add edit + toggle buttons alongside the existing delete button:
```tsx
<button
  onClick={() => openEdit(b)}
  className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
  title="Edit budget"
>
  <Pencil size={16} />
</button>
<button
  onClick={() => toggleMutation.mutate(b.budget_id)}
  className={`p-1 transition-colors ${b.is_active === false ? 'text-slate-600 hover:text-green-400' : 'text-slate-500 hover:text-yellow-400'}`}
  title={b.is_active === false ? 'Activate budget' : 'Deactivate budget'}
>
  <Power size={16} />
</button>
```

- [ ] Add inactive visual: wrap the BudgetCard with a conditional opacity class:
```tsx
<Card key={b.budget_id} className={`bg-slate-900 border-slate-800 ... ${b.is_active === false ? 'opacity-50' : ''}`}>
```

- [ ] Add edit Sheet before closing `</div>`:
```tsx
<Sheet open={editOpen} onOpenChange={setEditOpen}>
  <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md">
    <SheetHeader>
      <SheetTitle className="text-white">Edit Budget</SheetTitle>
    </SheetHeader>
    <form onSubmit={editSubmit((d) => updateMutation.mutate({
      ...d,
      amount_limit: parseFloat(d.amount_limit),
    }))} className="space-y-4 mt-6">
      <div className="space-y-1.5">
        <Label className="text-slate-300">Budget Limit (RM)</Label>
        <Input {...editReg('amount_limit', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-slate-300">Period</Label>
        <Controller name="period_type" control={editCtrl} render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        )} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" {...editReg('rollover')} id="edit-rollover" className="rounded border-slate-700 text-indigo-600 bg-slate-800" />
        <Label htmlFor="edit-rollover" className="text-slate-300 text-sm cursor-pointer">Rollover unused budget</Label>
      </div>
      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  </SheetContent>
</Sheet>
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/budgets/page.tsx
git commit -m "feat: add edit sheet and toggle to budget cards"
```

---

### Task 8: Settings page — edit profile + change password

**Files:**
- Modify: `frontend/app/(app)/settings/page.tsx`

- [ ] Replace the entire file with:

```tsx
'use client';

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
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/settings/page.tsx
git commit -m "feat: add edit profile and change password to settings"
```

---

## WAVE 2 — UI/UX Polish

> **Each task in Wave 2 invokes the `frontend-design` skill.** Pass the exact prompt below to the skill. The skill will read the current file, redesign it, and write the improved version.
>
> To invoke: use the `Skill` tool with `skill: "frontend-design:frontend-design"` and the prompt as `args`.

### Task 9: Polish auth pages

- [ ] Invoke `frontend-design:frontend-design` with this prompt:

```
Redesign the MyFinance login and register pages for a high-quality fintech hackathon demo.

Files to redesign:
- frontend/app/(auth)/login/page.tsx
- frontend/app/(auth)/register/page.tsx
- frontend/app/(auth)/layout.tsx

Design direction:
- Full-viewport dark background: bg-slate-950
- Centered card: max-w-sm, bg-slate-900, border border-slate-800, rounded-2xl, shadow-2xl, p-8
- Brand mark at top: indigo square logo "M" + "MyFinance" wordmark in bold white
- Tagline below brand: "Your finances, beautifully organised" in text-slate-400
- Form inputs: bg-slate-800, border-slate-700, focus:border-indigo-500, text-white, rounded-lg
- Labels: text-slate-400 text-sm, margin-bottom 6px
- Primary button: full-width, bg-indigo-600 hover:bg-indigo-500, rounded-lg, h-11, font-semibold
- Error states: red-400 text, red-500/10 bg on the field
- Login page: email, password, "Remember me" checkbox, submit, link to register
- Register page: name, email, password, confirm password, submit, link to login
- Subtle animated gradient background or static: radial-gradient(ellipse at 20% 50%, indigo-900/20, transparent) on the page bg
- No emoji, clean minimal design
- Keep all existing functionality (form handlers, validation, API calls) — only change the visual layer

Tech: Next.js client component, Tailwind CSS v4, shadcn/ui (Input, Button, Label, Card), React Hook Form (already wired)
```

- [ ] Commit after skill completes:
```bash
git add frontend/app/\(auth\)/
git commit -m "feat: redesign auth pages with premium fintech aesthetic"
```

---

### Task 10: Polish dashboard

- [ ] Invoke `frontend-design:frontend-design` with this prompt:

```
Redesign the MyFinance dashboard page for a premium fintech hackathon demo.

File: frontend/app/(app)/dashboard/page.tsx

Current state: The page already fetches data and renders charts. It has a pending banner, net worth card, cashflow summary cards, bar chart, donut chart, budget health, recent transactions, and EPF/ASB snapshots. ALL data logic and query calls must be preserved exactly — only the visual layer changes.

Design direction:
- Net worth hero section: large gradient card (from-indigo-900/30 to-slate-900), "Total Net Worth" label in slate-400, balance in text-5xl font-black text-white, breakdown chips in a flex row
- Cashflow cards: 3 cards in a grid, each with a subtle colored top border (green/red/indigo), icon in matching tinted bg circle, amount in text-2xl bold
- Charts: keep Recharts, but style the card containers with bg-slate-900 border-slate-800, add a subtle top gradient line matching the data colour
- Pending banner: amber gradient bg, bell icon, animated pulse on the count badge
- Budget health: clean progress bars with gradient fill (use style prop), status dot indicator
- Recent transactions: each row has a type icon in a tinted circle, category pill badge, amount right-aligned
- EPF/ASB snapshot: side-by-side cards with account number pills
- Section spacing: space-y-6, cards use rounded-2xl
- No emoji in code, clean professional look
- Page max-width: max-w-7xl mx-auto

Preserve: all useQuery calls, useEffect for pending count, formatRM/formatDate utilities, balance masking logic
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/dashboard/page.tsx
git commit -m "feat: redesign dashboard with premium fintech aesthetic"
```

---

### Task 11: Polish accounts page

- [ ] Invoke `frontend-design:frontend-design` with this prompt:

```
Redesign the MyFinance accounts page.

File: frontend/app/(app)/accounts/page.tsx

Design direction:
- Account cards: rounded-2xl, 4px colored top strip (using account.color), hover:shadow-lg hover:border-slate-700 transition
- Balance: text-3xl font-black, masked when balanceVisible is false
- Bank name + account type as subtitle row
- Last 4 digits shown as "•••• XXXX" in slate-500
- Card footer: account type badge (capitalize, outline variant) + edit + archive icon buttons right-aligned
- "Add Account" button: indigo, top-right of page header
- Empty state: CreditCard icon + friendly copy, centered, py-24
- Page header: "Bank Accounts" h1 + "{n} active" subtitle in slate-400
- Grid: 1 col mobile, 2 col sm, 3 col lg

Preserve all mutations, sheet form, archive/restore logic, BANK_NAMES/ACCOUNT_TYPES/ACCOUNT_COLORS constants usage.
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/accounts/page.tsx
git commit -m "feat: redesign accounts page"
```

---

### Task 12: Polish transactions page

- [ ] Invoke `frontend-design:frontend-design` with this prompt:

```
Redesign the MyFinance transactions page.

File: frontend/app/(app)/transactions/page.tsx

Design direction:
- Transaction rows grouped by date: show date as a divider header "Today", "Yesterday", "DD MMM YYYY"
- Each row: type icon in colored circle (green=income, red=expense, blue=transfer), name + category breadcrumb, amount right-aligned (green + for income, red - for expense)
- Pending rows: amber left border, confirm (check) and skip (X) icon buttons
- Filter tabs at top: All / Pending / Expense / Income — pill style, not full-width
- Add Transaction button: top right, indigo
- Empty state: no transactions matching filter
- Status badge: small, right-aligned under amount

Preserve: all mutations, filter logic, category/EPF/ASB conditional fields added in Task 3, confirm/skip/edit/delete buttons.
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/transactions/page.tsx
git commit -m "feat: redesign transactions page with date grouping"
```

---

### Task 13: Polish recurring + budgets pages

- [ ] Invoke `frontend-design:frontend-design` with this prompt:

```
Redesign two MyFinance pages.

Files:
1. frontend/app/(app)/recurring/page.tsx
2. frontend/app/(app)/budgets/page.tsx

Recurring page design:
- Template cards: clean layout with type icon (income=green coin, expense=red arrow), name bold, frequency + account subtitle
- Status badge: Active=green, Paused=yellow, Ended=slate — pill style top-right of card
- Amount: text-xl font-bold right-aligned, frequency label below in slate-500
- Next due date: calendar chip at bottom
- Action buttons: pause/resume/edit/delete icons, subtle icon buttons
- Empty state: refresh icon + "No recurring templates"

Budgets page design:
- Budget cards: 2-col grid, each card has category name header, period badge
- Progress bar: gradient fill from budget status colour (green/yellow/red), h-2.5, rounded-full
- Spent amount: large text-2xl font-black, "/ limit" in slate-400
- Status indicator: coloured dot + text bottom of card
- Inactive budgets: opacity-60, "Inactive" badge overlay
- Edit + toggle + delete icon buttons in card header
- Empty state: target icon + "No budgets set"

Preserve all mutations, hooks, edit sheets added in Tasks 6 and 7.
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/recurring/page.tsx frontend/app/\(app\)/budgets/page.tsx
git commit -m "feat: redesign recurring and budgets pages"
```

---

### Task 14: Polish sidebar + topbar

- [ ] Invoke `frontend-design:frontend-design` with this prompt:

```
Redesign the MyFinance sidebar and topbar.

Files:
1. frontend/components/layout/Sidebar.tsx
2. frontend/components/layout/Topbar.tsx

Sidebar design:
- Width: w-64 expanded, w-16 collapsed
- Background: bg-slate-950 border-r border-slate-800/60
- Logo section: h-16 border-b border-slate-800/40, "M" in indigo-500 rounded-lg, "MyFinance" wordmark
- Nav items: rounded-lg, active = bg-indigo-600/15 text-indigo-400 border border-indigo-500/20, hover = bg-slate-800/60
- Section label above EPF/ASB group: "Investments" in text-slate-600 text-xs uppercase tracking-wider (shown when expanded)
- Bottom: logout in red-500/10 on hover, collapse button
- Smooth transition-all duration-300 on width

Topbar design:
- h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800/60 sticky top-0 z-20
- Left: dynamic page title from pathname (Dashboard, Accounts, etc.)
- Right group: pending bell icon (with amber badge showing count from pendingStore), eye toggle for balance, user avatar dropdown (name, email, settings link, logout)
- Bell: if pendingCount > 0 show animated amber dot
- Eye: from uiStore.balanceVisible, toggles on click
- Avatar: slate-800 circle with user initial

Preserve all existing functionality: logout logic, sidebar collapse state from uiStore, pending count from pendingStore, balanceVisible toggle from uiStore.
```

- [ ] Commit:
```bash
git add frontend/components/layout/
git commit -m "feat: redesign sidebar and topbar"
```

---

### Task 15: Polish EPF + ASB + settings shells

- [ ] Invoke `frontend-design:frontend-design` with this prompt:

```
Polish the visual shells of three pages (do NOT add new functionality — Wave 3 does that).

Files:
1. frontend/app/(app)/epf/page.tsx — currently has: overview tab (account cards), transactions tab (list), calculators tab (placeholder). Polish the existing content visually.
2. frontend/app/(app)/asb/page.tsx — currently has: fund tabs with overview card per fund. Polish visually.
3. frontend/app/(app)/settings/page.tsx — already functional from Task 8. Polish the card layout.

EPF shell design:
- Tabs: pill style, indigo active
- Total balance hero card: gradient indigo/purple, large balance, last contribution date
- Account 1/2/3 cards: indigo/purple/cyan accent, percentage badge, balance in matching colour
- Tab content area: bg-slate-900 rounded-xl

ASB shell design:
- Fund tabs at top (one per fund), active = indigo
- Fund overview card: gradient purple/slate, "X units @ RM1.00/unit" subtitle, remaining capacity bar
- Near-ceiling warning: amber badge

Settings design:
- Profile card: avatar circle (user initial, indigo bg), name + email stacked, edit inline
- Password card: lock icon header
- Clean card borders, consistent spacing

Preserve all existing query calls and data rendering. Only change the visual layer.
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/epf/page.tsx frontend/app/\(app\)/asb/page.tsx frontend/app/\(app\)/settings/page.tsx
git commit -m "feat: polish EPF, ASB, settings visual shells"
```

---

## WAVE 3 — EPF Full + ASB Full

### Task 16: EPF — Transactions tab (add/delete contributions & withdrawals)

**Files:**
- Modify: `frontend/app/(app)/epf/page.tsx`

The file now has 3 tabs after Wave 2 polish. This task upgrades the Transactions tab.

All needed hooks already exist in `hooks/useEpf.ts`: `useEpfTransactions()`, `useCreateEpfTransaction()`, `useDeleteEpfTransaction()`.

- [ ] Add these imports to the EPF page:
```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateEpfTransaction, useDeleteEpfTransaction } from '@/hooks/useEpf';
```

- [ ] Add state variables at the top of the component:
```tsx
const qc = useQueryClient();
const [addTxOpen, setAddTxOpen] = useState(false);
const [deleteTxId, setDeleteTxId] = useState<number | null>(null);
const { register: txReg, handleSubmit: txSubmit, control: txCtrl, reset: txReset, watch: txWatch } = useForm({
  defaultValues: { transaction_type: 'contribution', contribution_type: 'mandatory', epf_account_number: '', date: new Date().toISOString().split('T')[0], employee_amount: '', employer_amount: '', total_amount: '', remarks: '' }
});
const txType = txWatch('transaction_type');
const contribType = txWatch('contribution_type');
const createTxMutation = useCreateEpfTransaction();
const deleteTxMutation = useDeleteEpfTransaction();
```

- [ ] The transactions tab currently fetches and lists transactions. Change the query so it filters out dividends:
```tsx
const { data: contributions = [] } = useQuery({
  queryKey: ['epf', 'transactions', 'contrib'],
  queryFn: () => api.get('/epf/transactions').then((r) =>
    (r.data.data ?? []).filter((t: any) => t.transaction_type !== 'dividend')
  ),
});
```

- [ ] Replace the Transactions `<TabsContent value="transactions">` block with:
```tsx
<TabsContent value="transactions" className="mt-4 space-y-4">
  <div className="flex justify-end">
    <Button onClick={() => { txReset(); setAddTxOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 gap-2">
      <Plus size={16} /> Add Entry
    </Button>
  </div>
  <Card className="bg-slate-900 border-slate-800">
    <CardContent className="pt-4 divide-y divide-slate-800">
      {contributions.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No contribution or withdrawal entries yet</div>
      ) : contributions.map((tx: any) => (
        <div key={tx.id} className="flex justify-between items-center py-3">
          <div>
            <p className="text-sm text-slate-200 capitalize">
              {tx.transaction_type} {tx.contribution_type ? `· ${tx.contribution_type}` : ''} · Acc {tx.epf_account_number ?? 'All'}
            </p>
            <p className="text-xs text-slate-500">{formatDate(tx.date)}</p>
            {tx.remarks && <p className="text-xs text-slate-600 mt-0.5">{tx.remarks}</p>}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-indigo-400">{balance(tx.total_amount)}</p>
            <button
              onClick={() => setDeleteTxId(tx.id)}
              className="text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>

  {/* Add Entry Sheet */}
  <Sheet open={addTxOpen} onOpenChange={setAddTxOpen}>
    <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="text-white">Add EPF Entry</SheetTitle>
      </SheetHeader>
      <form onSubmit={txSubmit((d) => {
        const payload: any = {
          transaction_type: d.transaction_type,
          date: d.date,
          remarks: d.remarks || undefined,
        };
        if (d.transaction_type === 'contribution') {
          payload.contribution_type = d.contribution_type;
          if (d.contribution_type === 'mandatory') {
            payload.employee_amount = parseFloat(d.employee_amount);
            payload.employer_amount = parseFloat(d.employer_amount);
          } else {
            payload.epf_account_number = parseInt(d.epf_account_number);
            payload.total_amount = parseFloat(d.total_amount);
          }
        } else {
          payload.epf_account_number = parseInt(d.epf_account_number);
          payload.total_amount = parseFloat(d.total_amount);
        }
        createTxMutation.mutate(payload, {
          onSuccess: () => { setAddTxOpen(false); txReset(); toast.success('Entry added'); },
          onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
        });
      })} className="space-y-4 mt-6">

        <div className="space-y-1.5">
          <Label className="text-slate-300">Entry Type</Label>
          <Controller name="transaction_type" control={txCtrl} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="contribution">Contribution</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>

        {txType === 'contribution' && (
          <div className="space-y-1.5">
            <Label className="text-slate-300">Contribution Type</Label>
            <Controller name="contribution_type" control={txCtrl} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="mandatory">Mandatory (auto-splits 75/15/10)</SelectItem>
                  <SelectItem value="voluntary">Voluntary</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
        )}

        {txType === 'contribution' && contribType === 'mandatory' ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Employee Amount (RM)</Label>
              <Input {...txReg('employee_amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Employer Amount (RM)</Label>
              <Input {...txReg('employer_amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className="text-slate-300">EPF Account</Label>
              <Controller name="epf_account_number" control={txCtrl} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="1">Account 1 — Akaun Persaraan</SelectItem>
                    <SelectItem value="2">Account 2 — Akaun Sejahtera</SelectItem>
                    <SelectItem value="3">Account 3 — Akaun Fleksibel</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Amount (RM)</Label>
              <Input {...txReg('total_amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label className="text-slate-300">Date</Label>
          <Input {...txReg('date', { required: true })} type="date" className="bg-slate-800 border-slate-700 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">Remarks (optional)</Label>
          <Textarea {...txReg('remarks')} className="bg-slate-800 border-slate-700 text-white" rows={2} />
        </div>
        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={createTxMutation.isPending}>
          {createTxMutation.isPending ? 'Adding…' : 'Add Entry'}
        </Button>
      </form>
    </SheetContent>
  </Sheet>

  <ConfirmDialog
    open={!!deleteTxId}
    title="Delete entry?"
    description="This will remove the EPF entry and adjust balances."
    onConfirm={() => deleteTxMutation.mutate(deleteTxId!, {
      onSuccess: () => { setDeleteTxId(null); toast.success('Entry deleted'); },
    })}
    onCancel={() => setDeleteTxId(null)}
    loading={deleteTxMutation.isPending}
  />
</TabsContent>
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/epf/page.tsx
git commit -m "feat: EPF transactions tab — add/delete contributions and withdrawals"
```

---

### Task 17: EPF — Dividends tab

**Files:**
- Modify: `frontend/app/(app)/epf/page.tsx`

- [ ] Add a `dividends` tab to the `<TabsList>`:
```tsx
<TabsTrigger value="dividends" className="...">Dividends</TabsTrigger>
```

- [ ] Add state for the dividends tab form:
```tsx
const [addDivOpen, setAddDivOpen] = useState(false);
const [deleteDivId, setDeleteDivId] = useState<number | null>(null);
const { register: divReg, handleSubmit: divSubmit, reset: divReset } = useForm({
  defaultValues: { epf_account_number: '', year: new Date().getFullYear().toString(), dividend_rate: '', total_amount: '', remarks: '' }
});
```

- [ ] Add dividends query (filtered):
```tsx
const { data: dividendEntries = [] } = useQuery({
  queryKey: ['epf', 'transactions', 'dividends'],
  queryFn: () => api.get('/epf/transactions').then((r) =>
    (r.data.data ?? []).filter((t: any) => t.transaction_type === 'dividend')
  ),
});
```

- [ ] Add the Dividends `<TabsContent value="dividends">` block (insert after the transactions TabsContent):
```tsx
<TabsContent value="dividends" className="mt-4 space-y-4">
  <div className="flex justify-end">
    <Button onClick={() => { divReset(); setAddDivOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 gap-2">
      <Plus size={16} /> Add Dividend
    </Button>
  </div>
  <Card className="bg-slate-900 border-slate-800">
    <CardContent className="pt-4 divide-y divide-slate-800">
      {dividendEntries.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No dividend entries yet. Add your annual EPF dividend.</div>
      ) : dividendEntries.map((tx: any) => {
        const rateMatch = tx.remarks?.match(/Rate:\s*([\d.]+)%/);
        const rate = rateMatch ? rateMatch[1] : null;
        return (
          <div key={tx.id} className="flex justify-between items-center py-3">
            <div>
              <p className="text-sm text-slate-200">Account {tx.epf_account_number} Dividend</p>
              <p className="text-xs text-slate-500">
                {tx.remarks?.replace(/Rate:[\s\d.%]+·?\s*/, '') || formatDate(tx.date)}
                {rate && <span className="ml-2 text-indigo-400 font-medium">{rate}% p.a.</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-green-400">+{balance(tx.total_amount)}</p>
              <button onClick={() => setDeleteDivId(tx.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>

  {/* Add Dividend Sheet */}
  <Sheet open={addDivOpen} onOpenChange={setAddDivOpen}>
    <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md">
      <SheetHeader>
        <SheetTitle className="text-white">Add EPF Dividend</SheetTitle>
      </SheetHeader>
      <form onSubmit={divSubmit((d) => {
        const rateStr = `Rate: ${d.dividend_rate}%`;
        const remarksStr = d.remarks ? `${rateStr} · ${d.remarks}` : rateStr;
        createTxMutation.mutate({
          transaction_type: 'dividend',
          epf_account_number: parseInt(d.epf_account_number) as 1|2|3,
          date: `${d.year}-12-31`,
          total_amount: parseFloat(d.total_amount),
          remarks: remarksStr,
        }, {
          onSuccess: () => {
            setAddDivOpen(false);
            divReset();
            toast.success('Dividend added');
            qc.invalidateQueries({ queryKey: ['epf', 'transactions', 'dividends'] });
          },
          onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
        });
      })} className="space-y-4 mt-6">
        <div className="space-y-1.5">
          <Label className="text-slate-300">EPF Account</Label>
          <select {...divReg('epf_account_number', { required: true })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm">
            <option value="">Select account</option>
            <option value="1">Account 1 — Akaun Persaraan</option>
            <option value="2">Account 2 — Akaun Sejahtera</option>
            <option value="3">Account 3 — Akaun Fleksibel</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300">Year</Label>
            <Input {...divReg('year', { required: true })} type="number" min={2000} max={2099} className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Dividend Rate (%)</Label>
            <Input {...divReg('dividend_rate', { required: true })} type="number" step="0.01" placeholder="5.50" className="bg-slate-800 border-slate-700 text-white" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">Total Dividend Amount (RM)</Label>
          <Input {...divReg('total_amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">Remarks (optional)</Label>
          <Input {...divReg('remarks')} placeholder="e.g. FY2024 annual dividend" className="bg-slate-800 border-slate-700 text-white" />
        </div>
        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={createTxMutation.isPending}>
          {createTxMutation.isPending ? 'Adding…' : 'Add Dividend'}
        </Button>
      </form>
    </SheetContent>
  </Sheet>

  <ConfirmDialog
    open={!!deleteDivId}
    title="Delete dividend entry?"
    onConfirm={() => deleteTxMutation.mutate(deleteDivId!, {
      onSuccess: () => { setDeleteDivId(null); toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['epf', 'transactions', 'dividends'] }); },
    })}
    onCancel={() => setDeleteDivId(null)}
    loading={deleteTxMutation.isPending}
  />
</TabsContent>
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/epf/page.tsx
git commit -m "feat: EPF dividends tab — manual dividend insertion"
```

---

### Task 18: EPF — Analytics tab

**Files:**
- Modify: `frontend/app/(app)/epf/page.tsx`

All hooks already exist: `useEpfAnalytics()` in `hooks/useEpf.ts` → GET `/epf/analytics`.

- [ ] Add to imports:
```tsx
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useEpfAnalytics } from '@/hooks/useEpf';
```

- [ ] Add the query:
```tsx
const { data: analytics } = useEpfAnalytics();
```

- [ ] Add or replace the `<TabsContent value="analytics">` block:
```tsx
<TabsContent value="analytics" className="mt-4 space-y-4">
  {/* Balance over time */}
  <Card className="bg-slate-900 border-slate-800">
    <CardHeader>
      <CardTitle className="text-sm text-slate-300">Balance Over Time</CardTitle>
    </CardHeader>
    <CardContent>
      {analytics?.balance_over_time?.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={analytics.balance_over_time}>
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v: any) => formatRM(v)} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Line type="monotone" dataKey="account_1" stroke="#6366f1" strokeWidth={2} dot={false} name="Account 1" />
            <Line type="monotone" dataKey="account_2" stroke="#a855f7" strokeWidth={2} dot={false} name="Account 2" />
            <Line type="monotone" dataKey="account_3" stroke="#06b6d4" strokeWidth={2} dot={false} name="Account 3" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No data yet — add contributions to see trends</div>
      )}
    </CardContent>
  </Card>

  {/* Monthly contributions */}
  <Card className="bg-slate-900 border-slate-800">
    <CardHeader>
      <CardTitle className="text-sm text-slate-300">Monthly Contributions</CardTitle>
    </CardHeader>
    <CardContent>
      {analytics?.monthly_contributions?.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={analytics.monthly_contributions} barSize={14}>
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v: any) => formatRM(v)} />
            <Bar dataKey="employee" fill="#6366f1" radius={[4,4,0,0]} name="Employee" />
            <Bar dataKey="employer" fill="#a855f7" radius={[4,4,0,0]} name="Employer" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No contribution data yet</div>
      )}
    </CardContent>
  </Card>
</TabsContent>
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/epf/page.tsx
git commit -m "feat: EPF analytics tab — balance and contribution charts"
```

---

### Task 19: EPF — Calculators tab (3 tools)

**Files:**
- Modify: `frontend/app/(app)/epf/page.tsx`

All calculator hooks already exist in `hooks/useEpf.ts`:
- `useEpfRetirementCalculator(params)` → GET `/epf/calculator/retirement`
- `useEpfSustainabilityCalculator(params)` → GET `/epf/calculator/sustainability`
- `useEpfComfortCalculator(params)` → GET `/epf/calculator/comfort`

The hooks use `enabled: Object.values(params).every(v => v !== undefined)` so they only fire when all inputs are filled.

- [ ] Add calculator state variables:
```tsx
const [retCalc, setRetCalc] = useState({ current_age: 0, retirement_age: 55, current_balance: overview?.total ?? 0, monthly_contribution: 0, annual_dividend_rate: 5.5 });
const [susCalc, setSusCalc] = useState({ monthly_withdrawal: 0 });
const [comCalc, setComCalc] = useState({ monthly_expenses: 0 });
const [retSubmitted, setRetSubmitted] = useState(false);
const [susSubmitted, setSusSubmitted] = useState(false);
const [comSubmitted, setComSubmitted] = useState(false);
```

- [ ] Add calculator queries (only fire after user submits — use `enabled` with submission flags):
```tsx
const { data: retResult, isFetching: retFetching } = useQuery({
  queryKey: ['epf', 'calc', 'retirement', retCalc],
  queryFn: () => api.get('/epf/calculator/retirement', { params: retCalc }).then(r => r.data.data),
  enabled: retSubmitted && retCalc.current_age > 0 && retCalc.monthly_contribution > 0,
});
const { data: susResult, isFetching: susFetching } = useQuery({
  queryKey: ['epf', 'calc', 'sustainability', susCalc],
  queryFn: () => api.get('/epf/calculator/sustainability', { params: susCalc }).then(r => r.data.data),
  enabled: susSubmitted && susCalc.monthly_withdrawal > 0,
});
const { data: comResult, isFetching: comFetching } = useQuery({
  queryKey: ['epf', 'calc', 'comfort', comCalc],
  queryFn: () => api.get('/epf/calculator/comfort', { params: comCalc }).then(r => r.data.data),
  enabled: comSubmitted && comCalc.monthly_expenses > 0,
});
```

- [ ] Replace the Calculators `<TabsContent value="calculators">` stub with:
```tsx
<TabsContent value="calculators" className="mt-4 space-y-4">

  {/* Retirement Calculator */}
  <Card className="bg-slate-900 border-slate-800">
    <CardHeader>
      <CardTitle className="text-sm text-slate-300">Retirement Projection</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Current Age</Label>
          <Input type="number" value={retCalc.current_age || ''} onChange={e => setRetCalc(p => ({ ...p, current_age: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Retirement Age</Label>
          <Input type="number" value={retCalc.retirement_age} onChange={e => setRetCalc(p => ({ ...p, retirement_age: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Current Balance (RM)</Label>
          <Input type="number" step="0.01" value={retCalc.current_balance || ''} onChange={e => setRetCalc(p => ({ ...p, current_balance: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Monthly Contribution (RM)</Label>
          <Input type="number" step="0.01" value={retCalc.monthly_contribution || ''} onChange={e => setRetCalc(p => ({ ...p, monthly_contribution: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-slate-400 text-xs">Annual Dividend Rate (%)</Label>
          <Input type="number" step="0.1" value={retCalc.annual_dividend_rate} onChange={e => setRetCalc(p => ({ ...p, annual_dividend_rate: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
        </div>
      </div>
      <Button onClick={() => setRetSubmitted(true)} className="bg-indigo-600 hover:bg-indigo-500 w-full" disabled={retFetching}>
        {retFetching ? 'Calculating…' : 'Calculate'}
      </Button>
      {retResult && (
        <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 space-y-2">
          <p className="text-xs text-slate-400">Projected EPF at retirement</p>
          <p className="text-3xl font-black text-white">{formatRM(retResult.projected_balance)}</p>
          <div className="flex gap-4 text-xs text-slate-400">
            <span>Total contributions: {formatRM(retResult.total_contributions)}</span>
            <span>Dividends earned: {formatRM(retResult.total_dividends)}</span>
          </div>
        </div>
      )}
    </CardContent>
  </Card>

  {/* Sustainability Calculator */}
  <Card className="bg-slate-900 border-slate-800">
    <CardHeader>
      <CardTitle className="text-sm text-slate-300">Account 3 Withdrawal Sustainability</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-slate-400 text-xs">Monthly Withdrawal Amount (RM)</Label>
        <Input type="number" step="0.01" value={susCalc.monthly_withdrawal || ''} onChange={e => setSusCalc({ monthly_withdrawal: +e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
      </div>
      <Button onClick={() => setSusSubmitted(true)} className="bg-indigo-600 hover:bg-indigo-500 w-full" disabled={susFetching}>
        {susFetching ? 'Calculating…' : 'Calculate'}
      </Button>
      {susResult && (
        <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Account 3 will last</p>
          <p className="text-2xl font-black text-white">{susResult.months_remaining} months</p>
          <p className="text-slate-400 text-sm">({(susResult.months_remaining / 12).toFixed(1)} years)</p>
        </div>
      )}
    </CardContent>
  </Card>

  {/* Comfort Analysis */}
  <Card className="bg-slate-900 border-slate-800">
    <CardHeader>
      <CardTitle className="text-sm text-slate-300">Retirement Comfort Analysis</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-slate-400 text-xs">Expected Monthly Expenses Post-Retirement (RM)</Label>
        <Input type="number" step="0.01" value={comCalc.monthly_expenses || ''} onChange={e => setComCalc({ monthly_expenses: +e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
      </div>
      <Button onClick={() => setComSubmitted(true)} className="bg-indigo-600 hover:bg-indigo-500 w-full" disabled={comFetching}>
        {comFetching ? 'Calculating…' : 'Analyse'}
      </Button>
      {comResult && (
        <div className={`border rounded-xl p-4 ${comResult.is_sufficient ? 'bg-green-900/20 border-green-500/20' : 'bg-red-900/20 border-red-500/20'}`}>
          <p className="text-xs text-slate-400 mb-1">{comResult.is_sufficient ? 'Comfortable retirement' : 'Shortfall detected'}</p>
          <p className={`text-2xl font-black ${comResult.is_sufficient ? 'text-green-400' : 'text-red-400'}`}>
            {comResult.is_sufficient ? '+' : '-'}{formatRM(Math.abs(comResult.monthly_surplus ?? comResult.monthly_shortfall ?? 0))} / mo
          </p>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/epf/page.tsx
git commit -m "feat: EPF calculators tab — retirement, sustainability, comfort"
```

---

### Task 20: ASB — Add Fund button + fix empty state

**Files:**
- Modify: `frontend/app/(app)/asb/page.tsx`

All hooks already exist in `hooks/useAsb.ts`: `useAsbFunds()`, `useCreateAsbFund()`, `useDeleteAsbFund()`.

- [ ] Add imports:
```tsx
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { ASB_FUNDS } from '@/lib/constants';
import { useCreateAsbFund } from '@/hooks/useAsb';
```

- [ ] Replace the existing `funds.length === 0` early return with proper state management:
```tsx
const [addFundOpen, setAddFundOpen] = useState(false);
const { register: fundReg, handleSubmit: fundSubmit, control: fundCtrl, reset: fundReset } = useForm();
const createFundMutation = useCreateAsbFund();
```

- [ ] Add "Add Fund" button to the page header. The page currently returns early if no funds — change it to always render the header with the button, and show empty state inside the tab area:

Replace the early return:
```tsx
// REMOVE the early return for funds.length === 0
// Instead, add an "Add Fund" button at the top that's always visible
```

Add at the top of the return JSX (before the Tabs):
```tsx
<div className="flex items-center justify-between mb-6">
  <h2 className="text-xl font-bold text-white">ASB / ASNB Tracker</h2>
  <Button onClick={() => { fundReset(); setAddFundOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 gap-2">
    <Plus size={16} /> Add Fund
  </Button>
</div>

{funds.length === 0 && (
  <div className="text-center py-20 text-slate-500">
    <p className="text-4xl mb-4">🏦</p>
    <p className="font-medium text-slate-400">No ASB funds registered</p>
    <p className="text-sm mt-1">Click "Add Fund" above to get started.</p>
  </div>
)}
```

- [ ] Add the Add Fund Sheet at the end of the return:
```tsx
<Sheet open={addFundOpen} onOpenChange={setAddFundOpen}>
  <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md">
    <SheetHeader>
      <SheetTitle className="text-white">Add ASB / ASNB Fund</SheetTitle>
    </SheetHeader>
    <form onSubmit={fundSubmit((d) => {
      createFundMutation.mutate({ fund_name: d.fund_name }, {
        onSuccess: () => { setAddFundOpen(false); fundReset(); toast.success('Fund added!'); },
        onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
      });
    })} className="space-y-4 mt-6">
      <div className="space-y-1.5">
        <Label className="text-slate-300">Fund</Label>
        <Controller name="fund_name" control={fundCtrl} rules={{ required: true }} render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Select ASNB fund" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              {ASB_FUNDS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )} />
      </div>
      <p className="text-xs text-slate-500">All ASNB funds are fixed at RM 1.00 per unit. Balance = units held.</p>
      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={createFundMutation.isPending}>
        {createFundMutation.isPending ? 'Adding…' : 'Add Fund'}
      </Button>
    </form>
  </SheetContent>
</Sheet>
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/asb/page.tsx
git commit -m "feat: ASB add fund button and improved empty state"
```

---

### Task 21: ASB — Per-fund Transactions tab

**Files:**
- Modify: `frontend/app/(app)/asb/page.tsx`

Hooks already exist: `useAsbTransactions(fundId)`, `useCreateAsbTransaction(fundId)`, `useDeleteAsbTransaction(fundId)`.

- [ ] The per-fund area currently only has an `overview` TabsContent. Extend to 4 inner tabs per fund. The outer Tabs already shows one tab per fund by `fund.fund_name`. Inside each fund's TabsContent, add inner Tabs:

Replace the fund TabsContent body. For each fund, the current content shows only the overview card. Wrap it in inner Tabs with 4 tabs: overview | transactions | dividends | calculator.

Note: In React, you cannot call hooks conditionally. Create a sub-component `AsbFundTabs` that receives `fund` as a prop so hooks can be called at the component level.

- [ ] Create a `AsbFundTabs` component at the BOTTOM of `asb/page.tsx` (before the default export) or inline as a named function:

```tsx
function AsbFundTabs({ fund, balance }: { fund: any; balance: (v: number) => string }) {
  const qc = useQueryClient();
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [deleteTxId, setDeleteTxId] = useState<number | null>(null);
  const { register: txReg, handleSubmit: txSubmit, reset: txReset } = useForm({
    defaultValues: { transaction_type: 'deposit', date: new Date().toISOString().split('T')[0], amount: '', remarks: '' }
  });

  const { data: transactions = [] } = useAsbTransactions(fund.id);
  const createTx = useCreateAsbTransaction(fund.id);
  const deleteTx = useDeleteAsbTransaction(fund.id);

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={() => { txReset(); setAddTxOpen(true); }} size="sm" className="bg-indigo-600 hover:bg-indigo-500 gap-1.5 text-xs">
          <Plus size={14} /> Add Transaction
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-4 divide-y divide-slate-800">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">No transactions yet</div>
          ) : transactions.map((tx: any) => (
            <div key={tx.id} className="flex justify-between items-center py-3">
              <div>
                <p className="text-sm text-slate-200 capitalize">{tx.transaction_type}</p>
                <p className="text-xs text-slate-500">{formatDate(tx.date)}{tx.remarks ? ` · ${tx.remarks}` : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className={`text-sm font-bold ${tx.transaction_type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.transaction_type === 'deposit' ? '+' : '-'}{balance(tx.amount)}
                </p>
                <button onClick={() => setDeleteTxId(tx.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Sheet open={addTxOpen} onOpenChange={setAddTxOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md">
          <SheetHeader><SheetTitle className="text-white">Add Transaction</SheetTitle></SheetHeader>
          <form onSubmit={txSubmit((d) => {
            createTx.mutate({ transaction_type: d.transaction_type as any, date: d.date, amount: parseFloat(d.amount), remarks: d.remarks || undefined }, {
              onSuccess: () => { setAddTxOpen(false); txReset(); toast.success('Transaction added'); },
              onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
            });
          })} className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Type</Label>
              <select {...txReg('transaction_type')} className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm">
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Amount (RM)</Label>
              <Input {...txReg('amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Date</Label>
              <Input {...txReg('date', { required: true })} type="date" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Remarks (optional)</Label>
              <Input {...txReg('remarks')} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={createTx.isPending}>
              {createTx.isPending ? 'Adding…' : 'Add Transaction'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTxId}
        title="Delete transaction?"
        onConfirm={() => deleteTx.mutate(deleteTxId!, { onSuccess: () => { setDeleteTxId(null); toast.success('Deleted'); } })}
        onCancel={() => setDeleteTxId(null)}
        loading={deleteTx.isPending}
      />
    </>
  );
}
```

- [ ] In the outer fund TabsContent, wrap the existing overview content in inner Tabs:

```tsx
{funds.map((fund: any) => (
  <TabsContent key={fund.fund_name} value={fund.fund_name} className="mt-4">
    <Tabs defaultValue="overview">
      <TabsList className="bg-slate-800 border border-slate-700 mb-4">
        {['overview', 'transactions', 'dividends', 'calculator'].map((t) => (
          <TabsTrigger key={t} value={t} className="capitalize data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs">
            {t}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview">
        {/* existing overview card for this fund */}
        <Card className="bg-gradient-to-br from-purple-900/30 to-slate-900 border-purple-500/20">
          {/* ... keep existing content ... */}
        </Card>
      </TabsContent>

      <TabsContent value="transactions">
        <AsbFundTabs fund={fund} balance={balance} />
      </TabsContent>

      <TabsContent value="dividends">
        <AsbDividendTabs fund={fund} balance={balance} />
      </TabsContent>

      <TabsContent value="calculator">
        <AsbCalculatorTab fund={fund} balance={balance} />
      </TabsContent>
    </Tabs>
  </TabsContent>
))}
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/asb/page.tsx
git commit -m "feat: ASB per-fund transactions tab"
```

---

### Task 22: ASB — Per-fund Dividends tab

**Files:**
- Modify: `frontend/app/(app)/asb/page.tsx`

Hooks already exist: `useAsbDividends(fundId)`, `useCreateAsbDividend(fundId)`, `useDeleteAsbDividend(fundId)`.

- [ ] Add `AsbDividendTabs` component to the file (alongside `AsbFundTabs`):

```tsx
function AsbDividendTabs({ fund, balance }: { fund: any; balance: (v: number) => string }) {
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { register: divReg, handleSubmit: divSubmit, reset: divReset } = useForm({
    defaultValues: { year: new Date().getFullYear().toString(), dividend_rate: '', dividend_amount: '', bonus_rate: '', bonus_amount: '' }
  });

  const { data: dividends = [] } = useAsbDividends(fund.id);
  const createDiv = useCreateAsbDividend(fund.id);
  const deleteDiv = useDeleteAsbDividend(fund.id);

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={() => { divReset(); setAddOpen(true); }} size="sm" className="bg-indigo-600 hover:bg-indigo-500 gap-1.5 text-xs">
          <Plus size={14} /> Add Dividend
        </Button>
      </div>
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-4 divide-y divide-slate-800">
          {dividends.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">No dividend records yet</div>
          ) : dividends.map((d: any) => (
            <div key={d.id} className="flex justify-between items-center py-3">
              <div>
                <p className="text-sm text-slate-200 font-medium">FY{d.year}</p>
                <p className="text-xs text-slate-500">
                  Div: {d.dividend_rate ? `${(d.dividend_rate * 100).toFixed(2)}%` : '—'}
                  {d.bonus_rate ? ` · Bonus: ${(d.bonus_rate * 100).toFixed(2)}%` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-green-400">+{balance(d.total_payout)}</p>
                <button onClick={() => setDeleteId(d.id)} className="text-slate-500 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-white w-full sm:max-w-md">
          <SheetHeader><SheetTitle className="text-white">Add Annual Dividend</SheetTitle></SheetHeader>
          <form onSubmit={divSubmit((d) => {
            const payload: any = {
              year: parseInt(d.year),
              dividend_rate: parseFloat(d.dividend_rate) / 100,
              dividend_amount: parseFloat(d.dividend_amount),
            };
            if (d.bonus_rate) payload.bonus_rate = parseFloat(d.bonus_rate) / 100;
            if (d.bonus_amount) payload.bonus_amount = parseFloat(d.bonus_amount);
            createDiv.mutate(payload, {
              onSuccess: () => { setAddOpen(false); divReset(); toast.success('Dividend added'); },
              onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed'),
            });
          })} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Year</Label>
                <Input {...divReg('year', { required: true })} type="number" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Dividend Rate (%)</Label>
                <Input {...divReg('dividend_rate', { required: true })} type="number" step="0.01" placeholder="4.50" className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Dividend Amount (RM)</Label>
              <Input {...divReg('dividend_amount', { required: true })} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Bonus Rate (%) optional</Label>
                <Input {...divReg('bonus_rate')} type="number" step="0.01" placeholder="0.00" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Bonus Amount (RM) optional</Label>
                <Input {...divReg('bonus_amount')} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={createDiv.isPending}>
              {createDiv.isPending ? 'Adding…' : 'Add Dividend'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete dividend record?"
        onConfirm={() => deleteDiv.mutate(deleteId!, { onSuccess: () => { setDeleteId(null); toast.success('Deleted'); } })}
        onCancel={() => setDeleteId(null)}
        loading={deleteDiv.isPending}
      />
    </>
  );
}
```

- [ ] Commit:
```bash
git add frontend/app/\(app\)/asb/page.tsx
git commit -m "feat: ASB per-fund dividends tab"
```

---

### Task 23: ASB — Per-fund Calculator tab

**Files:**
- Modify: `frontend/app/(app)/asb/page.tsx`

Hook already exists: `useAsbCalculator(fundId, params)` in `hooks/useAsb.ts` → GET `/asb/{fundId}/calculator`.

- [ ] Add `AsbCalculatorTab` component to the file:

```tsx
function AsbCalculatorTab({ fund, balance }: { fund: any; balance: (v: number) => string }) {
  const [params, setParams] = useState({
    current_balance: fund.units_held ?? 0,
    monthly_topup: 0,
    annual_dividend_rate: 4.5,
    years: 10,
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: result, isFetching } = useQuery({
    queryKey: ['asb', fund.id, 'calculator', params],
    queryFn: () => api.get(`/asb/${fund.id}/calculator`, { params }).then(r => r.data.data),
    enabled: submitted && params.monthly_topup > 0,
  });

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs">Current Balance (RM)</Label>
            <Input type="number" step="0.01" value={params.current_balance} onChange={e => setParams(p => ({ ...p, current_balance: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs">Monthly Top-up (RM)</Label>
            <Input type="number" step="0.01" value={params.monthly_topup || ''} onChange={e => setParams(p => ({ ...p, monthly_topup: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs">Annual Dividend Rate (%)</Label>
            <Input type="number" step="0.1" value={params.annual_dividend_rate} onChange={e => setParams(p => ({ ...p, annual_dividend_rate: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs">Projection (years)</Label>
            <Input type="number" min={1} max={50} value={params.years} onChange={e => setParams(p => ({ ...p, years: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
          </div>
        </div>
        <Button onClick={() => setSubmitted(true)} className="bg-indigo-600 hover:bg-indigo-500 w-full" disabled={isFetching}>
          {isFetching ? 'Calculating…' : 'Project Growth'}
        </Button>
        {result && (
          <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs text-slate-400">Projected balance in {params.years} years</p>
              <p className="text-3xl font-black text-white">{formatRM(result.projected_balance)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/60 rounded-lg p-3">
                <p className="text-slate-500">Total deposited</p>
                <p className="text-slate-200 font-semibold mt-0.5">{formatRM(result.total_principal_deposited)}</p>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3">
                <p className="text-slate-500">Total dividends</p>
                <p className="text-green-400 font-semibold mt-0.5">{formatRM(result.total_dividends_earned)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] Ensure `AsbCalculatorTab` is referenced in the outer Tab structure from Task 21 (it should already be wired there).

- [ ] Commit:
```bash
git add frontend/app/\(app\)/asb/page.tsx
git commit -m "feat: ASB per-fund calculator tab with compound growth projection"
```

---

## WAVE 4 — Smoke Test + Demo Prep

### Task 24: End-to-end test + TypeScript build

**No file changes — verification only.**

- [ ] Run TypeScript build check:
```bash
cd C:/laragon/www/MyFinance_MAVERIX/frontend
npm run build
```
Expected: Build succeeds with 0 errors. If TS errors appear, fix them before continuing.

- [ ] Run backend tests:
```bash
docker compose exec laravel php artisan test
```
Expected: 10 tests, 27 assertions, all green.

- [ ] Reset and seed demo data:
```bash
docker compose exec laravel php artisan migrate:fresh --seed
```

- [ ] Open `http://localhost` in browser, login with `demo@myfinance.my` / `password`.

- [ ] Smoke test checklist (verify each in browser):
  - [ ] Dashboard loads with net worth, charts, budget health, EPF/ASB snapshots
  - [ ] Accounts: Add → Edit (change nickname) → verify change persists → Archive
  - [ ] Transactions: Add expense with category → verify budget health updates on dashboard → Edit → Delete
  - [ ] Transactions: Add transfer (from/to account) → verify both balances update
  - [ ] Recurring: Add monthly template → Pause → Resume → Edit amount → End
  - [ ] Budgets: Add → check health bar → Edit limit → Toggle inactive → Toggle active
  - [ ] Settings: Edit name → confirm update in topbar → Change password (use current + new)
  - [ ] EPF: Add mandatory contribution → confirm auto-split across Acc 1/2/3 on Overview tab → Add voluntary → Add dividend (verify rate shows in list) → Check Analytics charts
  - [ ] ASB: Add fund (ASB) → Add deposit → Add dividend → Run calculator projection
  - [ ] Balance toggle (eye icon in topbar): all balances should mask/unmask
  - [ ] Pending transactions banner: add a recurring template and run `docker compose exec laravel php artisan schedule:run` → verify pending appears on dashboard
  - [ ] Empty states: check all pages show friendly messages with no data

- [ ] Final commit:
```bash
git add -A
git commit -m "chore: final wave 4 smoke test complete — hackathon ready"
```

---

## Common Troubleshooting

| Issue | Fix |
|---|---|
| Next.js changes not showing | `docker compose restart nextjs` from monorepo root |
| API 401 errors | Token expired — logout and login again |
| TypeScript error on `any` | Add explicit type cast or `as any` — do not block ship for TS strictness |
| Category select shows empty | Check that `CategorySeeder` ran — `php artisan migrate:fresh --seed` |
| EPF analytics returns empty | Need at least one EPF transaction before analytics data populates |
| ASB calculator returns empty | Need `monthly_topup > 0` — the query is disabled when it's 0 |
| Form doesn't pre-fill on edit | Check that `reset()` is called with the selected item's data |
| Balance shows wrong after confirm | TanStack Query invalidation — both `['accounts']` and `['dashboard']` must be invalidated |
