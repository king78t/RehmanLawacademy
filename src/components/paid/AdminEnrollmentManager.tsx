import { Save, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { PaidStatusBadge } from "@/components/paid/PaidStatusBadge";
import type { PaidCourse, PaidEnrollment, PaidProgress } from "@/lib/paid-course-types";

type EnrollmentStatus = "active" | "pending" | "suspended" | "removed";

interface AdminEnrollmentManagerProps {
  enrollments: PaidEnrollment[];
  progress: PaidProgress[];
  courses: PaidCourse[];
  onStatusChange: (enrollment: any, status: EnrollmentStatus) => Promise<void>;
}

export function AdminEnrollmentManager({ enrollments, progress, courses, onStatusChange }: AdminEnrollmentManagerProps) {
  const [drafts, setDrafts] = useState<Record<string, EnrollmentStatus>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  useEffect(() => {
    setDrafts(Object.fromEntries(enrollments.map((item: any) => [item.id, (item.enrollment_status || "pending") as EnrollmentStatus])));
  }, [enrollments]);
  const save = async (enrollment: any) => {
    setBusyId(enrollment.id);
    try { await onStatusChange(enrollment, drafts[enrollment.id] || "pending"); }
    finally { setBusyId(null); }
  };
  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-3">
        <div><p className="eyebrow">Access records</p><h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">{enrollments.length} enrollment{enrollments.length === 1 ? "" : "s"}</h2></div>
        <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400"><UsersRound size={15} className="text-[#1766a9]" /> Manual access control</span>
      </div>
      {!enrollments.length ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">Approved payment requests will create enrollment records here.</div> : <div className="mt-5 grid gap-4">{enrollments.map((enrollment: any) => {
        const course = courses.find((item) => item.id === enrollment.course_id);
        const rowProgress: any = progress.find((item: any) => item.id === enrollment.progress_id || item.enrollment_id === enrollment.id || (item.course_id === enrollment.course_id && item.student_email === enrollment.student_email));
        const current = drafts[enrollment.id] || enrollment.enrollment_status || "pending";
        return <article key={enrollment.id} className="surface p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div className="min-w-0"><p className="break-all text-xs font-bold text-slate-500">{enrollment.student_email || "Student email unavailable"}</p><h3 className="mt-2 break-words font-display text-lg font-bold text-[#14294d]">{course?.title || enrollment.course_title}</h3><p className="mt-1 text-xs text-slate-400">Enrolled {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString() : "recently"}{enrollment.last_activity_at ? ` · Active ${new Date(enrollment.last_activity_at).toLocaleDateString()}` : ""}</p></div><PaidStatusBadge status={enrollment.enrollment_status || "pending"} /></div><div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-xs font-bold text-slate-600" htmlFor={`enrollment-status-${enrollment.id}`}>Enrollment status<select id={`enrollment-status-${enrollment.id}`} value={current} onChange={(event) => setDrafts((items) => ({ ...items, [enrollment.id]: event.target.value as EnrollmentStatus }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400"><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option><option value="removed">Removed</option></select></label><button type="button" disabled={busyId === enrollment.id} onClick={() => void save(enrollment)} className="button-primary w-full sm:w-auto"><Save size={15} /> {busyId === enrollment.id ? "Saving…" : "Save access"}</button></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500"><span>Progress: {rowProgress?.progress_percentage || 0}%</span><span>Lessons: {rowProgress?.completed_lessons || 0} / {rowProgress?.total_lessons || 0}</span><span>{enrollment.payment_request_id ? `Payment ${enrollment.payment_request_id.slice(0, 8)}…` : "Manual enrollment"}</span></div></article>;
      })}</div>}
    </section>
  );
}
