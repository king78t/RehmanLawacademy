import { Activity, ArrowRight, Award, Bookmark, BookOpenCheck, CircleAlert, History, Target } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DeviceDataNotice } from "@/components/study/DeviceDataNotice";
import { EmptyState } from "@/components/study/EmptyState";
import { ProgressBar } from "@/components/study/ProgressBar";
import { StatCard } from "@/components/study/StatCard";
import { StarterNotice } from "@/components/study/StarterNotice";
import { StudyShell } from "@/components/study/StudyShell";
import { DEVICE_STUDY_UPDATED_EVENT, isDeviceStorageAvailable } from "@/lib/device-study-storage";
import { listAttempts } from "@/lib/quiz-data";
import { listBookmarks, listWrongQuestions, loadProgress, publishedQuestions } from "@/lib/study-data";

function DashboardContent() {
  const [data, setData] = useState<any>({ attempts: [], bookmarks: [], wrong: [], progress: null, total: 0, storageAvailable: true });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [attempts, bookmarks, wrong, progress, questions] = await Promise.all([listAttempts(), listBookmarks(), listWrongQuestions(), loadProgress(), publishedQuestions()]);
      setData({ attempts, bookmarks, wrong, progress, total: questions.length, storageAvailable: isDeviceStorageAvailable() });
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load local dashboard:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => { void load(); const refresh = () => void load(); window.addEventListener(DEVICE_STUDY_UPDATED_EVENT, refresh); return () => window.removeEventListener(DEVICE_STUDY_UPDATED_EVENT, refresh); }, [load]);

  const completed = useMemo(() => data.attempts.filter((attempt: any) => attempt.status !== "in_progress"), [data.attempts]);
  const accuracy = data.progress?.answered_count ? Math.round((data.progress.correct_count / data.progress.answered_count) * 100) : 0;
  const average = completed.length ? Math.round(completed.reduce((sum: number, item: any) => sum + Number(item.percentage || 0), 0) / completed.length) : 0;
  const best = completed.length ? Math.max(...completed.map((item: any) => Number(item.percentage || 0))) : 0;

  return <StudyShell><main className="page-wrap py-10 sm:py-14">
    {status === "loading" && <div className="surface p-7"><div className="loader-line w-1/3" /><div className="loader-line mt-4 w-2/3" /><div className="mt-8 grid gap-4 sm:grid-cols-4">{[1, 2, 3, 4].map((item) => <div className="loader-line h-24" key={item} />)}</div></div>}
    {status === "error" && <EmptyState title="Your progress could not load" description="We could not read this browser’s saved study records. Try again when your connection is ready." onRetry={load} />}
    {status === "ready" && <>
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="eyebrow">My results &amp; progress</p><h1 className="page-heading mt-3 break-words text-4xl font-bold sm:text-5xl">Your study dashboard</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">Keep the next useful action close, from your last answer to the questions you want to revisit.</p></div><StarterNotice compact /></div>
      <div className="mt-6"><DeviceDataNotice /></div>
      {!data.storageAvailable && <p className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-700" role="alert">Browser storage is unavailable right now. You can study, but this device may not keep new progress after you leave.</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Questions practised" value={data.progress?.answered_count || 0} detail={`${data.total} currently published`} icon={BookOpenCheck} /><StatCard label="Practice accuracy" value={`${accuracy}%`} detail="Across saved answers" icon={Target} tone="green" /><StatCard label="Quiz attempts" value={completed.length} detail={completed.length ? "Completed or timed out" : "No attempts yet"} icon={History} tone="gold" /><StatCard label="Average / best" value={`${average}% / ${best}%`} detail="From this device’s history" icon={Award} /></div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="surface p-6 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Continue preparation</p><h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">Pakistan Studies · Part 1</h2></div><div className="icon-tile"><Activity size={18} /></div></div><p className="mt-3 text-sm leading-6 text-slate-500">Keep working through the live starter set. Your progress is saved in this browser as you answer each question.</p><div className="mt-6"><ProgressBar value={data.total ? Math.round(((data.progress?.answered_count || 0) / data.total) * 100) : 0} label={`${data.progress?.answered_count || 0} of ${data.total} unique questions answered`} /></div><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Link to="/lat/pakistan-studies/part-1" className="button-primary">Continue practice <ArrowRight size={16} /></Link><Link to="/lat/pakistan-studies" className="button-secondary">View subject</Link></div></section><section className="surface p-6 sm:p-7"><p className="eyebrow">Your revision queue</p><h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">What needs attention?</h2><div className="mt-6 grid gap-3"><Link to="/saved" className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50"><span className="flex min-w-0 items-center gap-3"><Bookmark size={17} className="shrink-0 text-[#b28d37]" /><span className="min-w-0"><span className="block text-sm font-bold text-[#14294d]">Saved questions</span><span className="mt-1 block text-xs text-slate-500">{data.bookmarks.length} ready to revisit</span></span></span><ArrowRight size={16} className="shrink-0 text-slate-400" /></Link><Link to="/wrong" className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-rose-200 hover:bg-rose-50"><span className="flex min-w-0 items-center gap-3"><CircleAlert size={17} className="shrink-0 text-rose-500" /><span className="min-w-0"><span className="block text-sm font-bold text-[#14294d]">Wrong questions</span><span className="mt-1 block text-xs text-slate-500">{data.wrong.length} open practice records</span></span></span><ArrowRight size={16} className="shrink-0 text-slate-400" /></Link></div></section></div>
      <section className="mt-8"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Recent activity</p><h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">Quiz history</h2></div><Link to="/history" className="shrink-0 text-xs font-extrabold text-[#1766a9] hover:underline">View all</Link></div>{data.attempts.length ? <div className="mt-5 grid gap-3">{data.attempts.slice(0, 3).map((attempt: any) => { const completedAttempt = attempt.status !== "in_progress"; return <Link key={attempt.id} to={completedAttempt ? `/results/${attempt.id}` : `/lat/pakistan-studies/part-1/quiz/${attempt.id}`} className="surface surface-hover flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-[.66rem] font-extrabold uppercase tracking-[.1em] text-slate-400">{completedAttempt ? new Date(attempt.created_at || attempt.started_at).toLocaleDateString() : "In progress"}</p><h3 className="mt-1 break-words font-bold text-[#14294d]">{attempt.title}</h3><p className="mt-1 text-xs text-slate-500">{completedAttempt ? `${attempt.correct_count || 0} correct · ${attempt.question_count} questions` : `${Object.keys(attempt.answers || {}).length} answered · resume when ready`}</p></div><div className="flex shrink-0 items-center gap-4"><span className="text-2xl font-bold text-[#1766a9]">{completedAttempt ? `${attempt.percentage || 0}%` : "Resume"}</span><ArrowRight size={17} className="text-slate-400" /></div></Link>; })}</div> : <div className="mt-5"><EmptyState title="Your quiz history is ready for its first entry" description="Start the Pakistan Studies Part 1 quiz when you want a timed practice record." action="/lat/pakistan-studies" actionLabel="Open Pakistan Studies" /></div>}</section>
    </>}
  </main></StudyShell>;
}

export default DashboardContent;
