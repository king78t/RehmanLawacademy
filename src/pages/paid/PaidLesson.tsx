import { ArrowLeft, ArrowRight, CheckCircle2, Download, FileLock2, LockKeyhole, PlayCircle, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PaidAuthGate } from "@/components/paid/PaidAuthGate";
import { EmptyState } from "@/components/study/EmptyState";
import { StudyShell } from "@/components/study/StudyShell";
import { loadProtectedLesson, markProtectedLessonComplete } from "@/lib/paid-course-data";
import type { PaidLesson, PaidProgress } from "@/lib/paid-course-types";
import { formatDuration } from "@/lib/paid-course-types";

function VideoShell({ lesson }: { lesson: PaidLesson }) {
  const provider = String(lesson.video_provider || "").toLowerCase();
  if (lesson.video_reference && provider === "direct") return <div className="overflow-hidden rounded-2xl bg-[#081a37]"><video controls className="aspect-video w-full" src={lesson.video_reference} aria-label={lesson.title}>Your browser does not support video playback.</video></div>;
  if (lesson.video_reference && provider === "youtube") {
    const source = lesson.video_reference.startsWith("http") ? lesson.video_reference : `https://www.youtube.com/embed/${lesson.video_reference}`;
    return <div className="overflow-hidden rounded-2xl bg-[#081a37]"><iframe title={lesson.title} src={source} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
  }
  if (lesson.video_reference) return <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-[#cfe1ef] bg-[#f1f8fc] p-8 text-center"><div><PlayCircle size={28} className="mx-auto text-[#1766a9]" /><p className="mt-4 font-display text-lg font-bold text-[#14294d]">Video configured for {lesson.video_provider || "a private provider"}</p><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">This protected reference is stored for the academy’s video provider. Playback will appear here when that provider is connected.</p></div></div>;
  return <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-[#c6d3e1] bg-[#f7fafc] p-8 text-center"><div><FileLock2 size={28} className="mx-auto text-slate-400" /><p className="mt-4 font-display text-lg font-bold text-[#14294d]">Video not configured yet</p><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">An administrator has not attached a video to this lesson. This page will use the protected provider reference when one is configured.</p></div></div>;
}

function LockedLesson() {
  return <StudyShell><main className="page-wrap flex min-h-[68vh] items-center justify-center py-16"><div className="surface w-full max-w-lg p-8 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><LockKeyhole size={24} /></div><p className="eyebrow mt-6">Protected lesson</p><h1 className="page-heading mt-2 text-3xl font-bold">This course is locked.</h1><p className="mt-3 text-sm leading-6 text-slate-500">Please purchase the course to access the lessons. Your account needs an active enrollment before lesson content can be returned.</p><Link to="/paid-courses" className="button-primary mt-7">Browse paid courses <ArrowRight size={16} /></Link></div></main></StudyShell>;
}

function LessonContent({ courseSlug, lessonId }: { courseSlug: string; lessonId: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadProtectedLesson>> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "locked">("loading");
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setStatus("loading");
    try { setData(await loadProtectedLesson(courseSlug, lessonId)); setStatus("ready"); }
    catch (error) { console.error("Failed to load protected lesson:", error); const text = error instanceof Error ? error.message.toLowerCase() : ""; setStatus(text.includes("locked") || text.includes("purchase") ? "locked" : "error"); }
  }, [courseSlug, lessonId]);
  useEffect(() => { void load(); }, [load]);
  const markComplete = async () => {
    if (!data || marking || data.progress?.completed_lesson_ids?.includes(data.lesson.id)) return;
    setMarking(true); setMessage("");
    try { const result = await markProtectedLessonComplete(courseSlug, lessonId); setData((current) => current ? { ...current, progress: result.progress } : current); setMessage("Lesson marked as complete. Your course progress is saved."); }
    catch (error) { console.error("Failed to save lesson progress:", error); setMessage("The lesson could not be marked complete. Try again when your session is ready."); }
    finally { setMarking(false); }
  };
  if (status === "loading") return <StudyShell><main className="page-wrap py-14"><div className="surface p-7"><div className="loader-line h-52 w-full" /><div className="loader-line mt-6 w-2/3" /><div className="loader-line mt-4 w-full" /></div></main></StudyShell>;
  if (status === "locked") return <LockedLesson />;
  if (status === "error" || !data) return <StudyShell><main className="page-wrap py-14"><EmptyState title="Lesson could not load" description="The protected lesson was not available for this course. Check the link and try again." onRetry={load} action={`/my-courses/${courseSlug}`} actionLabel="Return to course" /></main></StudyShell>;
  const completed = Boolean(data.progress?.completed_lesson_ids?.includes(data.lesson.id));
  return <StudyShell><main className="page-wrap py-10 sm:py-14"><Link to={`/my-courses/${courseSlug}`} className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"><ArrowLeft size={15} /> {data.course.title}</Link><div className="mt-8"><p className="eyebrow">{data.module.title}</p><div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="page-heading break-words text-4xl font-bold sm:text-5xl">{data.lesson.title}</h1><p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">{formatDuration(data.lesson.duration_seconds)} <span className="text-slate-300">·</span> Protected lesson</p></div>{completed && <span className="inline-flex items-center gap-2 rounded-full bg-[#effaf4] px-3 py-2 text-xs font-extrabold text-[#2e7655]"><CheckCircle2 size={15} /> Completed</span>}</div></div><section className="mt-8"><VideoShell lesson={data.lesson} /></section><section className="mt-8 grid gap-8 lg:grid-cols-[1fr_.72fr]"><div className="surface p-6 sm:p-7"><p className="eyebrow">Lesson notes</p><h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">{data.lesson.description || "Work through this lesson at your own pace."}</h2>{data.lesson.notes ? <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">{data.lesson.notes}</div> : <p className="mt-5 text-sm leading-6 text-slate-500">Study notes will appear here when the administrator adds them to this lesson.</p>}{data.lesson.attachment_url && <a href={data.lesson.attachment_url} target="_blank" rel="noreferrer" className="button-secondary mt-6"><Download size={15} /> Open study material</a>}<button type="button" disabled={marking || completed} onClick={() => void markComplete()} className={`mt-6 w-full sm:w-auto ${completed ? "button-secondary" : "button-primary"}`}><CheckCircle2 size={16} /> {marking ? "Saving progress…" : completed ? "Lesson completed" : "Mark as completed"}</button>{message && <p className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs font-semibold leading-5 text-sky-800" role="status">{message}</p>}</div><aside className="surface h-fit bg-[#f7fafc] p-6"><p className="eyebrow">Course navigation</p><div className="mt-4 grid gap-3">{data.previous_lesson ? <Link to={`/my-courses/${courseSlug}/lessons/${data.previous_lesson.id}`} className="button-secondary w-full justify-between"> <span className="flex items-center gap-2"><ArrowLeft size={15} /> Previous</span><span className="max-w-[10rem] truncate text-xs">{data.previous_lesson.title}</span></Link> : <span className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 text-xs font-bold text-slate-400"><ArrowLeft size={15} /> This is the first lesson</span>}{data.next_lesson ? <Link to={`/my-courses/${courseSlug}/lessons/${data.next_lesson.id}`} className="button-primary w-full justify-between"><span className="flex items-center gap-2">Next lesson <ArrowRight size={15} /></span><span className="max-w-[10rem] truncate text-xs">{data.next_lesson.title}</span></Link> : <span className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 text-xs font-bold text-slate-400"><CheckCircle2 size={15} /> Last configured lesson</span>}<Link to={`/my-courses/${courseSlug}`} className="button-quiet mt-2 w-full"><RotateCcw size={15} /> Back to curriculum</Link></div></aside></section></main></StudyShell>;
}

export default function PaidLesson() { const { courseSlug = "", lessonId = "" } = useParams(); return <PaidAuthGate><LessonContent courseSlug={courseSlug} lessonId={lessonId} /></PaidAuthGate>; }
