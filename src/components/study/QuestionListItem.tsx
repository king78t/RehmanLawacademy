import { Bookmark, CheckCircle2, CircleAlert, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { StarterNotice } from "@/components/study/StarterNotice";
import type { StudyQuestion } from "@/lib/study-types";

export function QuestionListItem({
  question,
  meta,
  onRemove,
  wrong = false,
}: {
  question: StudyQuestion;
  meta?: string;
  onRemove?: () => void;
  wrong?: boolean;
}) {
  return (
    <article className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${wrong ? "bg-rose-50 text-rose-500" : "bg-[#fbf5df] text-[#9c7b2d]"}`}>
            {wrong ? <CircleAlert size={17} /> : <Bookmark size={17} />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[.66rem] font-extrabold uppercase tracking-[.1em] text-slate-400">Pakistan Studies · Part 1</p>
              <StarterNotice compact />
            </div>
            <h2 className="mt-1 break-words font-display text-lg font-bold leading-7 text-[#14294d]">{question.question_text}</h2>
          </div>
        </div>
        {onRemove && (
          <button
            type="button"
            className="button-quiet !min-h-11 !min-w-11 !p-2 !text-slate-400 hover:!text-rose-600"
            onClick={onRemove}
            aria-label={wrong ? "Clear wrong question" : "Remove saved question"}
            title={wrong ? "Clear wrong question" : "Remove saved question"}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">{meta || "Saved for a future revision session"}</p>
        <div className="flex gap-2">
          <Link to={`/lat/pakistan-studies/part-1?q=${encodeURIComponent(question.id)}${wrong ? `&retry=${encodeURIComponent(question.id)}` : ""}`} className="button-secondary !min-h-11 !px-3 !py-2">
            <CheckCircle2 size={14} /> Practice
          </Link>
        </div>
      </div>
    </article>
  );
}
