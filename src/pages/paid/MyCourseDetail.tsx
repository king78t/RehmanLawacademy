import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock3,
  FileLock2,
  LockKeyhole,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CourseTestRunner } from "@/components/paid/CourseTestRunner";
import { CurriculumPreview } from "@/components/paid/CurriculumPreview";
import { PaidAuthGate } from "@/components/paid/PaidAuthGate";
import { PaidStatusBadge } from "@/components/paid/PaidStatusBadge";
import { WhatsAppFloatingSupport } from "@/components/paid/WhatsAppFloatingSupport";
import { EmptyState } from "@/components/study/EmptyState";
import { ProgressBar } from "@/components/study/ProgressBar";
import { StudyShell } from "@/components/study/StudyShell";
import {
  loadEnrolledCurriculum,
  loadPaidDashboard,
  loadPublicModules,
  loadPublishedCourse,
} from "@/lib/paid-course-data";
import type { PaidCourse, PaidDashboard, PaidLesson, PaidModule } from "@/lib/paid-course-types";
import { formatDuration, formatPkr } from "@/lib/paid-course-types";

function LessonRow({
  courseSlug,
  lesson,
  completed,
}: {
  courseSlug: string;
  lesson: PaidLesson;
  completed: boolean;
}) {
  return (
    <Link
      to={`/my-courses/${courseSlug}/lessons/${lesson.id}`}
      className="group flex min-h-11 items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:border-sky-200 hover:bg-sky-50"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          completed ? "bg-[#effaf4] text-[#2e7655]" : "bg-[#eaf4fb] text-[#1766a9]"
        }`}
      >
        {completed ? <CheckCircle2 size={17} /> : <PlayCircle size={17} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-bold text-[#14294d]">{lesson.title}</span>
        <span className="mt-1 flex items-center gap-2 text-[.68rem] font-semibold text-slate-400">
          <Clock3 size={12} /> {formatDuration(lesson.duration_seconds)}
        </span>
      </span>
      <ArrowRight size={16} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function CourseContent({ courseSlug }: { courseSlug: string }) {
  const [course, setCourse] = useState<PaidCourse | null>(null);
  const [modules, setModules] = useState<PaidModule[]>([]);
  const [dashboard, setDashboard] = useState<PaidDashboard | null>(null);
  const [curriculum, setCurriculum] = useState<Awaited<ReturnType<typeof loadEnrolledCurriculum>> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [showTestRunner, setShowTestRunner] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [found, data] = await Promise.all([loadPublishedCourse(courseSlug), loadPaidDashboard()]);
      if (!found) {
        setCourse(null);
        setStatus("ready");
        return;
      }
      setCourse(found);
      setDashboard(data);
      setModules(await loadPublicModules(found.id));
      const active = data.enrollments.some(
        (item) => item.course_slug === courseSlug && item.enrollment_status === "active"
      );
      if (active) setCurriculum(await loadEnrolledCurriculum(courseSlug));
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load paid course detail:", error);
      setStatus("error");
    }
  }, [courseSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === "loading") {
    return (
      <StudyShell>
        <main className="page-wrap py-14">
          <div className="surface p-7">
            <div className="loader-line h-28 w-full" />
            <div className="loader-line mt-6 w-2/3" />
            <div className="mt-8 grid gap-3">
              <div className="loader-line h-16" />
              <div className="loader-line h-16" />
            </div>
          </div>
        </main>
      </StudyShell>
    );
  }

  if (status === "error") {
    return (
      <StudyShell>
        <main className="page-wrap py-14">
          <EmptyState
            title="Your course could not load"
            description="We could not confirm your enrollment or course curriculum. Try again when your session is ready."
            onRetry={load}
          />
        </main>
      </StudyShell>
    );
  }

  if (!course) {
    return (
      <StudyShell>
        <main className="page-wrap py-14">
          <EmptyState
            title="Course not found"
            description="That course is not available in the published catalog."
            action="/my-courses"
            actionLabel="Return to dashboard"
          />
        </main>
      </StudyShell>
    );
  }

  const active = Boolean(curriculum);
  const progress = curriculum?.progress || dashboard?.progress.find((item) => item.course_id === course.id);
  const lessons = curriculum?.lessons || [];
  const moduleRows = curriculum?.modules || modules;

  return (
    <StudyShell>
      <main className="page-wrap py-10 sm:py-14">
        <Link
          to="/my-courses"
          className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"
        >
          <ArrowLeft size={15} /> My Student Dashboard
        </Link>

        {/* Course Header */}
        <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow">{active ? "Active Enrollment" : "Course Access"}</p>
              <PaidStatusBadge status={active ? "active" : "locked"} />
            </div>
            <h1 className="page-heading mt-4 break-words text-3xl font-bold sm:text-4xl">{course.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
              {course.description || course.short_description}
            </p>
          </div>

          <div className="surface bg-[#0f2349] p-6 text-white sm:p-7 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[.65rem] font-extrabold uppercase tracking-widest text-[#ddc275]">
                  Your Learning Progress
                </p>
                <p className="mt-2 text-3xl font-extrabold text-[#ddc275]">
                  {progress?.progress_percentage || 0}%
                </p>
              </div>
              <ShieldCheck size={26} className="text-[#ddc275]" />
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#ddc275] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progress?.progress_percentage || 0))}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-blue-100/70">
              <span>{progress?.completed_lessons || 0} of {progress?.total_lessons || 0} lessons completed</span>
              {active && (
                <button
                  type="button"
                  onClick={() => setShowTestRunner(true)}
                  className="inline-flex items-center gap-1 font-bold text-[#ddc275] hover:underline"
                >
                  <Award size={14} /> Practice Tests
                </button>
              )}
            </div>
          </div>
        </section>

        {/* LOCKED BANNER IF NOT ACTIVE */}
        {!active && (
          <section className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/90 p-6 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <LockKeyhole size={22} />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-rose-950">This course is locked.</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-rose-800">
                  Please purchase this course via manual bank transfer or Easypaisa/JazzCash to unlock video lessons and practice drills. Direct URL entry is strictly protected.
                </p>
                <Link to={`/paid-courses/${course.slug}/purchase`} className="button-primary mt-4 inline-flex items-center gap-2">
                  Request Course Access / Submit Payment <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* CURRICULUM SECTION */}
        <section className="mt-12">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Course Curriculum</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#14294d]">
                {active ? "Work through each video module." : "Preview the learning path."}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {active
                  ? "Your lesson lectures, downloadable resources, and completion marks are active."
                  : "Curriculum outline is displayed publicly. Protected video content unlocks upon admin verification."}
              </p>
            </div>

            {active && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowTestRunner(true)}
                  className="button-primary !bg-[#1766a9] text-xs font-bold"
                >
                  <Award size={15} /> Take Diagnostic Quiz
                </button>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <FileLock2 size={15} className="text-[#b28d37]" /> Protected
                </span>
              </div>
            )}
          </div>

          {active ? (
            <div className="mt-6 grid gap-5">
              {moduleRows.map((module, index) => {
                const moduleLessons = lessons
                  .filter((lesson) => lesson.module_id === module.id)
                  .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

                return (
                  <article key={module.id} className="surface border border-slate-200 p-5 sm:p-6 shadow-sm">
                    <div className="flex items-start gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf4fb] text-sm font-extrabold text-[#1766a9]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words font-display text-xl font-bold text-[#14294d]">
                          {module.title}
                        </h3>
                        {module.description && (
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">{module.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-2 border-t border-slate-100 pt-4">
                      {moduleLessons.length ? (
                        moduleLessons.map((lesson) => (
                          <LessonRow
                            key={lesson.id}
                            courseSlug={course.slug}
                            lesson={lesson}
                            completed={Boolean(progress?.completed_lesson_ids?.includes(lesson.id))}
                          />
                        ))
                      ) : (
                        <p className="rounded-xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">
                          No published lessons in this module yet.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6">
              <CurriculumPreview modules={modules} />
            </div>
          )}
        </section>

        {active && (
          <section className="mt-8 rounded-2xl border border-[#cfe1ef] bg-[#f1f8fc] p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#1766a9]" />
              <p className="text-xs leading-relaxed text-[#4f6982]">
                Your progress is securely synchronized with your student profile. Free LAT preparation questions and practice history remain saved on your local browser.
              </p>
            </div>
          </section>
        )}

        <p className="mt-8 text-xs text-slate-400">
          Course Fee: {formatPkr(course)} · Instructor: {course.instructor || "Rehman Law Academy"}
        </p>

        {/* Floating WhatsApp Helpline */}
        <WhatsAppFloatingSupport courseTitle={course.title} />

        {/* Test Modal */}
        {showTestRunner && (
          <CourseTestRunner
            courseSlug={course.slug}
            onClose={() => setShowTestRunner(false)}
            onFinished={() => void load()}
          />
        )}
      </main>
    </StudyShell>
  );
}

export default function MyCourseDetail() {
  const { courseSlug = "" } = useParams();
  return (
    <PaidAuthGate>
      <CourseContent courseSlug={courseSlug} />
    </PaidAuthGate>
  );
}
