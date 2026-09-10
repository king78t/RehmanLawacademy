export function ProgressBar({ value, label, gold = false }: { value: number; label?: string; gold?: boolean }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      {label && <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-500"><span>{label}</span><span>{safe}%</span></div>}
      <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe} aria-label={label || "Progress"}>
        <div className={`progress-fill ${gold ? "progress-fill-gold" : ""}`} style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}
