export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-lg font-bold shadow-lg shadow-indigo-500/30">
              M
            </div>
            <span className="text-2xl font-bold tracking-tight">MyFinance</span>
          </div>
          <p className="text-slate-400 text-sm mt-2">Your Malaysian Personal Finance Tracker</p>
        </div>
        {children}
      </div>
    </div>
  );
}
