import { ArrowRight, Inbox, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";

export function EmptyState({
  title,
  description,
  action,
  actionLabel,
  onRetry,
}: {
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="empty-panel" role="status">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Inbox size={21} /></div>
      <h2 className="mt-5 font-display text-xl font-bold text-[#14294d]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {onRetry && <button type="button" className="button-secondary" onClick={onRetry}><RefreshCcw size={15} /> Try again</button>}
        {action && actionLabel && <Link to={action} className="button-primary">{actionLabel} <ArrowRight size={15} /></Link>}
      </div>
    </div>
  );
}
