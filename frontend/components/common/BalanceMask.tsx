'use client';

import { useUiStore } from '@/store/uiStore';
import { formatRM } from '@/lib/formatters';

interface BalanceMaskProps {
  value: number;
  className?: string;
}

export default function BalanceMask({ value, className = '' }: BalanceMaskProps) {
  const { balanceVisible } = useUiStore();

  return (
    <span className={className}>
      {balanceVisible ? formatRM(value) : 'RM •••••'}
    </span>
  );
}
