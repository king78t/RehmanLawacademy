import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CurriculumPreview } from "@/components/paid/CurriculumPreview";
import { WhatsAppFloatingSupport } from "@/components/paid/WhatsAppFloatingSupport";
import { EmptyState } from "@/components/study/EmptyState";
import { StudyShell } from "@/components/study/StudyShell";
import { loadPublicModules, loadPublishedCourse } from "@/lib/paid-course-data";
import type { PaidCourse, PaidModule } from "@/lib/paid-course-types";
import { formatPkr } from "@/lib/paid-course-types";
import { getCourseWhatsAppUrl, getBrandConfig } from "@/lib/brand-config";

export default function PublicCourseDetail() {
  const { courseSlug = "" } = useParams();
  const [course, setCourse] = useState<PaidCourse | null>(null);
  const [modules, setModules] = useState<PaidModule[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const found = await loadPublishedCourse(courseSlug);
      if (!found) {
        setCourse(null);
        setStatus("ready");
        return;
      }
      setCourse(found);
      setModules(await loadPublicModules(found.id));
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load public course:", error);
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
            <div className="loader-line h-44 w-full" />
            <div className="loader-line mt-6 w-2/3" />
            <div className="loader-line mt-4 w-full" />
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
            title="Course details could not load"
            description="The course page did not respond. Try again when your connection is ready."
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
            description="That course is not published or is no longer available."
            action="/paid-courses"
            actionLabel="Browse paid courses"
          />
        </main>
      </StudyShell>
    );
  }

  return (
    <StudyShell>
      <main className="page-wrap py-10 sm:py-14">
        <Link
          to="/paid-courses"
          className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"
        >
          <ArrowLeft size={15} /> All Paid Courses
        </Link>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow">Published Paid Course</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#effaf4] px-2.5 py-1 text-[.63rem] font-bold text-[#2e7655]">
                <CheckCircle2 size={13} /> Open for Admission
              </span>
            </div>
            <h1 className="page-heading mt-4 break-words text-3xl font-bold sm:text-5xl">{course.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500">
              {course.description || course.short_description}
            </p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-2">
                <GraduationCap size={16} className="text-[#1766a9]" /> {course.instructor || "Adv. AbdulRehman Yaseen"}
              </span>
              <span className="flex items-center gap-2">
                <Clock3 size={16} className="text-[#1766a9]" /> {course.duration_label || "Full LAT Session"}
              </span>
              <span className="flex items-center gap-2">
                <BookOpen size={16} className="text-[#1766a9]" /> {Number(course.lecture_count || 0)} Lectures & Quizzes
              </span>
            </div>
          </div>

          {/* Pricing & Purchase Box */}
          <div className="surface border-[#cddbea] bg-[#0f2349] p-6 text-white sm:p-7 shadow-xl">
            <p className="text-[.65rem] font-extrabold uppercase tracking-widest text-[#ddc275]">
              Enrollment Fee
            </p>
            <p className="mt-3 font-display text-4xl font-bold text-[#ddc275]">
              {formatPkr(course)}
            </p>
            <p className="mt-2 text-xs text-blue-100/70">
              Manual Pakistan payment via Bank Transfer, Easypaisa, or JazzCash. Verified manually by academy coordinators.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                to={`/paid-courses/${course.slug}/purchase`}
                className="button-primary flex w-full items-center justify-center gap-2 !bg-[#ddc275] !text-[#14294d] hover:!bg-[#e5ce88] font-bold"
              >
                Enroll &amp; Buy Course <ArrowRight size={16} />
              </Link>
              <a
                href={getCourseWhatsAppUrl(course.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="button-secondary flex w-full items-center justify-center gap-2 !border-white/20 !bg-white/10 text-xs font-bold text-white hover:!bg-[#25D366] hover:!border-[#25D366]"
              >
                <MessageCircle size={15} /> Buy Course / Contact on WhatsApp
              </a>
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-white/60">
              <MessageCircle size={14} className="mt-0.5 shrink-0 text-[#ddc275]" />
              Official WhatsApp ({getBrandConfig().whatsapp.display}) coordinator available daily 9am - 10pm.
            </p>
          </div>
        </section>

        {/* Curriculum Preview */}
        <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_.78fr]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Curriculum Syllabus</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">See the Learning Path</h2>
              </div>
              <span className="hidden items-center gap-2 text-xs font-bold text-slate-400 sm:flex">
                <ShieldCheck size={15} className="text-[#b28d37]" /> Protected after approval
              </span>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-500 sm:text-sm">
              Module topics and syllabus breakdown are visible publicly. Recorded video lectures, study handouts, and diagnostic tests unlock upon enrollment confirmation.
            </p>
            <div className="mt-6">
              <CurriculumPreview modules={modules} />
            </div>
          </div>

          <aside className="surface h-fit bg-[#f7fafc] p-6 sm:p-7 border border-slate-200 shadow-sm">
            <p className="eyebrow">Course Highlights</p>
            <h2 className="mt-2 font-display text-xl font-bold text-[#14294d]">What is included:</h2>
            <div className="mt-5 grid gap-3 text-xs sm:text-sm leading-6 text-slate-600">
              <p className="flex gap-2.5">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#2e7655]" />
                Complete syllabus video lectures covering Constitution, Law, English, and General Knowledge.
              </p>
              <p className="flex gap-2.5">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#2e7655]" />
                Timed diagnostic practice tests with automatic evaluation and answer reviews.
              </p>
              <p className="flex gap-2.5">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#2e7655]" />
                Direct WhatsApp coordination with academy instructors.
              </p>
              <p className="flex gap-2.5">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#2e7655]" />
                Personal Essay & Statement of Purpose evaluation guidelines.
              </p>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-5">
              <Link
                to={`/paid-courses/${course.slug}/purchase`}
                className="button-primary flex w-full items-center justify-center gap-2 text-xs font-bold"
              >
                Proceed to Payment <ArrowRight size={14} />
              </Link>
            </div>
          </aside>
        </section>

        {/* Floating WhatsApp Support */}
        <WhatsAppFloatingSupport courseTitle={course.title} />
      </main>
    </StudyShell>
  );
}
