import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileLock2, LockKeyhole, PlayCircle, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CurriculumPreview } from "@/components/paid/CurriculumPreview";
import { PaidAuthGate } from "@/components/paid/PaidAuthGate";
import { PaidStatusBadge } from "@/components/paid/PaidStatusBadge";
import { EmptyState } from "@/components/study/EmptyState";
import { ProgressBar } from "@/components/study/ProgressBar";
import { StudyShell } from "@/components/study/StudyShell";
import { loadEnrolledCurriculum, loadPaidDashboard, loadPublicModules, loadPublishedCourse } from "@/lib/paid-course-data";
import type { PaidCourse, PaidDashboard, PaidLesson, PaidModule } from "@/lib/paid-course-types";
import { formatDuration, formatPkr } from "@/lib/paid-course-types";

function LessonRow({ courseSlug, lesson, completed }: { courseSlug: string; lesson: PaidLesson; completed: boolean }) {
  return <Link to={`/my-courses/${courseSlug}/lessons/${lesson.id}`} className="group flex min-h-11 items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:border-sky-200 hover:bg-sky-50"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${completed ? "bg-[#effaf4] text-[#2e7655]" : "bg-[#eaf4fb] text-[#1766a9]"}`}>{completed ? <CheckCircle2 size={17} /> : <PlayCircle size={17} />}</span><span className="min-w-0 flex-1"><span className="block break-words text-sm font-bold text-[#14294d]">{lesson.title}</span><span className="mt-1 flex items-center gap-2 text-[.68rem] font-semibold text-slate-400"><Clock3 size={12} /> {formatDuration(lesson.duration_seconds)}</span></span><ArrowRight size={16} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5" /></Link>;
}

function CourseContent({ courseSlug }: { courseSlug: string }) {
  const [course, setCourse] = useState<PaidCourse | null>(null);
  const [modules, setModules] = useState<PaidModule[]>([]);
  const [dashboard, setDashboard] = useState<PaidDashboard | null>(null);
  const [curriculum, setCurriculum] = useState<Awaited<ReturnType<typeof loadEnrolledCurriculum>> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [found, data] = await Promise.all([loadPublishedCourse(courseSlug), loadPaidDashboard()]);
      if (!found) { setCourse(null); setStatus("ready"); return; }
      setCourse(found); setDashboard(data); setModules(await loadPublicModules(found.id));
      const active = data.enrollments.some((item) => item.course_slug === courseSlug && item.enrollment_status === "active");
      if (active) setCurriculum(await loadEnrolledCurriculum(courseSlug));
      setStatus("ready");
    } catch (error) { console.error("Failed to load paid course detail:", error); setStatus("error"); }
  }, [courseSlug]);
  useEffect(() => { void load(); }, [load]);
  if (status === "loading") return <StudyShell><main className="page-wrap py-14"><div className="surface p-7"><div className="loader-line h-28 w-full" /><div className="loader-line mt-6 w-2/3" /><div className="mt-8 grid gap-3"><div className="loader-line h-16" /><div className="loader-line h-16" /></div></div></main></StudyShell>;
  if (status === "error") return <StudyShell><main className="page-wrap py-14"><EmptyState title="Your course could not load" description="We could not confirm your enrollment or course curriculum. Try again when your session is ready." onRetry={load} /></main></StudyShell>;
  if (!course) return <StudyShell><main className="page-wrap py-14"><EmptyState title="Course not found" description="That course is not available in the published catalog." action="/my-courses" actionLabel="Return to dashboard" /></main></StudyShell>;
  const active = Boolean(curriculum);
  const progress = curriculum?.progress || dashboard?.progress.find((item) => item.course_id === course.id);
  const lessons = curriculum?.lessons || [];
  const moduleRows = curriculum?.modules || modules;
  return <StudyShell><main className="page-wrap py-10 sm:py-14"><Link to="/my-courses" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"><ArrowLeft size={15} /> My dashboard</Link><section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end"><div><div className="flex flex-wrap items-center gap-3"><p className="eyebrow">{active ? "Active enrollment" : "Course access"}</p><PaidStatusBadge status={active ? "active" : "locked"} /></div><h1 className="page-heading mt-4 break-words text-4xl font-bold sm:text-5xl">{course.title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">{course.description || course.short_description}</p></div><div className="surface bg-[#0f2349] p-6 text-white sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[.65rem] font-extrabold uppercase tracking-[.14em] text-white/50">Your progress</p><p className="mt-2 text-3xl font-bold text-[#ddc275]">{progress?.progress_percentage || 0}%</p></div><ShieldCheck size={22} className="text-[#ddc275]" /></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#ddc275]" style={{ width: `${Math.min(100, Math.max(0, progress?.progress_percentage || 0))}%` }} /></div><p className="mt-3 text-xs text-blue-100/60">{progress?.completed_lessons || 0} of {progress?.total_lessons || 0} configured lessons completed</p></div></section>{!active && <section className="mt-8 rounded-2xl border border-[#e6caca] bg-[#fff5f5] p-5 sm:p-6"><div className="flex items-start gap-3"><LockKeyhole size={20} className="mt-0.5 shrink-0 text-[#b44848]" /><div><h2 className="font-display text-xl font-bold text-[#7f3030]">This course is locked.</h2><p className="mt-2 text-sm leading-6 text-[#8d5555]">Please purchase the course to access the lessons. Opening a course link cannot unlock protected content without an active enrollment.</p><Link to={`/paid-courses/${course.slug}/purchase`} className="button-primary mt-5">Request course access <ArrowRight size={16} /></Link></div></div></section>}<section className="mt-12"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Course curriculum</p><h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">{active ? "Work through each module." : "Preview the learning path."}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{active ? "Your lesson titles and completion state are available because this account has an active enrollment." : "Module titles are visible before purchase. Lesson and video details remain protected."}</p></div>{active && <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400"><FileLock2 size={15} className="text-[#b28d37]" /> Protected content</span>}</div>{active ? <div className="mt-6 grid gap-5">{moduleRows.map((module, index) => { const moduleLessons = lessons.filter((lesson) => lesson.module_id === module.id).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)); return <article key={module.id} className="surface p-5 sm:p-6"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf4fb] text-sm font-extrabold text-[#1766a9]">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><h3 className="break-words font-display text-xl font-bold text-[#14294d]">{module.title}</h3>{module.description && <p className="mt-1 text-sm leading-6 text-slate-500">{module.description}</p>}</div></div><div className="mt-5 grid gap-2 border-t border-slate-100 pt-4">{moduleLessons.length ? moduleLessons.map((lesson) => <LessonRow key={lesson.id} courseSlug={course.slug} lesson={lesson} completed={Boolean(progress?.completed_lesson_ids?.includes(lesson.id))} />) : <p className="rounded-xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">No published lessons in this module yet.</p>}</div></article>; })}</div> : <div className="mt-6"><CurriculumPreview modules={modules} /></div>}</section>{active && <section className="mt-8 rounded-2xl border border-[#cfe1ef] bg-[#f1f8fc] p-5"><div className="flex items-start gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#1766a9]" /><p className="text-sm leading-6 text-[#4f6982]">Progress is recorded to this paid-course account. Your free LAT practice history remains separate and stays on its browser.</p></div></section>}<p className="mt-8 text-xs text-slate-400">Course amount: {formatPkr(course)} · Instructor: {course.instructor || "Rehman Law Academy"}</p></main></StudyShell>;
}

export default function MyCourseDetail() { const { courseSlug = "" } = useParams(); return <PaidAuthGate><CourseContent courseSlug={courseSlug} /></PaidAuthGate>; }
