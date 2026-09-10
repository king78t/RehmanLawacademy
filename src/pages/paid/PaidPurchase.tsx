import { ArrowLeft, CheckCircle2, Clock3, LockKeyhole, MessageCircle, RefreshCcw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PaidAuthGate } from "@/components/paid/PaidAuthGate";
import { EmptyState } from "@/components/study/EmptyState";
import { StudyShell } from "@/components/study/StudyShell";
import { loadPaidDashboard, loadPublishedCourse, requestCourseAccess } from "@/lib/paid-course-data";
import type { PaidCourse, PaidDashboard, PaidPaymentRequest } from "@/lib/paid-course-types";
import { formatPkr } from "@/lib/paid-course-types";

function PurchaseContent({ courseSlug }: { courseSlug: string }) {
  const [course, setCourse] = useState<PaidCourse | null>(null);
  const [dashboard, setDashboard] = useState<PaidDashboard | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [request, setRequest] = useState<PaidPaymentRequest | null>(null);
  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [found, data] = await Promise.all([loadPublishedCourse(courseSlug), loadPaidDashboard()]);
      setCourse(found); setDashboard(data); setRequest(data.payments.find((item) => item.course_slug === courseSlug) || null); setStatus("ready");
    } catch (error) { console.error("Failed to load course request:", error); setStatus("error"); }
  }, [courseSlug]);
  useEffect(() => { void load(); }, [load]);
  const enrollment = useMemo(() => dashboard?.enrollments.find((item) => item.course_slug === courseSlug), [dashboard, courseSlug]);
  const beginRequest = async () => {
    if (!course) return;
    setBusy(true); setMessage("");
    try {
      const result = await requestCourseAccess(course.slug);
      setRequest(result.request);
      setMessage(result.reused ? "Your pending request is ready. WhatsApp will open so you can continue the manual payment conversation." : "Your pending request was created. WhatsApp will open so the academy can review your payment.");
      window.location.assign(result.whatsapp_url);
    } catch (error) { console.error("Failed to create course request:", error); setMessage("The request could not be created. Check your account session and try again."); }
    finally { setBusy(false); }
  };
  if (status === "loading") return <StudyShell><main className="page-wrap py-14"><div className="surface p-7"><div className="loader-line h-32 w-full" /><div className="loader-line mt-6 w-2/3" /><div className="loader-line mt-4 w-full" /></div></main></StudyShell>;
  if (status === "error") return <StudyShell><main className="page-wrap py-14"><EmptyState title="Course request could not load" description="We could not confirm the course or your request status. Try again when your session is ready." onRetry={load} /></main></StudyShell>;
  if (!course) return <StudyShell><main className="page-wrap py-14"><EmptyState title="Course not found" description="That course is not published or is no longer accepting requests." action="/paid-courses" actionLabel="Browse paid courses" /></main></StudyShell>;
  const approved = request?.payment_status === "approved" || enrollment?.enrollment_status === "active";
  const rejected = request?.payment_status === "rejected" || request?.payment_status === "refunded";
  return <StudyShell><main className="page-wrap max-w-[900px] py-10 sm:py-14"><Link to={`/paid-courses/${course.slug}`} className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"><ArrowLeft size={15} /> Course details</Link><div className="mt-8"><p className="eyebrow">Secure course request</p><h1 className="page-heading mt-3 break-words text-4xl font-bold sm:text-5xl">Request access to {course.title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">Your account keeps the request and any approved enrollment together. WhatsApp is used for manual payment instructions and review.</p></div><div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.78fr]"><section className="surface p-6 sm:p-8"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf4fb] text-[#1766a9]"><ShieldCheck size={22} /></div><div className="min-w-0"><p className="text-[.65rem] font-extrabold uppercase tracking-[.14em] text-slate-400">Selected course</p><h2 className="mt-2 break-words font-display text-2xl font-bold text-[#14294d]">{course.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{course.short_description}</p></div></div><div className="mt-7 grid gap-3 rounded-2xl bg-[#f7fafc] p-4 sm:grid-cols-2"><div><p className="text-[.63rem] font-extrabold uppercase tracking-[.12em] text-slate-400">Course amount</p><p className="mt-1 text-lg font-bold text-[#14294d]">{formatPkr(course)}</p></div><div><p className="text-[.63rem] font-extrabold uppercase tracking-[.12em] text-slate-400">Payment method</p><p className="mt-1 flex items-center gap-2 text-sm font-bold text-[#14294d]"><MessageCircle size={15} className="text-[#1766a9]" /> WhatsApp manual review</p></div></div>{approved ? <div className="mt-6 rounded-2xl border border-[#b8dcc7] bg-[#effaf4] p-4" role="status"><div className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#2e7655]" /><div><p className="text-sm font-bold text-[#245e46]">Your enrollment is active.</p><p className="mt-1 text-xs leading-5 text-[#3f745c]">The academy has approved your request. Your protected course lessons are ready.</p><Link to={`/my-courses/${course.slug}`} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-extrabold text-[#2e7655] hover:underline">Open my course <ArrowLeft size={14} className="rotate-180" /></Link></div></div></div> : <><button type="button" disabled={busy} onClick={() => void beginRequest()} className="button-primary mt-7 w-full sm:w-auto"><MessageCircle size={16} /> {busy ? "Preparing WhatsApp…" : request?.payment_status === "pending" ? "Open WhatsApp again" : "Request access on WhatsApp"}</button><p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><Clock3 size={14} className="mt-0.5 shrink-0 text-[#b28d37]" /> Opening WhatsApp creates no access by itself. An administrator must verify the payment and approve your enrollment.</p></>}{message && <p className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs font-semibold leading-5 text-sky-800" role="status">{message}</p>}</section><aside className="surface h-fit bg-[#0f2349] p-6 text-white sm:p-8"><p className="text-[.65rem] font-extrabold uppercase tracking-[.14em] text-[#ddc275]">Request status</p>{request ? <><h2 className="mt-3 break-words font-display text-2xl font-bold">{request.payment_status === "pending" ? "Waiting for review" : request.payment_status === "approved" ? "Approved" : request.payment_status === "refunded" ? "Refunded" : "Needs a new request"}</h2><p className="mt-3 text-sm leading-6 text-blue-100/70">{request.payment_status === "pending" ? "Your request is recorded. Continue the conversation in WhatsApp, then wait for administrator approval." : rejected ? "This request did not unlock the course. You can start a new WhatsApp request after confirming your payment details." : "Your course request is linked to your active account."}</p><div className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.06] p-3 text-xs font-bold text-white/70"><span className={`h-2 w-2 rounded-full ${request.payment_status === "pending" ? "bg-[#ddc275]" : request.payment_status === "approved" ? "bg-emerald-300" : "bg-rose-300"}`} /> {request.payment_status}</div></> : <><h2 className="mt-3 font-display text-2xl font-bold">No request yet</h2><p className="mt-3 text-sm leading-6 text-blue-100/70">Your next step is to open WhatsApp and share the selected course name with the academy.</p><div className="mt-6 flex items-center gap-2 text-xs font-bold text-white/60"><RefreshCcw size={14} className="text-[#ddc275]" /> One pending request per course</div></>}</aside></div></main></StudyShell>;
}

export default function PaidPurchase() {
  const { courseSlug = "" } = useParams();
  return <PaidAuthGate><PurchaseContent courseSlug={courseSlug} /></PaidAuthGate>;
}
