'use client';

import { cn } from '@/lib/utils';

type StatusVariant = 'confirmed' | 'pending' | 'skipped' | 'active' | 'paused' | 'ended' | 'on_track' | 'warning' | 'exceeded';

const STATUS_CONFIG: Record<StatusVariant, { label: string; className: string }> = {
  confirmed:  { label: 'Confirmed',  className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pending:    { label: 'Pending',    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  skipped:    { label: 'Skipped',   className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  active:     { label: 'Active',    className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  paused:     { label: 'Paused',    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  ended:      { label: 'Ended',     className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  on_track:   { label: 'On Track',  className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  warning:    { label: 'Warning',   className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  exceeded:   { label: 'Exceeded',  className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
