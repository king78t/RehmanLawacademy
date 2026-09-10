import { ArrowLeft, ArrowRight, BookOpenCheck, ClipboardCheck, Info, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DeviceDataNotice } from "@/components/study/DeviceDataNotice";
import { EmptyState } from "@/components/study/EmptyState";
import { PartCard } from "@/components/study/PartCard";
import { StarterNotice } from "@/components/study/StarterNotice";
import { StudyShell } from "@/components/study/StudyShell";
import { startQuiz } from "@/lib/quiz-data";
import { loadParts, loadProgress, publishedQuestions } from "@/lib/study-data";

type PartDetail = any & { questionCount: number; progress: any };

export default function PakistanStudies() {
  const [parts, setParts] = useState<PartDetail[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const records = await loadParts();
      const details = await Promise.all(records.map(async (part: any) => {
        const [questions, progress] = await Promise.all([publishedQuestions(part.slug), loadProgress(part.slug)]);
        return { ...part, questionCount: questions.length, progress };
      }));
      setParts(details);
      setTotalQuestions(details.reduce((sum, part) => sum + part.questionCount, 0));
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load Pakistan Studies:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const beginQuiz = async (partSlug = "part-1") => {
    if (partSlug !== "part-1") return;
    setStarting(true); setMessage("");
    try {
      const attempt: any = await startQuiz();
      window.location.assign(`/lat/pakistan-studies/part-1/quiz/${attempt.id}`);
    } catch (error) {
      console.error("Failed to start quiz:", error);
      setMessage("The quiz could not start. Check that at least one question is published, then try again.");
      setStarting(false);
    }
  };

  const partOne = parts.find((part) => part.slug === "part-1");
  const partOneProgress = partOne?.progress;
  const partOneCount = partOne?.questionCount || 0;

  return <StudyShell><main className="page-wrap py-10 sm:py-14">
    <Link to="/lat" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"><ArrowLeft size={15} /> LAT preparation</Link>
    {status === "loading" && <div className="surface mt-8 p-7"><div className="loader-line w-1/3" /><div className="loader-line mt-4 w-2/3" /><div className="loader-line mt-10 h-28 w-full" /></div>}
    {status === "error" && <div className="mt-8"><EmptyState title="Subject details could not load" description="The question bank did not respond. Try again when your connection is ready." onRetry={load} /></div>}
    {status === "ready" && <>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end"><div><div className="flex flex-wrap items-center gap-3"><p className="eyebrow">LAT · Pakistan Studies</p><StarterNotice compact /></div><h1 className="page-heading mt-4 break-words text-4xl font-bold sm:text-5xl">Pakistan Studies</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">A focused first bank covering key dates, institutions and milestones. Use each published part to practise, review explanations and build a repeatable study rhythm.</p></div><div className="surface bg-[#0f2349] p-6 text-white"><div className="flex items-center justify-between gap-4"><div><p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-white/50">Published starter bank</p><p className="mt-2 text-3xl font-bold">{totalQuestions} <span className="text-base font-normal text-white/[.55]">questions</span></p></div><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ddc275]/15 text-[#ddc275]"><BookOpenCheck size={22} /></div></div><p className="mt-4 text-xs leading-5 text-blue-100/[.65]">This total reflects the current database records, not a promised full bank.</p></div></div>
      <div className="mt-6"><DeviceDataNotice compact /></div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="metric-card"><p className="text-[.68rem] font-extrabold uppercase tracking-[.12em] text-slate-400">Part 1 progress</p><p className="mt-2 text-2xl font-bold text-[#14294d]">{partOneProgress?.answered_count || 0} / {partOneCount}</p><p className="mt-1 text-xs text-slate-500">unique questions answered</p></div><div className="metric-card"><p className="text-[.68rem] font-extrabold uppercase tracking-[.12em] text-slate-400">Accuracy so far</p><p className="mt-2 text-2xl font-bold text-[#14294d]">{partOneProgress?.answered_count ? Math.round(((partOneProgress.correct_count || 0) / partOneProgress.answered_count) * 100) : 0}%</p><p className="mt-1 text-xs text-slate-500">based on this browser’s saved answers</p></div><div className="metric-card"><p className="text-[.68rem] font-extrabold uppercase tracking-[.12em] text-slate-400">Study mode</p><p className="mt-2 text-lg font-bold text-[#14294d]">Open practice</p><p className="mt-1 text-xs text-slate-500">No student account required</p></div></div>
      {message && <p className="mt-5 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-700" role="alert">{message}</p>}
      <div className="mt-10 flex items-end justify-between gap-4"><div><p className="eyebrow">The first focused set</p><h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">Choose your study mode</h2></div><span className="hidden items-center gap-1.5 text-xs font-bold text-slate-400 sm:flex"><Info size={14} /> Timing is practice-only</span></div>
      {!parts.length ? <div className="mt-5"><EmptyState title="No study parts are published" description="An administrator needs to publish a part before students can practise it." /></div> : <div className="mt-5 grid gap-5 lg:grid-cols-2">{parts.map((part) => <PartCard key={part.id || part.slug} name={part.name} questionCount={part.questionCount} answered={part.progress?.answered_count || 0} practicePath={part.slug === "part-1" && part.questionCount ? "/lat/pakistan-studies/part-1" : undefined} onQuiz={part.slug === "part-1" ? () => { void beginQuiz(part.slug); } : undefined} />)}</div>}
      <div className="mt-8 rounded-2xl border border-[#eadba7] bg-[#fffaf0] p-5"><div className="flex gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#9c7b2d]" /><div><p className="text-sm font-bold text-[#765d1e]">Starter bank, clearly identified</p><p className="mt-1 text-sm leading-6 text-[#77653a]">Every starter record carries “Starter Content — For Academic Review.” These questions are practice content and are not presented as officially verified HEC or LAT questions.</p></div></div></div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Link to="/lat/pakistan-studies/part-1" className="button-primary"><BookOpenCheck size={16} /> Open Part 1 practice</Link><button type="button" onClick={() => { void beginQuiz(); }} disabled={starting || !partOneCount} className="button-secondary"><ClipboardCheck size={16} /> {starting ? "Preparing quiz…" : "Start timed quiz"}<ArrowRight size={16} /></button></div>
    </>}
  </main></StudyShell>;
}
