import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CourseCard } from "@/components/paid/CourseCard";
import { WhatsAppFloatingSupport } from "@/components/paid/WhatsAppFloatingSupport";
import { EmptyState } from "@/components/study/EmptyState";
import { StudyShell } from "@/components/study/StudyShell";
import { loadPublishedCourses } from "@/lib/paid-course-data";
import type { PaidCourse } from "@/lib/paid-course-types";

export default function PaidCourses() {
  const [courses, setCourses] = useState<PaidCourse[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setCourses(await loadPublishedCourses());
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load paid courses:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <StudyShell>
      <main>
        {/* HERO */}
        <section className="hero-panel hero-grid text-white">
          <div className="page-wrap grid min-h-[470px] items-center gap-10 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <p className="eyebrow !text-[#ddc275]">Guided learning, separate from free practice</p>
                <span className="rounded-full border border-white/20 px-3 py-1 text-[.62rem] font-bold text-white/65">
                  Paid courses
                </span>
              </div>
              <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-[-.03em] sm:text-6xl">
                Build a stronger LAT routine with guided lessons.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-blue-100/75 sm:text-lg">
                Choose a structured course when you want lessons, study material, diagnostic tests, and progress tracking in one account. Free preparation remains open and device-only.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#course-catalog"
                  className="button-primary !bg-[#ddc275] !text-[#14294d] hover:!bg-[#e5ce88]"
                >
                  View available courses <ArrowRight size={16} />
                </a>
                <Link
                  to="/my-courses"
                  className="button-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/[.15]"
                >
                  Open my dashboard
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[440px]">
              <div className="absolute -right-8 top-5 h-32 w-32 rounded-full border border-[#ddc275]/25" />
              <div className="relative rounded-[28px] border border-white/[.15] bg-white/[.08] p-5 shadow-2xl backdrop-blur-sm sm:p-7">
                <div className="rounded-[22px] border border-white/10 bg-[#112951] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[.62rem] font-bold uppercase tracking-[.15em] text-white/45">
                        Your learning path
                      </p>
                      <p className="mt-1 font-display text-xl font-bold">LAT preparation</p>
                    </div>
                    <Sparkles size={22} className="text-[#ddc275]" />
                  </div>
                  <div className="mt-7 grid gap-3">
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.06] p-3 text-sm text-white/75">
                      <CheckCircle2 size={17} className="text-[#ddc275]" /> Video lessons and study material
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.06] p-3 text-sm text-white/75">
                      <CheckCircle2 size={17} className="text-[#ddc275]" /> Course-specific practice & diagnostic tests
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.06] p-3 text-sm text-white/75">
                      <CheckCircle2 size={17} className="text-[#ddc275]" /> Manual Pakistan payment (Bank, Easypaisa, JazzCash)
                    </div>
                  </div>
                  <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-white/50">
                    Submit payment receipts with transaction IDs. Instant admin approval unlocks full video curriculum.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CATALOG */}
        <section id="course-catalog" className="page-wrap scroll-mt-24 py-20 sm:py-24">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Course catalog</p>
              <h2 className="page-heading mt-3 text-3xl font-bold sm:text-4xl">
                Choose your next focused step.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
                Published courses appear here when the academy is ready to accept requests. Prices are shown in Pakistani Rupees (PKR).
              </p>
            </div>
            <div className="flex items-start gap-2 text-xs font-bold leading-5 text-slate-500">
              <MessageCircle size={16} className="mt-0.5 shrink-0 text-[#1766a9]" />
              Manual Pakistan Payment & Verification
            </div>
          </div>

          {status === "loading" && (
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="surface p-5">
                <div className="loader-line h-44 w-full" />
                <div className="loader-line mt-5 w-2/3" />
                <div className="loader-line mt-3 w-full" />
              </div>
              <div className="surface p-5">
                <div className="loader-line h-44 w-full" />
                <div className="loader-line mt-5 w-2/3" />
                <div className="loader-line mt-3 w-full" />
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="mt-8">
              <EmptyState
                title="Paid courses could not load"
                description="The course catalog did not respond. Try again when your connection is ready."
                onRetry={load}
              />
            </div>
          )}

          {status === "ready" && !courses.length && (
            <div className="mt-8">
              <EmptyState
                title="Courses are being prepared"
                description="Published paid courses will appear here after the academy configures their curriculum and access details."
              />
            </div>
          )}

          {status === "ready" && courses.length > 0 && (
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {courses.map((course, index) => (
                <CourseCard key={course.id || course.slug} course={course} index={index} />
              ))}
            </div>
          )}
        </section>

        {/* FOOTER NOTICE */}
        <section className="page-wrap pb-20">
          <div className="surface grid gap-6 bg-[#eef5fa] p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1766a9] shadow-sm">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="eyebrow">A clear approval boundary</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">
                Your account unlocks access after admin review.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Buying a course starts a manual payment request. An administrator reviews the transaction receipt and activates your enrollment in database. Direct URL entry is strictly guarded.
              </p>
            </div>
            <Link to="/lat" className="button-secondary w-full lg:w-auto">
              Keep using free preparation <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* Floating WhatsApp Helpline */}
        <WhatsAppFloatingSupport />
      </main>
    </StudyShell>
  );
}
