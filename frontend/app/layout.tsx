import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MyFinance — Personal Finance Tracker',
  description: 'Track your bank accounts, expenses, income, EPF, and ASB investments in one place. Built for Malaysians.',
  keywords: ['personal finance', 'Malaysia', 'EPF', 'ASB', 'budget tracker', 'expense tracker'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
