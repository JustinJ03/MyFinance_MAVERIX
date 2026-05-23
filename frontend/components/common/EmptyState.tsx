'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
          <Icon size={28} className="text-slate-500" />
        </div>
      )}
      <p className="text-white font-semibold text-lg mb-1">{title}</p>
      {description && <p className="text-slate-400 text-sm max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-5 bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
