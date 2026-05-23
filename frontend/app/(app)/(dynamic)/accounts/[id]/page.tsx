'use client';

export const dynamic = 'force-dynamic';

import { use, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, ArrowLeftRight, FileText, Upload, Trash2, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, useAccountTransactions } from '@/hooks/useAccounts';
import { formatRM, formatDate } from '@/lib/formatters';
import { useUiStore } from '@/store/uiStore';
import { PageLoader } from '@/components/common/LoadingSpinner';
import StatusBadge from '@/components/common/StatusBadge';
import BalanceMask from '@/components/common/BalanceMask';
import { Transaction } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import ConfirmDialog from '@/components/common/ConfirmDialog';

async function openAuthFile(url: string) {
  const res = await api.get(url, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(res.data);
  window.open(blobUrl, '_blank');
}

const TYPE_ICONS: Record<string, string> = {
  savings: '🏦', current: '🏛️', credit_card: '💳', e_wallet: '📱', digital_bank: '🔷',
};

const TxTypeIcon = ({ type }: { type: string }) => {
  if (type === 'income') return <TrendingUp size={14} className="text-emerald-400" />;
  if (type === 'expense') return <TrendingDown size={14} className="text-red-400" />;
  return <ArrowLeftRight size={14} className="text-blue-400" />;
};

function formatBytes(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const accountId = parseInt(id);
  const { balanceVisible } = useUiStore();
  const qc = useQueryClient();

  const { data: account, isLoading: loadingAccount } = useAccount(accountId);
  const { data: txData, isLoading: loadingTx } = useAccountTransactions(accountId);

  // Statements
  const { data: statements = [], isLoading: loadingStatements } = useQuery({
    queryKey: ['statements', accountId],
    queryFn: () => api.get(`/accounts/${accountId}/statements`).then((r) => r.data.data ?? []),
    enabled: !!accountId,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [periodLabel, setPeriodLabel] = useState('');
  const [deleteStatementId, setDeleteStatementId] = useState<number | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) => api.post(`/accounts/${accountId}/statements`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['statements', accountId] });
      setPeriodLabel('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Statement uploaded');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (statementId: number) => api.delete(`/accounts/${accountId}/statements/${statementId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['statements', accountId] });
      setDeleteStatementId(null);
      toast.success('Statement deleted');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Delete failed'),
  });

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) { toast.error('Please select a file'); return; }
    const fd = new FormData();
    fd.append('statement', file);
    if (periodLabel.trim()) fd.append('period_label', periodLabel.trim());
    uploadMutation.mutate(fd);
  };

  if (loadingAccount) return <PageLoader />;
  if (!account) return (
    <div className="text-center py-20 text-slate-400">Account not found.</div>
  );

  const transactions: Transaction[] = txData?.data ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/accounts" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
        <ArrowLeft size={14} /> Back to Accounts
      </Link>

      {/* Account Header Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="h-2 w-full" style={{ background: account.color ?? '#6366f1' }} />
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{TYPE_ICONS[account.account_type] ?? '🏦'}</span>
                <h1 className="text-xl font-bold text-white">{account.nickname}</h1>
              </div>
              <p className="text-slate-400 text-sm">{account.bank_name}</p>
              {account.last_four_digits && (
                <p className="text-slate-500 text-xs mt-0.5">•••• {account.last_four_digits}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Current Balance</p>
              <p className="text-3xl font-bold text-white">
                <BalanceMask value={account.current_balance} />
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Initial: {balanceVisible ? formatRM(account.initial_balance) : 'RM •••••'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Statements */}
      <div>
        <h2 className="text-white font-semibold mb-3">Bank Statements</h2>

        {/* Upload area */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs">File (PDF, JPG, PNG — max 20 MB)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs">Period Label (optional)</Label>
              <Input
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="e.g. Jan 2025"
                className="bg-slate-800 border-slate-700 text-white h-9"
              />
            </div>
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 h-9"
          >
            <Upload size={14} />
            {uploadMutation.isPending ? 'Uploading…' : 'Upload Statement'}
          </Button>
        </div>

        {/* Statement list */}
        {loadingStatements ? (
          <PageLoader />
        ) : statements.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-slate-900 rounded-xl border border-slate-800 text-sm">
            No statements uploaded yet
          </div>
        ) : (
          <div className="space-y-2">
            {(statements as any[]).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate">{s.file_name}</p>
                  <p className="text-xs text-slate-500">
                    {s.period_label && <span className="mr-2">{s.period_label}</span>}
                    {formatDate(s.created_at)}
                    {s.file_size && <span className="ml-2">{formatBytes(s.file_size)}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.period_label && (
                    <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">{s.period_label}</Badge>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        await openAuthFile(`/accounts/${accountId}/statements/${s.id}/download`);
                      } catch {
                        toast.error('Failed to open statement');
                      }
                    }}
                    className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                    title="View statement"
                  >
                    <ExternalLink size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteStatementId(s.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    title="Delete statement"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-white font-semibold mb-3">Transaction History</h2>

        {loadingTx ? (
          <PageLoader />
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
            No transactions for this account yet.
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: Transaction) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <TxTypeIcon type={tx.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{tx.name}</p>
                  <p className="text-slate-500 text-xs">
                    {tx.category?.parent ? `${tx.category.parent.name} › ` : ''}
                    {tx.category?.name ?? '—'}
                    {' · '}{formatDate(tx.actual_date)}
                  </p>
                </div>
                <StatusBadge status={tx.status as any} />
                <div className="text-right shrink-0">
                  <p className={`font-semibold text-sm ${
                    tx.type === 'income' ? 'text-emerald-400' : tx.type === 'expense' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}
                    {balanceVisible ? formatRM(tx.amount) : 'RM •••••'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteStatementId !== null}
        title="Delete statement?"
        description="This will permanently remove this bank statement file."
        onConfirm={() => deleteStatementId !== null && deleteMutation.mutate(deleteStatementId)}
        onCancel={() => setDeleteStatementId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
