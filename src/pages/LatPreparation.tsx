import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Compass, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DeviceDataNotice } from "@/components/study/DeviceDataNotice";
import { EmptyState } from "@/components/study/EmptyState";
import { StarterNotice } from "@/components/study/StarterNotice";
import { StudyShell } from "@/components/study/StudyShell";
import { SubjectCard } from "@/components/study/SubjectCard";
import { loadProgress, loadSubjects } from "@/lib/study-data";
import type { SubjectSummary } from "@/lib/study-types";
import { Question } from "@/entities";

export default function LatPreparation() {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const records: any[] = await loadSubjects();
      const summaries = await Promise.all(records.map(async (record) => {
        const questions = await Question.filter({ exam_slug: "lat", subject_slug: record.slug, is_published: true }, "sort_order", 500);
        const progress = record.slug === "pakistan-studies" ? await loadProgress() : null;
        return { ...record, question_count: questions?.length || 0, progress: progress?.answered_count && questions?.length ? Math.round((progress.answered_count / questions.length) * 100) : 0 } as SubjectSummary & { progress: number };
      }));
      setSubjects(summaries);
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load LAT subjects:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return <StudyShell><main className="page-wrap py-10 sm:py-14"><Link to="/" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"><ArrowLeft size={15} /> Home</Link><div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end"><div><p className="eyebrow">Law Admission Test</p><h1 className="page-heading mt-3 break-words text-4xl font-bold sm:text-5xl">LAT preparation, with a clear next step.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-500">Choose one subject, work through its focused parts and use your device results to decide what deserves another session. Pakistan Studies is the first live bank in Phase 1.</p></div><div className="surface bg-[#0f2349] p-6 text-white"><div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ddc275]/15 text-[#ddc275]"><Compass size={21} /></div><div className="min-w-0"><p className="text-[.62rem] font-bold uppercase tracking-[.14em] text-white/50">Phase 1 focus</p><p className="mt-1 font-display text-xl font-bold">Pakistan Studies</p></div></div><p className="mt-5 text-sm leading-6 text-blue-100/70">Start small, see your answer quality and keep building a repeatable practice habit.</p><Link to="/lat/pakistan-studies" className="button-primary mt-5 w-full !bg-[#ddc275] !text-[#14294d] hover:!bg-[#e5ce88]">Open subject <ArrowRight size={16} /></Link></div></div><div className="mt-8"><StarterNotice /></div><div className="mt-5"><DeviceDataNotice compact /></div><div className="mt-8 flex items-center justify-between gap-4"><div><h2 className="font-display text-2xl font-bold text-[#14294d]">LAT subjects</h2><p className="mt-1 text-sm text-slate-500">Published question counts are read from the study bank. Empty subjects remain future-ready.</p></div><div className="hidden items-center gap-2 text-xs font-bold text-slate-400 sm:flex"><ShieldCheck size={15} className="text-[#b28d37]" /> More subjects are ready for later phases</div></div>{status === "loading" && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div className="surface p-5" key={item}><div className="loader-line w-10" /><div className="loader-line mt-7 w-2/3" /><div className="loader-line mt-3 w-full" /><div className="loader-line mt-8 w-1/2" /></div>)}</div>}{status === "error" && <div className="mt-6"><EmptyState title="Subjects could not load" description="The study bank did not respond. Try again when your connection is ready." onRetry={load} /></div>}{status === "ready" && !subjects.length && <div className="mt-6"><EmptyState title="No LAT subjects yet" description="The administrator has not published a subject bank. Check back after the next content update." /></div>}{status === "ready" && subjects.length > 0 && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{subjects.map((subject: any) => <SubjectCard key={subject.id || subject.slug} subject={subject} active={subject.slug === "pakistan-studies" && subject.question_count > 0} progress={subject.progress || 0} />)}</div>}<div className="mt-10 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-3"><div className="flex gap-3"><BookOpen size={18} className="mt-1 shrink-0 text-[#1766a9]" /><div><p className="text-sm font-bold text-[#14294d]">Subject-first study</p><p className="mt-1 text-xs leading-5 text-slate-500">Each bank stays bounded and easy to revisit.</p></div></div><div className="flex gap-3"><CheckCircle2 size={18} className="mt-1 shrink-0 text-[#36805d]" /><div><p className="text-sm font-bold text-[#14294d]">Device progress</p><p className="mt-1 text-xs leading-5 text-slate-500">Your browser keeps the answers you save here.</p></div></div><div className="flex gap-3"><ShieldCheck size={18} className="mt-1 shrink-0 text-[#b28d37]" /><div><p className="text-sm font-bold text-[#14294d]">Review-first content</p><p className="mt-1 text-xs leading-5 text-slate-500">Starter records are clearly identified.</p></div></div></div></main></StudyShell>;
}
