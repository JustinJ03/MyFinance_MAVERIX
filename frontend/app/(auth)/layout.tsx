export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(139,92,246,0.05) 0%, transparent 60%)'
      }} />
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-indigo-500/30 ring-1 ring-inset ring-indigo-400/20">
              M
            </div>
            <span className="text-xl font-bold tracking-tight text-white">MyFinance</span>
          </div>
          <p className="text-slate-500 text-sm">Your finances, beautifully organised</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
          {children}
        </div>

        <p className="text-center text-slate-700 text-xs mt-6">
          MyFinance &copy; {new Date().getFullYear()} · Built for FinTech Forward 2026
        </p>
      </div>
    </div>
  );
}
