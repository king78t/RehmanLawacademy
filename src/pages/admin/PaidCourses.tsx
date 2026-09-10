import { ArrowLeft, Edit3, ExternalLink, FileLock2, Layers3, ListVideo, Plus, RefreshCcw, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthGuard } from "@/components/study/AuthGate";
import { EmptyState } from "@/components/study/EmptyState";
import { StudyShell } from "@/components/study/StudyShell";
import { AdminCourseList } from "@/components/paid/AdminCourseList";
import { AdminEnrollmentManager } from "@/components/paid/AdminEnrollmentManager";
import { CourseForm } from "@/components/paid/CourseForm";
import { LessonForm } from "@/components/paid/LessonForm";
import { ModuleForm } from "@/components/paid/ModuleForm";
import { PaymentReviewManager } from "@/components/paid/PaymentReviewManager";
import { Course, CourseEnrollment, CourseLesson, CourseModule, CoursePaymentRequest, CourseProgress, User } from "@/entities";
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
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (selectedCourseId && courses.some((course) => course.id === selectedCourseId)) return;
    setSelectedCourseId(courses[0]?.id || "");
  }, [courses, selectedCourseId]);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || null;
  const selectedModules = useMemo(() => modules.filter((module) => module.course_id === selectedCourseId).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)), [modules, selectedCourseId]);
  const selectedLessons = useMemo(() => lessons.filter((lesson) => lesson.course_id === selectedCourseId).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)), [lessons, selectedCourseId]);
  const setError = (error: unknown, fallback: string) => { const text = error instanceof Error ? error.message : fallback; setMessage({ text: text || fallback, error: true }); };
  const closeCourseForm = () => { setCourseForm(null); setEditingCourse(null); };
  const closeModuleForm = () => { setModuleForm(null); setEditingModule(null); };
  const closeLessonForm = () => { setLessonForm(null); setEditingLesson(null); };

  const saveCourse = async (record: Row) => {
    try {
      if (courses.some((course) => course.slug === record.slug && course.id !== editingCourse?.id)) throw new Error("That course slug is already in use.");
      const saved = editingCourse?.id ? await Course.update(editingCourse.id, record) : await Course.create(record);
      if (saved?.id) setSelectedCourseId(String(saved.id));
      closeCourseForm(); setMessage({ text: editingCourse ? "Course changes saved." : "Course added to the paid catalog." }); await load();
    } catch (error) { console.error("Failed to save paid course:", error); setError(error, "The course could not be saved. Try again."); throw error; }
  };

  const removeCourse = async (course: PaidCourse) => {
    if (!window.confirm(`Delete ${course.title}? Courses with curriculum, requests or enrollments cannot be removed.`)) return;
    if (modules.some((item) => item.course_id === course.id) || lessons.some((item) => item.course_id === course.id) || payments.some((item) => item.course_id === course.id) || enrollments.some((item) => item.course_id === course.id) || progress.some((item) => item.course_id === course.id)) { setError(new Error("Remove this course's modules, lessons, requests and enrollments before deleting it."), "The course could not be deleted."); return; }
    try { await Course.delete(course.id); setMessage({ text: "Course deleted." }); await load(); }
    catch (error) { console.error("Failed to delete paid course:", error); setError(error, "The course could not be deleted. Try again."); }
  };

  const toggleCourse = async (course: PaidCourse) => {
    try { await Course.update(course.id, { is_published: !course.is_published, publication_status: course.is_published ? "draft" : "published" }); setMessage({ text: course.is_published ? "Course unpublished from the public catalog." : "Course published in the public catalog." }); await load(); }
    catch (error) { console.error("Failed to change course publication:", error); setError(error, "The course publication status could not be changed."); }
  };

  const saveModule = async (record: Row) => {
    try { if (editingModule?.id) await CourseModule.update(editingModule.id, record); else await CourseModule.create(record); closeModuleForm(); setMessage({ text: editingModule ? "Module changes saved." : "Module added to the course." }); await load(); }
    catch (error) { console.error("Failed to save module:", error); setError(error, "The module could not be saved. Try again."); throw error; }
  };
  const removeModule = async (module: PaidModule) => {
    if (!window.confirm(`Delete ${module.title}? A module with lessons cannot be removed.`)) return;
    if (lessons.some((lesson) => lesson.module_id === module.id)) { setError(new Error("Remove this module's lessons before deleting the module."), "The module could not be deleted."); return; }
    try { await CourseModule.delete(module.id); setMessage({ text: "Module deleted." }); await load(); }
    catch (error) { console.error("Failed to delete module:", error); setError(error, "The module could not be deleted. Try again."); }
  };

  const saveLesson = async (record: Row) => {
    try { if (editingLesson?.id) await CourseLesson.update(editingLesson.id, record); else await CourseLesson.create(record); closeLessonForm(); setMessage({ text: editingLesson ? "Lesson changes saved." : "Lesson added to the course." }); await load(); }
    catch (error) { console.error("Failed to save lesson:", error); setError(error, "The lesson could not be saved. Try again."); throw error; }
  };
  const removeLesson = async (lesson: PaidLesson) => {
    if (!window.confirm(`Delete ${lesson.title}? This cannot be undone.`)) return;
    try { await CourseLesson.delete(lesson.id); setMessage({ text: "Lesson deleted." }); await load(); }
    catch (error) { console.error("Failed to delete lesson:", error); setError(error, "The lesson could not be deleted. Try again."); }
  };

  const reviewPayment = async (payment: Row, paymentStatus: string, reference: string, note: string) => {
    try {
      const admin: any = await User.me();
      const reviewedAt = new Date().toISOString();
      await CoursePaymentRequest.update(payment.id, { payment_status: paymentStatus, transaction_reference: reference, payment_note: note, reviewed_at: reviewedAt, reviewed_by: admin.email });
      const matching = await CourseEnrollment.filter({ student_email: payment.student_email, course_id: payment.course_id }, "-created_at", 20);
      if (paymentStatus === "approved") {
        const record = { student_user_id: payment.student_user_id || "", student_email: payment.student_email, course_id: payment.course_id, course_slug: payment.course_slug, course_title: payment.course_title, enrollment_status: "active", payment_request_id: payment.id, amount_pkr: Number(payment.amount_pkr || 0), currency: payment.currency || "PKR", enrolled_at: matching?.[0]?.enrolled_at || reviewedAt, activated_at: reviewedAt };
        if (matching?.[0]) await CourseEnrollment.update(matching[0].id, record); else await CourseEnrollment.create(record);
      } else if (matching?.length) {
        await Promise.all(matching.map((item: Row) => CourseEnrollment.update(item.id, { enrollment_status: paymentStatus === "pending" ? "pending" : "suspended" })));
      }
      setMessage({ text: paymentStatus === "approved" ? "Payment approved and enrollment activated." : `Payment marked ${paymentStatus}; course access remains locked.` }); await load();
    } catch (error) { console.error("Failed to review payment:", error); setError(error, "The payment review could not be saved. Try again."); throw error; }
  };

  const changeEnrollmentStatus = async (enrollment: Row, nextStatus: "active" | "pending" | "suspended" | "removed") => {
    try { await CourseEnrollment.update(enrollment.id, { enrollment_status: nextStatus, activated_at: nextStatus === "active" ? (enrollment.activated_at || new Date().toISOString()) : enrollment.activated_at || "" }); setMessage({ text: `Enrollment marked ${nextStatus}.` }); await load(); }
    catch (error) { console.error("Failed to update enrollment:", error); setError(error, "The enrollment status could not be changed."); throw error; }
  };

  return <StudyShell><main className="page-wrap py-10 sm:py-14">
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><Link to="/admin/questions" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"><ArrowLeft size={15} /> Question management</Link><div className="mt-6 flex flex-wrap items-center gap-3"><p className="eyebrow">Administrator workspace</p><span className="inline-flex items-center gap-2 rounded-full border border-[#b8dcc7] bg-[#effaf4] px-3 py-1 text-[.68rem] font-bold text-[#2e7655]"><ShieldCheck size={14} /> Protected paid courses</span></div><h1 className="page-heading mt-3 break-words text-4xl font-bold">Paid-course workspace</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Configure the public catalog, protected curriculum and manual WhatsApp access review. Only approval or a deliberate access action can unlock a student course.</p></div><div className="flex flex-wrap gap-2"><Link to="/admin/catalog" className="button-secondary"><ExternalLink size={15} /> Free catalog</Link><Link to="/paid-courses" className="button-secondary"><ExternalLink size={15} /> Public courses</Link></div></div>
    {message && <p className={`mt-6 rounded-xl border p-3 text-xs font-semibold ${message.error ? "border-rose-100 bg-rose-50 text-rose-700" : "border-sky-100 bg-sky-50 text-sky-800"}`} role={message.error ? "alert" : "status"}>{message.text}</p>}
    {status === "loading" && <div className="mt-8 surface p-6"><div className="loader-line w-1/3" /><div className="loader-line mt-5 h-36 w-full" /></div>}
    {status === "error" && <div className="mt-8"><EmptyState title="Paid-course workspace could not load" description="The protected course records did not respond. Confirm administrator access and try again." /><button type="button" className="button-primary mx-auto mt-4 flex" onClick={() => void load()}><RefreshCcw size={15} /> Try again</button></div>}
    {status === "ready" && <>
      {courseForm && <div className="mt-8"><CourseForm editing={editingCourse} onSaved={saveCourse} onCancel={closeCourseForm} /></div>}
      <div className="mt-10"><AdminCourseList courses={courses} selectedCourseId={selectedCourseId} onSelect={(course) => setSelectedCourseId(course.id)} onAdd={() => { setEditingCourse(null); setCourseForm("new"); }} onEdit={(course) => { setEditingCourse(course); setCourseForm("edit"); }} onDelete={(course) => void removeCourse(course)} onTogglePublish={(course) => void toggleCourse(course)} /></div>
      {selectedCourse && <section className="mt-12"><div className="surface border-[#cddbea] bg-[#f7fafc] p-5 sm:p-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="min-w-0"><p className="eyebrow">Selected course</p><h2 className="mt-2 break-words font-display text-2xl font-bold text-[#14294d]">{selectedCourse.title}</h2><p className="mt-2 break-words text-xs text-slate-500">/{selectedCourse.slug} · {selectedCourse.is_published ? "Public" : "Draft"} · price {selectedCourse.price_configured ? `${selectedCourse.currency || "PKR"} ${Number(selectedCourse.price_pkr || 0).toLocaleString("en-PK")}` : "set by admin"}</p></div><button type="button" className="button-secondary w-full sm:w-auto" onClick={() => { setEditingCourse(selectedCourse); setCourseForm("edit"); }}>Edit course details</button></div></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="surface p-5 sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Curriculum structure</p><h3 className="mt-2 font-display text-xl font-bold text-[#14294d]">{selectedModules.length} modules</h3></div><button type="button" className="button-primary !min-h-10 !px-3" onClick={() => { setEditingModule(null); setModuleForm("new"); }}><Plus size={15} /> Add</button></div>{moduleForm && <div className="mt-5"><ModuleForm courseId={selectedCourse.id} courseSlug={selectedCourse.slug} editing={editingModule} onSaved={saveModule} onCancel={closeModuleForm} /></div>}<div className="mt-5 grid gap-3">{selectedModules.length ? selectedModules.map((module) => <article key={module.id} className="rounded-2xl border border-slate-100 bg-[#f7fafc] p-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf4fb] text-[#1766a9]"><Layers3 size={16} /></span><div className="min-w-0 flex-1"><h4 className="break-words font-display text-lg font-bold text-[#14294d]">{module.title}</h4><p className="mt-1 text-xs text-slate-500">Order {module.sort_order} · {selectedLessons.filter((lesson) => lesson.module_id === module.id).length} lessons · {module.is_published ? "Shown in preview" : "Hidden"}</p></div></div><div className="mt-3 flex justify-end gap-1 border-t border-slate-200 pt-3"><button type="button" className="button-quiet !min-h-10 !min-w-10 !p-2" onClick={() => { setEditingModule(module); setModuleForm("edit"); }} aria-label={`Edit ${module.title}`}><Edit3 size={14} /></button><button type="button" className="button-quiet !min-h-10 !min-w-10 !p-2 !text-rose-500" onClick={() => void removeModule(module)} aria-label={`Delete ${module.title}`}><Trash2 size={14} /></button></div></article>) : <p className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">Add a module before creating lessons. Module titles can be shown publicly without exposing lesson content.</p>}</div></section><section className="surface p-5 sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Protected curriculum</p><h3 className="mt-2 font-display text-xl font-bold text-[#14294d]">{selectedLessons.length} lessons</h3></div><button type="button" disabled={!selectedModules.length} className="button-primary !min-h-10 !px-3" onClick={() => { setEditingLesson(null); setLessonForm("new"); }}><Plus size={15} /> Add</button></div>{lessonForm && <div className="mt-5"><LessonForm courseId={selectedCourse.id} courseSlug={selectedCourse.slug} modules={selectedModules} editing={editingLesson} onSaved={saveLesson} onCancel={closeLessonForm} /></div>}<div className="mt-5 grid gap-3">{selectedLessons.length ? selectedLessons.map((lesson) => <article key={lesson.id} className="rounded-2xl border border-slate-100 bg-[#f7fafc] p-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fffaf0] text-[#9c7b2d]"><ListVideo size={16} /></span><div className="min-w-0 flex-1"><h4 className="break-words font-display text-lg font-bold text-[#14294d]">{lesson.title}</h4><p className="mt-1 break-words text-xs text-slate-500">{selectedModules.find((module) => module.id === lesson.module_id)?.title || "Unassigned module"} · order {lesson.sort_order} · {lesson.is_published ? "Published" : "Draft"}</p></div></div><div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3"><span className="flex items-center gap-2 text-[.68rem] font-semibold text-slate-400"><FileLock2 size={13} /> {lesson.video_reference ? "Provider reference set" : "Video not configured"}</span><div className="flex gap-1"><button type="button" className="button-quiet !min-h-10 !min-w-10 !p-2" onClick={() => { setEditingLesson(lesson); setLessonForm("edit"); }} aria-label={`Edit ${lesson.title}`}><Edit3 size={14} /></button><button type="button" className="button-quiet !min-h-10 !min-w-10 !p-2 !text-rose-500" onClick={() => void removeLesson(lesson)} aria-label={`Delete ${lesson.title}`}><Trash2 size={14} /></button></div></div></article>) : <p className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">No lessons yet. Add lesson notes and a private provider reference only when the content is ready.</p>}</div></section></div></section>}
      <div className="mt-14"><PaymentReviewManager payments={payments} onReview={reviewPayment} /></div>
      <AdminEnrollmentManager enrollments={enrollments} progress={progress} courses={courses} onStatusChange={changeEnrollmentStatus} />
    </>}
  </main></StudyShell>;
}

export default function AdminPaidCourses() { return <AuthGuard admin><AdminPaidCoursesContent /></AuthGuard>; }
