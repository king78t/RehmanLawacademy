import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, detail, icon: Icon, tone = "blue" }: { label: string; value: string | number; detail?: string; icon: LucideIcon; tone?: "blue" | "gold" | "green" }) {
  const toneClass = tone === "gold" ? "bg-[#fbf5df] text-[#9c7b2d]" : tone === "green" ? "bg-[#edf8f1] text-[#36805d]" : "bg-[#eaf4fb] text-[#1766a9]";
  return <div className="metric-card"><div className="flex items-start justify-between gap-3"><div><p className="text-[.68rem] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-[#14294d]">{value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}><Icon size={18} /></div></div></div>;
}
