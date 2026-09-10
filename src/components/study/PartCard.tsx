import { CheckCircle2, ClipboardCheck, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ProgressBar } from "@/components/study/ProgressBar";

export function PartCard({
  name,
  questionCount,
  answered,
  practicePath,
  onQuiz,
}: {
  name: string;
  questionCount: number;
  answered: number;
  practicePath?: string;
  onQuiz?: () => void;
}) {
  const percent = questionCount ? Math.round((answered / questionCount) * 100) : 0;
  const available = Boolean(practicePath && questionCount > 0);
  return (
    <div className="surface surface-hover p-5">
      <div className="flex items-start justify-between gap-4">
        <div><p className="eyebrow">Focused set</p><h3 className="mt-1 font-display text-xl font-bold text-[#14294d]">{name}</h3></div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${available ? "bg-[#edf8f1] text-[#36805d]" : "bg-slate-100 text-slate-400"}`}><CheckCircle2 size={19} /></div>
      </div>
      <div className="mt-6 flex items-end justify-between gap-3"><div><p className="text-2xl font-bold text-[#14294d]">{questionCount}</p><p className="text-xs text-slate-500">published questions</p></div><p className="text-right text-xs font-bold text-slate-500">{answered} answered<br /><span className="text-[#1766a9]">{percent}% complete</span></p></div>
      <div className="mt-4"><ProgressBar value={percent} /></div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {available ? <Link to={practicePath as string} className="button-primary"><PlayCircle size={16} /> Practice</Link> : <button type="button" disabled className="button-secondary"><PlayCircle size={16} /> Practice soon</button>}
        <button type="button" className="button-secondary" onClick={onQuiz} disabled={!onQuiz || !available}><ClipboardCheck size={16} /> Timed quiz</button>
      </div>
    </div>
  );
}
