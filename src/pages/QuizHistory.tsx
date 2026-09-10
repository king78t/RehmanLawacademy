import { ArrowRight, CalendarDays, HardDrive, History, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DeviceDataNotice } from "@/components/study/DeviceDataNotice";
import { EmptyState } from "@/components/study/EmptyState";
import { StudyShell } from "@/components/study/StudyShell";
import { DEVICE_STUDY_UPDATED_EVENT, isDeviceStorageAvailable } from "@/lib/device-study-storage";
import { listAttempts } from "@/lib/quiz-data";

export default function QuizHistory() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [storageAvailable, setStorageAvailable] = useState(true);

  const load = useCallback(async () => {
    setStatus("loading");
    setStorageAvailable(isDeviceStorageAvailable());
    try {
      setAttempts(await listAttempts());
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load quiz history:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => { void load(); };
    window.addEventListener(DEVICE_STUDY_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(DEVICE_STUDY_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [load]);

  return <StudyShell><main className="page-wrap py-10 sm:py-14">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Your local record</p><h1 className="page-heading mt-3 break-words text-4xl font-bold">Quiz history</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Completed, timed-out and resumable quizzes remain on this device. A retake creates a new record rather than overwriting the old one.</p></div><div className="icon-tile"><History size={21} /></div></div>
    <div className="mt-6"><DeviceDataNotice compact /></div>
    {!storageAvailable && <p className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900" role="alert"><HardDrive size={15} className="mt-0.5 shrink-0" /> Browser storage is unavailable, so quiz history cannot survive a refresh.</p>}
    {status === "loading" && <div className="mt-8 grid gap-3">{[1, 2, 3].map((item) => <div key={item} className="surface p-5"><div className="loader-line w-1/2" /><div className="loader-line mt-3 w-1/3" /></div>)}</div>}
    {status === "error" && <div className="mt-8"><EmptyState title="Quiz history could not load" description="Your browser-only attempts could not be read. Try again when storage is available." onRetry={load} /></div>}
    {status === "ready" && attempts.length === 0 && <div className="mt-8"><EmptyState title="Your first quiz is waiting" description="Start the Pakistan Studies Part 1 practice quiz when you are ready to make a timed record." action="/lat/pakistan-studies" actionLabel="Open Pakistan Studies" /></div>}
    {status === "ready" && attempts.length > 0 && <div className="mt-8 grid gap-4">{attempts.map((attempt) => { const completed = attempt.status !== "in_progress"; return <Link key={attempt.id} to={completed ? `/results/${attempt.id}` : `/lat/pakistan-studies/part-1/quiz/${attempt.id}`} className="surface surface-hover flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex min-w-0 items-start gap-4"><div className="icon-tile shrink-0"><Trophy size={18} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[.65rem] font-extrabold uppercase tracking-[.1em] text-slate-400">{attempt.status === "timed_out" ? "Timed out" : completed ? "Completed" : "In progress"}</p><span className="text-slate-300">·</span><p className="flex items-center gap-1 text-xs text-slate-500"><CalendarDays size={13} /> {new Date(attempt.created_at || attempt.started_at).toLocaleString()}</p></div><h2 className="mt-2 break-words font-display text-xl font-bold text-[#14294d]">{attempt.title}</h2><p className="mt-1 text-xs text-slate-500">{attempt.question_count} questions · {Math.round(Number(attempt.time_limit_seconds || 0) / 60)} minute practice limit</p></div></div><div className="flex shrink-0 items-center justify-between gap-5 border-t border-slate-100 pt-4 sm:border-0 sm:pt-0"><span className="text-2xl font-bold text-[#1766a9]">{completed ? `${attempt.percentage || 0}%` : "Resume"}</span><ArrowRight size={17} className="text-slate-400" /></div></Link>; })}</div>}
  </main></StudyShell>;
}
