import { CheckCircle2, Clock3, XCircle } from "lucide-react";

export function PaidStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const approved = normalized === "active" || normalized === "approved";
  const rejected = normalized === "rejected" || normalized === "refunded" || normalized === "suspended" || normalized === "removed";
  const Icon = approved ? CheckCircle2 : rejected ? XCircle : Clock3;
  const styles = approved ? "bg-[#effaf4] text-[#2e7655]" : rejected ? "bg-rose-50 text-rose-700" : "bg-[#fffaf0] text-[#876b25]";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[.62rem] font-extrabold uppercase tracking-[.08em] ${styles}`}><Icon size={13} /> {status}</span>;
}
