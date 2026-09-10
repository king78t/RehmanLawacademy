import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  ExternalLink,
  FileLock2,
  GraduationCap,
  Layers3,
  ListVideo,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthGuard } from "@/components/study/AuthGate";
import { EmptyState } from "@/components/study/EmptyState";
import { StudyShell } from "@/components/study/StudyShell";
import { AdminCourseList } from "@/components/paid/AdminCourseList";
import { AdminEnrollmentManager } from "@/components/paid/AdminEnrollmentManager";
import { AdminPaymentSettings } from "@/components/paid/AdminPaymentSettings";
import { CourseForm } from "@/components/paid/CourseForm";
import { LessonForm } from "@/components/paid/LessonForm";
import { ModuleForm } from "@/components/paid/ModuleForm";
import { PaymentReviewManager } from "@/components/paid/PaymentReviewManager";
import {
  Course,
  CourseEnrollment,
  CourseLesson,
  CourseModule,
  CoursePaymentRequest,
  CourseProgress,
  User,
} from "@/entities";
import type { PaidCourse, PaidLesson, PaidModule } from "@/lib/paid-course-types";

type Row = any;
type FormMode = "new" | "edit" | null;
type Message = { text: string; error?: boolean } | null;

function AdminPaidCoursesContent() {
  const [courses, setCourses] = useState<PaidCourse[]>([]);
  const [modules, setModules] = useState<PaidModule[]>([]);
  const [lessons, setLessons] = useState<PaidLesson[]>([]);
  const [payments, setPayments] = useState<Row[]>([]);
  const [enrollments, setEnrollments] = useState<Row[]>([]);
  const [progress, setProgress] = useState<Row[]>([]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"courses" | "payments" | "settings" | "enrollments">("payments");

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseForm, setCourseForm] = useState<FormMode>(null);
  const [editingCourse, setEditingCourse] = useState<PaidCourse | null>(null);
  const [moduleForm, setModuleForm] = useState<FormMode>(null);
  const [editingModule, setEditingModule] = useState<PaidModule | null>(null);
  const [lessonForm, setLessonForm] = useState<FormMode>(null);
  const [editingLesson, setEditingLesson] = useState<PaidLesson | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<Message>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [courseRows, moduleRows, lessonRows, paymentRows, enrollmentRows, progressRows] = await Promise.all([
        Course.filter({}, "sort_order", 200),
        CourseModule.filter({}, "sort_order", 500),
        CourseLesson.filter({}, "sort_order", 1000),
        CoursePaymentRequest.filter({}, "-created_at", 500),
        CourseEnrollment.filter({}, "-created_at", 500),
        CourseProgress.filter({}, "-created_at", 500),
      ]);
      setCourses((courseRows || []) as PaidCourse[]);
      setModules((moduleRows || []) as PaidModule[]);
      setLessons((lessonRows || []) as PaidLesson[]);
      setPayments((paymentRows || []) as Row[]);
      setEnrollments((enrollmentRows || []) as Row[]);
      setProgress((progressRows || []) as Row[]);
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load paid-course administration:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selectedCourseId && courses.some((course) => course.id === selectedCourseId)) return;
    setSelectedCourseId(courses[0]?.id || "");
  }, [courses, selectedCourseId]);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || null;
  const selectedModules = useMemo(
    () =>
      modules
        .filter((module) => module.course_id === selectedCourseId)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)),
    [modules, selectedCourseId]
  );
  const selectedLessons = useMemo(
    () =>
      lessons
        .filter((lesson) => lesson.course_id === selectedCourseId)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)),
    [lessons, selectedCourseId]
  );

  const pendingPaymentsCount = useMemo(
    () => payments.filter((p) => p.payment_status === "pending").length,
    [payments]
  );

  const setError = (error: unknown, fallback: string) => {
    const text = error instanceof Error ? error.message : fallback;
    setMessage({ text: text || fallback, error: true });
  };
  const closeCourseForm = () => {
    setCourseForm(null);
    setEditingCourse(null);
  };
  const closeModuleForm = () => {
    setModuleForm(null);
    setEditingModule(null);
  };
  const closeLessonForm = () => {
    setLessonForm(null);
    setEditingLesson(null);
  };

  const saveCourse = async (record: Row) => {
    try {
      if (courses.some((course) => course.slug === record.slug && course.id !== editingCourse?.id)) {
        throw new Error("That course slug is already in use.");
      }
      const saved = editingCourse?.id ? await Course.update(editingCourse.id, record) : await Course.create(record);
      if (saved?.id) setSelectedCourseId(String(saved.id));
      closeCourseForm();
      setMessage({ text: editingCourse ? "Course changes saved." : "Course added to the paid catalog." });
      await load();
    } catch (error) {
      console.error("Failed to save paid course:", error);
      setError(error, "The course could not be saved. Try again.");
      throw error;
    }
  };

  const removeCourse = async (course: PaidCourse) => {
    if (!window.confirm(`Delete ${course.title}? Courses with curriculum, requests or enrollments cannot be removed.`)) return;
    if (
      modules.some((item) => item.course_id === course.id) ||
      lessons.some((item) => item.course_id === course.id) ||
      payments.some((item) => item.course_id === course.id) ||
      enrollments.some((item) => item.course_id === course.id) ||
      progress.some((item) => item.course_id === course.id)
    ) {
      setError(new Error("Remove this course's modules, lessons, requests and enrollments before deleting it."), "The course could not be deleted.");
      return;
    }
    try {
      await Course.delete(course.id);
      setMessage({ text: "Course deleted." });
      await load();
    } catch (error) {
      console.error("Failed to delete paid course:", error);
      setError(error, "The course could not be deleted. Try again.");
    }
  };

  const toggleCourse = async (course: PaidCourse) => {
    try {
      await Course.update(course.id, {
        is_published: !course.is_published,
        publication_status: course.is_published ? "draft" : "published",
      });
      setMessage({ text: course.is_published ? "Course unpublished from public catalog." : "Course published in public catalog." });
      await load();
    } catch (error) {
      console.error("Failed to change course publication:", error);
      setError(error, "The course publication status could not be changed.");
    }
  };

  const saveModule = async (record: Row) => {
    try {
      if (editingModule?.id) await CourseModule.update(editingModule.id, record);
      else await CourseModule.create(record);
      closeModuleForm();
      setMessage({ text: editingModule ? "Module changes saved." : "Module added to the course." });
      await load();
    } catch (error) {
      console.error("Failed to save module:", error);
      setError(error, "The module could not be saved. Try again.");
      throw error;
    }
  };

  const removeModule = async (module: PaidModule) => {
    if (!window.confirm(`Delete ${module.title}? A module with lessons cannot be removed.`)) return;
    if (lessons.some((lesson) => lesson.module_id === module.id)) {
      setError(new Error("Remove this module's lessons before deleting the module."), "The module could not be deleted.");
      return;
    }
    try {
      await CourseModule.delete(module.id);
      setMessage({ text: "Module deleted." });
      await load();
    } catch (error) {
      console.error("Failed to delete module:", error);
      setError(error, "The module could not be deleted. Try again.");
    }
  };

  const saveLesson = async (record: Row) => {
    try {
      if (editingLesson?.id) await CourseLesson.update(editingLesson.id, record);
      else await CourseLesson.create(record);
      closeLessonForm();
      setMessage({ text: editingLesson ? "Lesson changes saved." : "Lesson added to the course." });
      await load();
    } catch (error) {
      console.error("Failed to save lesson:", error);
      setError(error, "The lesson could not be saved. Try again.");
      throw error;
    }
  };

  const removeLesson = async (lesson: PaidLesson) => {
    if (!window.confirm(`Delete ${lesson.title}? This cannot be undone.`)) return;
    try {
      await CourseLesson.delete(lesson.id);
      setMessage({ text: "Lesson deleted." });
      await load();
    } catch (error) {
      console.error("Failed to delete lesson:", error);
      setError(error, "The lesson could not be deleted. Try again.");
    }
  };

  const changeEnrollmentStatus = async (enrollment: Row, nextStatus: "active" | "pending" | "suspended" | "removed") => {
    try {
      await CourseEnrollment.update(enrollment.id, {
        enrollment_status: nextStatus,
        activated_at: nextStatus === "active" ? enrollment.activated_at || new Date().toISOString() : enrollment.activated_at || "",
      });
      setMessage({ text: `Enrollment marked ${nextStatus}.` });
      await load();
    } catch (error) {
      console.error("Failed to update enrollment:", error);
      setError(error, "The enrollment status could not be changed.");
    }
  };

  return (
    <StudyShell>
      <main className="page-wrap py-10 sm:py-14">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <Link
              to="/admin/questions"
              className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"
            >
              <ArrowLeft size={15} /> Free Question Management
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="eyebrow">Academy Administration</p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8dcc7] bg-[#effaf4] px-3 py-1 text-[.68rem] font-bold text-[#2e7655]">
                <ShieldCheck size={14} /> Official Academy Portal
              </span>
            </div>
            <h1 className="page-heading mt-2 break-words text-3xl font-bold sm:text-4xl">
              Paid Courses & Payments Desk
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
              Verify manual student payments, configure bank details, manage curriculum, and activate enrollments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/paid-courses" className="button-secondary text-xs">
              <ExternalLink size={14} /> Public Catalog
            </Link>
            <Link to="/my-courses" className="button-secondary text-xs">
              <GraduationCap size={14} /> Student Dashboard
            </Link>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {message && (
          <p
            className={`mt-6 rounded-xl border p-3.5 text-xs font-semibold ${
              message.error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
            role={message.error ? "alert" : "status"}
          >
            {message.text}
          </p>
        )}

        {/* ADMIN WORKSPACE TABS */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "payments"
                ? "bg-[#14294d] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock size={15} />
            Payment Verifications
            {pendingPaymentsCount > 0 && (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[.65rem] font-extrabold text-amber-950">
                {pendingPaymentsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "courses"
                ? "bg-[#14294d] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers3 size={15} />
            Courses & Curriculum ({courses.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "settings"
                ? "bg-[#14294d] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Building2 size={15} />
            Payment Accounts Setup
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("enrollments")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "enrollments"
                ? "bg-[#14294d] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users size={15} />
            Active Enrollments ({enrollments.length})
          </button>
        </div>

        {/* LOADING & ERROR STATES */}
        {status === "loading" && (
          <div className="mt-8 surface p-6">
            <div className="loader-line w-1/3" />
            <div className="loader-line mt-5 h-36 w-full" />
          </div>
        )}

        {status === "error" && (
          <div className="mt-8">
            <EmptyState
              title="Paid-course workspace could not load"
              description="The records did not respond. Check connection and retry."
            />
            <button
              type="button"
              className="button-primary mx-auto mt-4 flex"
              onClick={() => void load()}
            >
              <RefreshCcw size={15} /> Try again
            </button>
          </div>
        )}

        {/* READY STATE */}
        {status === "ready" && (
          <div className="mt-6">
            {/* TAB 1: PAYMENT VERIFICATIONS */}
            {activeTab === "payments" && (
              <PaymentReviewManager payments={payments} onRefresh={load} />
            )}

            {/* TAB 2: COURSES & CURRICULUM */}
            {activeTab === "courses" && (
              <div className="space-y-10">
                {courseForm && (
                  <CourseForm editing={editingCourse} onSaved={saveCourse} onCancel={closeCourseForm} />
                )}

                <AdminCourseList
                  courses={courses}
                  selectedCourseId={selectedCourseId}
                  onSelect={(course) => setSelectedCourseId(course.id)}
                  onAdd={() => {
                    setEditingCourse(null);
                    setCourseForm("new");
                  }}
                  onEdit={(course) => {
                    setEditingCourse(course);
                    setCourseForm("edit");
                  }}
                  onDelete={(course) => void removeCourse(course)}
                  onTogglePublish={(course) => void toggleCourse(course)}
                />

                {selectedCourse && (
                  <section className="mt-10">
                    <div className="surface border-[#cddbea] bg-[#f7fafc] p-5 sm:p-7">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <p className="eyebrow">Selected Course</p>
                          <h2 className="mt-1.5 break-words font-display text-2xl font-bold text-[#14294d]">
                            {selectedCourse.title}
                          </h2>
                          <p className="mt-1 break-words text-xs text-slate-500">
                            /{selectedCourse.slug} · {selectedCourse.is_published ? "Public" : "Draft"} · Price:{" "}
                            {selectedCourse.price_configured
                              ? `${selectedCourse.currency || "PKR"} ${Number(
                                  selectedCourse.price_pkr || 0
                                ).toLocaleString("en-PK")}`
                              : "Free / Set by admin"}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="button-secondary w-full sm:w-auto text-xs"
                          onClick={() => {
                            setEditingCourse(selectedCourse);
                            setCourseForm("edit");
                          }}
                        >
                          Edit Course Details
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      {/* Modules */}
                      <section className="surface p-5 sm:p-6">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="eyebrow">Curriculum Modules</p>
                            <h3 className="mt-1 font-display text-xl font-bold text-[#14294d]">
                              {selectedModules.length} Modules
                            </h3>
                          </div>
                          <button
                            type="button"
                            className="button-primary !min-h-9 !px-3 text-xs"
                            onClick={() => {
                              setEditingModule(null);
                              setModuleForm("new");
                            }}
                          >
                            <Plus size={14} /> Add Module
                          </button>
                        </div>

                        {moduleForm && (
                          <div className="mt-5">
                            <ModuleForm
                              courseId={selectedCourse.id}
                              courseSlug={selectedCourse.slug}
                              editing={editingModule}
                              onSaved={saveModule}
                              onCancel={closeModuleForm}
                            />
                          </div>
                        )}

                        <div className="mt-5 grid gap-3">
                          {selectedModules.length ? (
                            selectedModules.map((module) => (
                              <article key={module.id} className="rounded-2xl border border-slate-100 bg-[#f7fafc] p-4">
                                <div className="flex items-start gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf4fb] text-[#1766a9]">
                                    <Layers3 size={16} />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="break-words font-display text-base font-bold text-[#14294d]">
                                      {module.title}
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-500">
                                      Order {module.sort_order} ·{" "}
                                      {selectedLessons.filter((lesson) => lesson.module_id === module.id).length} lessons ·{" "}
                                      {module.is_published ? "Visible in preview" : "Hidden"}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 flex justify-end gap-1 border-t border-slate-200 pt-2">
                                  <button
                                    type="button"
                                    className="button-quiet !min-h-8 !p-1.5 text-xs"
                                    onClick={() => {
                                      setEditingModule(module);
                                      setModuleForm("edit");
                                    }}
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="button-quiet !min-h-8 !p-1.5 !text-rose-500 text-xs"
                                    onClick={() => void removeModule(module)}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </article>
                            ))
                          ) : (
                            <p className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                              No modules created yet. Add a module before adding lesson videos.
                            </p>
                          )}
                        </div>
                      </section>

                      {/* Lessons */}
                      <section className="surface p-5 sm:p-6">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="eyebrow">Video Lessons</p>
                            <h3 className="mt-1 font-display text-xl font-bold text-[#14294d]">
                              {selectedLessons.length} Lessons
                            </h3>
                          </div>
                          <button
                            type="button"
                            disabled={!selectedModules.length}
                            className="button-primary !min-h-9 !px-3 text-xs disabled:opacity-50"
                            onClick={() => {
                              setEditingLesson(null);
                              setLessonForm("new");
                            }}
                          >
                            <Plus size={14} /> Add Lesson
                          </button>
                        </div>

                        {lessonForm && (
                          <div className="mt-5">
                            <LessonForm
                              courseId={selectedCourse.id}
                              courseSlug={selectedCourse.slug}
                              modules={selectedModules}
                              editing={editingLesson}
                              onSaved={saveLesson}
                              onCancel={closeLessonForm}
                            />
                          </div>
                        )}

                        <div className="mt-5 grid gap-3">
                          {selectedLessons.length ? (
                            selectedLessons.map((lesson) => (
                              <article key={lesson.id} className="rounded-2xl border border-slate-100 bg-[#f7fafc] p-4">
                                <div className="flex items-start gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fffaf0] text-[#9c7b2d]">
                                    <ListVideo size={16} />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="break-words font-display text-base font-bold text-[#14294d]">
                                      {lesson.title}
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {selectedModules.find((m) => m.id === lesson.module_id)?.title || "Unassigned"} · Order {lesson.sort_order} · {lesson.is_published ? "Published" : "Draft"}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2">
                                  <span className="flex items-center gap-1.5 text-[.68rem] text-slate-400">
                                    <FileLock2 size={13} /> {lesson.video_reference ? "Video Linked" : "No Video"}
                                  </span>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      className="button-quiet !min-h-8 !p-1.5 text-xs"
                                      onClick={() => {
                                        setEditingLesson(lesson);
                                        setLessonForm("edit");
                                      }}
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="button-quiet !min-h-8 !p-1.5 !text-rose-500 text-xs"
                                      onClick={() => void removeLesson(lesson)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </article>
                            ))
                          ) : (
                            <p className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                              No lessons yet.
                            </p>
                          )}
                        </div>
                      </section>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* TAB 3: PAYMENT ACCOUNTS SETUP */}
            {activeTab === "settings" && <AdminPaymentSettings />}

            {/* TAB 4: ACTIVE ENROLLMENTS */}
            {activeTab === "enrollments" && (
              <AdminEnrollmentManager
                enrollments={enrollments}
                progress={progress}
                courses={courses}
                onStatusChange={changeEnrollmentStatus}
              />
            )}
          </div>
        )}
      </main>
    </StudyShell>
  );
}

export default function AdminPaidCourses() {
  return (
    <AuthGuard admin>
      <AdminPaidCoursesContent />
    </AuthGuard>
  );
}
