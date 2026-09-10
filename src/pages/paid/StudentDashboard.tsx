import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  LogOut,
  MessageCircle,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CourseTestRunner } from "@/components/paid/CourseTestRunner";
import { PaidAuthGate } from "@/components/paid/PaidAuthGate";
import { PaidStatusBadge } from "@/components/paid/PaidStatusBadge";
import { WhatsAppFloatingSupport } from "@/components/paid/WhatsAppFloatingSupport";
import { EmptyState } from "@/components/study/EmptyState";
import { ProgressBar } from "@/components/study/ProgressBar";
import { StudyShell } from "@/components/study/StudyShell";
import {
  getActiveStudent,
  loadPaidDashboard,
  studentLogout,
} from "@/lib/paid-course-data";
import type { PaidCourse, PaidDashboard } from "@/lib/paid-course-types";
import { formatPkr } from "@/lib/paid-course-types";

function DashboardContent() {
  const [data, setData] = useState<PaidDashboard | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [signingOut, setSigningOut] = useState(false);

  // Test modal runner
  const [activeTestCourseSlug, setActiveTestCourseSlug] = useState<string | null>(null);

  const student = getActiveStudent();

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await loadPaidDashboard();
      setData(res);
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load paid dashboard:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const signOut = () => {
    setSigningOut(true);
    studentLogout();
    window.location.assign("/paid-courses");
  };

  if (status === "loading") {
    return (
      <StudyShell>
        <main className="page-wrap py-14">
          <div className="surface p-7">
            <div className="loader-line w-1/3" />
            <div className="loader-line mt-4 w-2/3" />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="loader-line h-24" />
              <div className="loader-line h-24" />
              <div className="loader-line h-24" />
            </div>
          </div>
        </main>
      </StudyShell>
    );
  }

  if (status === "error" || !data) {
    return (
      <StudyShell>
        <main className="page-wrap py-14">
          <EmptyState
            title="Your student portal could not load"
            description="We could not verify your course enrollments. Please check your connection and retry."
            onRetry={load}
          />
        </main>
      </StudyShell>
    );
  }

  const activeEnrollments = data.enrollments.filter((item) => item.enrollment_status === "active");
  const activeIds = new Set(activeEnrollments.map((item) => item.course_id));
  const progressFor = (courseId: string) => data.progress.find((item) => item.course_id === courseId);

  const pendingPayments = data.payments.filter((item) => item.payment_status === "pending" && !activeIds.has(item.course_id));
  const rejectedPayments = data.payments.filter((item) => item.payment_status === "rejected" && !activeIds.has(item.course_id));
  const availableCourses = data.courses.filter((course) => !activeIds.has(course.id));

  return (
    <StudyShell>
      <main className="page-wrap py-10 sm:py-14">
        {/* Welcome Header */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow">Student Learning Portal</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[.65rem] font-bold text-emerald-800">
                Verified Account
              </span>
            </div>
            <h1 className="page-heading mt-2 break-words text-3xl font-bold sm:text-4xl">
              Welcome, {student?.full_name || data.user.full_name || "Student"}.
            </h1>
            <p className="mt-2 text-xs text-slate-500 sm:text-sm">
              Manage your enrolled legal aptitude courses, practice tests, and manual payment verification receipts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/paid-courses" className="button-secondary text-xs">
              <ExternalLink size={14} /> Course Catalog
            </Link>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="button-secondary text-xs text-rose-700 hover:bg-rose-50"
            >
              <LogOut size={14} /> {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="metric-card border-l-4 border-l-emerald-600">
            <p className="text-[.68rem] font-extrabold uppercase tracking-wider text-slate-400">
              Active Enrolled Courses
            </p>
            <p className="mt-2 text-3xl font-extrabold text-[#14294d]">{activeEnrollments.length}</p>
            <p className="mt-1 text-xs text-slate-500">Unlocked full access</p>
          </div>

          <div className="metric-card border-l-4 border-l-amber-500">
            <p className="text-[.68rem] font-extrabold uppercase tracking-wider text-slate-400">
              Pending Verifications
            </p>
            <p className="mt-2 text-3xl font-extrabold text-[#14294d]">{pendingPayments.length}</p>
            <p className="mt-1 text-xs text-slate-500">Under admin review</p>
          </div>

          <div className="metric-card border-l-4 border-l-[#1766a9]">
            <p className="text-[.68rem] font-extrabold uppercase tracking-wider text-slate-400">
              Registered Profile
            </p>
            <p className="mt-2 truncate font-mono text-xs font-bold text-slate-700">{data.user.email}</p>
            <p className="mt-1 text-xs text-slate-400">
              Mobile: {student?.mobile_number || "Pakistan Account"}
            </p>
          </div>
        </div>

        {/* PENDING PAYMENT VERIFICATIONS BANNER */}
        {pendingPayments.length > 0 && (
          <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Clock size={22} className="mt-0.5 shrink-0 text-amber-700" />
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-bold text-amber-950">
                  Manual Payment Verification in Progress
                </h3>
                <p className="mt-1 text-xs text-amber-800">
                  You have submitted payment receipts that are currently being cross-referenced with academy bank records. Once verified by an administrator, the course will immediately appear in your active courses below.
                </p>

                <div className="mt-4 grid gap-3">
                  {pendingPayments.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-amber-200/80 bg-white p-3.5 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <span className="font-display text-sm font-bold text-[#14294d]">
                          {item.course_title}
                        </span>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Method: {item.payment_method || "Bank / Manual"} · Trx ID:{" "}
                          <span className="font-mono font-bold text-slate-700">
                            {item.transaction_reference || "N/A"}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`https://wa.me/923128891288?text=${encodeURIComponent(
                            `Assalam-o-Alaikum Rehman Law Academy, please verify my manual payment for: ${item.course_title}. Trx ID: ${item.transaction_reference}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          <MessageCircle size={13} /> WhatsApp Helpline
                        </a>
                        <Link
                          to={`/paid-courses/${item.course_slug}/purchase`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          View Status <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* REJECTED PAYMENTS BANNER */}
        {rejectedPayments.length > 0 && (
          <section className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/90 p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <XCircle size={22} className="mt-0.5 shrink-0 text-rose-700" />
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-bold text-rose-950">
                  Payment Verification Requires Correction
                </h3>
                <p className="mt-1 text-xs text-rose-800">
                  One or more payment receipts could not be matched. Please review the reason below and submit an updated receipt.
                </p>

                <div className="mt-4 grid gap-3">
                  {rejectedPayments.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-rose-200 bg-white p-3.5 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <span className="font-display text-sm font-bold text-[#14294d]">
                          {item.course_title}
                        </span>
                        {item.rejection_reason && (
                          <p className="mt-1 text-xs text-rose-700">
                            <strong>Reason:</strong> {item.rejection_reason}
                          </p>
                        )}
                      </div>

                      <Link
                        to={`/paid-courses/${item.course_slug}/purchase`}
                        className="button-primary inline-flex items-center gap-1 !bg-rose-700 text-xs font-bold text-white hover:!bg-rose-800"
                      >
                        <RefreshCcw size={13} /> Re-submit Payment Proof
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ACTIVE ENROLLED COURSES */}
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">My Enrolled Courses</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#14294d]">
                Active Courses & Study Materials
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2e7655]">
              <ShieldCheck size={16} /> Activated & Unlocked
            </span>
          </div>

          {activeEnrollments.length ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {activeEnrollments.map((enrollment) => {
                const course =
                  data.courses.find((item) => item.id === enrollment.course_id) ||
                  ({
                    id: enrollment.course_id,
                    slug: enrollment.course_slug,
                    title: enrollment.course_title,
                  } as PaidCourse);
                const progress = progressFor(enrollment.course_id);

                return (
                  <article
                    key={enrollment.id}
                    className="surface surface-hover flex flex-col justify-between border border-slate-200 p-6 shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[.62rem] font-extrabold uppercase text-emerald-800">
                            Active Student Access
                          </span>
                          <h3 className="mt-2.5 break-words font-display text-xl font-bold text-[#14294d]">
                            {course.title}
                          </h3>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eaf4fb] text-[#1766a9]">
                          <BookOpenCheck size={20} />
                        </div>
                      </div>

                      <div className="mt-6">
                        <ProgressBar
                          value={progress?.progress_percentage || 0}
                          label={`${progress?.completed_lessons || 0} of ${progress?.total_lessons || 0} lessons completed`}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      <Link
                        to={`/my-courses/${course.slug}`}
                        className="button-primary flex-1 items-center justify-center gap-1.5 text-xs font-bold"
                      >
                        <PlayCircle size={15} /> Continue Learning
                      </Link>

                      <button
                        type="button"
                        onClick={() => setActiveTestCourseSlug(course.slug)}
                        className="button-secondary flex items-center gap-1.5 text-xs font-bold text-[#1766a9] hover:bg-sky-50"
                      >
                        <Award size={14} /> Practice Tests
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                title="No active paid courses yet"
                description="Browse our published courses, transfer via Bank or Easypaisa/JazzCash, and upload your receipt to start learning."
                action="/paid-courses"
                actionLabel="Browse Paid Courses Catalog"
              />
            </div>
          )}
        </section>

        {/* AVAILABLE COURSES CATALOG */}
        {availableCourses.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Expand Your Preparation</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-[#14294d]">
                  Available Academy Courses
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Comprehensive LAT preparation batches and crash courses open for admission.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableCourses.map((course) => (
                <div
                  key={course.id}
                  className="surface flex flex-col justify-between border border-slate-200 p-5 shadow-sm transition hover:border-[#1766a9]"
                >
                  <div>
                    <span className="text-[.65rem] font-bold uppercase tracking-wider text-[#ddc275]">
                      LAT Special Batch
                    </span>
                    <h3 className="mt-1.5 font-display text-lg font-bold text-[#14294d]">
                      {course.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">
                      {course.short_description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-base font-extrabold text-[#14294d]">
                      {formatPkr(course)}
                    </span>
                    <Link
                      to={`/paid-courses/${course.slug}/purchase`}
                      className="button-primary !py-1.5 !px-3 text-xs font-bold"
                    >
                      Enroll Now <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Floating WhatsApp Helpline Widget */}
        <WhatsAppFloatingSupport studentName={student?.full_name} />

        {/* Active Test Runner Modal */}
        {activeTestCourseSlug && (
          <CourseTestRunner
            courseSlug={activeTestCourseSlug}
            onClose={() => setActiveTestCourseSlug(null)}
            onFinished={() => void load()}
          />
        )}
      </main>
    </StudyShell>
  );
}

export default function StudentDashboard() {
  return (
    <PaidAuthGate>
      <DashboardContent />
    </PaidAuthGate>
  );
}
