import { ArrowUpRight, HardDrive, Mail, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { StudyHeader } from "@/components/study/StudyHeader";

export function StudyShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#14294d]">
      <StudyHeader />
      {children}
      {footer && <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="page-wrap grid gap-10 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link to="/" className="font-display text-lg font-bold text-[#14294d]">RehmanLawAcademy</Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">Prepare Smart. Practice More. Succeed in LAT &amp; Law GAT. A focused study space for Pakistani law students.</p>
            <div className="mt-5 flex items-start gap-2 text-xs font-bold leading-5 text-slate-500"><Shield size={14} className="mt-0.5 shrink-0 text-[#b28d37]" /> Starter content is clearly marked for academic review.</div>
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-slate-400">Study</p>
            <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-600"><Link to="/lat" className="hover:text-[#1766a9]">LAT preparation</Link><Link to="/lat/pakistan-studies" className="hover:text-[#1766a9]">Pakistan Studies</Link><Link to="/paid-courses" className="hover:text-[#1766a9]">Paid courses</Link><Link to="/saved" className="hover:text-[#1766a9]">Saved questions</Link><Link to="/history" className="hover:text-[#1766a9]">Quiz history</Link></div>
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-slate-400">This browser</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-500"><span className="flex items-start gap-2"><HardDrive size={14} className="mt-0.5 shrink-0 text-[#1766a9]" /> Progress stays on this device.</span><span className="flex items-start gap-2"><Mail size={14} className="mt-0.5 shrink-0" /> Support space coming soon.</span><Link to="/dashboard" className="inline-flex items-center gap-1 font-bold text-[#1766a9]">View your progress <ArrowUpRight size={14} /></Link></div>
          </div>
        </div>
        <div className="border-t border-slate-100 py-5"><div className="page-wrap flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 RehmanLawAcademy. All rights reserved.</span><span>Built for deliberate practice, one question at a time.</span></div></div>
      </footer>}
    </div>
  );
}
