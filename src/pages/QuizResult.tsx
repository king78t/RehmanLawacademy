import { ArrowLeft, ArrowRight, BarChart3, Check, CircleAlert, Clock3, History, RotateCcw, Target, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DeviceDataNotice } from "@/components/study/DeviceDataNotice";
import { EmptyState } from "@/components/study/EmptyState";
import { ProgressBar } from "@/components/study/ProgressBar";
import { StarterNotice } from "@/components/study/StarterNotice";
import { StudyShell } from "@/components/study/StudyShell";
import { loadAttempt, loadAttemptAnswers, loadQuestionsByIds, startQuiz } from "@/lib/quiz-data";

function ResultContent() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retaking, setRetaking] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!attemptId) { setStatus("error"); return; }
    setStatus("loading"); setMessage("");
    try {
      const loaded = await loadAttempt(attemptId);
      if (!loaded) { setStatus("error"); return; }
      if (loaded.status === "in_progress") { navigate(`/lat/pakistan-studies/part-1/quiz/${loaded.id}`, { replace: true }); return; }
      if (loaded.status !== "completed" && loaded.status !== "timed_out") { setStatus("error"); return; }
      const [answers, questions] = await Promise.all([loadAttemptAnswers(attemptId), loadQuestionsByIds(loaded.question_ids || [], loaded.part_slug)]);
      setAttempt({ ...loaded, answers, questions }); setStatus("ready");
    } catch (error) { console.error("Failed to load quiz result:", error); setStatus("error"); }
  }, [attemptId, navigate]);

  useEffect(() => { void load(); }, [load]);

  const values = useMemo(() => {
    if (!attempt) return { total: 0, attempted: 0, correct: 0, wrong: 0, unattempted: 0, percentage: 0 };
    const total = Math.max(0, Number(attempt.question_count || attempt.questions?.length || 0));
    const attempted = Math.max(0, Number(attempt.attempted_count ?? attempt.answers?.length ?? 0));
    const correct = Math.max(0, Number(attempt.correct_count ?? attempt.answers?.filter((answer: any) => answer.is_correct).length ?? 0));
    const wrong = Math.max(0, Number(attempt.wrong_count ?? attempted - correct));
    const unattempted = Math.max(0, Number(attempt.unattempted_count ?? total - attempted));
    const percentage = Math.max(0, Math.min(100, Number(attempt.percentage ?? (total ? Math.round((correct / total) * 100) : 0))));
    return { total, attempted, correct, wrong, unattempted, percentage };
  }, [attempt]);

  const retake = async () => {
    setRetaking(true); setMessage("");
    try { const next: any = await startQuiz(); if (!next?.id) throw new Error("The new quiz attempt did not return an id."); navigate(`/lat/pakistan-studies/part-1/quiz/${next.id}`); }
    catch (error) { console.error("Failed to retake quiz:", error); setRetaking(false); setMessage("A new quiz could not be started. Check that a published question is available, then try again."); }
  };

  return <StudyShell><main className="page-wrap py-10 sm:py-14">
    {status === "loading" && <div className="surface p-7"><div className="loader-line mx-auto h-36 w-36 rounded-full" /><div className="loader-line mx-auto mt-7 w-1/2" /></div>}
    {status === "error" && <EmptyState title="Result could not load" description="This saved attempt was not available. Return to your history and choose another record." action="/history" actionLabel="Open quiz history" onRetry={load} />}
    {status === "ready" && attempt && <><Link to="/history" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"><ArrowLeft size={15} /> Quiz history</Link><div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><p className="eyebrow">Saved result</p><StarterNotice compact /></div><h1 className="page-heading mt-3 break-words text-4xl font-bold sm:text-5xl">{attempt.title}</h1><p className="mt-3 text-sm text-slate-500">{attempt.status === "timed_out" ? "The timer ended and the answers saved up to that point were marked." : "Your answer record is saved on this device. Use the review to turn misses into a plan."}</p></div><div className="flex flex-wrap gap-2"><Link to={`/results/${attempt.id}/review`} className="button-secondary">Review answers <ArrowRight size={15} /></Link><button type="button" onClick={() => { void retake(); }} disabled={retaking} className="button-primary"><RotateCcw size={15} /> {retaking ? "Preparing…" : "Retake quiz"}</button></div></div><div className="mt-5"><DeviceDataNotice compact /></div>{message && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-700" role="alert">{message}</p>}<div className="mt-8 grid gap-5 lg:grid-cols-[.85fr_1.15fr]"><section className="surface flex flex-col items-center justify-center p-7 text-center sm:p-9"><div className="relative flex h-48 w-48 items-center justify-center rounded-full" style={{ background: `conic-gradient(#1766a9 ${values.percentage}%, #e8eff5 0)` }}><div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white"><span className="font-display text-4xl font-bold text-[#14294d]">{values.percentage}%</span><span className="mt-1 text-[.65rem] font-extrabold uppercase tracking-[.12em] text-slate-400">score</span></div></div><p className="mt-6 flex items-center gap-2 text-lg font-bold text-[#14294d]"><Trophy size={19} className="text-[#b28d37]" /> {values.correct} / {values.total} correct</p><p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">A practice result is a snapshot. Your review is where the next improvement starts.</p></section><section className="surface p-6 sm:p-8"><div className="flex items-center gap-3"><div className="icon-tile"><BarChart3 size={19} /></div><div><p className="eyebrow">Performance analysis</p><h2 className="mt-1 font-display text-2xl font-bold text-[#14294d]">What the attempt shows</h2></div></div><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="metric-card !bg-[#f7fbfe]"><p className="text-xs font-bold text-slate-500">Total</p><p className="mt-2 text-xl font-bold">{values.total}</p></div><div className="metric-card !bg-[#effaf4]"><p className="text-xs font-bold text-slate-500">Correct</p><p className="mt-2 text-xl font-bold text-[#2e7655]">{values.correct}</p></div><div className="metric-card !bg-[#fff4f4]"><p className="text-xs font-bold text-slate-500">Wrong</p><p className="mt-2 text-xl font-bold text-[#a63d3d]">{values.wrong}</p></div><div className="metric-card !bg-[#f7f9fb]"><p className="text-xs font-bold text-slate-500">Skipped</p><p className="mt-2 text-xl font-bold text-slate-600">{values.unattempted}</p></div></div><div className="mt-7 space-y-5"><ProgressBar value={values.total ? Math.round((values.correct / values.total) * 100) : 0} label={`Correct · ${values.correct} questions`} /><ProgressBar value={values.total ? Math.round((values.wrong / values.total) * 100) : 0} label={`Wrong · ${values.wrong} questions`} gold /><ProgressBar value={values.total ? Math.round((values.unattempted / values.total) * 100) : 0} label={`Unattempted · ${values.unattempted} questions`} /></div><div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-5 text-xs text-slate-500"><span className="flex items-center gap-2"><Clock3 size={14} /> {Math.round(Number(attempt.time_taken_seconds || 0) / 60)} minutes used</span><span className="flex items-center gap-2"><Target size={14} /> {values.attempted} answered</span><span className="flex items-center gap-2"><History size={14} /> Saved to history</span></div></section></div><div className="mt-7 grid gap-4 sm:grid-cols-3"><Link to={`/results/${attempt.id}/review`} className="surface surface-hover p-5"><Check size={18} className="text-[#36805d]" /><h2 className="mt-4 font-display text-lg font-bold text-[#14294d]">Review answers</h2><p className="mt-1 text-xs leading-5 text-slate-500">See your selection, the correct choice and the explanation.</p></Link><Link to="/wrong" className="surface surface-hover p-5"><CircleAlert size={18} className="text-rose-500" /><h2 className="mt-4 font-display text-lg font-bold text-[#14294d]">Practice wrong questions</h2><p className="mt-1 text-xs leading-5 text-slate-500">Keep missed questions in your remedial queue.</p></Link><Link to="/lat/pakistan-studies" className="surface surface-hover p-5"><ArrowRight size={18} className="text-[#1766a9]" /><h2 className="mt-4 font-display text-lg font-bold text-[#14294d]">Back to subject</h2><p className="mt-1 text-xs leading-5 text-slate-500">Choose another practice mode when you are ready.</p></Link></div></>}
  </main></StudyShell>;
}

export default function QuizResult() { return <ResultContent />; }
