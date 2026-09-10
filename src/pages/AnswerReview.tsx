import { ArrowLeft, Check, CircleAlert, Filter, MinusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DeviceDataNotice } from "@/components/study/DeviceDataNotice";
import { EmptyState } from "@/components/study/EmptyState";
import { StarterNotice } from "@/components/study/StarterNotice";
import { StudyShell } from "@/components/study/StudyShell";
import { loadAttempt, loadAttemptAnswers, loadQuestionsByIds } from "@/lib/quiz-data";

const filters = ["all", "correct", "wrong", "unattempted"] as const;
type FilterKey = typeof filters[number];

function ReviewContent() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [attempt, setAttempt] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const filter = (filters.includes(searchParams.get("filter") as FilterKey) ? searchParams.get("filter") : "all") as FilterKey;

  const load = useCallback(async () => {
    if (!attemptId) { setStatus("error"); return; }
    setStatus("loading");
    try {
      const loaded = await loadAttempt(attemptId);
      if (!loaded) { setStatus("error"); return; }
      if (loaded.status === "in_progress") { navigate(`/lat/pakistan-studies/part-1/quiz/${loaded.id}`, { replace: true }); return; }
      if (loaded.status !== "completed" && loaded.status !== "timed_out") { setStatus("error"); return; }
      const [answers, questions] = await Promise.all([loadAttemptAnswers(attemptId), loadQuestionsByIds(loaded.question_ids || [], loaded.part_slug)]);
      setAttempt({ ...loaded, answers, questions }); setStatus("ready");
    } catch (error) { console.error("Failed to load answer review:", error); setStatus("error"); }
  }, [attemptId, navigate]);

  useEffect(() => { void load(); }, [load]);

  const rows = useMemo(() => {
    if (!attempt) return [];
    const answerMap = new Map((attempt.answers || []).map((answer: any) => [answer.question_id, answer]));
    return (attempt.questions || []).map((question: any, index: number) => {
      const answer: any = answerMap.get(question.id);
      const kind = !answer ? "unattempted" : answer.is_correct ? "correct" : "wrong";
      const storedPosition = (attempt.question_ids || []).findIndex((id: string) => id === question.id) + 1;
      return { question, answer, kind, position: storedPosition > 0 ? storedPosition : index + 1 };
    }).filter((row: any) => filter === "all" || row.kind === filter);
  }, [attempt, filter]);

  return <StudyShell><main className="page-wrap py-10 sm:py-14">{status === "loading" && <div className="surface p-7"><div className="loader-line w-1/3" /><div className="loader-line mt-7 h-36 w-full" /><div className="loader-line mt-4 h-36 w-full" /></div>}{status === "error" && <EmptyState title="Answer review could not load" description="This attempt was not available. Return to your history and try again." action="/history" actionLabel="Open quiz history" onRetry={load} />}{status === "ready" && attempt && <><Link to={`/results/${attempt.id}`} className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"><ArrowLeft size={15} /> Result summary</Link><div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><p className="eyebrow">Answer review</p><StarterNotice compact /></div><h1 className="page-heading mt-3 break-words text-4xl font-bold">Review {attempt.title}</h1><p className="mt-3 text-sm leading-6 text-slate-500">Read every explanation, then filter the list to focus on one kind of answer.</p></div><div className="text-left sm:text-right"><p className="text-2xl font-bold text-[#1766a9]">{rows.length}</p><p className="text-[.65rem] font-extrabold uppercase tracking-[.1em] text-slate-400">shown now</p></div></div><div className="mt-5"><DeviceDataNotice compact /></div>{attempt.questions?.length === 0 ? <div className="mt-7"><EmptyState title="Question records unavailable" description="The saved attempt still exists, but its question records are no longer available in the catalog." action="/history" actionLabel="Return to history" /></div> : <><div className="mt-7 flex flex-wrap gap-2">{filters.map((item) => <button type="button" key={item} aria-pressed={filter === item} className={`button-secondary !min-h-10 !px-3 !py-2 capitalize ${filter === item ? "!border-[#1766a9] !bg-[#edf7fd] !text-[#1766a9]" : ""}`} onClick={() => setSearchParams(item === "all" ? {} : { filter: item })}><Filter size={14} /> {item}</button>)}</div>{rows.length === 0 && <div className="mt-7"><EmptyState title="Nothing matches this filter" description="Choose another review filter to see more of this attempt." /></div>}{rows.length > 0 && <div className="mt-6 grid gap-4">{rows.map(({ question, answer, kind, position }: any) => <article key={question.id} className="surface p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-extrabold uppercase tracking-[.1em] text-slate-400">Question {position}</p><span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[.68rem] font-extrabold ${kind === "correct" ? "bg-[#effaf4] text-[#2e7655]" : kind === "wrong" ? "bg-[#fff4f4] text-[#a63d3d]" : "bg-slate-100 text-slate-500"}`}>{kind === "correct" ? <Check size={13} /> : kind === "wrong" ? <CircleAlert size={13} /> : <MinusCircle size={13} />} {kind}</span></div><h2 className="mt-5 break-words font-display text-xl font-bold leading-8 text-[#14294d]">{question.question_text}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className={`rounded-xl border p-4 ${kind === "correct" ? "border-[#b8dcc7] bg-[#f4fbf7]" : "border-slate-100 bg-slate-50"}`}><p className="text-[.65rem] font-extrabold uppercase tracking-[.1em] text-slate-400">Your answer</p><p className="mt-2 break-words text-sm font-bold text-slate-700">{answer ? `${answer.selected_answer}. ${question[`option_${answer.selected_answer.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d"]}` : "Not answered"}</p></div><div className="rounded-xl border border-[#b8dcc7] bg-[#f4fbf7] p-4"><p className="text-[.65rem] font-extrabold uppercase tracking-[.1em] text-[#4a8b68]">Correct answer</p><p className="mt-2 break-words text-sm font-bold text-[#2e7655]">{question.correct_answer}. {question[`option_${question.correct_answer.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d"]}</p></div></div><div className="mt-5 border-l-2 border-[#ddc275] bg-[#fffaf0] p-4"><p className="text-[.65rem] font-extrabold uppercase tracking-[.1em] text-[#9c7b2d]">Explanation</p><p className="mt-2 text-sm leading-6 text-slate-600">{question.explanation}</p></div></article>)}</div>}</>}</>}
  </main></StudyShell>;
}

export default function AnswerReview() { return <ReviewContent />; }
